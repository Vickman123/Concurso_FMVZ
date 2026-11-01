import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl) {
  console.error('❌ Error: SOURCE_DATABASE_URL (o DATABASE_URL) no está definida.');
  process.exit(1);
}

if (!targetUrl) {
  console.error('❌ Error: TARGET_DATABASE_URL no está definida.');
  console.error('Uso: TARGET_DATABASE_URL="postgres://user:pass@host:5432/db" node scripts/migrate_from_supabase.mjs');
  process.exit(1);
}

if (sourceUrl === targetUrl) {
  console.error('❌ Error: La base de datos de origen y destino no pueden ser la misma.');
  process.exit(1);
}

function createPool(url) {
  const isLocalHost =
    url.includes('@localhost') ||
    url.includes('@127.0.0.1') ||
    url.includes('@db:') ||
    url.includes('@postgres:') ||
    url.includes('sslmode=disable');

  const isSsl = !isLocalHost && (url.includes('supabase') || url.includes('neon') || url.includes('sslmode=require'));

  return new Pool({
    connectionString: url,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 7000,
  });
}

const sourcePool = createPool(sourceUrl);
const targetPool = createPool(targetUrl);

const TABLES_ORDER = [
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

async function migrateData() {
  console.log('==================================================================');
  console.log('🚀 Migrador de Datos: Supabase Cloud ➔ Hostinger VPS PostgreSQL');
  console.log(`📡 Origen (Lectura estricta): ${sourceUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`🎯 Destino (Escritura):      ${targetUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log('==================================================================\n');

  try {
    // 1. Verify connections
    await sourcePool.query('SELECT 1');
    console.log('✅ Conexión con origen (Supabase) verificada.');

    await targetPool.query('SELECT 1');
    console.log('✅ Conexión con destino (Hostinger VPS) verificada.');

    // 2. Migrate each table preserving integrity
    const summary = [];

    for (const table of TABLES_ORDER) {
      console.log(`\n⏳ Migrando tabla [${table}]...`);
      const srcRows = (await sourcePool.query(`SELECT * FROM "${table}"`)).rows;

      let insertedCount = 0;
      if (srcRows.length > 0) {
        const columns = Object.keys(srcRows[0]);
        const colNames = columns.map(c => `"${c}"`).join(', ');

        for (const row of srcRows) {
          const values = columns.map(c => row[c]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

          // Insert with ON CONFLICT DO NOTHING to guarantee idempotence
          const insertQuery = `
            INSERT INTO "${table}" (${colNames})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING;
          `;

          await targetPool.query(insertQuery, values);
          insertedCount++;
        }
      }

      // Check count in target
      const targetCount = (await targetPool.query(`SELECT COUNT(*) as count FROM "${table}"`)).rows[0].count;
      summary.push({
        Tabla: table,
        Origen: srcRows.length,
        Destino: Number(targetCount),
        Estado: Number(targetCount) >= srcRows.length ? '✅ Sincronizado' : '⚠️ Discrepancia',
      });
    }

    // 3. Reset primary key sequences on target
    console.log('\n--- Ajuste de Secuencias de Identificadores (Target) ---');
    const sequences = [
      { table: 'prize_categories', seq: 'prize_categories_id_seq' },
      { table: 'admins', seq: 'admins_id_seq' },
      { table: 'participants', seq: 'participants_id_seq' },
      { table: 'voters', seq: 'voters_id_seq' },
      { table: 'votes', seq: 'votes_id_seq' },
      { table: 'audit_logs', seq: 'audit_logs_id_seq' },
      { table: 'live_votes', seq: 'live_votes_id_seq' },
      { table: 'live_reactions', seq: 'live_reactions_id_seq' }
    ];

    for (const s of sequences) {
      try {
        await targetPool.query(`
          SELECT setval('${s.seq}', COALESCE((SELECT MAX(id) FROM "${s.table}"), 0) + 1, false);
        `);
        console.log(`✅ Secuencia '${s.seq}' actualizada.`);
      } catch (err) {
        // Table might not have custom sequence or already aligned
      }
    }

    console.log('\n==================================================================');
    console.log('📋 RESUMEN DE MIGRACIÓN DE INFORMACIÓN');
    console.log('==================================================================');
    console.table(summary);
    console.log('==================================================================');
    console.log('🎉 Migración completada sin afectar la base de datos de origen.');
    console.log('==================================================================');

  } catch (err) {
    console.error('❌ Error durante el proceso de migración:', err);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

migrateData();
