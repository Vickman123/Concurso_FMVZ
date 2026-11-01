import fs from 'fs';
import path from 'path';
import { getDb } from './connection';

/**
 * Robust versioned migration engine for FMVZ Halloween Contest.
 * Tracks applied migrations in the 'schema_migrations' table.
 */
export async function runMigrations(): Promise<void> {
  const db = await getDb();

  // 1. Ensure migrations tracking table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Discover migrations directory
  let migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    // Development tsx fallback
    migrationsDir = path.resolve(__dirname, '../../src/db/migrations');
  }

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`[DB Migration] Discovered ${files.length} versioned migration file(s) in ${migrationsDir}`);

    for (const file of files) {
      const checkRes = await db.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [file]
      );

      if (checkRes.rowCount === 0) {
        console.log(`[DB Migration] Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Split statements safely
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        await db.transaction(async (txClient) => {
          for (const statement of statements) {
            await txClient.query(statement);
          }
          await txClient.query(
            'INSERT INTO schema_migrations (version) VALUES ($1)',
            [file]
          );
        });

        console.log(`[DB Migration] Successfully applied: ${file} ✅`);
      } else {
        // Already applied
      }
    }
  } else {
    // Fallback to legacy schema.sql if migrations folder is absent
    let schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
    }

    if (fs.existsSync(schemaPath)) {
      console.log('[DB Migration] Applying fallback schema.sql...');
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await db.query(statement);
      }
      console.log('[DB Migration] Fallback schema applied successfully.');
    }
  }

  console.log('[DB Migration] All database migrations are up to date.');
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[DB Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Migration Error]:', err);
      process.exit(1);
    });
}
