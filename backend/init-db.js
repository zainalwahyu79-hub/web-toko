import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

async function initDB() {
  try {
    console.log('📦 Initializing database...');
    
    // Drop existing tables (cascade to handle dependencies)
    console.log('🧹 Cleaning up existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    
    // Log confirmation
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
    
    console.log('✅ Database initialized!');
    console.log(`   👥 Users: ${usersCount.rows[0].count}`);
    console.log(`   📦 Products: ${productsCount.rows[0].count}`);
    console.log(`   📋 Orders: ${ordersCount.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  }
}

initDB();
