import path from 'path';
import fs from 'fs';
import { Pool, PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
}

let pgPool: Pool | null = null;
let pgliteInstance: PGlite | null = null;
let isInitialized = false;

export async function getDb(): Promise<DbClient & { transaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> }> {
  if (!isInitialized) {
    await initDb();
  }

  if (pgPool) {
    return {
      async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pgPool!.query(text, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rowCount ?? res.rows.length,
        };
      },
      async transaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
        const client: PoolClient = await pgPool!.connect();
        try {
          await client.query('BEGIN');
          const wrappedClient: DbClient = {
            async query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
              const res = await client.query(text, params);
              return {
                rows: res.rows as R[],
                rowCount: res.rowCount ?? res.rows.length,
              };
            },
          };
          const result = await fn(wrappedClient);
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      },
    };
  }

  if (pgliteInstance) {
    const pgl = pgliteInstance;
    return {
      async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pgl.query(text, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rows.length,
        };
      },
      async transaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
        return await pgl.transaction(async (tx) => {
          const wrappedClient: DbClient = {
            async query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
              const res = await tx.query(text, params);
              return {
                rows: res.rows as R[],
                rowCount: res.rows.length,
              };
            },
          };
          return await fn(wrappedClient);
        });
      },
    };
  }

  throw new Error('Database not initialized');
}

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log('[DB] Connecting to PostgreSQL via DATABASE_URL...');
    const isSsl = dbUrl.includes('supabase') || dbUrl.includes('neon') || dbUrl.includes('sslmode=require') || process.env.NODE_ENV === 'production';
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    // Test connection
    const client = await pgPool.connect();
    client.release();
    console.log('[DB] Connected to native PostgreSQL successfully.');
  } else {
    const dataDir = path.resolve(__dirname, '../../data/postgres_db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    console.log(`[DB] Initializing PostgreSQL WASM engine at ${dataDir}...`);
    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.waitReady;
    console.log('[DB] PostgreSQL WASM engine is ready.');
  }

  isInitialized = true;
}
