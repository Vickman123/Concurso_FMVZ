const fs = require('fs');
const path = require('path');
const { getDb } = require('../server/dist/db/connection');

async function insertParticipants() {
  const db = await getDb();

  // Clear any existing test votes and participants
  await db.query('DELETE FROM live_votes');
  await db.query('DELETE FROM votes');
  await db.query('DELETE FROM participants');

  const p1_b64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, '../client/public/test-costumes/spiderman.jpg')).toString('base64');
  const p2_b64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, '../client/public/test-costumes/payaso_asesino.jpg')).toString('base64');
  const p3_b64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, '../client/public/test-costumes/chica_vampiro.jpg')).toString('base64');

  const p1 = await db.query(`
    INSERT INTO participants (
      contest_number, full_name, public_display_name, costume_title,
      description, participant_type, institutional_identifier,
      photo_original_key, photo_thumbnail_key, status, registration_folio
    ) VALUES (
      1, 'Santiago Morales Rivera', 'Santiago (Spiderman)', 'Spiderman Universitario',
      'El clásico Hombre Araña llega a defender la FMVZ de cualquier villano con su traje arácnido.',
      'student', '318001122', $1, '/test-costumes/spiderman.jpg', 'approved', 'FMVZ-2026-SPID-001'
    ) RETURNING id
  `, [p1_b64]);

  const p2 = await db.query(`
    INSERT INTO participants (
      contest_number, full_name, public_display_name, costume_title,
      description, participant_type, institutional_identifier,
      photo_original_key, photo_thumbnail_key, status, registration_folio
    ) VALUES (
      2, 'Mateo Hernández Cruz', 'Mateo (Payaso Asesino)', 'Payaso Asesino del Circo Siniestro',
      'Directo de tus peores pesadillas circenses, maquillaje tétrico y globo rojo listo para asustar.',
      'student', '318002233', $1, '/test-costumes/payaso_asesino.jpg', 'approved', 'FMVZ-2026-CLWN-002'
    ) RETURNING id
  `, [p2_b64]);

  const p3 = await db.query(`
    INSERT INTO participants (
      contest_number, full_name, public_display_name, costume_title,
      description, participant_type, institutional_identifier,
      photo_original_key, photo_thumbnail_key, status, registration_folio
    ) VALUES (
      3, 'Valeria Gómez Luna', 'Valeria (Chica Vampiro)', 'Chica Vampiro Victoriana',
      'Elegancia gótica, vestido de terciopelo borgoña, encaje negro y colmillos afilados.',
      'student', '318003344', $1, '/test-costumes/chica_vampiro.jpg', 'approved', 'FMVZ-2026-VAMP-003'
    ) RETURNING id
  `, [p3_b64]);

  console.log('Inserted participants with IDs:', p1.rows[0].id, p2.rows[0].id, p3.rows[0].id);

  // Set participant 1 on stage
  await db.query(`
    UPDATE live_stage_session
    SET current_participant_id = $1, stage_status = 'presenting', voting_seconds_left = 30, is_active = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `, [p1.rows[0].id]);

  await db.query(`
    UPDATE contest_settings
    SET is_live_active = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `);

  console.log('Live stage configured with participant 1 on stage and active!');
  process.exit(0);
}

insertParticipants().catch(err => {
  console.error(err);
  process.exit(1);
});
