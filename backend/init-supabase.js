import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script untuk inisialisasi database di Supabase
// Menjalankan schema.sql untuk membuat semua tabel dan data awal

async function initDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔄 Menghubungkan ke Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Berhasil terhubung!');

    // Baca file schema.sql
    const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🔄 Menjalankan schema SQL...');
    await client.query(schema);
    console.log('✅ Semua tabel berhasil dibuat!');

    // Verifikasi tabel yang sudah dibuat
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n📋 Daftar tabel yang berhasil dibuat:');
    tablesResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    // Cek jumlah data seed
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const productsCount = await client.query('SELECT COUNT(*) FROM products');
    const categoriesCount = await client.query('SELECT COUNT(*) FROM categories');

    console.log('\n📊 Data awal (seed):');
    console.log(`   - Users: ${usersCount.rows[0].count}`);
    console.log(`   - Products: ${productsCount.rows[0].count}`);
    console.log(`   - Categories: ${categoriesCount.rows[0].count}`);

    console.log('\n🎉 Database Supabase siap digunakan!');
  } catch (error) {
    console.error('❌ Gagal inisialisasi database:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

initDatabase();
