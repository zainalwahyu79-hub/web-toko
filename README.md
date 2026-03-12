# 👕 Toko Pakaian Premium - Platform E-Commerce Modern

Selamat datang di proyek **Toko Pakaian**, sebuah platform e-commerce fashion online yang dirancang dengan estetika modern, fitur premium, dan pengalaman pengguna (UX) kelas profesional. Proyek ini dibangun menggunakan teknologi web terbaru untuk memberikan kecepatan dan kenyamanan maksimal bagi pelanggan.

---

## 🚀 Teknologi Utama
Proyek ini dikembangkan dengan tumpukan teknologi modern:
*   **Frontend**: [React.js](https://reactjs.org/) (Vite) - Memberikan performa rendering cepat dan transisi halaman instan.
*   **Backend**: Integrasi API Node.js - Untuk manajemen data produk, pesanan, dan sistem autentikasi.
*   **Styling**: Vanilla CSS dengan sistem desain kustom - Menggunakan CSS Variables untuk konsistensi desain yang elegan.
*   **Icons & Assets**: Lottie Animations & High-Quality High-Fashion Banners.

---

## 🌟 Fitur Unggulan

### 1. Desain Visual Premium
*   **Fashion Hero Banner**: Header utama yang dinamis dengan gambar berkualitas tinggi dan animasi masuk yang halus.
*   **Premium Product Cards**: Kartu produk interaktif dengan efek hover, zoom gambar, dan indikator stok bergaya modern.
*   **Glassmorphism UI**: Penggunaan efek transparansi dan blur (backdrop filter) pada Navbar dan sidebar keranjang untuk kesan mewah.

### 2. Pengalaman Belanja yang Cerdas
*   **Quick View**: Lihat detail produk secara instan melalui jendela popup tanpa meninggalkan halaman katalog.
*   **Slide-in Cart Sidebar**: Keranjang belanja samping yang intuitif dengan transisi halus.
*   **Filter Kategori Dinamis**: Pencarian dan filter produk berdasarkan kategori (Kemeja, Celana, Jaket, dll) secara *real-time*.

### 3. Alur Checkout Terpadu
*   **One-Box Checkout Layout**: Proses pengisian data pengiriman hingga pembayaran dalam satu alur terpadu yang rapi.
*   **Step Progress Indicator**: Indikator langkah proses belanja yang jelas (Keranjang -> Pengiriman -> Pembayaran -> Selesai).
*   **Simulasi Pembayaran**: Animasi proses pembayaran dan layar konfirmasi keberhasilan yang elegan.

### 4. Manajemen Akun
*   **Dashboard Pelanggan**: Pantau riwayat pesanan dengan desain kartu yang informatif.
*   **Admin Panel**: Antarmuka khusus untuk mengelola stok, pelanggan, dan status pesanan.
*   **Profil Pengguna**: Pengaturan data pribadi dan alamat pengiriman yang mudah digunakan.

---

## 📖 Panduan Penggunaan & Fitur Admin

Berikut adalah penjelasan detail mengenai alur utama dan fitur manajemen produk dalam platform ini:

### 🔐 Autentikasi & Keamanan
*   **Halaman Register**: Lokasi file `src/pages/Register.jsx`. Menangani pendaftaran pengguna baru dengan enkripsi data.
*   **Halaman Login**: Lokasi file `src/pages/LoginProfessional.jsx`. Pintu masuk utama sistem dengan validasi kredensial pengguna (Didefinisikan di `App.jsx:L13`).

### 📦 Manajemen Produk (Dashboard Admin)
*   **Create Product (Tambah Produk)**: Lokasi file `src/pages/Dashboard.jsx`. Fungsi `handleAddProduct` (L767) dan Form Input (L1010-1045).
*   **Read Product (Eksplorasi Produk)**: Lokasi file `src/pages/Dashboard.jsx`. Detail modal interaktif untuk melihat spesifikasi lengkap produk (L410-L505).
*   **Update Product (Perbarui Produk)**: Lokasi file `src/pages/Dashboard.jsx`. Logika pembaruan data melalui `api.updateProduct` (L813) dalam fungsi edit.
*   **Delete Product (Hapus Produk)**: Lokasi file `src/pages/Dashboard.jsx`. Fungsi `handleDeleteProduct` (L835) dengan konfirmasi keamanan sebelum data dihapus.

---

## 📱 Responsivitas
Website ini telah dioptimalkan untuk berbagai perangkat:
*   **Desktop**: Layout lebar dengan navigasi maksimal.
*   **Tablet & Mobile**: Desain vertikal yang dioptimalkan untuk sentuhan, memastikan pengalaman belanja tetap nyaman di layar kecil.

---

## 🛠️ Cara Menjalankan Proyek Secara Lokal

### Prasyarat
*   Node.js terinstal di sistem Anda.
*   NPM atau Yarn.

### Langkah-langkah
1.  **Clone atau Download** repositori ini.
2.  **Instal Dependensi**:
    ```bash
    cd vite-project
    npm install
    ```
3.  **Jalankan Server Frontend**:
    ```bash
    npm run dev
    ```
4.  **Jalankan Backend** (di terminal terpisah):
    ```bash
    cd backend
    npm run dev
    ```

---

## 💎 Filosofi Desain
Proyek ini mengusung tema **"Clean, Minimalist, & Luxurious"**. Dengan dominasi warna Indigo dan Violet serta pemanfaatan *white space* yang proporsional, website ini bertujuan untuk menjadikan produk fashion Anda sebagai pusat perhatian utama.

---

Dikembangkan dengan ❤️ untuk industri fashion masa depan.
