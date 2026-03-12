import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetDatabase() {
    try {
        console.log('🔄 Memulai reset database...');

        // Read schema.sql from ../sql/
        const schemaPath = path.join(__dirname, '../sql/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database berhasil di-reset dan data awal telah ditambahkan!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal mereset database:', err);
        process.exit(1);
    }
}

resetDatabase();
