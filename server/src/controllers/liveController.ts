import { Request, Response } from 'express';
import { getDb } from '../db/connection';
import { normalizeIdentifier } from '../utils/validation';

// Real-time SSE Clients Pool
const sseClients = new Set<Response>();

// Timer reference for Kahoot auto-closing voting
let liveVotingTimer: NodeJS.Timeout | null = null;

export function broadcastLiveEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Keep SSE connections alive with ping every 15s
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(':ping\n\n');
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

export async function streamLiveEvents(req: Request, res: Response): Promise<void> {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Critical for Render reverse proxy to prevent SSE buffering
    'Access-Control-Allow-Origin': '*',
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  res.write(':connected\n\n');
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  sseClients.add(res);

  // Broadcast updated viewer count to projector and audience
  broadcastLiveEvent('VIEWER_JOINED', { connected_clients: sseClients.size });

  // Send initial state immediately
  try {
    const state = await fetchCurrentLiveState();
    res.write(`event: INITIAL_STATE\ndata: ${JSON.stringify(state)}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  } catch (err) {
    console.error('[SSE] Failed to send initial state:', err);
  }

  req.on('close', () => {
    sseClients.delete(res);
    broadcastLiveEvent('VIEWER_LEFT', { connected_clients: sseClients.size });
  });
}

export async function fetchCurrentLiveState() {
  const db = await getDb();

  // 1. Get stage session
  const sessionRes = await db.query(`
    SELECT stage_status, current_participant_id, voting_seconds_left, total_cheers, updated_at, is_active
    FROM live_stage_session
    WHERE id = 1
  `);

  let session = sessionRes.rows[0];
  if (!session) {
    // If not exists, insert default
    await db.query(`
      INSERT INTO live_stage_session (id, stage_status, voting_seconds_left, total_cheers, is_active)
      VALUES (1, 'waiting', 30, 0, false)
      ON CONFLICT (id) DO NOTHING
    `);
    session = { stage_status: 'waiting', current_participant_id: null, voting_seconds_left: 30, total_cheers: 0, is_active: false };
  }

  // 2. Current participant info
  let currentParticipant = null;
  let currentVotes = { yes_count: 0, no_count: 0, total: 0 };

  if (session.current_participant_id) {
    const partRes = await db.query(`
      SELECT id, contest_number, public_display_name, costume_title, description,
             participant_type, photo_original_key, photo_thumbnail_key, status
      FROM participants
      WHERE id = $1
    `, [session.current_participant_id]);

    if (partRes.rowCount > 0) {
      currentParticipant = partRes.rows[0];

      // Count live votes for this participant
      const votesRes = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE vote_value = 'yes') as yes_count,
          COUNT(*) FILTER (WHERE vote_value = 'no') as no_count,
          COUNT(*) as total
        FROM live_votes
        WHERE participant_id = $1
      `, [session.current_participant_id]);

      const v = votesRes.rows[0];
      currentVotes = {
        yes_count: parseInt(v.yes_count || '0', 10),
        no_count: parseInt(v.no_count || '0', 10),
        total: parseInt(v.total || '0', 10),
      };
    }
  }

  // 3. Total registered voters
  const votersCountRes = await db.query(`SELECT COUNT(*) as count FROM voters`);
  const totalVotersRegistered = parseInt(votersCountRes.rows[0]?.count || '0', 10);

  // 4. All participants for switcher and ranking (include approved and pending for testing)
  const allPartsRes = await db.query(`
    SELECT p.id, p.contest_number, p.public_display_name, p.costume_title, p.photo_thumbnail_key, p.photo_original_key, p.status,
           COUNT(lv.id) FILTER (WHERE lv.vote_value = 'yes') as live_yes_votes
    FROM participants p
    LEFT JOIN live_votes lv ON p.id = lv.participant_id
    WHERE p.status IN ('approved', 'pending')
    GROUP BY p.id, p.contest_number, p.public_display_name, p.costume_title, p.photo_thumbnail_key, p.photo_original_key, p.status
    ORDER BY p.contest_number ASC
  `);

  return {
    is_active: Boolean(session.is_active),
    stage_status: session.stage_status,
    current_participant_id: session.current_participant_id,
    current_participant: currentParticipant,
    voting_seconds_left: session.voting_seconds_left,
    total_cheers: session.total_cheers,
    current_votes: currentVotes,
    total_voters_registered: totalVotersRegistered,
    participants: allPartsRes.rows.map(r => ({
      ...r,
      live_yes_votes: parseInt(r.live_yes_votes || '0', 10)
    })),
    connected_clients: Math.max(1, sseClients.size),
    updated_at: session.updated_at || new Date().toISOString(),
  };
}

export async function getLiveState(req: Request, res: Response): Promise<void> {
  try {
    const state = await fetchCurrentLiveState();
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener estado en vivo', details: err.message });
  }
}

export async function adminControlLive(req: Request, res: Response): Promise<void> {
  try {
    const { action, participant_id, contest_number, seconds } = req.body;
    const db = await getDb();

    let targetParticipantId = participant_id;

    if (!targetParticipantId && contest_number) {
      const p = await db.query('SELECT id FROM participants WHERE contest_number = $1', [contest_number]);
      if (p.rowCount > 0) targetParticipantId = p.rows[0].id;
    }

    if (action === 'SET_PARTICIPANT') {
      if (!targetParticipantId) {
        res.status(400).json({ error: 'Se requiere participant_id o contest_number' });
        return;
      }
      if (liveVotingTimer) {
        clearTimeout(liveVotingTimer);
        liveVotingTimer = null;
      }
      await db.query(`
        UPDATE live_stage_session
        SET current_participant_id = $1, stage_status = 'presenting', updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [targetParticipantId]);
    } else if (action === 'NEXT_PARTICIPANT' || action === 'PREV_PARTICIPANT') {
      if (liveVotingTimer) {
        clearTimeout(liveVotingTimer);
        liveVotingTimer = null;
      }

      const currentRes = await db.query(`
        SELECT p.contest_number 
        FROM live_stage_session s
        LEFT JOIN participants p ON s.current_participant_id = p.id
        WHERE s.id = 1
      `);
      const currentNum = currentRes.rows[0]?.contest_number || 0;

      let nextRes;
      if (action === 'NEXT_PARTICIPANT') {
        nextRes = await db.query(`
          SELECT id, contest_number FROM participants
          WHERE status = 'approved' AND contest_number > $1
          ORDER BY contest_number ASC LIMIT 1
        `, [currentNum]);

        if (nextRes.rowCount === 0) {
          nextRes = await db.query(`
            SELECT id, contest_number FROM participants
            WHERE status = 'approved'
            ORDER BY contest_number ASC LIMIT 1
          `);
        }

        if (nextRes.rowCount === 0) {
          // Fallback to any participant if none are approved yet
          nextRes = await db.query(`
            SELECT id, contest_number FROM participants
            ORDER BY contest_number ASC LIMIT 1
          `);
        }
      } else {
        nextRes = await db.query(`
          SELECT id, contest_number FROM participants
          WHERE status = 'approved' AND contest_number < $1
          ORDER BY contest_number DESC LIMIT 1
        `, [currentNum]);

        if (nextRes.rowCount === 0) {
          nextRes = await db.query(`
            SELECT id, contest_number FROM participants
            WHERE status = 'approved'
            ORDER BY contest_number DESC LIMIT 1
          `);
        }

        if (nextRes.rowCount === 0) {
          nextRes = await db.query(`
            SELECT id, contest_number FROM participants
            ORDER BY contest_number DESC LIMIT 1
          `);
        }
      }

      if (nextRes.rowCount > 0) {
        await db.query(`
          UPDATE live_stage_session
          SET current_participant_id = $1, stage_status = 'presenting', updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `, [nextRes.rows[0].id]);
      }
    } else if (action === 'OPEN_VOTING') {
      const votingDuration = seconds || 30;
      await db.query(`
        UPDATE live_stage_session
        SET stage_status = 'voting_open', voting_seconds_left = $1, is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [votingDuration]);
      await db.query(`
        UPDATE contest_settings
        SET is_live_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);

      // Server-side automatic timer to close voting after time runs out
      if (liveVotingTimer) clearTimeout(liveVotingTimer);
      liveVotingTimer = setTimeout(async () => {
        try {
          const dbInstance = await getDb();
          const check = await dbInstance.query('SELECT stage_status FROM live_stage_session WHERE id = 1');
          if (check.rows[0]?.stage_status === 'voting_open') {
            await dbInstance.query(`
              UPDATE live_stage_session
              SET stage_status = 'voting_closed', voting_seconds_left = 0, updated_at = CURRENT_TIMESTAMP
              WHERE id = 1
            `);
            const closedState = await fetchCurrentLiveState();
            broadcastLiveEvent('LIVE_STATE_CHANGED', closedState);
          }
        } catch (timerErr) {
          console.error('[Live Auto-close Timer Error]:', timerErr);
        }
      }, (votingDuration + 1) * 1000);
    } else if (action === 'ADJUST_TIMER') {
      const delta = Number(req.body.delta || 0);
      const newSec = Number(req.body.seconds);
      const sessionRes = await db.query('SELECT stage_status, voting_seconds_left FROM live_stage_session WHERE id = 1');
      const cur = sessionRes.rows[0];
      if (cur && cur.stage_status === 'voting_open') {
        let finalSeconds = !isNaN(newSec) && newSec > 0 ? newSec : (cur.voting_seconds_left || 30) + delta;
        if (finalSeconds < 5) finalSeconds = 5;
        await db.query(`
          UPDATE live_stage_session
          SET voting_seconds_left = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `, [finalSeconds]);

        if (liveVotingTimer) clearTimeout(liveVotingTimer);
        liveVotingTimer = setTimeout(async () => {
          try {
            const dbInstance = await getDb();
            const check = await dbInstance.query('SELECT stage_status FROM live_stage_session WHERE id = 1');
            if (check.rows[0]?.stage_status === 'voting_open') {
              await dbInstance.query(`
                UPDATE live_stage_session
                SET stage_status = 'voting_closed', voting_seconds_left = 0, updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
              `);
              const closedState = await fetchCurrentLiveState();
              broadcastLiveEvent('LIVE_STATE_CHANGED', closedState);
            }
          } catch (timerErr) {
            console.error('[Live Auto-close Timer Error]:', timerErr);
          }
        }, (finalSeconds + 1) * 1000);
      }
    } else if (action === 'CLOSE_VOTING') {
      if (liveVotingTimer) {
        clearTimeout(liveVotingTimer);
        liveVotingTimer = null;
      }
      await db.query(`
        UPDATE live_stage_session
        SET stage_status = 'voting_closed', voting_seconds_left = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
    } else if (action === 'SHOW_PODIUM') {
      if (liveVotingTimer) {
        clearTimeout(liveVotingTimer);
        liveVotingTimer = null;
      }
      await db.query(`
        UPDATE live_stage_session
        SET stage_status = 'podium', updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
    } else if (action === 'RESET_STAGE') {
      if (liveVotingTimer) {
        clearTimeout(liveVotingTimer);
        liveVotingTimer = null;
      }
      await db.query(`
        UPDATE live_stage_session
        SET stage_status = 'waiting', current_participant_id = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
    } else if (action === 'TOGGLE_LIVE_ACTIVE' || action === 'SET_LIVE_ACTIVE') {
      const currentActiveRes = await db.query('SELECT is_active FROM live_stage_session WHERE id = 1');
      const currentActive = Boolean(currentActiveRes.rows[0]?.is_active);
      const newActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : !currentActive;

      await db.query(`
        UPDATE live_stage_session
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [newActive]);

      await db.query(`
        UPDATE contest_settings
        SET is_live_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [newActive]);
    } else {
      res.status(400).json({ error: 'Acción no reconocida' });
      return;
    }

    // Broadcast updated state to all connected viewers and phones immediately
    const updatedState = await fetchCurrentLiveState();
    broadcastLiveEvent('LIVE_STATE_CHANGED', updatedState);

    res.json({ success: true, action, state: updatedState });
  } catch (err: any) {
    console.error('[Live Admin Error]:', err);
    res.status(500).json({ error: 'Error al controlar la sesión en vivo', details: err.message });
  }
}

export async function castLiveVote(req: Request, res: Response): Promise<void> {
  try {
    const { voter_type, institutional_identifier, full_name, vote, count } = req.body;

    if (!voter_type || !institutional_identifier || !vote) {
      res.status(400).json({ error: 'Faltan campos obligatorios para votar' });
      return;
    }

    const normalizedId = normalizeIdentifier(institutional_identifier);
    const db = await getDb();

    // Check stage session (must be in voting_open status)
    const sessionRes = await db.query('SELECT stage_status, current_participant_id, is_active FROM live_stage_session WHERE id = 1');
    const session = sessionRes.rows[0];

    if (!session || session.stage_status !== 'voting_open' || !session.current_participant_id) {
      res.status(403).json({
        error: 'VOTING_NOT_OPEN',
        message: 'La votación en vivo no está abierta en este momento.',
      });
      return;
    }

    const resolvedName = full_name?.trim() || (voter_type === 'student' ? `Alumno (${normalizedId})` : `Profesor (${normalizedId})`);

    // Upsert voter
    let voterId: number;
    const voterRes = await db.query(
      'SELECT id FROM voters WHERE voter_type = $1 AND normalized_identifier = $2',
      [voter_type, normalizedId]
    );

    if (voterRes.rowCount > 0) {
      voterId = voterRes.rows[0].id;
    } else {
      const newVoter = await db.query(
        'INSERT INTO voters (full_name, voter_type, normalized_identifier) VALUES ($1, $2, $3) RETURNING id',
        [resolvedName, voter_type, normalizedId]
      );
      voterId = newVoter.rows[0].id;
    }

    // 1 voto por espectador por cada participante que sube al escenario
    const voteVal = vote === 'no' ? 'no' : 'yes';

    await db.query(`
      INSERT INTO live_votes (voter_id, participant_id, vote_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (voter_id, participant_id) 
      DO UPDATE SET vote_value = EXCLUDED.vote_value, created_at = CURRENT_TIMESTAMP
    `, [voterId, session.current_participant_id, voteVal]);

    // Recalculate votes for current participant and broadcast immediately to admin console
    const votesRes = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE vote_value = 'yes') as yes_count,
        COUNT(*) FILTER (WHERE vote_value = 'no') as no_count,
        COUNT(*) as total
      FROM live_votes
      WHERE participant_id = $1
    `, [session.current_participant_id]);

    const v = votesRes.rows[0];
    const tally = {
      participant_id: session.current_participant_id,
      yes_count: parseInt(v.yes_count || '0', 10),
      no_count: parseInt(v.no_count || '0', 10),
      total: parseInt(v.total || '0', 10),
    };

    broadcastLiveEvent('LIVE_VOTE_UPDATED', tally);

    res.json({
      success: true,
      participant_id: session.current_participant_id,
      vote: voteVal,
      tally,
    });
  } catch (err: any) {
    console.error('[Live Vote Error]:', err);
    res.status(500).json({ error: 'Error al registrar el voto en vivo', details: err.message });
  }
}

export async function sendLiveReaction(req: Request, res: Response): Promise<void> {
  try {
    const { emoji } = req.body;
    const safeEmoji = typeof emoji === 'string' && emoji.length <= 10 ? emoji : '🎃';

    const db = await getDb();
    await db.query(`
      UPDATE live_stage_session
      SET total_cheers = total_cheers + 1
      WHERE id = 1
    `);

    // Insert reaction
    await db.query('INSERT INTO live_reactions (emoji) VALUES ($1)', [safeEmoji]);

    // Broadcast reaction to all projector/visors
    broadcastLiveEvent('REACTION', {
      emoji: safeEmoji,
      id: `${Date.now()}-${Math.random()}`,
    });

    res.json({ success: true, emoji: safeEmoji });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al enviar reacción', details: err.message });
  }
}
