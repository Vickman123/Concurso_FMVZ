import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/connection';
import { voterIdentificationSchema, voteSubmissionSchema, normalizeIdentifier } from '../utils/validation';

export async function checkVoterEligibility(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = voterIdentificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Datos de identificación inválidos',
        issues: parseResult.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
      return;
    }

    const { voter_type, institutional_identifier, full_name } = parseResult.data;
    const normalizedId = normalizeIdentifier(institutional_identifier);

    const db = await getDb();

    // Check if voting is open
    const settingsRes = await db.query('SELECT voting_status FROM contest_settings WHERE id = 1');
    const votingStatus = settingsRes.rows[0]?.voting_status;
    if (votingStatus !== 'open') {
      res.status(403).json({
        eligible: false,
        reason: 'VOTING_CLOSED',
        message: 'La votación se encuentra actualmente cerrada o en pausa por el comité organizador.'
      });
      return;
    }

    // Check if voter already cast a vote
    const existingVote = await db.query(`
      SELECT v.confirmation_folio, v.created_at
      FROM voters vt
      JOIN votes v ON vt.id = v.voter_id
      WHERE vt.voter_type = $1 AND vt.normalized_identifier = $2 AND v.status = 'valid'
    `, [voter_type, normalizedId]);

    if (existingVote.rowCount > 0) {
      res.status(409).json({
        eligible: false,
        reason: 'ALREADY_VOTED',
        message: 'Esta identidad declarada ya cuenta con un voto registrado en el sistema. Las reglas del concurso permiten un único voto por persona.',
      });
      return;
    }

    // Mask identifier for UI feedback (e.g., ******789 or ***019)
    const masked = normalizedId.length === 9 
      ? `******${normalizedId.slice(-3)}`
      : `***${normalizedId.slice(-3)}`;

    res.json({
      eligible: true,
      voter: {
        full_name: full_name.trim(),
        voter_type,
        institutional_identifier_masked: masked,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al verificar elegibilidad del votante', details: err.message });
  }
}

export async function castVote(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = voteSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Parámetros de votación incorrectos',
        issues: parseResult.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
      return;
    }

    const { full_name, voter_type, institutional_identifier, participant_number } = parseResult.data;
    const normalizedId = normalizeIdentifier(institutional_identifier);

    const db = await getDb();

    // Execute atomic transaction with strict constraint verification
    const voteResult = await db.transaction(async (client) => {
      // 1. Verify voting status
      const settingsRes = await client.query('SELECT voting_status FROM contest_settings WHERE id = 1');
      if (settingsRes.rows[0]?.voting_status !== 'open') {
        throw new Error('VOTING_NOT_OPEN');
      }

      // 2. Verify participant is approved & active
      const partRes = await client.query(`
        SELECT id, contest_number, public_display_name, costume_title, photo_original_key
        FROM participants
        WHERE contest_number = $1 AND status = 'approved'
      `, [participant_number]);

      if (partRes.rowCount === 0) {
        throw new Error('PARTICIPANT_NOT_ELIGIBLE');
      }
      const participant = partRes.rows[0];

      // 3. Insert or retrieve voter record
      let voterRes = await client.query(`
        INSERT INTO voters (full_name, voter_type, normalized_identifier)
        VALUES ($1, $2, $3)
        ON CONFLICT (voter_type, normalized_identifier) DO NOTHING
        RETURNING id
      `, [full_name.trim(), voter_type, normalizedId]);

      let voterId: number;
      if (voterRes.rowCount === 0) {
        // Voter record already existed, fetch its id
        const fetchVoter = await client.query(`
          SELECT id FROM voters WHERE voter_type = $1 AND normalized_identifier = $2
        `, [voter_type, normalizedId]);
        voterId = fetchVoter.rows[0].id;
      } else {
        voterId = voterRes.rows[0].id;
      }

      // 4. Verify that this voterId has not yet cast a vote (atomic check)
      const existingVote = await client.query(`
        SELECT id, confirmation_folio FROM votes WHERE voter_id = $1
      `, [voterId]);

      if (existingVote.rowCount > 0) {
        throw new Error('ALREADY_VOTED');
      }

      // 5. Generate unique confirmation folio
      const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const confirmationFolio = `FMVZ-VOTO-2026-${randomCode}`;

      // 6. Record vote
      await client.query(`
        INSERT INTO votes (voter_id, participant_id, confirmation_folio, status)
        VALUES ($1, $2, $3, 'valid')
      `, [voterId, participant.id, confirmationFolio]);

      return {
        confirmation_folio: confirmationFolio,
        voted_at: new Date().toISOString(),
        participant: {
          contest_number: participant.contest_number,
          public_display_name: participant.public_display_name,
          costume_title: participant.costume_title,
          photo: participant.photo_original_key,
        }
      };
    });

    res.status(201).json({
      success: true,
      message: '¡Tu voto ha sido registrado con éxito!',
      confirmation_folio: voteResult.confirmation_folio,
      voted_at: voteResult.voted_at,
      participant: voteResult.participant,
    });
  } catch (err: any) {
    if (err.message === 'VOTING_NOT_OPEN') {
      res.status(403).json({ error: 'La votación no se encuentra abierta en este momento.' });
      return;
    }
    if (err.message === 'PARTICIPANT_NOT_ELIGIBLE') {
      res.status(404).json({ error: 'El participante seleccionado no existe o no está habilitado para recibir votos.' });
      return;
    }
    if (err.message === 'ALREADY_VOTED') {
      res.status(409).json({ error: 'Esta identidad institucional ya cuenta con un voto registrado en el concurso.' });
      return;
    }
    // PostgreSQL unique violation fallback
    if (err.code === '23505') {
      res.status(409).json({ error: 'Esta identidad institucional ya cuenta con un voto registrado.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al registrar el voto', details: err.message });
  }
}
