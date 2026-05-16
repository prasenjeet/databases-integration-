import { getPool, closePool } from "./client";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface Product extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
}

async function setup(label: string): Promise<void> {
  const pool = getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.execute(`DELETE FROM products WHERE name LIKE 'Demo %'`);
  console.log(`[${label}] Table ready`);
}

async function insertProduct(name: string, price: number, stock: number): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO products (name, price, stock) VALUES (?, ?, ?)`,
    [name, price, stock]
  );
  return result.insertId;
}

async function listProducts(): Promise<Product[]> {
  const pool = getPool();
  const [rows] = await pool.execute<Product[]>(`SELECT * FROM products ORDER BY id`);
  return rows;
}

async function updateStock(id: number, stock: number): Promise<void> {
  const pool = getPool();
  await pool.execute(`UPDATE products SET stock = ? WHERE id = ?`, [stock, id]);
}

async function deleteProduct(id: number): Promise<void> {
  const pool = getPool();
  await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
}

export async function runMysqlDemo(): Promise<void> {
  const label = "MySQL";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${label} Demo`);
  console.log(`${"=".repeat(50)}`);

  try {
    await setup(label);

    const laptopId = await insertProduct("Demo Laptop", 999.99, 50);
    const phoneId = await insertProduct("Demo Phone", 499.49, 120);
    console.log(`[${label}] Inserted product ids:`, laptopId, phoneId);

    await updateStock(laptopId, 45);
    console.log(`[${label}] Updated stock for id=${laptopId}`);

    const products = await listProducts();
    console.log(`[${label}] All products (${products.length}):`);
    products.forEach((p) =>
      console.log(`  id=${p.id} name=${p.name} price=${p.price} stock=${p.stock}`)
    );

    await deleteProduct(phoneId);
    console.log(`[${label}] Deleted product id=${phoneId}`);

    const remaining = await listProducts();
    console.log(`[${label}] Remaining products: ${remaining.length}`);
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
  }
}

if (require.main === module) {
  runMysqlDemo().finally(closePool);
}
