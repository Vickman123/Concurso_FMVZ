import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Pool, PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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
let initPromise: Promise<void> | null = null;

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
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('[DB] Connecting to PostgreSQL via DATABASE_URL...');

      // Determine SSL mode:
      // 1. Explicit DATABASE_SSL env var ('true' or 'false')
      // 2. Auto-detect: disable for local/internal hosts (localhost, 127.0.0.1, docker service 'db'),
      //    enable for remote cloud DBs (supabase, neon, sslmode=require).
      let isSsl = false;
      if (process.env.DATABASE_SSL !== undefined) {
        isSsl = process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1';
      } else {
        const isLocalHost =
          dbUrl.includes('@localhost') ||
          dbUrl.includes('@127.0.0.1') ||
          dbUrl.includes('@db:') ||
          dbUrl.includes('@postgres:') ||
          dbUrl.includes('sslmode=disable');

        if (isLocalHost) {
          isSsl = false;
        } else if (
          dbUrl.includes('supabase') ||
          dbUrl.includes('neon') ||
          dbUrl.includes('sslmode=require')
        ) {
          isSsl = true;
        } else if (process.env.NODE_ENV === 'production' && !isLocalHost) {
          isSsl = true;
        }
      }

      const poolMax = parseInt(process.env.DB_POOL_MAX || '25', 10);
      const poolIdleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10);
      const poolConnectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || '15000', 10);

      console.log(`[DB] Pool Config: max=${poolMax}, idleTimeout=${poolIdleTimeout}ms, ssl=${isSsl}`);

      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: poolMax,
        idleTimeoutMillis: poolIdleTimeout,
        connectionTimeoutMillis: poolConnectTimeout,
      });

      pgPool.on('error', (err) => {
        console.error('[DB Pool Error] Unexpected idle client error:', err.message);
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
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function closeDb(): Promise<void> {
  isInitialized = false;
  initPromise = null;
  if (pgPool) {
    const p = pgPool;
    pgPool = null;
    await p.end();
  }
  if (pgliteInstance) {
    const p = pgliteInstance;
    pgliteInstance = null;
    await p.close();
  }
}
