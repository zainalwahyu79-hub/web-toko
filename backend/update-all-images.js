import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '12345',
  host: 'localhost',
  port: 5432,
  database: 'toko_baju_db'
});

async function updateImages() {
  try {
    console.log('Updating product images with local file paths...\n');

    const updates = [
      { id: 1, name: 'Kemeja Casual Putih', image: '/kemeja putih.png' },
      { id: 2, name: 'Celana Jeans Biru', image: '/Celana Jeans Biru.png' },
      { id: 3, name: 'T-Shirt Premium Hitam', image: '/T-Shirt Premium Hitam.png' },
      { id: 4, name: 'Jaket Denim Biru', image: '/Jaket Denim Biru.png' },
      { id: 5, name: 'Celana Chino Coklat', image: '/Celana Chino Coklat.png' },
      { id: 6, name: 'Kemeja Formal Biru', image: '/Kemeja Biru.png' },
      { id: 7, name: 'Hoodie Abu-abu', image: '/Hoodie Abu-abu.png' },
      { id: 8, name: 'Celana Jogger Hitam', image: '/Celana Jogger Hitam.png' },
      { id: 9, name: 'Polo Shirt Merah', image: '/Polo Shirt Merah.png' },
      { id: 10, name: 'Jaket Bomber Hijau', image: '/Jaket Bomber Hijau.png' }
    ];

    for (const update of updates) {
      await pool.query(
        'UPDATE products SET image = $1 WHERE id = $2',
        [update.image, update.id]
      );
      console.log(`✓ ID ${update.id} (${update.name}) -> ${update.image}`);
    }

    console.log('\n✓ All products updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateImages();
