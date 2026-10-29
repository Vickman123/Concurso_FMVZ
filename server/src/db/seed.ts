import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';
import { getDb } from './connection';
import { runMigrations } from './migrate';
import { INITIAL_57_PARTICIPANTS } from './initialData';
import { generateCostumeSvgs } from './generateAvatars';

export async function runSeed(): Promise<void> {
  // CRITICAL SAFETY CHECK: Prevent overwriting real production data or Supabase database
  const dbUrl = process.env.DATABASE_URL || '';
  const isCloudOrProduction =
    process.env.NODE_ENV === 'production' ||
    dbUrl.includes('supabase') ||
    dbUrl.includes('neon') ||
    dbUrl.includes('render') ||
    dbUrl.includes('pooler');

  if (isCloudOrProduction && process.env.ALLOW_DANGEROUS_SEED !== 'true') {
    console.warn('\n🛑 =========================================================================');
    console.warn('🛑 [SEGURIDAD ACTIVA] runSeed() fue BLOQUEADO automáticamente.');
    console.warn('🛑 Motivo: Se detectó un entorno de producción o conexión en la nube (Supabase).');
    console.warn('🛑 Para proteger los registros reales del concurso, el sembrado está desactivado.');
    console.warn('🛑 =========================================================================\n');
    return;
  }

  console.log('[Seed] Starting database migration & seed process...');
  await runMigrations();
  const db = await getDb();

  // 1. Generate SVGs
  generateCostumeSvgs();

  // 2. Contest Settings
  console.log('[Seed] Seeding contest settings...');
  await db.query(`
    INSERT INTO contest_settings (
      id, contest_name, contest_date, registration_limit,
      voting_status, voting_start, voting_end,
      results_publication_status, additional_prizes_method, updated_at
    ) VALUES (
      1,
      'Segundo Concurso de Disfraces FMVZ',
      '2026-11-03',
      100,
      'open',
      '2026-11-03 09:00:00-06',
      '2026-11-03 18:00:00-06',
      'hidden',
      'Modalidad por definir en las bases oficiales',
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      contest_name = EXCLUDED.contest_name,
      registration_limit = EXCLUDED.registration_limit,
      updated_at = CURRENT_TIMESTAMP;
  `);

  // 3. Prize Categories (vaciado / sin precargar)
  console.log('[Seed] Clearing prize categories...');
  await db.query('DELETE FROM prize_categories;');

  // 4. Admin Users
  console.log('[Seed] Seeding admin accounts...');
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Halloween2026!', adminSalt);
  const operatorHash = await bcrypt.hash('Operador2026!', adminSalt);

  await db.query(`
    INSERT INTO admins (name, email, password_hash, role, status)
    VALUES 
      ('Comité Organizador FMVZ', 'admin@fmvz.unam.mx', $1, 'admin', 'active'),
      ('Operador de Mesa FMVZ', 'operador@fmvz.unam.mx', $2, 'operator', 'active')
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      status = 'active';
  `, [adminHash, operatorHash]);

  // 5. Participants (57 initial registrations)
  console.log(`[Seed] Seeding ${INITIAL_57_PARTICIPANTS.length} participants...`);
  for (const part of INITIAL_57_PARTICIPANTS) {
    const folio = `FMVZ-REG-2026-${String(part.contest_number).padStart(4, '0')}`;
    await db.query(`
      INSERT INTO participants (
        contest_number, full_name, public_display_name, costume_title,
        description, participant_type, institutional_identifier,
        photo_original_key, photo_thumbnail_key, status, registration_folio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10)
      ON CONFLICT (contest_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        public_display_name = EXCLUDED.public_display_name,
        costume_title = EXCLUDED.costume_title,
        description = EXCLUDED.description,
        participant_type = EXCLUDED.participant_type,
        institutional_identifier = EXCLUDED.institutional_identifier,
        photo_original_key = EXCLUDED.photo_original_key,
        photo_thumbnail_key = EXCLUDED.photo_thumbnail_key,
        status = EXCLUDED.status;
    `, [
      part.contest_number,
      part.full_name,
      part.public_display_name,
      part.costume_title,
      part.description,
      part.participant_type,
      part.institutional_identifier,
      part.photo_original_key,
      part.status,
      folio
    ]);
  }

  // 6. Generate CSV file for external validation / re-import
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const csvRows = INITIAL_57_PARTICIPANTS.map(p => ({
    numero_concurso: p.contest_number,
    nombre_completo: p.full_name,
    nombre_publico: p.public_display_name,
    titulo_disfraz: p.costume_title,
    descripcion: p.description,
    tipo_participante: p.participant_type,
    identificador_institucional: p.institutional_identifier,
    estado: p.status,
  }));

  const csvOutput = stringify(csvRows, { header: true });
  const csvFile = path.join(dataDir, 'participantes_57_existentes.csv');
  fs.writeFileSync(csvFile, csvOutput, 'utf8');
  console.log(`[Seed] Exported reference CSV to ${csvFile}`);

  // 6.5 Live Stage Session
  await db.query(`
    INSERT INTO live_stage_session (id, stage_status, current_participant_id, voting_seconds_left, total_cheers)
    SELECT 1, 'waiting', id, 30, 0
    FROM participants
    WHERE contest_number = 1
    ON CONFLICT (id) DO NOTHING;
  `);

  // 7. Audit Log (limpiar registros de auditoría de prueba)
  await db.query('DELETE FROM audit_logs;');

  console.log('[Seed] Database initialization completed successfully! 🎉');
}

// Allow direct CLI execution
if (require.main === module) {
  runSeed()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
