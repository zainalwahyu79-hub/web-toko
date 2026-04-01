import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import pool from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// ===== MULTER SETUP (Upload Gambar) =====
// Pada Vercel, filesystem bersifat read-only kecuali folder /tmp
const isVercel = process.env.VERCEL === '1';
const uploadsDir = isVercel 
  ? path.join('/tmp', 'uploads') 
  : path.join(__dirname, '../vite-project/public/uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Direktori uploads berhasil dibuat: ${uploadsDir}`);
  }
} catch (err) {
  console.warn(`⚠️ Gagal membuat direktori uploads: ${err.message}. Ini normal di Vercel jika folder sudah disertakan atau jika mencoba menulis di luar /tmp.`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'));
  },
});

// ===== VALIDATION UTILITIES =====
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password && password.length >= 6;
const validateProductData = (data) => {
  if (!data.name || data.name.trim().length === 0) return 'Nama produk tidak boleh kosong';
  if (!data.price || data.price <= 0) return 'Harga produk harus lebih dari 0';
  if (data.stock === undefined || data.stock < 0) return 'Stok tidak boleh negatif';
  if (!data.category || data.category.trim().length === 0) return 'Kategori harus dipilih';
  return true;
};
const validateOrderData = (data) => {
  if (!Array.isArray(data.items) || data.items.length === 0) return 'Keranjang tidak boleh kosong';
  for (const item of data.items) {
    if (!item.id) return 'Data produk tidak lengkap (product id missing)';
    if (typeof item.qty !== 'number' || item.qty < 1) return 'Jumlah produk harus minimal 1';
  }
  if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) return 'Alamat pengiriman tidak boleh kosong';
  if (data.address.trim().length < 10) return 'Alamat terlalu pendek (minimal 10 karakter)';
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) return 'Nomor telepon tidak boleh kosong';
  const phoneDigits = data.phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return 'Nomor telepon tidak valid (10-15 digit)';
  if (!data.payment_method || typeof data.payment_method !== 'string' || data.payment_method.trim().length === 0) return 'Metode pembayaran harus dipilih';
  const validPaymentMethods = ['transfer', 'cod', 'ewallet'];
  if (!validPaymentMethods.includes(data.payment_method.toLowerCase())) return 'Metode pembayaran tidak valid';
  return true;
};

const validateReservationData = (data) => {
  if (!data.item_name || data.item_name.trim().length === 0) return 'Nama produk/barang harus diisi';
  if (!data.reservation_date) return 'Tanggal reservasi harus diisi';
  if (!data.reservation_time) return 'Jam reservasi harus diisi';
  return true;
};
const validateCategoryData = (data) => {
  if (!data.name || data.name.trim().length === 0) return 'Nama kategori toko tidak boleh kosong';
  return true;
};

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    // Ganti URL ini setelah frontend selesai di-deploy ke Vercel:
    // 'https://web-toko-frontend.vercel.app',
    /\.vercel\.app$/,  // izinkan semua subdomain vercel.app
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../vite-project/public')));

// Middleware verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};

// Middleware admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak. Hanya admin.' });
  next();
};

// ===== AUTH ROUTES =====
// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, password_confirm } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Nama, email, dan password harus diisi' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Format email tidak valid' });
    if (!validatePassword(password)) return res.status(400).json({ error: 'Password minimal 6 karakter' });
    if (password !== password_confirm) return res.status(400).json({ error: 'Password tidak cocok' });

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const hashedPassword = await bcryptjs.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'customer']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'Registrasi berhasil', user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password harus diisi' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Format email tidak valid' });

    const result = await pool.query('SELECT id, name, email, password, role, phone, address, avatar FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });

    const user = result.rows[0];
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Email atau password salah' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, avatar: user.avatar },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Logout (Sesuai Jobsheet)
app.post('/api/auth/logout', (req, res) => {
  // Client-side usually handles token deletion, but we provide this for completeness
  res.json({ success: true, message: 'Logout berhasil' });
});

// Verify token
app.get('/api/auth/verify', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, name, email, role, phone, address, avatar FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ success: true, user: user.rows[0] });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== PROFILE ROUTES =====
// Get profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, address, avatar, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Update profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Nama tidak boleh kosong' });

    const result = await pool.query(
      'UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING id, name, email, role, phone, address, avatar',
      [name.trim(), phone || null, address || null, req.user.id]
    );
    res.json({ success: true, message: 'Profil berhasil diupdate', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Change password
app.put('/api/profile/password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) return res.status(400).json({ error: 'Semua field password harus diisi' });
    if (new_password !== confirm_password) return res.status(400).json({ error: 'Password baru tidak cocok' });
    if (!validatePassword(new_password)) return res.status(400).json({ error: 'Password minimal 6 karakter' });

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const isValid = await bcryptjs.compare(current_password, userResult.rows[0].password);
    if (!isValid) return res.status(400).json({ error: 'Password lama tidak benar' });

    const hashed = await bcryptjs.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Upload avatar
app.post('/api/profile/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File gambar harus diupload' });
    const avatarUrl = '/uploads/' + req.file.filename;
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    res.json({ success: true, message: 'Avatar berhasil diupload', avatar: avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== PRODUCTS ROUTES =====
// Get all products (with optional search & filter)
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, sort, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== 'semua') {
      query += ` AND category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }
    if (minPrice) {
      query += ` AND price >= $${paramIdx}`;
      params.push(parseFloat(minPrice));
      paramIdx++;
    }
    if (maxPrice) {
      query += ` AND price <= $${paramIdx}`;
      params.push(parseFloat(maxPrice));
      paramIdx++;
    }

    const sortMap = {
      'price_asc': 'price ASC',
      'price_desc': 'price DESC',
      'name_asc': 'name ASC',
      'newest': 'created_at DESC',
      'stock_asc': 'stock ASC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'id ASC'}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get product categories stats (for filters)
app.get('/api/products/categories-stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories stats error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Create product (admin only)
app.post('/api/products', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, price, stock, category, description, image } = req.body;
    const validation = validateProductData({ name, price, stock, category, description });
    if (validation !== true) return res.status(400).json({ error: validation });
    if (typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'Harga harus angka positif' });
    if (typeof stock !== 'number' || stock < 0) return res.status(400).json({ error: 'Stok harus angka positif' });

    const result = await pool.query(
      'INSERT INTO products (name, price, stock, category, description, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name.trim(), price, parseInt(stock), category.trim(), description?.trim() || '', image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Upload product image (admin only)
app.post('/api/products/upload-image', verifyToken, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File gambar harus diupload' });
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ success: true, image: imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Update product (admin only)
app.put('/api/products/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category, description, image } = req.body;
    const validation = validateProductData({ name, price, stock, category, description });
    if (validation !== true) return res.status(400).json({ error: validation });
    if (typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'Harga harus angka positif' });
    if (typeof stock !== 'number' || stock < 0) return res.status(400).json({ error: 'Stok harus angka positif' });

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3, category = $4, description = $5, image = COALESCE($6, image) WHERE id = $7 RETURNING *',
      [name.trim(), price, parseInt(stock), category.trim(), description?.trim() || '', image || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Delete product (admin only)
app.delete('/api/products/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Delete Menu/Product (POST version - Sesuai Jobsheet)
app.post('/api/products/delete/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product POST error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== WISHLIST ROUTES =====
// Get user wishlist
app.get('/api/wishlist', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id as wishlist_id, p.* FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Add to wishlist
app.post('/api/wishlist', verifyToken, async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'Product ID diperlukan' });

    const existing = await pool.query('SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.user.id, product_id]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Produk sudah ada di wishlist' });

    await pool.query('INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)', [req.user.id, product_id]);
    res.status(201).json({ success: true, message: 'Produk ditambahkan ke wishlist' });
  } catch (error) {
    console.error('Add wishlist error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Remove from wishlist
app.delete('/api/wishlist/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
    res.json({ success: true, message: 'Produk dihapus dari wishlist' });
  } catch (error) {
    console.error('Remove wishlist error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== ORDERS ROUTES =====
// Get all orders (admin) or user's orders (customer)
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    let result;
    const { status, search } = req.query;

    if (req.user.role === 'admin') {
      let query = `SELECT o.*, u.name as customer_name, u.email as customer_email,
        json_agg(json_build_object('id', oi.product_id, 'name', p.name, 'price', oi.price_at_purchase, 'qty', oi.quantity, 'image', p.image)) as items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE 1=1`;
      const params = [];
      let paramIdx = 1;

      if (status && status !== 'semua') {
        query += ` AND o.status = $${paramIdx}`;
        params.push(status);
        paramIdx++;
      }
      if (search) {
        query += ` AND (u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR CAST(o.id AS TEXT) = $${paramIdx + 1})`;
        params.push(`%${search}%`, search);
        paramIdx += 2;
      }
      query += ' GROUP BY o.id, u.id ORDER BY o.created_at DESC';
      result = await pool.query(query, params);
    } else {
      result = await pool.query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email,
          json_agg(json_build_object('id', oi.product_id, 'name', p.name, 'price', oi.price_at_purchase, 'qty', oi.quantity, 'image', p.image)) as items
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE o.user_id = $1
          GROUP BY o.id, u.id
          ORDER BY o.created_at DESC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get single order by ID
app.get('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email,
        json_agg(json_build_object('id', oi.product_id, 'name', p.name, 'price', oi.price_at_purchase, 'qty', oi.quantity, 'image', p.image)) as items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = $1
        GROUP BY o.id, u.id`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });

    const order = result.rows[0];
    // Customer hanya bisa lihat order milik sendiri
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Create order (customer)
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { items, address, phone, payment_method, discount_code, total, notes } = req.body;

    const validation = validateOrderData({ items, address, phone, payment_method });
    if (validation !== true) return res.status(400).json({ error: validation });
    if (typeof total !== 'number' || total < 0) return res.status(400).json({ error: 'Total tidak valid' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verifikasi stok sebelum membuat order
      for (const item of items) {
        const productResult = await client.query('SELECT id, name, stock, price FROM products WHERE id = $1 FOR UPDATE', [item.id]);
        if (productResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: `Produk dengan ID ${item.id} tidak ditemukan` });
        }
        const product = productResult.rows[0];
        if (product.stock < item.qty) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Stok "${product.name}" tidak mencukupi (tersisa: ${product.stock})` });
        }
      }

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, address, phone, payment_method, discount_code, total, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
        [req.user.id, address, phone, payment_method, discount_code || null, total, notes || null]
      );
      const order = orderResult.rows[0];

      // Insert order items dan update stock
      for (const item of items) {
        const productResult = await client.query('SELECT price FROM products WHERE id = $1', [item.id]);
        const priceAtPurchase = productResult.rows[0].price;

        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
          [order.id, item.id, item.qty, priceAtPurchase]
        );
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.qty, item.id]);
      }

      await client.query('COMMIT');
      res.status(201).json(order);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Update order status (admin only)
app.put('/api/orders/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Status tidak valid' });

    const result = await pool.query(
      'UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, notes || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Cancel order (customer - only pending orders)
app.put('/api/orders/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });

    const order = orderResult.rows[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) return res.status(403).json({ error: 'Akses ditolak' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Hanya order dengan status pending yang bisa dibatalkan' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Kembalikan stok
      const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      for (const item of itemsResult.rows) {
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
      await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', id]);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Order berhasil dibatalkan' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Delete order (POST version - Admin only - Sesuai Jobsheet)
app.post('/api/orders/delete/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });
    res.json({ success: true, message: 'Order berhasil dihapus secara permanen' });
  } catch (error) {
    console.error('Delete order POST error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== CUSTOMERS ROUTES (Admin only) =====
// Get all customers
app.get('/api/customers', verifyToken, adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT u.id, u.name, u.email, u.phone, u.address, u.avatar, u.created_at,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total ELSE 0 END), 0) as total_spent,
      MAX(o.created_at) as last_order
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'`;
    const params = [];

    if (search) {
      query += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ' GROUP BY u.id ORDER BY total_orders DESC, u.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get customer by ID (admin only)
app.get('/api/customers/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const userResult = await pool.query(
      'SELECT id, name, email, phone, address, avatar, created_at FROM users WHERE id = $1 AND role = $2',
      [id, 'customer']
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Customer tidak ditemukan' });

    const ordersResult = await pool.query(
      `SELECT o.*, json_agg(json_build_object('name', p.name, 'qty', oi.quantity, 'price', oi.price_at_purchase)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id ORDER BY o.created_at DESC`,
      [id]
    );

    res.json({ user: userResult.rows[0], orders: ordersResult.rows });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== ANALYTICS ROUTES =====
// Dashboard analytics (admin only)
app.get('/api/analytics/dashboard', verifyToken, adminOnly, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = `NOW() - INTERVAL '${parseInt(period)} days'`;

    const [revenueResult, ordersResult, completedResult, productsResult, stockResult, lowStockResult, bestSellersResult, customersResult, recentOrdersResult, categoryResult, dailyResult] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total), 0) as total_revenue FROM orders WHERE status = 'completed'`),
      pool.query(`SELECT COUNT(*) as total_orders FROM orders`),
      pool.query(`SELECT COUNT(*) as completed_orders FROM orders WHERE status = 'completed'`),
      pool.query(`SELECT COUNT(*) as total_products FROM products`),
      pool.query(`SELECT COALESCE(SUM(stock), 0) as total_stock FROM products`),
      pool.query(`SELECT COUNT(*) as low_stock FROM products WHERE stock <= 5`),
      pool.query(`SELECT p.id, p.name, p.image, p.category, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price_at_purchase) as revenue
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed'
        GROUP BY p.id, p.name, p.image, p.category ORDER BY total_sold DESC LIMIT 5`),
      pool.query(`SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'`),
      pool.query(`SELECT o.id, u.name as customer_name, o.total, o.status, o.created_at
        FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`),
      pool.query(`SELECT p.category, COUNT(oi.id) as total_sold, SUM(oi.quantity * oi.price_at_purchase) as revenue
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed'
        GROUP BY p.category ORDER BY revenue DESC`),
      pool.query(`SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue
        FROM orders WHERE created_at >= ${daysAgo} AND status != 'cancelled'
        GROUP BY DATE(created_at) ORDER BY date ASC`),
    ]);

    // Revenue period vs previous period
    const currentPeriodRevenue = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = 'completed' AND created_at >= ${daysAgo}`
    );
    const prevPeriodRevenue = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = 'completed' 
       AND created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
       AND created_at < ${daysAgo}`
    );

    res.json({
      total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
      total_orders: parseInt(ordersResult.rows[0].total_orders),
      completed_orders: parseInt(completedResult.rows[0].completed_orders),
      total_products: parseInt(productsResult.rows[0].total_products),
      total_stock: parseInt(stockResult.rows[0].total_stock),
      low_stock: parseInt(lowStockResult.rows[0].low_stock),
      total_customers: parseInt(customersResult.rows[0].total_customers),
      best_sellers: bestSellersResult.rows,
      recent_orders: recentOrdersResult.rows,
      category_sales: categoryResult.rows,
      daily_stats: dailyResult.rows,
      period_revenue: {
        current: parseFloat(currentPeriodRevenue.rows[0].revenue),
        previous: parseFloat(prevPeriodRevenue.rows[0].revenue),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Sales stats by category
app.get('/api/analytics/categories', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.category, 
        COUNT(DISTINCT p.id) as product_count,
        SUM(p.stock) as total_stock,
        COALESCE(SUM(oi.quantity), 0) as total_sold
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
       GROUP BY p.category ORDER BY total_sold DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== REVIEWS ROUTES =====
// Get reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );
    const avgResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE product_id = $1',
      [id]
    );
    res.json({ reviews: result.rows, avg_rating: parseFloat(avgResult.rows[0].avg_rating).toFixed(1), total_reviews: parseInt(avgResult.rows[0].total_reviews) });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Add review
app.post('/api/products/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating harus antara 1-5' });
    if (!comment || comment.trim().length < 3) return res.status(400).json({ error: 'Komentar terlalu pendek' });

    // Cek apakah user sudah pernah beli produk ini
    const purchaseCheck = await pool.query(
      `SELECT oi.id FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id 
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'completed'`,
      [req.user.id, id]
    );
    if (purchaseCheck.rows.length === 0) return res.status(400).json({ error: 'Anda hanya bisa review produk yang sudah dibeli' });

    // Cek apakah sudah review
    const existingReview = await pool.query('SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2', [req.user.id, id]);
    if (existingReview.rows.length > 0) return res.status(400).json({ error: 'Anda sudah memberikan review untuk produk ini' });

    const result = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, id, rating, comment.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== CATEGORIES ROUTES (Mapping "Table" di Jobsheet) =====
// Get category by id
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Create category (admin only)
app.post('/api/categories', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    const validation = validateCategoryData({ name });
    if (validation !== true) return res.status(400).json({ error: validation });

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kategori sudah ada' });
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Update category (admin only)
app.put('/api/categories/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const validation = validateCategoryData({ name });
    if (validation !== true) return res.status(400).json({ error: validation });

    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name.trim(), description || '', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Delete category (admin only - POST version sesuai jobsheet)
app.post('/api/categories/delete/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== RESERVATIONS ROUTES =====
// Get reservation by id
app.get('/api/reservations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT r.*, u.name as customer_name FROM reservations r JOIN users u ON r.user_id = u.id WHERE r.id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservasi tidak ditemukan' });

    // Check permission
    if (req.user.role !== 'admin' && result.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get all reservations (Admin: all, Customer: ours)
app.get('/api/reservations', verifyToken, async (req, res) => {
  try {
    let query = 'SELECT r.*, u.name as customer_name FROM reservations r JOIN users u ON r.user_id = u.id';
    const params = [];
    if (req.user.role !== 'admin') {
      query += ' WHERE r.user_id = $1';
      params.push(req.user.id);
    }
    query += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Create reservation
app.post('/api/reservations', verifyToken, async (req, res) => {
  try {
    const { item_name, reservation_date, reservation_time, notes } = req.body;
    const validation = validateReservationData({ item_name, reservation_date, reservation_time });
    if (validation !== true) return res.status(400).json({ error: validation });

    const result = await pool.query(
      'INSERT INTO reservations (user_id, item_name, reservation_date, reservation_time, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, item_name, reservation_date, reservation_time, 'pending', notes || '']
    );
    res.status(201).json({ success: true, message: 'Reservasi berhasil dibuat', reservation: result.rows[0] });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Update reservation (Confirm/Complete - Admin only)
app.put('/api/reservations/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Status tidak valid' });

    const result = await pool.query(
      'UPDATE reservations SET status = COALESCE($1, status), notes = COALESCE($2, notes) WHERE id = $3 RETURNING *',
      [status, notes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservasi tidak ditemukan' });
    res.json({ success: true, message: 'Reservasi berhasil diupdate', reservation: result.rows[0] });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Delete reservation (POST version sesuai jobsheet)
app.post('/api/reservations/delete/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Customer hanya bisa hapus reservasi sendiri
    const check = await pool.query('SELECT user_id FROM reservations WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Reservasi tidak ditemukan' });
    if (req.user.role !== 'admin' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Akses ditolak' });

    await pool.query('DELETE FROM reservations WHERE id = $1', [id]);
    res.json({ success: true, message: 'Reservasi berhasil dihapus' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== NOTIFICATIONS ROUTES =====
// Get user notifications
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== DISCOUNT CODES ROUTES =====
// Validate discount code
app.post('/api/discount/validate', verifyToken, async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode diskon harus diisi' });

    const result = await pool.query(
      `SELECT * FROM discount_codes WHERE code = $1 AND is_active = true 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Kode diskon tidak valid atau sudah kadaluarsa' });

    const discount = result.rows[0];
    let discountAmount = 0;

    if (discount.discount_type === 'percentage') {
      discountAmount = (subtotal * discount.discount_value) / 100;
    } else {
      discountAmount = discount.discount_value;
    }

    if (discount.max_discount && discountAmount > discount.max_discount) {
      discountAmount = discount.max_discount;
    }

    res.json({
      success: true,
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      discount_amount: discountAmount,
      description: discount.description,
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Get all discount codes (admin only)
app.get('/api/discount', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discount_codes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Create discount code (admin only)
app.post('/api/discount', verifyToken, adminOnly, async (req, res) => {
  try {
    const { code, discount_type, discount_value, max_discount, max_uses, expires_at, description } = req.body;
    if (!code || !discount_type || !discount_value) return res.status(400).json({ error: 'Data diskon tidak lengkap' });
    if (!['percentage', 'fixed'].includes(discount_type)) return res.status(400).json({ error: 'Tipe diskon tidak valid' });

    const result = await pool.query(
      `INSERT INTO discount_codes (code, discount_type, discount_value, max_discount, max_uses, expires_at, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, max_discount || null, max_uses || null, expires_at || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode diskon sudah ada' });
    console.error('Create discount error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Toggle discount code (admin only)
app.put('/api/discount/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const result = await pool.query('UPDATE discount_codes SET is_active = $1 WHERE id = $2 RETURNING *', [is_active, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kode diskon tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle discount error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== SETTINGS ROUTES (Admin) =====
// Get store settings
app.get('/api/settings', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM store_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({
        store_name: 'Toko Baju', store_description: 'Toko pakaian terbaik',
        store_address: '', store_phone: '', store_email: '',
        currency: 'IDR', low_stock_threshold: 5, shipping_cost: 0, free_shipping_min: 300000
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Update store settings
app.put('/api/settings', verifyToken, adminOnly, async (req, res) => {
  try {
    const { store_name, store_description, store_address, store_phone, store_email, low_stock_threshold, shipping_cost, free_shipping_min } = req.body;
    const result = await pool.query(
      `INSERT INTO store_settings (id, store_name, store_description, store_address, store_phone, store_email, low_stock_threshold, shipping_cost, free_shipping_min)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
       store_name = $1, store_description = $2, store_address = $3, store_phone = $4, store_email = $5,
       low_stock_threshold = $6, shipping_cost = $7, free_shipping_min = $8, updated_at = NOW()
       RETURNING *`,
      [store_name, store_description, store_address, store_phone, store_email, low_stock_threshold || 5, shipping_cost || 0, free_shipping_min || 300000]
    );
    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend WEB-TOKO jalan 🚀');
});

// Jalankan server secara lokal
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// Export untuk Vercel Serverless Function
export default app;
