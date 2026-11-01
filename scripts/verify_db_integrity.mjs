import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está definida.');
  process.exit(1);
}

const isLocalHost =
  dbUrl.includes('@localhost') ||
  dbUrl.includes('@127.0.0.1') ||
  dbUrl.includes('@db:') ||
  dbUrl.includes('@postgres:') ||
  dbUrl.includes('sslmode=disable');

const isSsl = process.env.DATABASE_SSL !== undefined
  ? (process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1')
  : (!isLocalHost && (dbUrl.includes('supabase') || dbUrl.includes('neon') || dbUrl.includes('sslmode=require')));

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
});

async function runIntegrityCheck() {
  console.log('==================================================================');
  console.log('🔍 Auditoría de Integridad de Base de Datos PostgreSQL — FMVZ 2026');
  console.log(`🎯 Servidor: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log('==================================================================\n');

  let hasErrors = false;

  try {
    // 1. Version Check
    const versionRes = await pool.query('SELECT version();');
    console.log(`📦 Motor de Base de Datos: ${versionRes.rows[0].version}`);

    // 2. Required Tables Check
    const requiredTables = [
      'contest_settings',
      'prize_categories',
      'admins',
      'participants',
      'voters',
      'votes',
      'audit_logs',
      'live_stage_session',
      'live_votes',
      'live_reactions'
    ];

    console.log('\n--- 1. Verificación de Tablas Requeridas ---');
    const tableCounts = [];
    for (const table of requiredTables) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = countRes.rows[0].count;
        tableCounts.push({ Tabla: table, Estado: '✅ Presente', Registros: count });
      } catch (err) {
        hasErrors = true;
        tableCounts.push({ Tabla: table, Estado: '❌ Ausente / Error', Registros: '-' });
      }
    }
    console.table(tableCounts);

    // 3. Foreign Key & Orphan Records Integrity Check
    console.log('\n--- 2. Verificación de Integridad Referencial y Huérfanos ---');

    // Votes without valid voter
    const orphanedVotesVoter = await pool.query(`
      SELECT count(*) as count FROM votes v
      LEFT JOIN voters vt ON v.voter_id = vt.id
      WHERE vt.id IS NULL
    `);
    const orphanVoterCount = Number(orphanedVotesVoter.rows[0].count);
    if (orphanVoterCount === 0) {
      console.log('✅ Votos sin votante huérfano: 0 (Correcto)');
    } else {
      console.error(`🚨 ALERTA: Se encontraron ${orphanVoterCount} votos huérfanos sin registro en voters!`);
      hasErrors = true;
    }

    // Votes without valid participant
    const orphanedVotesPart = await pool.query(`
      SELECT count(*) as count FROM votes v
      LEFT JOIN participants p ON v.participant_id = p.id
      WHERE p.id IS NULL
    `);
    const orphanPartCount = Number(orphanedVotesPart.rows[0].count);
    if (orphanPartCount === 0) {
      console.log('✅ Votos hacia participantes inexistentes: 0 (Correcto)');
    } else {
      console.error(`🚨 ALERTA: Se encontraron ${orphanPartCount} votos hacia participantes inexistentes!`);
      hasErrors = true;
    }

    // Live votes without valid participant
    const orphanedLiveVotes = await pool.query(`
      SELECT count(*) as count FROM live_votes lv
      LEFT JOIN participants p ON lv.participant_id = p.id
      WHERE p.id IS NULL
    `);
    const orphanLivePartCount = Number(orphanedLiveVotes.rows[0].count);
    if (orphanLivePartCount === 0) {
      console.log('✅ Votos en vivo hacia participantes inexistentes: 0 (Correcto)');
    } else {
      console.error(`🚨 ALERTA: Se encontraron ${orphanLivePartCount} votos en vivo huérfanos!`);
      hasErrors = true;
    }

    // 4. Duplicate Voter Check
    console.log('\n--- 3. Verificación de Restricciones de Votación Única ---');
    const dupVoters = await pool.query(`
      SELECT voter_type, normalized_identifier, count(*)
      FROM voters
      GROUP BY voter_type, normalized_identifier
      HAVING count(*) > 1
    `);
    if (dupVoters.rowCount === 0) {
      console.log('✅ Padrón de votantes sin duplicados por identidad (Correcto)');
    } else {
      console.error(`🚨 ALERTA: Se encontraron ${dupVoters.rowCount} identidades duplicadas en voters!`);
      hasErrors = true;
    }

    const dupVotes = await pool.query(`
      SELECT voter_id, count(*)
      FROM votes
      GROUP BY voter_id
      HAVING count(*) > 1
    `);
    if (dupVotes.rowCount === 0) {
      console.log('✅ Votos tradicionales por persona: 1 voto máximo garantizado (Correcto)');
    } else {
      console.error(`🚨 ALERTA: Se encontraron ${dupVotes.rowCount} personas con múltiples votos!`);
      hasErrors = true;
    }

    // 5. Sequence Alignment
    console.log('\n--- 4. Verificación de Secuencias de Identificadores ---');
    const seqCheck = await pool.query(`
      SELECT 
        (SELECT MAX(id) FROM participants) as max_participant_id,
        (SELECT last_value FROM participants_id_seq) as seq_participant_id
    `);
    const maxPart = Number(seqCheck.rows[0].max_participant_id || 0);
    const seqPart = Number(seqCheck.rows[0].seq_participant_id || 1);
    if (seqPart >= maxPart) {
      console.log(`✅ Secuencia participants_id_seq (${seqPart}) alineada con MAX(id)=${maxPart}`);
    } else {
      console.warn(`⚠️  Secuencia desalineada: seq=${seqPart} < max=${maxPart}. Corrigiendo secuencia...`);
      await pool.query(`SELECT setval('participants_id_seq', (SELECT MAX(id) FROM participants) + 1);`);
      console.log('✅ Secuencia corregida.');
    }

    console.log('\n==================================================================');
    if (!hasErrors) {
      console.log('🎉 AUDITORÍA DE INTEGRIDAD: 100% EXITOSA — BASE DE DATOS ÍNTEGRA.');
    } else {
      console.error('🚨 AUDITORÍA FINALIZADA CON ADVERTENCIAS O ERRORES.');
    }
    console.log('==================================================================');

  } catch (err) {
    console.error('❌ Error catastrófico durante la auditoría:', err.message);
    hasErrors = true;
  } finally {
    await pool.end();
  }

  process.exit(hasErrors ? 1 : 0);
}

runIntegrityCheck();
