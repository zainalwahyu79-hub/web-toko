# Database Setup - Toko Baju Online

## Prerequisites
- PostgreSQL 12 atau lebih tinggi
- pgAdmin 4

## Cara Setup Database

### 1. Buka pgAdmin
- Buka browser dan akses `http://localhost:5050`
- Login dengan username dan password pgAdmin Anda

### 2. Buat Database Baru
1. Klik kanan pada **Databases** → **Create** → **Database**
2. Isikan nama: `toko_baju_db`
3. Klik **Save**

### 3. Import SQL Script
1. Buka database `toko_baju_db`
2. Klik menu **Tools** → **Query Tool**
3. Copy seluruh isi file `database.sql`
4. Paste ke Query Editor
5. Tekan **Execute** atau F5

### Data Default yang Tersedia

#### Akun Login (Users)
```
Email: admin@tokobaju.com
Password: admin123
Role: admin

Email: budi@email.com
Password: budi123
Role: customer

Email: siti@email.com
Password: siti123
Role: customer
```

#### Produk (15 item)
- Kemeja Casual Putih (Rp 150.000)
- Celana Jeans Biru (Rp 200.000)
- T-Shirt Premium Hitam (Rp 120.000)
- Jaket Denim Biru (Rp 300.000)
- Celana Chino Coklat (Rp 180.000)
- Kemeja Formal Putih (Rp 250.000)
- Hoodie Abu-abu (Rp 280.000)
- Celana Jogger Hitam (Rp 160.000)
- Polo Shirt Merah (Rp 140.000)
- Jaket Bomber Hijau (Rp 320.000)
- Tank Top Putih (Rp 80.000)
- Celana Pendek Denim (Rp 120.000)
- Sweater Krem (Rp 220.000)
- Kemeja Batik (Rp 280.000)
- Cardigan Abu-abu (Rp 260.000)

## Struktur Tabel

### users
- id (Primary Key)
- name (Varchar)
- email (Unique)
- password (Varchar)
- phone (Varchar)
- address (Text)
- role (admin/customer)
- created_at
- updated_at

### products
- id (Primary Key)
- name (Varchar)
- description (Text)
- price (Decimal)
- stock (Integer)
- category (Varchar)
- created_at
- updated_at

### orders
- id (Primary Key)
- user_id (Foreign Key)
- total_price (Decimal)
- status (pending/processing/completed)
- created_at
- updated_at

### order_items
- id (Primary Key)
- order_id (Foreign Key)
- product_id (Foreign Key)
- quantity (Integer)
- price (Decimal)
- created_at

## Tips
- Setiap user_id harus valid (ada di tabel users)
- Setiap product_id harus valid (ada di tabel products)
- Pastikan email user bersifat unik
- Harga disimpan dalam Rupiah tanpa desimal (gunakan DECIMAL(10,2))
