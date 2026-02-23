import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '12345',
  host: 'localhost',
  port: 5432,
  database: 'toko_baju_db'
});

pool.query('SELECT id, name FROM products ORDER BY id', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('\nProduct names in database:');
    res.rows.forEach(row => {
      console.log(`${row.id}. ${row.name}`);
    });
  }
  pool.end();
});
