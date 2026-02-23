# 🎯 Setup Lengkap Toko Baju Online

## 📋 Persyaratan
- Node.js 18+ & npm
- PostgreSQL 12+
- Git

---

## 🚀 Langkah Setup

### 1️⃣ Setup Database PostgreSQL

#### A. Buka pgAdmin (http://localhost:5050)
1. Login dengan username & password pgAdmin Anda
2. Klik kanan **Databases** → **Create** → **Database**
3. Nama: `toko_baju_db` → **Save**

#### B. Import SQL Schema
1. Buka database `toko_baju_db`
2. **Tools** → **Query Tool**
3. Copy-paste isi file `backend/database.sql`
4. Tekan **F5** atau **Execute**

✅ Database sudah siap dengan:
- Tabel users (3 sample user)
- Tabel products (10 produk)
- Tabel orders & order_items

**Login default:**
```
Email: admin@tokobaju.com
Password: admin123
```

---

### 2️⃣ Setup Backend (Node.js + Express + PostgreSQL)

```bash
# Navigate ke folder backend
cd backend

# Install dependencies
npm install

# Setup file .env (sudah ada default, edit jika perlu)
# DB_USER=postgres
# DB_PASSWORD=password (sesuaikan password PostgreSQL Anda)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=toko_baju_db
# JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
# PORT=5000

# Run development server
npm run dev

# Output: 🚀 Server berjalan di http://localhost:5000
```

**API Endpoints yang tersedia:**

#### Auth
- `POST /api/auth/register` — Daftar akun baru
- `POST /api/auth/login` — Login & dapatkan JWT token

#### Products
- `GET /api/products` — Semua produk
- `GET /api/products/:id` — Detail produk
- `GET /api/products/category/:category` — Filter by category

#### Orders
- `POST /api/orders` — Buat pesanan baru
- `GET /api/orders/:user_id` — Riwayat pesanan user
- `GET /api/orders/:order_id/items` — Detail item pesanan

#### Users
- `GET /api/users/:id` — Profil user
- `PUT /api/users/:id` — Update profil

---

### 3️⃣ Setup Frontend (React + Vite)

```bash
# Navigate ke folder frontend
cd vite-project

# Install dependencies (sudah ada, tapi bisa update)
npm install

# Run development server
npm run dev

# Output: Local: http://localhost:5173
```

Frontend akan otomatis connect ke backend di `http://localhost:5000/api`

---

## 🧪 Testing

### Test Login:
1. Buka http://localhost:5173 (frontend)
2. Login dengan:
   - Email: `admin@tokobaju.com`
   - Password: `admin123`
3. Dashboard akan load dengan 10 produk dari database

### Test API langsung (curl):
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tokobaju.com","password":"admin123"}'

# Get semua produk
curl http://localhost:5000/api/products

# Get produk by ID
curl http://localhost:5000/api/products/1
```

---

## 📁 Struktur Folder

```
web-toko/
├── backend/
│   ├── server.js              # Main server file
│   ├── db.js                  # PostgreSQL connection
│   ├── database.sql           # Schema & sample data
│   ├── .env                   # Environment variables
│   └── package.json
│
├── vite-project/ (Frontend)
│   ├── public/
│   │   ├── Celana*.png
│   │   ├── Hoodie*.png
│   │   ├── Jaket*.png
│   │   ├── Kemeja*.png
│   │   ├── Polo*.png
│   │   └── T-Shirt*.png
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 🔧 Troubleshooting

### ❌ "Database connection error"
- Cek PostgreSQL sudah running
- Cek `.env` file di backend, credentials harus sesuai
- Pastikan database `toko_baju_db` sudah dibuat

### ❌ "Failed to fetch products"
- Cek backend server jalan di http://localhost:5000
- Buka browser console & lihat error message
- Pastikan CORS enabled di backend (sudah di setup)

### ❌ "Login gagal / Email atau password salah"
- Cek database sudah di-import dengan benar
- Cek email user di database sudah ada
- Cek password di database: `admin123` (default)

### ❌ "Port 5000 already in use"
- Kill process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)
- Or gunakan port berbeda di `.env` file

---

## 📱 Fitur Saat Ini

✅ **Dashboard Produk** — Tampil 10 produk dari database
✅ **Login/Register** — Auth dengan JWT token
✅ **Responsive UI** — Design elegan & modern
✅ **API Backend** — REST endpoints untuk semua fitur
✅ **PostgreSQL** — Database relasional dengan tabel lengkap

---

## 🚧 Fitur Selanjutnya (To Do)

- [ ] Halaman detail produk / Product gallery
- [ ] Keranjang belanja (Cart) & Checkout
- [ ] Sistem pembayaran (Stripe/Midtrans)
- [ ] Admin panel CRUD produk + upload image
- [ ] User profil & order history
- [ ] Product search & filter
- [ ] Review & rating produk
- [ ] Email notifikasi pesanan
- [ ] Responsive mobile UI optimization
- [ ] Deployment (Vercel frontend + Render backend)

---

## 📞 Support

Jika ada error, check:
1. Backend console untuk API errors
2. Browser console (F12) untuk frontend errors
3. PostgreSQL pgAdmin untuk database issues

Happy coding! 🎉
