import fs from 'fs';
import path from 'path';
import { getDb } from './connection';

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  let schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    // Try source folder fallback when running from dist/
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[DB] Running database migrations...');
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (err: any) {
      console.error(`[DB Migration Error] in statement:\n${statement}\nError:`, err.message);
      throw err;
    }
  }

  console.log('[DB] Migrations applied successfully.');
}
