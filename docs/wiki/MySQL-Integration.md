# MySQL Integration

## Driver

[`mysql2`](https://github.com/sidorares/node-mysql2) — a fast MySQL client with native promise support and full TypeScript types built in. Uses `mysql2/promise` for the async/await API.

## Source files

| File | Purpose |
|---|---|
| `src/databases/mysql/client.ts` | Pool factory |
| `src/databases/mysql/examples.ts` | CRUD demo — products table |

## Connection pool

A `mysql2` promise pool is created lazily with a connection limit of 10:

```typescript
pool = mysql.createPool({
  ...config.mysql,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

The pool is accessed via `getPool()` from any module that needs it.

## Parameterised queries

MySQL uses `?` placeholders:

```typescript
const [result] = await pool.execute<ResultSetHeader>(
  `INSERT INTO products (name, price, stock) VALUES (?, ?, ?)`,
  [name, price, stock]
);
return result.insertId;
```

`execute()` uses prepared statements, which cache the query plan on the server and prevent SQL injection.

## Typed row results

Rows are typed by extending `RowDataPacket`:

```typescript
interface Product extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
}

const [rows] = await pool.execute<Product[]>(`SELECT * FROM products ORDER BY id`);
```

## Demo walkthrough

The `runMysqlDemo()` function:

1. Creates a `products` table if it doesn't exist
2. Deletes previous demo rows (idempotent)
3. Inserts two products and captures their `insertId`
4. Updates the stock of one product
5. Lists all products
6. Deletes one product
7. Confirms remaining count

## Running

```bash
npm run demo:mysql
```

## Configuration

See [Configuration](Configuration.md#mysql) for environment variables.

## Schema used

```sql
CREATE TABLE IF NOT EXISTS products (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  stock      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
