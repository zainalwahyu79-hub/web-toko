import dns from 'dns';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Menggunakan dns.setDefaultResultOrder untuk memprioritaskan IPv4
// Membantu mengatasi error ENOTFOUND di beberapa sistem Windows
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Konfigurasi Pool menggunakan Connection String (DATABASE_URL)
// Lebih stabil dan direkomendasikan untuk Supabase/Postgres eksternal
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 15000,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('❌ Kesalahan Pool Database:', err.message);
});

console.log('--- Mencoba Koneksi Database (via Connection String) ---');

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ BERHASIL TERHUBUNG KE DATABASE!');
    console.log('Waktu Server:', res.rows[0].now);
  } catch (err) {
    console.error('❌ KONEKSI GAGAL:', err.message);
    
    if (err.message.includes('ENOTFOUND')) {
      console.log('--- TIPS DEBUGGING (ENOTFOUND) ---');
      console.log('1. Pastikan project Supabase Anda tidak sedang dipause.');
      console.log('2. Coba ganti DNS komputer ke Google DNS (8.8.8.8).');
      console.log('3. Coba matikan/nyalakan VPN jika Anda menggunakannya.');
    }
  }
}

testConnection();

export default pool;



