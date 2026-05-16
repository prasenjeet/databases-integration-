import { withClient, closePool } from "./client";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

async function setup(label: string): Promise<void> {
  await withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Wipe previous demo rows so the example is idempotent.
    await client.query(`DELETE FROM users WHERE email LIKE '%@example.com'`);
    console.log(`[${label}] Table ready`);
  });
}

async function insertUser(name: string, email: string): Promise<User> {
  return withClient(async (client) => {
    const result = await client.query<User>(
      `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *`,
      [name, email]
    );
    return result.rows[0];
  });
}

async function listUsers(): Promise<User[]> {
  return withClient(async (client) => {
    const result = await client.query<User>(`SELECT * FROM users ORDER BY id`);
    return result.rows;
  });
}

async function updateUser(id: number, name: string): Promise<User | undefined> {
  return withClient(async (client) => {
    const result = await client.query<User>(
      `UPDATE users SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    return result.rows[0];
  });
}

async function deleteUser(id: number): Promise<void> {
  await withClient(async (client) => {
    await client.query(`DELETE FROM users WHERE id = $1`, [id]);
  });
}

export async function runPostgresqlDemo(): Promise<void> {
  const label = "PostgreSQL";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${label} Demo`);
  console.log(`${"=".repeat(50)}`);

  try {
    await setup(label);

    const alice = await insertUser("Alice", "alice@example.com");
    const bob = await insertUser("Bob", "bob@example.com");
    console.log(`[${label}] Inserted:`, alice.name, bob.name);

    const updated = await updateUser(alice.id, "Alice Updated");
    console.log(`[${label}] Updated:`, updated?.name);

    const users = await listUsers();
    console.log(`[${label}] All users (${users.length}):`);
    users.forEach((u) => console.log(`  id=${u.id} name=${u.name} email=${u.email}`));

    await deleteUser(bob.id);
    console.log(`[${label}] Deleted user id=${bob.id}`);

    const remaining = await listUsers();
    console.log(`[${label}] Remaining users: ${remaining.length}`);
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
  }
}

// Run directly: npm run demo:postgresql
if (require.main === module) {
  runPostgresqlDemo().finally(closePool);
}
