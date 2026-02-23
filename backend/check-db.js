#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '12345',
  host: 'localhost',
  port: 5432,
  database: 'toko_baju_db'
});

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Check products
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('Products count:', productsResult.rows[0].count);

    // Get first product
    const firstProduct = await pool.query('SELECT * FROM products LIMIT 1');
    if (firstProduct.rows.length > 0) {
      console.log('First product:', firstProduct.rows[0]);
    } else {
      console.log('No products found!');
    }

    // Check users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', usersResult.rows[0].count);

    // Check orders
    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log('Orders count:', ordersResult.rows[0].count);

    console.log('\n✓ Database connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
