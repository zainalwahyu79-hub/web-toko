import dns from 'dns';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Menggunakan dns.setDefaultResultOrder dinonaktifkan sementara untuk tes DNS default
// if (dns.setDefaultResultOrder) {
//   dns.setDefaultResultOrder('ipv4first');
// }

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Wajib diatur false untuk Supabase agar SSL tidak ditolak
  },
  connectionTimeoutMillis: 30000, 
  max: 10,
  idleTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Kesalahan Pool Database:', err.message);
});

const dbUrl = process.env.DATABASE_URL || '';
const redactPassword = (url) => url.replace(/:([^:@]+)@/, ':****@');

console.log('--- Mencoba Koneksi Database ---');
console.log('🔗 URL:', redactPassword(dbUrl));

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ BERHASIL TERHUBUNG KE DATABASE!');
    console.log('🕒 Waktu Server:', res.rows[0].now);
  } catch (err) {
    console.error('❌ KONEKSI GAGAL:', err.message);
    if (err.cause) console.error('🔍 Penyebab:', err.cause.message || err.cause);
    
    if (err.message.includes('ENOTFOUND')) {
      console.log('--- TIPS DEBUGGING (ENOTFOUND) ---');
      console.log('1. Pastikan project Supabase Anda tidak sedang dipause.');
      console.log('2. Coba ganti DNS komputer ke Google DNS (8.8.8.8).');
    }
    if (err.message.includes('timeout')) {
      console.log('--- TIPS DEBUGGING (TIMEOUT) ---');
      console.log('1. Pastikan anda terhubung ke internet.');
      console.log('2. Coba matikan/nyalakan VPN jika Anda menggunakannya.');
      console.log('3. Firewall mungkin memblokir port 5432/6543.');
    }
  }
}

testConnection();

export default pool;



