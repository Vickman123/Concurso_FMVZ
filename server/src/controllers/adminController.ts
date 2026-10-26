import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import qrcode from 'qrcode';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { getDb } from '../db/connection';
import { generateToken } from '../middleware/auth';
import { adminLoginSchema, normalizeIdentifier } from '../utils/validation';

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const parseRes = adminLoginSchema.safeParse(req.body);
    if (!parseRes.success) {
      res.status(400).json({ error: 'Credenciales inválidas' });
      return;
    }

    const { email, password } = parseRes.data;
    const db = await getDb();
    const adminRes = await db.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase().trim()]);

    if (adminRes.rowCount === 0) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }

    const admin = adminRes.rows[0];
    if (admin.status !== 'active') {
      res.status(403).json({ error: 'Esta cuenta administrativa ha sido desactivada' });
      return;
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }

    const token = generateToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    // Record login in audit log
    await db.query(`
      INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, reason, metadata)
      VALUES ($1, 'ADMIN_LOGIN', 'admin', $2, 'Inicio de sesión exitoso en el panel administrativo', $3)
    `, [admin.id, String(admin.id), JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] })]);

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error durante el inicio de sesión', details: err.message });
  }
}

export async function getAdminMe(req: Request, res: Response): Promise<void> {
  res.json({ admin: req.admin });
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();

    const countsRes = await db.query(`
      SELECT 
        COUNT(*) as total_participants,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'needs_correction' THEN 1 END) as needs_correction_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count
      FROM participants
    `);

    const votesRes = await db.query("SELECT COUNT(*) as total_votes FROM votes WHERE status = 'valid'");
    const settingsRes = await db.query('SELECT * FROM contest_settings WHERE id = 1');
    const recentAudit = await db.query(`
      SELECT a.*, adm.name as admin_name 
      FROM audit_logs a 
      LEFT JOIN admins adm ON a.admin_id = adm.id 
      ORDER BY a.timestamp DESC 
      LIMIT 6
    `);

    const counts = countsRes.rows[0];
    const settings = settingsRes.rows[0] || {};
    const totalVotes = Number(votesRes.rows[0]?.total_votes || 0);
    const capacityLimit = Number(settings.registration_limit || 100);
    const totalParticipants = Number(counts.total_participants || 0);

    res.json({
      total_participants: totalParticipants,
      capacity_limit: capacityLimit,
      capacity_used_pct: Math.min(100, Math.round((totalParticipants / capacityLimit) * 100)),
      approved_count: Number(counts.approved_count || 0),
      pending_count: Number(counts.pending_count || 0),
      needs_correction_count: Number(counts.needs_correction_count || 0),
      rejected_count: Number(counts.rejected_count || 0),
      inactive_count: Number(counts.inactive_count || 0),
      total_votes: totalVotes,
      voting_status: settings.voting_status,
      results_publication_status: settings.results_publication_status,
      recent_audit: recentAudit.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard', details: err.message });
  }
}

export async function getAdminParticipants(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = (req.query.search as string || '').trim().toLowerCase();

    let queryText = 'SELECT * FROM participants WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    if (type && type !== 'all') {
      params.push(type);
      queryText += ` AND participant_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      queryText += ` AND (
        LOWER(full_name) LIKE $${pIdx}
        OR LOWER(public_display_name) LIKE $${pIdx}
        OR LOWER(costume_title) LIKE $${pIdx}
        OR CAST(contest_number AS TEXT) LIKE $${pIdx}
        OR institutional_identifier LIKE $${pIdx}
        OR registration_folio LIKE $${pIdx}
      )`;
    }

    queryText += ' ORDER BY contest_number ASC';

    const result = await db.query(queryText, params);
    res.json({ participants: result.rows, total: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar participantes en administración', details: err.message });
  }
}

export async function updateParticipantStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { status, reason } = req.body;

    const validStatuses = ['approved', 'pending', 'needs_correction', 'rejected', 'inactive'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Estado de participante no válido' });
      return;
    }

    const db = await getDb();
    const prevRes = await db.query('SELECT * FROM participants WHERE id = $1', [id]);
    if (prevRes.rowCount === 0) {
      res.status(404).json({ error: 'Participante no encontrado' });
      return;
    }
    const prev = prevRes.rows[0];

    await db.query(`
      UPDATE participants 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, id]);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, reason, metadata)
      VALUES ($1, 'PARTICIPANT_STATUS_UPDATED', 'participant', $2, $3, $4)
    `, [
      req.admin?.id,
      String(id),
      reason || `Cambio de estado de '${prev.status}' a '${status}'`,
      JSON.stringify({ previous_status: prev.status, new_status: status, contest_number: prev.contest_number })
    ]);

    res.json({ success: true, message: `Estado actualizado a '${status}' con éxito` });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar estado del participante', details: err.message });
  }
}

export async function getPendingPhotos(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const result = await db.query(`
      SELECT id, contest_number, public_display_name, costume_title, photo_original_key, status, created_at
      FROM participants
      WHERE status IN ('pending', 'needs_correction')
      ORDER BY contest_number ASC
    `);
    res.json({ photos: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar fotografías pendientes', details: err.message });
  }
}

export async function importParticipantsCsv(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Se requiere subir un archivo CSV' });
      return;
    }

    const content = req.file.buffer ? req.file.buffer.toString('utf8') : '';
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const db = await getDb();

    let importedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    await db.transaction(async (client) => {
      // Find current max contest number
      const maxNumRes = await client.query('SELECT COALESCE(MAX(contest_number), 0) as max_num FROM participants');
      let currentMaxNum = Number(maxNumRes.rows[0].max_num);

      for (let idx = 0; idx < records.length; idx++) {
        const row = records[idx];
        const fullName = row.nombre_completo || row.full_name;
        const pubName = row.nombre_publico || row.public_display_name || (fullName ? fullName.split(' ')[0] : 'Participante');
        const costumeTitle = row.titulo_disfraz || row.costume_title;
        const description = row.descripcion || row.description || '';
        const pType = (row.tipo_participante || row.participant_type || 'student').toLowerCase() === 'trabajador' ? 'worker' : 'student';
        const iden = normalizeIdentifier(row.identificador_institucional || row.institutional_identifier || '');
        const photo = row.fotografia || row.photo_original_key || `/uploads/costume_default.svg`;
        const initialStatus = row.estado || row.status || 'approved';

        if (!fullName || !costumeTitle || !iden) {
          errors.push(`Fila ${idx + 1}: Faltan campos obligatorios`);
          continue;
        }

        // Check duplicate
        const dupCheck = await client.query('SELECT id FROM participants WHERE institutional_identifier = $1', [iden]);
        if (dupCheck.rowCount > 0) {
          duplicateCount++;
          continue;
        }

        currentMaxNum++;
        const folio = `FMVZ-REG-2026-${String(currentMaxNum).padStart(4, '0')}`;

        await client.query(`
          INSERT INTO participants (
            contest_number, full_name, public_display_name, costume_title,
            description, participant_type, institutional_identifier,
            photo_original_key, photo_thumbnail_key, status, registration_folio
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10)
        `, [
          currentMaxNum,
          fullName,
          pubName,
          costumeTitle,
          description,
          pType,
          iden,
          photo,
          initialStatus,
          folio
        ]);
        importedCount++;
      }

      await client.query(`
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, reason, metadata)
        VALUES ($1, 'CSV_IMPORT_EXECUTED', 'participants', 'bulk', 'Importación masiva de participantes mediante CSV', $2)
      `, [req.admin?.id, JSON.stringify({ importedCount, duplicateCount, totalProcessed: records.length })]);
    });

    res.json({
      success: true,
      importedCount,
      duplicateCount,
      errors,
      message: `Se importaron ${importedCount} participantes correctamente (${duplicateCount} omitidos por identificador duplicado).`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al procesar el archivo CSV', details: err.message });
  }
}

export async function exportParticipantsCsv(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const result = await db.query(`
      SELECT 
        contest_number,
        public_display_name,
        full_name,
        costume_title,
        participant_type,
        status,
        registration_folio,
        created_at
      FROM participants
      ORDER BY contest_number ASC
    `);

    const csvData = stringify(result.rows, { header: true });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="participantes_fmvz_halloween.csv"');
    res.send(csvData);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al exportar participantes a CSV', details: err.message });
  }
}

export async function getAdminVotes(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const result = await db.query(`
      SELECT 
        v.id,
        v.confirmation_folio,
        v.created_at,
        v.status,
        p.contest_number as participant_number,
        p.costume_title,
        p.public_display_name,
        vt.voter_type
      FROM votes v
      JOIN participants p ON v.participant_id = p.id
      JOIN voters vt ON v.voter_id = vt.id
      ORDER BY v.created_at DESC
    `);

    res.json({ votes: result.rows, total: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar registro de votos', details: err.message });
  }
}

export async function getAdminResults(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const tallyRes = await db.query(`
      SELECT 
        p.id,
        p.contest_number,
        p.public_display_name,
        p.costume_title,
        p.photo_original_key,
        p.participant_type,
        p.status,
        COUNT(v.id) as total_votes
      FROM participants p
      LEFT JOIN votes v ON p.id = v.participant_id AND v.status = 'valid'
      WHERE p.status = 'approved'
      GROUP BY p.id, p.contest_number, p.public_display_name, p.costume_title, p.photo_original_key, p.participant_type, p.status
      ORDER BY total_votes DESC, p.contest_number ASC
    `);

    const settingsRes = await db.query('SELECT results_publication_status, voting_status FROM contest_settings WHERE id = 1');
    const settings = settingsRes.rows[0] || {};

    res.json({
      results: tallyRes.rows,
      results_publication_status: settings.results_publication_status,
      voting_status: settings.voting_status,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al calcular resultados del concurso', details: err.message });
  }
}

export async function updateContestSettings(req: Request, res: Response): Promise<void> {
  try {
    const { voting_status, results_publication_status, registration_limit, additional_prizes_method } = req.body;
    const db = await getDb();

    const currentRes = await db.query('SELECT * FROM contest_settings WHERE id = 1');
    const current = currentRes.rows[0];

    const newVotingStatus = voting_status || current.voting_status;
    const newPubStatus = results_publication_status || current.results_publication_status;
    const newLimit = registration_limit ? Number(registration_limit) : current.registration_limit;
    const newAddMethod = additional_prizes_method !== undefined ? additional_prizes_method : current.additional_prizes_method;

    await db.query(`
      UPDATE contest_settings
      SET 
        voting_status = $1,
        results_publication_status = $2,
        registration_limit = $3,
        additional_prizes_method = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [newVotingStatus, newPubStatus, newLimit, newAddMethod]);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, reason, metadata)
      VALUES ($1, 'SETTINGS_UPDATED', 'contest_settings', '1', 'Modificación de parámetros del concurso', $2)
    `, [req.admin?.id, JSON.stringify({ voting_status: newVotingStatus, results_publication_status: newPubStatus, registration_limit: newLimit })]);

    res.json({ success: true, message: 'Configuración actualizada exitosamente' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar la configuración', details: err.message });
  }
}

export async function getAdminPrizes(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const result = await db.query('SELECT * FROM prize_categories ORDER BY rank_position ASC');
    res.json({ prizes: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar premios', details: err.message });
  }
}

export async function updatePrizeCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { name, amount_mxn, allocation_method, quantity } = req.body;

    const db = await getDb();
    await db.query(`
      UPDATE prize_categories
      SET 
        name = COALESCE($1, name),
        amount_mxn = COALESCE($2, amount_mxn),
        allocation_method = COALESCE($3, allocation_method),
        quantity = COALESCE($4, quantity)
      WHERE id = $5
    `, [name, amount_mxn, allocation_method, quantity, id]);

    // Audit log
    await db.query(`
      INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, reason, metadata)
      VALUES ($1, 'PRIZE_UPDATED', 'prize_categories', $2, 'Actualización de categoría o método de premiación', $3)
    `, [req.admin?.id, String(id), JSON.stringify(req.body)]);

    res.json({ success: true, message: 'Categoría de premio actualizada' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar el premio', details: err.message });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const result = await db.query(`
      SELECT 
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.timestamp,
        a.reason,
        a.metadata,
        adm.name as admin_name,
        adm.email as admin_email
      FROM audit_logs a
      LEFT JOIN admins adm ON a.admin_id = adm.id
      ORDER BY a.timestamp DESC
      LIMIT 100
    `);

    res.json({ logs: result.rows, total: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar bitácora de auditoría', details: err.message });
  }
}

export async function generateQrCode(req: Request, res: Response): Promise<void> {
  try {
    const targetUrl = (req.query.url as string) || 'https://fmvz.unam.mx/halloween-2026';
    const qrDataUrl = await qrcode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#090B14',
        light: '#FFFFFF',
      },
    });

    res.json({
      target_url: targetUrl,
      qr_data_url: qrDataUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al generar código QR', details: err.message });
  }
}
