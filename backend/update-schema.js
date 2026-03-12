import pool from './db.js';

async function updateSchema() {
    try {
        console.log('🔄 Menambahkan tabel Reservations dan Categories...');

        await pool.query(`
            -- 10. Tabel Categories (Mapping dari "Table" di Jobsheet)
            CREATE TABLE IF NOT EXISTS categories (
              id SERIAL PRIMARY KEY,
              name VARCHAR(100) NOT NULL UNIQUE,
              description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 11. Tabel Reservations
            CREATE TABLE IF NOT EXISTS reservations (
              id SERIAL PRIMARY KEY,
              user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              item_name VARCHAR(255), -- Nama barang yang di-reserve (bisa nama produk)
              reservation_date DATE NOT NULL,
              reservation_time TIME NOT NULL,
              status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Tabel berhasil ditambahkan (jika belum ada).');
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal mengupdate schema:', err);
        process.exit(1);
    }
}

updateSchema();
