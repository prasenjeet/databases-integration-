import { Pool, PoolClient } from "pg";
import { config } from "../../config";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(config.postgresql);
  }
  return pool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
