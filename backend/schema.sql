-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  discount_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL
);

-- Insert sample users with hashed passwords
INSERT INTO users (name, email, password, role) VALUES
('Admin Toko', 'admin@tokobaju.com', '$2a$10$ZqLap.q5gOABzn45XsOEU.i3iFZdmMuMZp9MB8VlZ.1MnrnZx2NHa', 'admin'),
('Budi Santoso', 'budi@email.com', '$2a$10$QyLXd1LE/e.LpW8zhGX..OY8WOBhQEWb.3izWo2fNuD7Fn9MnaXA2', 'customer'),
('Siti Nurhaliza', 'siti@email.com', '$2a$10$oV1HQedXx/sX6TTS0y5EJOf90p3XeK.ZnAwZIh4wPxJnG9FLzEhfW', 'customer'),
('Ahmad Wijaya', 'ahmad@email.com', '$2a$10$Pc9XHEuQY1Nhhg.TBFV54OGePcCviAcQiPRSYEiPWCwDD1sAWu6qi', 'customer')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, price, stock, category, description, image) VALUES
('Kemeja Casual Putih', 150000, 25, 'Kemeja', 'Kemeja kasual putih dengan bahan katun berkualitas tinggi, nyaman untuk penggunaan sehari-hari.', 'kemeja putih.png'),
('Celana Jeans Biru', 200000, 15, 'Celana', 'Celana jeans biru dengan desain trendy dan jahitan yang rapi.', 'Celana Jeans Biru.png'),
('T-Shirt Premium Hitam', 120000, 30, 'T-Shirt', 'T-shirt premium dengan bahan kombed berkualitas tinggi dan desain eksklusif.', 'T-Shirt Premium Hitam.png'),
('Jaket Denim Biru', 300000, 10, 'Jaket', 'Jaket denim klasik biru dengan potongan modern dan bahan denim tebal.', 'Jaket Denim Biru.png'),
('Celana Chino Coklat', 180000, 20, 'Celana', 'Celana chino coklat dengan potongan slim fit dan bahan breathable.', 'Celana Chino Coklat.png'),
('Kemeja Formal Biru', 250000, 12, 'Kemeja', 'Kemeja formal biru cocok untuk acara formal dan kantor.', 'Kemeja Biru.png'),
('Hoodie Abu-abu', 280000, 18, 'Hoodie', 'Hoodie abu-abu dengan material fleece yang nyaman dan hangat.', 'Hoodie Abu-abu.png'),
('Celana Jogger Hitam', 160000, 22, 'Celana', 'Celana jogger hitam dengan desain sporty dan kenyamanan maksimal.', 'Celana Jogger Hitam.png'),
('Polo Shirt Merah', 140000, 28, 'Polo', 'Polo shirt merah dengan kerah yang rapi dan bahan berkualitas.', 'Polo Shirt Merah.png'),
('Jaket Bomber Hijau', 320000, 8, 'Jaket', 'Jaket bomber hijau dengan desain streetwear dan bahan tahan lama.', 'Jaket Bomber Hijau.png')
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO orders (user_id, address, phone, payment_method, discount_code, total, status) VALUES
(2, 'Jl. Merdeka No. 123, Jakarta Pusat', '081234567890', 'transfer', NULL, 450000, 'completed'),
(3, 'Jl. Sudirman No. 456, Jakarta Selatan', '082345678901', 'transfer', NULL, 330000, 'pending'),
(2, 'Jl. Merdeka No. 123, Jakarta Pusat', '081234567890', 'transfer', NULL, 600000, 'processing'),
(4, 'Jl. Ahmad Yani No. 789, Bandung', '083456789012', 'transfer', NULL, 280000, 'completed'),
(3, 'Jl. Sudirman No. 456, Jakarta Selatan', '082345678901', 'transfer', NULL, 320000, 'pending')
ON CONFLICT DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity) VALUES
(1, 1, 2),
(1, 2, 1),
(2, 3, 2),
(2, 4, 1),
(3, 1, 3),
(3, 5, 1),
(4, 7, 1),
(5, 10, 1)
ON CONFLICT DO NOTHING;
