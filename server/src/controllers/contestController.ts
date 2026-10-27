import { Request, Response } from 'express';
import { getDb } from '../db/connection';

export async function getContestSettings(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const settingsRes = await db.query('SELECT * FROM contest_settings WHERE id = 1');
    const countsRes = await db.query(`
      SELECT 
        COUNT(*) as total_registered,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
      FROM participants
      WHERE status != 'inactive'
    `);

    const settings = settingsRes.rows[0] || {};
    const counts = countsRes.rows[0] || { total_registered: 0, approved_count: 0 };

    res.json({
      contest_name: settings.contest_name,
      contest_date: settings.contest_date,
      registration_limit: Number(settings.registration_limit),
      voting_status: settings.voting_status,
      voting_start: settings.voting_start,
      voting_end: settings.voting_end,
      results_publication_status: settings.results_publication_status,
      additional_prizes_method: settings.additional_prizes_method,
      is_live_active: Boolean(settings.is_live_active),
      total_registered: Number(counts.total_registered),
      approved_count: Number(counts.approved_count),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar parámetros del concurso', details: err.message });
  }
}

export async function getPrizes(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const resPrizes = await db.query('SELECT id, name, amount_mxn, allocation_method, rank_position, quantity FROM prize_categories ORDER BY rank_position ASC');
    res.json({ prizes: resPrizes.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar premios', details: err.message });
  }
}

export async function getPublicResults(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const settingsRes = await db.query('SELECT results_publication_status FROM contest_settings WHERE id = 1');
    const status = settingsRes.rows[0]?.results_publication_status;

    if (status !== 'published') {
      res.json({
        published: false,
        message: 'Los resultados oficiales serán publicados tras el cierre del concurso y la validación del jurado.',
      });
      return;
    }

    // Tally votes for approved participants
    const tallyRes = await db.query(`
      SELECT 
        p.contest_number,
        p.public_display_name,
        p.costume_title,
        p.photo_original_key,
        p.participant_type,
        COUNT(v.id) as total_votes
      FROM participants p
      LEFT JOIN votes v ON p.id = v.participant_id AND v.status = 'valid'
      WHERE p.status = 'approved'
      GROUP BY p.id, p.contest_number, p.public_display_name, p.costume_title, p.photo_original_key, p.participant_type
      ORDER BY total_votes DESC, p.contest_number ASC
    `);

    res.json({
      published: true,
      results: tallyRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener resultados públicos', details: err.message });
  }
}
