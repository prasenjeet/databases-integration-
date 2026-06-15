# PostgreSQL Integration

## Driver

[`pg`](https://node-postgres.com/) — the most widely used PostgreSQL client for Node.js, with full TypeScript types via `@types/pg`.

## Source files

| File | Purpose |
|---|---|
| `src/databases/postgresql/client.ts` | Pool factory and `withClient` helper |
| `src/databases/postgresql/examples.ts` | CRUD demo — users table |

## Connection pooling

A single `pg.Pool` is created lazily and reused across all queries. The `withClient` helper acquires a connection from the pool, runs your callback, and releases it automatically — even on error:

```typescript
export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
```

## Parameterised queries

All queries use `$1`, `$2`, … placeholders to prevent SQL injection:

```typescript
const result = await client.query<User>(
  `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *`,
  [name, email]
);
```

## Demo walkthrough

The `runPostgresqlDemo()` function in `examples.ts`:

1. Creates a `users` table if it doesn't exist (`CREATE TABLE IF NOT EXISTS`)
2. Clears previous demo rows so the script is idempotent
3. Inserts two users with `INSERT … RETURNING *`
4. Updates one user's name with `UPDATE … RETURNING *`
5. Lists all users with `SELECT *`
6. Deletes one user with `DELETE WHERE id = $1`
7. Confirms the remaining count

## Running

```bash
npm run demo:postgresql
```

## Configuration

See [Configuration](Configuration.md#postgresql) for environment variables.

## Schema used

```sql
CREATE TABLE IF NOT EXISTS users (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  email     VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
