-- =============================================
-- SCHEMA DATABASE TOKO BAJU (MASTER VERSION)
-- =============================================
-- Tanggal: 2026-03-09
-- Deskripsi: Skema lengkap untuk toko pakaian online dengan fitur modern.

-- Drop existing tables to start fresh (WARNING: Data will be lost)
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Tabel Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer', -- 'admin' atau 'customer'
  phone VARCHAR(20),
  address TEXT,
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  total DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'completed', 'cancelled'
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  discount_code VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Order Items (Detail Pesanan)
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price_at_purchase DECIMAL(15, 2) NOT NULL DEFAULT 0
);

-- 5. Tabel Wishlist
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- 6. Tabel Reviews (Ulasan Produk)
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- 7. Tabel Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Discount Codes
CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage' atau 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount DECIMAL(15, 2),
  max_uses INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Store Settings
CREATE TABLE store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  store_name VARCHAR(255) DEFAULT 'Toko Baju',
  store_description TEXT,
  store_address TEXT,
  store_phone VARCHAR(20),
  store_email VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'IDR',
  low_stock_threshold INT DEFAULT 5,
  shipping_cost DECIMAL(15, 2) DEFAULT 0,
  free_shipping_min DECIMAL(15, 2) DEFAULT 300000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel Categories (Mapping dari "Table" di Jobsheet)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabel Reservations
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(255), -- Nama barang yang di-reserve (bisa nama produk)
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SEED DATA (DATA AWAL)
-- =============================================

-- dan seterusnya...
-- (Saya akan menyisipkan seed categories dan reservations di bawah)

-- 1. Akun Default (Admin: admin123, Customer: customer123)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Admin Utama', 'admin@tokobaju.com', '$2a$10$RzjMf6ocCwbguMYc.4GALOb/PoNBmCLG7cmCmcffQ.IfBDXTeW/yu', 'admin', '08123456789', 'Kantor Pusat Jakarta'),
('Customer Demo', 'customer@email.com', '$2a$10$6X10hTab.zFq/MfRDbSMy.9yVu/shdOSRCKrySHpX1gJW0j90UZHq', 'customer', '08987654321', 'Jl. Contoh No. 123'),
('Budi Santoso', 'budi@email.com', '$2a$10$6X10hTab.zFq/MfRDbSMy.9yVu/shdOSRCKrySHpX1gJW0j90UZHq', 'customer', '081222333444', 'Jl. Merdeka No. 10, Bandung'),
('Siti Aminah', 'siti@email.com', '$2a$10$6X10hTab.zFq/MfRDbSMy.9yVu/shdOSRCKrySHpX1gJW0j90UZHq', 'customer', '085666777888', 'Jl. Mawar No. 5, Surabaya'),
('Ahmad Fauzi', 'ahmad@email.com', '$2a$10$6X10hTab.zFq/MfRDbSMy.9yVu/shdOSRCKrySHpX1gJW0j90UZHq', 'customer', '087888999000', 'Jl. Melati No. 8, Yogyakarta'),
('Rina Wijaya', 'rina@email.com', '$2a$10$6X10hTab.zFq/MfRDbSMy.9yVu/shdOSRCKrySHpX1gJW0j90UZHq', 'customer', '082111222333', 'Jl. Anggrek No. 15, Semarang'),
('Doni Setiawan', 'doni@email.com', '$2a$10$6X10hTab.zFq/MfRDbSMy.9yVu/shdOSRCKrySHpX1gJW0j90UZHq', 'customer', '081333444555', 'Jl. Kamboja No. 3, Medan')
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Categories
INSERT INTO categories (name, description) VALUES
('Kemeja', 'Pakaian atasan berkerah'),
('Celana', 'Pakaian bawahan'),
('Jaket', 'Pakaian luar hangat'),
('Kaos', 'Pakaian santai'),
('Aksesoris', 'Pelengkap fashion')
ON CONFLICT (name) DO NOTHING;

-- 3. Produk Contoh
INSERT INTO products (name, price, stock, category, description, image) VALUES
('Kemeja Casual Putih', 150000, 25, 'Kemeja', 'Kemeja kasual putih dengan bahan katun premium.', '/kemeja putih.png'),
('Kemeja Formal Biru', 250000, 12, 'Kemeja', 'Kemeja formal biru untuk acara resmi.', '/Kemeja Biru.png'),
('Celana Jeans Biru', 200000, 15, 'Celana', 'Celana jeans biru denim berkualitas.', '/Celana Jeans Biru.png'),
('Celana Chino Coklat', 180000, 20, 'Celana', 'Celana chino coklat slim fit.', '/Celana Chino Coklat.png'),
('T-Shirt Premium Hitam', 120000, 30, 'Kaos', 'Kaos hitam katun kombed 30s.', '/T-Shirt Premium Hitam.png'),
('Jaket Denim Biru', 300000, 10, 'Jaket', 'Jaket denim tebal dan stylish.', '/Jaket Denim Biru.png'),
('Jaket Bomber Hijau', 320000, 8, 'Jaket', 'Jaket bomber material anti air.', '/Jaket Bomber Hijau.png'),
('Hoodie Abu-abu', 280000, 18, 'Jaket', 'Hoodie fleece yang hangat dan lembut.', '/Hoodie Abu-abu.png'),
('Celana Jogger Hitam', 160000, 22, 'Celana', 'Celana jogger untuk santai atau olahraga.', '/Celana Jogger Hitam.png'),
('Polo Shirt Merah', 140000, 28, 'Kaos', 'Kaos polo dengan kerah yang rapi.', '/Polo Shirt Merah.png')
ON CONFLICT DO NOTHING;

-- 4. Voucher Diskon
INSERT INTO discount_codes (code, discount_type, discount_value, max_discount, description) VALUES
('NEWYEAR', 'percentage', 20, 100000, 'Promo Tahun Baru diskon 20%'),
('HEMAT50', 'fixed', 50000, NULL, 'Potongan langsung 50rb'),
('ONGKIRGRATIS', 'fixed', 15000, NULL, 'Potongan ongkir 15rb')
ON CONFLICT (code) DO NOTHING;

-- 5. Pengaturan Toko
INSERT INTO store_settings (id, store_name, store_description, store_address, store_phone, store_email) 
VALUES (1, 'Toko Baju Kita', 'Pusat Fashion Terlengkap & Termurah', 'Jakarta, Indonesia', '021-99887766', 'pusat@tokobaju.com')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Reservations
INSERT INTO reservations (user_id, item_name, reservation_date, reservation_time, notes) VALUES
(2, 'Jaket Denim Biru', CURRENT_DATE + INTERVAL '1 day', '14:00:00', 'Mau coba ukuran L');
