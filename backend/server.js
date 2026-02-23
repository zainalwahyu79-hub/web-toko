import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// Validation utilities
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
  // Validasi items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return 'Keranjang tidak boleh kosong';
  }
  
  for (const item of data.items) {
    if (!item.id) {
      return 'Data produk tidak lengkap (product id missing)';
    }
    if (typeof item.qty !== 'number' || item.qty < 1) {
      return 'Jumlah produk harus minimal 1';
    }
  }

  // Validasi address
  if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
    return 'Alamat pengiriman tidak boleh kosong';
  }
  
  if (data.address.trim().length < 10) {
    return 'Alamat terlalu pendek (minimal 10 karakter)';
  }
  
  // Validasi phone
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    return 'Nomor telepon tidak boleh kosong';
  }
  
  const phoneDigits = data.phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return 'Nomor telepon tidak valid (10-15 digit)';
  }
  
  // Validasi payment method
  if (!data.payment_method || typeof data.payment_method !== 'string' || data.payment_method.trim().length === 0) {
    return 'Metode pembayaran harus dipilih';
  }

  const validPaymentMethods = ['transfer', 'cod', 'ewallet'];
  if (!validPaymentMethods.includes(data.payment_method.toLowerCase())) {
    return 'Metode pembayaran tidak valid';
  }
  
  return true;
};

// Middleware
app.use(cors());
app.use(express.json());

// Middleware untuk verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};

// ===== AUTH ROUTES =====
// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, password_confirm } = req.body;
    
    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password harus diisi' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }
    
    if (password !== password_confirm) {
      return res.status(400).json({ error: 'Password tidak cocok' });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user baru
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'customer']
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }

    // Query user dari database
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];

    // Validasi password dengan bcrypt
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Verify token
app.get('/api/auth/verify', verifyToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    res.json({
      success: true,
      user: user.rows[0],
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== PRODUCTS ROUTES =====
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY id ASC'
    );
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
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Create product (admin only)
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa menambah produk' });
    }

    const { name, price, stock, category, description, image } = req.body;

    // Validasi data
    const validation = validateProductData({ name, price, stock, category, description });
    if (validation !== true) {
      return res.status(400).json({ error: validation });
    }

    // Validasi tipe data
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Harga harus angka positif' });
    }
    
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Stok harus angka positif' });
    }

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

// Update product (admin only)
app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa mengupdate produk' });
    }

    const { id } = req.params;
    const { name, price, stock, category, description, image } = req.body;

    // Validasi data
    const validation = validateProductData({ name, price, stock, category, description });
    if (validation !== true) {
      return res.status(400).json({ error: validation });
    }

    // Validasi tipe data
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Harga harus angka positif' });
    }
    
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Stok harus angka positif' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3, category = $4, description = $5, image = COALESCE($6, image) WHERE id = $7 RETURNING *',
      [name.trim(), price, parseInt(stock), category.trim(), description?.trim() || '', image || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Delete product (admin only)
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa menghapus produk' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== ORDERS ROUTES =====
// Get all orders (admin) or user's orders (customer)
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      // Admin bisa lihat semua orders dengan data pelanggan
      result = await pool.query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email, json_agg(json_build_object('id', oi.product_id, 'name', p.name, 'price', p.price, 'qty', oi.quantity)) as items
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         GROUP BY o.id, u.id
         ORDER BY o.created_at DESC`
      );
    } else {
      // Customer hanya bisa lihat orders mereka sendiri
      result = await pool.query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email, json_agg(json_build_object('id', oi.product_id, 'name', p.name, 'price', p.price, 'qty', oi.quantity)) as items
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

// Create order (customer)
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { items, address, phone, payment_method, discount_code, total } = req.body;

    // Validasi order data
    const validation = validateOrderData({ items, address, phone, payment_method });
    if (validation !== true) {
      return res.status(400).json({ error: validation });
    }

    // Validasi total
    if (typeof total !== 'number' || total < 0) {
      return res.status(400).json({ error: 'Total tidak valid' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, address, phone, payment_method, discount_code, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [req.user.id, address, phone, payment_method, discount_code, total]
      );

      const order = orderResult.rows[0];

      // Insert order items dan update stock
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
          [order.id, item.id, item.qty]
        );

        // Update stock produk
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.qty, item.id]
        );
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
app.put('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa mengupdate order' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ===== ANALYTICS ROUTES =====
// Get dashboard analytics (admin only)
app.get('/api/analytics/dashboard', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang bisa akses analytics' });
    }

    // Total revenue
    const revenueResult = await pool.query(
      'SELECT SUM(total) as total_revenue FROM orders WHERE status = \'completed\''
    );

    // Total orders
    const ordersResult = await pool.query(
      'SELECT COUNT(*) as total_orders FROM orders'
    );

    // Completed orders
    const completedResult = await pool.query(
      'SELECT COUNT(*) as completed_orders FROM orders WHERE status = \'completed\''
    );

    // Total products
    const productsResult = await pool.query(
      'SELECT COUNT(*) as total_products FROM products'
    );

    // Total stock
    const stockResult = await pool.query(
      'SELECT SUM(stock) as total_stock FROM products'
    );

    // Low stock items
    const lowStockResult = await pool.query(
      'SELECT COUNT(*) as low_stock FROM products WHERE stock <= 5'
    );

    // Best sellers
    const bestSellersResult = await pool.query(
      `SELECT p.id, p.name, SUM(oi.quantity) as total_sold, p.price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name, p.price
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    res.json({
      total_revenue: revenueResult.rows[0].total_revenue || 0,
      total_orders: parseInt(ordersResult.rows[0].total_orders),
      completed_orders: parseInt(completedResult.rows[0].completed_orders),
      total_products: parseInt(productsResult.rows[0].total_products),
      total_stock: parseInt(stockResult.rows[0].total_stock),
      low_stock: parseInt(lowStockResult.rows[0].low_stock),
      best_sellers: bestSellersResult.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend WEB-TOKO jalan 🚀')
})

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
