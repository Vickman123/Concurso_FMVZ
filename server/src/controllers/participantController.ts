import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/connection';
import { participantRegistrationSchema, statusCheckSchema, normalizeIdentifier } from '../utils/validation';

export async function getPublicParticipants(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const search = (req.query.search as string || '').trim().toLowerCase();
    const type = req.query.type as string; // 'all', 'student', 'worker'

    let queryText = `
      SELECT 
        contest_number,
        public_display_name,
        costume_title,
        description,
        participant_type,
        photo_original_key,
        photo_thumbnail_key,
        status,
        created_at
      FROM participants
      WHERE status = 'approved'
    `;
    const params: any[] = [];

    if (type === 'student' || type === 'worker') {
      params.push(type);
      queryText += ` AND participant_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      queryText += ` AND (
        LOWER(costume_title) LIKE $${pIdx} 
        OR LOWER(public_display_name) LIKE $${pIdx}
        OR CAST(contest_number AS TEXT) LIKE $${pIdx}
      )`;
    }

    queryText += ` ORDER BY contest_number ASC`;

    const result = await db.query(queryText, params);

    res.json({
      participants: result.rows,
      total: result.rowCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar la galería de participantes', details: err.message });
  }
}

export async function getPublicParticipantDetail(req: Request, res: Response): Promise<void> {
  try {
    const num = parseInt(String(req.params.number), 10);
    if (isNaN(num)) {
      res.status(400).json({ error: 'Número de participante no válido' });
      return;
    }

    const db = await getDb();
    const result = await db.query(`
      SELECT 
        contest_number,
        public_display_name,
        costume_title,
        description,
        participant_type,
        photo_original_key,
        status,
        created_at
      FROM participants
      WHERE contest_number = $1 AND status != 'inactive'
    `, [num]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Participante no encontrado o inactivo' });
      return;
    }

    res.json({ participant: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar detalle del participante', details: err.message });
  }
}

export async function registerParticipant(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = participantRegistrationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Datos de registro inválidos',
        issues: parseResult.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
      return;
    }

    const data = parseResult.data;
    const normalizedId = normalizeIdentifier(data.institutional_identifier);

    // Photo check & Base64 conversion (Stored permanently in Supabase)
    let photoPath = '/uploads/costume_default.svg';
    if (req.file && req.file.buffer) {
      const mime = req.file.mimetype || 'image/jpeg';
      photoPath = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    } else {
      res.status(400).json({ error: 'Se requiere subir una fotografía del disfraz para completar el registro.' });
      return;
    }

    const db = await getDb();

    // Run registration transactionally
    const result = await db.transaction(async (client) => {
      // 1. Check settings & capacity limit
      const settingsRes = await client.query('SELECT registration_limit FROM contest_settings WHERE id = 1');
      const limit = Number(settingsRes.rows[0]?.registration_limit || 100);

      const countRes = await client.query("SELECT COUNT(*) as count FROM participants WHERE status != 'inactive'");
      const currentCount = Number(countRes.rows[0]?.count || 0);

      if (currentCount >= limit) {
        throw new Error('CAPACITY_REACHED');
      }

      // 2. Check if identity already registered
      const existingRes = await client.query(
        "SELECT id FROM participants WHERE institutional_identifier = $1 AND status != 'inactive'",
        [normalizedId]
      );
      if (existingRes.rowCount > 0) {
        throw new Error('DUPLICATE_IDENTIFIER');
      }

      // 3. Determine next official contest number
      const maxNumRes = await client.query('SELECT COALESCE(MAX(contest_number), 0) as max_num FROM participants');
      const nextContestNumber = Number(maxNumRes.rows[0].max_num) + 1;

      // 4. Generate unique registration folio
      const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      const registrationFolio = `FMVZ-REG-2026-${String(nextContestNumber).padStart(3, '0')}-${randomPart}`;

      // 5. Insert participant record as 'pending'
      await client.query(`
        INSERT INTO participants (
          contest_number, full_name, public_display_name, costume_title,
          description, participant_type, institutional_identifier,
          photo_original_key, photo_thumbnail_key, status, registration_folio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, 'pending', $9)
      `, [
        nextContestNumber,
        data.full_name,
        data.public_display_name,
        data.costume_title,
        data.description || '',
        data.participant_type,
        normalizedId,
        photoPath,
        registrationFolio,
      ]);

      return {
        contest_number: nextContestNumber,
        registration_folio: registrationFolio,
      };
    });

    res.status(201).json({
      success: true,
      message: '¡Registro exitoso! Tu disfraz ha sido recibido y pasará a revisión del comité organizador.',
      contest_number: result.contest_number,
      registration_folio: result.registration_folio,
    });
  } catch (err: any) {
    if (err.message === 'CAPACITY_REACHED') {
      res.status(400).json({ error: 'El concurso ha alcanzado el cupo máximo de 100 participantes registrados.' });
      return;
    }
    if (err.message === 'DUPLICATE_IDENTIFIER') {
      res.status(409).json({ error: 'Este número de cuenta o identificación ya cuenta con un registro activo en el concurso.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al procesar el registro', details: err.message });
  }
}

export async function checkParticipantStatus(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = statusCheckSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Proporciona el folio de registro y tu número de identificación' });
      return;
    }

    const { registration_folio, institutional_identifier } = parseResult.data;
    const normalizedId = normalizeIdentifier(institutional_identifier);

    const db = await getDb();
    const result = await db.query(`
      SELECT 
        contest_number,
        public_display_name,
        costume_title,
        status,
        created_at,
        updated_at
      FROM participants
      WHERE UPPER(TRIM(registration_folio)) = UPPER(TRIM($1))
        AND institutional_identifier = $2
    `, [registration_folio, normalizedId]);

    if (result.rowCount === 0) {
      res.status(404).json({
        error: 'No se encontró ningún registro que coincida con el folio e identificación proporcionados. Por favor verifica tus datos.',
      });
      return;
    }

    const p = result.rows[0];
    const statusDescriptions: Record<string, string> = {
      pending: 'Tu registro y fotografía están en proceso de revisión por el comité organizador.',
      approved: '¡Tu registro y fotografía han sido aprobados! Ya eres visible en la galería oficial.',
      needs_correction: 'Tu fotografía requiere ajustes (por favor contacta al comité organizador para subir una foto de mejor resolución).',
      rejected: 'Tu registro no cumplió con las bases del concurso.',
      inactive: 'El registro se encuentra desactivado temporalmente.',
    };

    res.json({
      found: true,
      contest_number: p.contest_number,
      public_display_name: p.public_display_name,
      costume_title: p.costume_title,
      status: p.status,
      status_message: statusDescriptions[p.status] || p.status,
      registered_at: p.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar el estado del registro', details: err.message });
  }
}
