import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import * as api from '../api'
import toastManager from '../components/Toast'
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput'
import { Modal, ConfirmModal } from '../components/Modal'
import { validateProductForm, validateCheckoutForm } from '../utils/validation'

// Fungsi untuk mendapatkan gambar produk dari folder public atau uploads
const getProductImage = (product) => {
  // Jika product adalah object
  if (typeof product === 'object' && product) {
    // Jika ada image field dari database
    if (product.image) {
      // Jika URL Unsplash
      if (product.image.startsWith('http')) {
        return product.image;
      }
      // Jika path lokal (dimulai dengan /)
      if (product.image.startsWith('/')) {
        return product.image;
      }
    }

    // Fallback ke mapping local images di public folder
    const imageMap = {
      'Kemeja Casual Putih': '/kemeja putih.png',
      'Kemeja Formal Biru': '/Kemeja Biru.png',
      'Celana Jeans Biru': '/Celana Jeans Biru.png',
      'Celana Chino Coklat': '/Celana Chino Coklat.png',
      'Celana Jogger Hitam': '/Celana Jogger Hitam.png',
      'T-Shirt Premium Hitam': '/T-Shirt Premium Hitam.png',
      'Jaket Denim Biru': '/Jaket Denim Biru.png',
      'Jaket Bomber Hijau': '/Jaket Bomber Hijau.png',
      'Hoodie Abu-abu': '/Hoodie Abu-abu.png',
      'Polo Shirt Merah': '/Polo Shirt Merah.png',
    }
    
    if (imageMap[product.name]) {
      return imageMap[product.name];
    }
  }
  
  // Default fallback
  return '/vite.svg';
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      navigate('/login')
      return
    }

    setUser(JSON.parse(userData))
    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const productsData = await api.getProducts()
      setProducts(productsData)

      const ordersData = await api.getOrders()
      setOrders(ordersData)
    } catch (err) {
      setError('Gagal memuat data. Pastikan backend running di http://localhost:3000')
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (!window.confirm('Apakah Anda yakin ingin logout?')) {
      return
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading data...</div>
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
        <p>{error}</p>
        <button onClick={loadData}>Coba Lagi</button>
      </div>
    )
  }

  if (user.role === 'customer') {
    return <CustomerDashboard user={user} handleLogout={handleLogout} products={products} orders={orders} onRefresh={loadData} />
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>👕 Toko Baju</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-item ${activeMenu === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveMenu('orders')}
          >
            📦 Pesanan
          </button>
          <button
            className={`nav-item ${activeMenu === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveMenu('customers')}
          >
            👥 Pelanggan
          </button>
          <button
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            ⚙️ Pengaturan
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            <input type="text" placeholder="Cari produk..." />
          </div>
          <div className="user-info">
            <span>👤 {user.name}</span>
          </div>
        </header>

        <div className="content">
          {activeMenu === 'dashboard' && <AdminDashboardContent products={products} orders={orders} />}
          {activeMenu === 'orders' && <OrdersAdminContent orders={orders} setOrders={setOrders} />}
          {activeMenu === 'customers' && <CustomersContent orders={orders} />}
          {activeMenu === 'settings' && <SettingsContent />}
        </div>
      </main>
    </div>
  )
}

function CustomerDashboard({ user, handleLogout, products, orders, onRefresh }) {
  const [activeMenu, setActiveMenu] = useState('shop')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('semua')
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    address: '',
    phone: '',
    payment_method: 'transfer',
    discount_code: '',
  })
  const [discountAmount, setDiscountAmount] = useState(0)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [checkoutErrors, setCheckoutErrors] = useState({})

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target
    setCheckoutForm({ ...checkoutForm, [name]: value })
    if (checkoutErrors[name]) {
      setCheckoutErrors({ ...checkoutErrors, [name]: '' })
    }
  }

  const CATEGORIES = ['semua', 'Kemeja', 'Celana', 'T-Shirt', 'Jaket', 'Hoodie', 'Polo']
  const DISCOUNT_CODES = { 'SAVE10': 0.10, 'SAVE20': 0.20, 'SAVE50': 0.50 }

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'semua' || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem && existingItem.qty < product.stock) {
      existingItem.qty += 1
      toastManager.info(`${product.name} ditambah ke keranjang`)
    } else if (!existingItem && product.stock > 0) {
      cart.push({ ...product, qty: 1 })
      toastManager.success(`${product.name} ditambah ke keranjang`)
    } else if (!existingItem) {
      toastManager.warning(`${product.name} sudah habis`)
      return
    }
    setCart([...cart])
  }

  const updateCartQty = (productId, qty) => {
    const item = cart.find(c => c.id === productId)
    if (item) {
      const product = products.find(p => p.id === productId)
      if (qty > 0 && qty <= product.stock) {
        item.qty = qty
      }
    }
    setCart([...cart])
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(c => c.id !== productId))
  }

  const getCartSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0)
  }

  const applyDiscount = () => {
    const code = checkoutForm.discount_code.toUpperCase()
    if (DISCOUNT_CODES[code]) {
      const subtotal = getCartSubtotal()
      setDiscountAmount(subtotal * DISCOUNT_CODES[code])
    }
  }

  const getCartTotal = () => {
    return getCartSubtotal() - discountAmount
  }

  const handleCheckout = async () => {
    const validation = validateCheckoutForm(checkoutForm)
    if (!validation.valid) {
      setCheckoutErrors(validation.errors)
      toastManager.warning('Periksa kembali data pengiriman')
      return
    }

    if (!window.confirm(`Konfirmasi pesanan dengan total Rp ${getCartTotal().toLocaleString('id-ID')}?`)) {
      return
    }

    setCreatingOrder(true)
    try {
      const orderData = {
        items: cart,
        address: checkoutForm.address,
        phone: checkoutForm.phone,
        payment_method: checkoutForm.payment_method,
        discount_code: checkoutForm.discount_code,
        total: getCartTotal(),
      }

      await api.createOrder(orderData)
      toastManager.success('Order berhasil dibuat!')
      setCart([])
      setShowCheckout(false)
      setCheckoutForm({ address: '', phone: '', payment_method: 'transfer', discount_code: '' })
      setCheckoutErrors({})
      setDiscountAmount(0)
      onRefresh()
    } catch (error) {
      toastManager.error('Gagal membuat order: ' + error.message)
    } finally {
      setCreatingOrder(false)
    }
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>👕 Toko Baju</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Customer</p>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeMenu === 'shop' ? 'active' : ''}`} onClick={() => setActiveMenu('shop')}>🛍️ Belanja</button>
          <button className={`nav-item ${activeMenu === 'orders' ? 'active' : ''}`} onClick={() => setActiveMenu('orders')}>📦 Pesanan Saya</button>
          <button className={`nav-item ${activeMenu === 'profile' ? 'active' : ''}`} onClick={() => setActiveMenu('profile')}>👤 Profil</button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          {activeMenu === 'shop' && (
            <div className="search-bar">
              <input type="text" placeholder="Cari produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          )}
          <div className="user-info">
            <span>👤 {user.name}</span>
            {activeMenu === 'shop' && (
              <button onClick={() => setShowCart(!showCart)} style={{ marginLeft: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                🛒 ({cart.length})
              </button>
            )}
          </div>
        </header>

        <div className="content">
          {activeMenu === 'shop' && <CustomerShop products={filteredProducts} categories={CATEGORIES} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} onAddToCart={addToCart} />}
          {activeMenu === 'orders' && <CustomerOrders orders={orders.filter(o => o.user_id === user.id)} />}
          {activeMenu === 'profile' && <CustomerProfile user={user} />}
        </div>

        {activeMenu === 'shop' && showCart && (
          <div className="cart-sidebar">
            <h3>🛒 Keranjang</h3>
            {cart.length === 0 ? (
              <p>Keranjang kosong</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ marginBottom: '10px', padding: '10px', borderBottom: '1px solid #eee' }}>
                    <p><strong>{item.name}</strong></p>
                    <p>Rp {Number(item.price).toLocaleString('id-ID')}</p>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <button onClick={() => updateCartQty(item.id, item.qty - 1)}>−</button>
                      <span style={{ flex: 1, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, item.qty + 1)}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'red', color: 'white' }}>🗑️</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #667eea' }}>
                  <p>Subtotal: Rp {getCartSubtotal().toLocaleString('id-ID')}</p>
                  {discountAmount > 0 && <p style={{ color: 'green' }}>Diskon: -Rp {discountAmount.toLocaleString('id-ID')}</p>}
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>Total: Rp {getCartTotal().toLocaleString('id-ID')}</p>
                  <button onClick={() => setShowCheckout(true)} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Checkout</button>
                </div>
              </>
            )}
          </div>
        )}

        {showCheckout && (
          <Modal
            isOpen={showCheckout}
            title="📋 Checkout"
            onClose={() => setShowCheckout(false)}
            onSubmit={handleCheckout}
            submitText="✓ Konfirmasi Pesanan"
            isLoading={creatingOrder}
          >
            <FormTextarea
              label="Alamat Pengiriman"
              name="address"
              value={checkoutForm.address}
              onChange={handleCheckoutChange}
              placeholder="Masukkan alamat lengkap"
              error={checkoutErrors.address}
              required
            />

            <FormInput
              label="Nomor Telepon"
              type="tel"
              name="phone"
              value={checkoutForm.phone}
              onChange={handleCheckoutChange}
              placeholder="08xxxxxxxxxx"
              error={checkoutErrors.phone}
              required
            />

            <FormSelect
              label="Metode Pembayaran"
              name="payment_method"
              value={checkoutForm.payment_method}
              onChange={handleCheckoutChange}
              options={[
                { value: 'transfer', label: 'Transfer Bank' },
                { value: 'cod', label: 'COD (Bayar Ditempat)' },
                { value: 'ewallet', label: 'E-Wallet' }
              ]}
              required
            />

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Kode Diskon (Opsional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  name="discount_code"
                  value={checkoutForm.discount_code}
                  onChange={handleCheckoutChange}
                  placeholder="SAVE10, SAVE20, SAVE50"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                />
                <button
                  onClick={applyDiscount}
                  style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  Terapkan
                </button>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '5px', marginBottom: '15px' }}>
              <p style={{ margin: '5px 0' }}>Subtotal: Rp {getCartSubtotal().toLocaleString('id-ID')}</p>
              {discountAmount > 0 && <p style={{ margin: '5px 0', color: 'green' }}>Diskon: -Rp {discountAmount.toLocaleString('id-ID')}</p>}
              <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#667eea' }}>Total: Rp {getCartTotal().toLocaleString('id-ID')}</p>
            </div>
          </Modal>
        )}
      </main>
    </div>
  )
}

function CustomerShop({ products, categories, selectedCategory, onSelectCategory, onAddToCart }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [imageErrors, setImageErrors] = useState({})

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  return (
    <>
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>📁 Kategori:</h3>
        <div className="category-filter">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
          <p style={{ fontSize: '16px' }}>Tidak ada produk yang ditemukan</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product, index) => (
            <div 
              key={product.id}
              className="product-card"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div 
                className="product-image-container"
                onClick={() => setSelectedProduct(product)}
              >
                {imageErrors[product.id] ? (
                  <div className="product-image-placeholder">
                    <div className="placeholder-text">{product.name}</div>
                  </div>
                ) : (
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="product-image"
                    onError={() => handleImageError(product.id)}
                  />
                )}
              </div>
              
              <div className="product-info">
                <div className="product-details">
                  <h3 className="product-name" onClick={() => setSelectedProduct(product)}>
                    {product.name}
                  </h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                  <p className="product-stock">
                    {product.stock === 0 ? '❌ Habis' : product.stock <= 5 ? `⚠️ Stok Terbatas (${product.stock})` : `✓ Stok: ${product.stock}`}
                  </p>
                </div>
                
                <button 
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                  className="btn-primary"
                  style={{ width: '100%', opacity: product.stock === 0 ? 0.5 : 1, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
                >
                  🛒 Tambah Keranjang
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="product-detail-layout">
              <div className="detail-image">
                {imageErrors[selectedProduct.id] ? (
                  <div className="product-image-placeholder" style={{ height: '400px' }}>
                    <div className="placeholder-text">{selectedProduct.name}</div>
                  </div>
                ) : (
                  <img 
                    src={getProductImage(selectedProduct)}
                    alt={selectedProduct.name}
                    style={{ width: '100%', borderRadius: '8px' }}
                    onError={() => handleImageError(selectedProduct.id)}
                  />
                )}
              </div>
              <div className="detail-info">
                <h2 style={{ marginTop: '0', marginBottom: '10px', fontSize: '28px', color: '#333' }}>{selectedProduct.name}</h2>
                <p style={{ color: '#999', marginBottom: '15px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>{selectedProduct.category}</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '20px' }}>Rp {Number(selectedProduct.price).toLocaleString('id-ID')}</p>
                <p style={{ lineHeight: '1.6', marginBottom: '20px', color: '#666', fontSize: '15px' }}>{selectedProduct.description}</p>
                <p style={{ marginBottom: '25px', fontSize: '15px', fontWeight: '600' }}>
                  {selectedProduct.stock === 0 ? '❌ Produk Habis' : `✓ Stok Tersedia: ${selectedProduct.stock}`}
                </p>
                <button 
                  onClick={() => { onAddToCart(selectedProduct); setSelectedProduct(null) }}
                  disabled={selectedProduct.stock === 0}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '16px', opacity: selectedProduct.stock === 0 ? 0.5 : 1 }}
                >
                  ✓ Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CustomerOrders({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null)

  if (!orders || orders.length === 0) {
    return <p>Anda belum memiliki pesanan</p>
  }

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID Pesanan</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tanggal</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>#{order.id}</td>
              <td style={{ padding: '12px' }}>{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
              <td style={{ padding: '12px' }}>Rp {order.total.toLocaleString('id-ID')}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', background: order.status === 'completed' ? '#d4edda' : order.status === 'processing' ? '#fff3cd' : '#f8d7da', color: order.status === 'completed' ? '#155724' : order.status === 'processing' ? '#856404' : '#721c24' }}>
                  {order.status === 'completed' ? '✓ Selesai' : order.status === 'processing' ? '⏳ Diproses' : '⏳ Menunggu'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button onClick={() => setSelectedOrder(order)} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}>
                  Lihat Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Detail Pesanan #{selectedOrder.id}</h3>
          <p><strong>Tanggal:</strong> {new Date(selectedOrder.created_at).toLocaleDateString('id-ID')}</p>
          <p><strong>Status:</strong> <span style={{ padding: '5px 10px', borderRadius: '20px', background: selectedOrder.status === 'completed' ? '#d4edda' : selectedOrder.status === 'processing' ? '#fff3cd' : '#f8d7da', color: selectedOrder.status === 'completed' ? '#155724' : selectedOrder.status === 'processing' ? '#856404' : '#721c24' }}>
            {selectedOrder.status === 'completed' ? '✓ Selesai' : selectedOrder.status === 'processing' ? '⏳ Diproses' : '⏳ Menunggu'}
          </span></p>
          <p><strong>Alamat:</strong> {selectedOrder.address}</p>
          <p><strong>Telepon:</strong> {selectedOrder.phone}</p>
          <p><strong>Metode Pembayaran:</strong> {selectedOrder.payment_method === 'transfer' ? 'Transfer Bank' : selectedOrder.payment_method === 'cod' ? 'COD' : 'E-Wallet'}</p>

          <h4>Item Pesanan:</h4>
          {selectedOrder.items && selectedOrder.items.map(item => (
            <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <p><strong>{item.name}</strong> x {item.qty} = Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
            </div>
          ))}

          <p style={{ marginTop: '15px', fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>Total: Rp {selectedOrder.total.toLocaleString('id-ID')}</p>
          <button onClick={() => setSelectedOrder(null)} style={{ marginTop: '10px', padding: '8px 15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
        </div>
      )}
    </>
  )
}

function CustomerProfile({ user }) {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px' }}>
      <h2>👤 Profil Anda</h2>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Nama:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role === 'customer' ? 'Pelanggan' : 'Admin'}</p>
      </div>
    </div>
  )
}

function AdminDashboardContent({ products, orders }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '', description: '' })
  const [formErrors, setFormErrors] = useState({})
  const [imageErrors, setImageErrors] = useState({})
  const [creatingProduct, setCreatingProduct] = useState(false)

  const getTotalRevenue = () => orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)
  const getTotalOrders = () => orders.length
  const getCompletedOrders = () => orders.filter(o => o.status === 'completed').length
  const getTotalProducts = () => products.length
  const getTotalStock = () => products.reduce((sum, p) => sum + p.stock, 0)
  const getLowStockCount = () => products.filter(p => p.stock <= 5).length
  const getBestSellers = () => {
    const sellersMap = {}
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!sellersMap[item.id]) {
            sellersMap[item.id] = { id: item.id, name: item.name, total: 0, price: item.price }
          }
          sellersMap[item.id].total += item.qty
        })
      }
    })
    return Object.values(sellersMap).sort((a, b) => b.total - a.total).slice(0, 5)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddProduct = async () => {
    const validation = validateProductForm(formData)
    if (!validation.valid) {
      setFormErrors(validation.errors)
      toastManager.warning('Periksa kembali data produk')
      return
    }
    
    if (!window.confirm(`Tambahkan produk "${formData.name}" dengan harga Rp ${parseFloat(formData.price).toLocaleString('id-ID')}?`)) {
      return
    }
    
    setCreatingProduct(true)
    try {
      await api.createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        description: formData.description,
      })
      toastManager.success('Produk berhasil ditambahkan!')
      setShowAddModal(false)
      setFormData({ name: '', price: '', stock: '', category: '', description: '' })
      setFormErrors({})
    } catch (error) {
      toastManager.error('Gagal menambah produk: ' + error.message)
    } finally {
      setCreatingProduct(false)
    }
  }

  const handleUpdateProduct = async () => {
    const validation = validateProductForm(formData)
    if (!validation.valid) {
      setFormErrors(validation.errors)
      toastManager.warning('Periksa kembali data produk')
      return
    }

    if (!window.confirm(`Update produk "${formData.name}"?`)) {
      return
    }

    setCreatingProduct(true)
    try {
      await api.updateProduct(editingProduct.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        description: formData.description,
      })
      toastManager.success('Produk berhasil diupdate!')
      setShowEditModal(false)
      setEditingProduct(null)
      setFormData({ name: '', price: '', stock: '', category: '', description: '' })
      setFormErrors({})
    } catch (error) {
      toastManager.error('Gagal update produk: ' + error.message)
    } finally {
      setCreatingProduct(false)
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return
    }
    setDeleting(true)
    try {
      await api.deleteProduct(id)
      toastManager.success('Produk berhasil dihapus!')
      setDeleteConfirm(null)
    } catch (error) {
      toastManager.error('Gagal menghapus produk: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description || ''
    })
    setShowEditModal(true)
  }

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  return (
    <>
      <div className="tab-buttons">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Produk</button>
        <button className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>Alerts</button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <h2 style={{ marginBottom: '30px' }}>� Semua Produk</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
            {products.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>Belum ada produk</p>
            ) : (
              products.map((product) => (
                <div key={product.id} style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  border: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  ':hover': {
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)'
                  }
                }}>
                  <div style={{ position: 'relative' }}>
                    <img src={getProductImage(product)} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: product.stock <= 5 ? '#e74c3c' : '#27ae60',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {product.stock <= 5 ? `⚠️ ${product.stock}` : `✓ ${product.stock}`}
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#222', fontWeight: '700' }}>{product.name}</h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.category}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>Harga:</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>Rp {Number(product.price).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <>
          <button className="add-product-btn" onClick={() => {
            setEditingProduct(null)
            setFormData({ name: '', price: '', stock: '', category: '', description: '' })
            setShowAddModal(true)
          }}>
            ➕ Tambah Produk
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {products.map(product => (
              <div key={product.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <img src={getProductImage(product)} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px', background: '#f0f0f0' }} />
                <h4 style={{ margin: '10px 0' }}>{product.name}</h4>
                <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>{product.category}</p>
                <p style={{ fontWeight: 'bold', color: '#667eea', margin: '5px 0' }}>Rp {Number(product.price).toLocaleString('id-ID')}</p>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>{product.stock === 0 ? '❌ Habis' : product.stock <= 5 ? `⚠️ Stok: ${product.stock}` : `✓ Stok: ${product.stock}`}</p>
                <div className="product-actions" style={{ marginTop: '10px' }}>
                  <button className="btn-small" onClick={() => setSelectedProduct(product)}>👁️ View</button>
                  <button className="btn-small" onClick={() => openEditModal(product)}>✏️ Edit</button>
                  <button className="btn-small danger" onClick={() => setDeleteConfirm(product)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          <div className="alerts-section">
            <h3>❌ Produk Habis</h3>
            <div className="alert-list">
              {products.filter(p => p.stock === 0).length === 0 ? (
                <p style={{ color: '#666' }}>Semua produk tersedia</p>
              ) : (
                products.filter(p => p.stock === 0).map(product => (
                  <div key={product.id} className="alert-item danger">
                    <span className="alert-name">{product.name}</span>
                    <span className="alert-stock">Stok: 0</span>
                    <button className="alert-action" onClick={() => openEditModal(product)}>Restock</button>
                  </div>
                ))
              )}
            </div>

            <h3 style={{ marginTop: '20px' }}>⚠️ Stok Terbatas</h3>
            <div className="alert-list">
              {products.filter(p => p.stock > 0 && p.stock <= 5).length === 0 ? (
                <p style={{ color: '#666' }}>Tidak ada produk dengan stok terbatas</p>
              ) : (
                products.filter(p => p.stock > 0 && p.stock <= 5).map(product => (
                  <div key={product.id} className="alert-item warning">
                    <span className="alert-name">{product.name}</span>
                    <span className="alert-stock">Stok: {product.stock}</span>
                    <button className="alert-action" onClick={() => openEditModal(product)}>Restock</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="product-detail-layout">
              <div className="detail-image">
                <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} style={{ width: '100%', borderRadius: '8px' }} />
              </div>
              <div className="detail-info">
                <h2>{selectedProduct.name}</h2>
                <p style={{ color: '#666', marginBottom: '10px' }}>{selectedProduct.category}</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>Rp {Number(selectedProduct.price).toLocaleString('id-ID')}</p>
                <p style={{ marginBottom: '15px' }}>{selectedProduct.description}</p>
                <p style={{ marginBottom: '15px' }}>{selectedProduct.stock === 0 ? '❌ Habis' : `✓ Stok: ${selectedProduct.stock}`}</p>
                <button onClick={() => openEditModal(selectedProduct)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Edit Produk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          title="Tambah Produk Baru"
          onClose={() => {
            setShowAddModal(false)
            setFormErrors({})
          }}
          onSubmit={handleAddProduct}
          submitText="Simpan"
          isLoading={creatingProduct}
        >
          <FormInput
            label="Nama Produk"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            error={formErrors.name}
            placeholder="Contoh: Kemeja Casual Putih"
            required
          />
          <FormInput
            label="Harga"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleFormChange}
            error={formErrors.price}
            placeholder="50000"
            required
          />
          <FormInput
            label="Stok"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleFormChange}
            error={formErrors.stock}
            required
          />
          <FormSelect
            label="Kategori"
            name="category"
            value={formData.category}
            onChange={handleFormChange}
            error={formErrors.category}
            options={[
              { value: 'Kemeja', label: 'Kemeja' },
              { value: 'Celana', label: 'Celana' },
              { value: 'T-Shirt', label: 'T-Shirt' },
              { value: 'Jaket', label: 'Jaket' },
              { value: 'Hoodie', label: 'Hoodie' },
              { value: 'Polo', label: 'Polo' },
            ]}
            placeholder="Pilih kategori"
            required
          />
          <FormTextarea
            label="Deskripsi"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            error={formErrors.description}
            maxLength={500}
            rows={4}
          />
        </Modal>
      )}

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          title="Edit Produk"
          onClose={() => {
            setShowEditModal(false)
            setFormErrors({})
          }}
          onSubmit={handleUpdateProduct}
          submitText="Update"
          isLoading={creatingProduct}
        >
          <FormInput
            label="Nama Produk"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            error={formErrors.name}
            required
          />
          <FormInput
            label="Harga"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleFormChange}
            error={formErrors.price}
            required
          />
          <FormInput
            label="Stok"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleFormChange}
            error={formErrors.stock}
            required
          />
          <FormSelect
            label="Kategori"
            name="category"
            value={formData.category}
            onChange={handleFormChange}
            error={formErrors.category}
            options={[
              { value: 'Kemeja', label: 'Kemeja' },
              { value: 'Celana', label: 'Celana' },
              { value: 'T-Shirt', label: 'T-Shirt' },
              { value: 'Jaket', label: 'Jaket' },
              { value: 'Hoodie', label: 'Hoodie' },
              { value: 'Polo', label: 'Polo' },
            ]}
            required
          />
          <FormTextarea
            label="Deskripsi"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            error={formErrors.description}
            maxLength={500}
            rows={4}
          />
        </Modal>
      )}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Hapus Produk?"
        message={deleteConfirm ? `Apakah Anda yakin ingin menghapus produk "${deleteConfirm.name}"? Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmText="Hapus"
        isDangerous={true}
        isLoading={deleting}
        onConfirm={() => handleDeleteProduct(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  )
}

function OrdersAdminContent({ orders, setOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusModalOrder, setStatusModalOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('pending')
  const [updating, setUpdating] = useState(false)

  const handleUpdateStatus = async () => {
    if (!statusModalOrder) return
    if (!window.confirm(`Ubah status menjadi "${newStatus}"?`)) {
      return
    }
    setUpdating(true)
    try {
      await api.updateOrder(statusModalOrder.id, newStatus)
      toastManager.success('Status pesanan berhasil diupdate!')
      setStatusModalOrder(null)
    } catch (error) {
      toastManager.error('Gagal update status: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const processingOrders = orders.filter(o => o.status === 'processing').length

  return (
    <>
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p style={{ margin: '5px 0' }}>Total Pesanan: <strong>{orders.length}</strong></p>
        <p style={{ margin: '5px 0' }}>Menunggu: <strong style={{ color: '#ff6b6b' }}>{pendingOrders}</strong></p>
        <p style={{ margin: '5px 0' }}>Diproses: <strong style={{ color: '#ffd93d' }}>{processingOrders}</strong></p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Pelanggan</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tanggal</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>#{order.id}</td>
              <td style={{ padding: '12px' }}>{order.customer_name || 'N/A'}</td>
              <td style={{ padding: '12px' }}>{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
              <td style={{ padding: '12px' }}>Rp {order.total.toLocaleString('id-ID')}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', background: order.status === 'completed' ? '#d4edda' : order.status === 'processing' ? '#fff3cd' : '#f8d7da', color: order.status === 'completed' ? '#155724' : order.status === 'processing' ? '#856404' : '#721c24' }}>
                  {order.status === 'completed' ? '✓ Selesai' : order.status === 'processing' ? '⏳ Diproses' : '⏳ Menunggu'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button onClick={() => setSelectedOrder(order)} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}>
                  Detail
                </button>
                <button onClick={() => {
                  setStatusModalOrder(order)
                  setNewStatus(order.status)
                }} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', marginLeft: '10px' }}>
                  Ubah Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Detail Pesanan #{selectedOrder.id}</h3>
          <p><strong>Pelanggan:</strong> {selectedOrder.customer_name || 'N/A'}</p>
          <p><strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}</p>
          <p><strong>Tanggal:</strong> {new Date(selectedOrder.created_at).toLocaleDateString('id-ID')}</p>
          <p><strong>Alamat:</strong> {selectedOrder.address}</p>
          <p><strong>Telepon:</strong> {selectedOrder.phone}</p>
          <p><strong>Metode Pembayaran:</strong> {selectedOrder.payment_method === 'transfer' ? 'Transfer Bank' : selectedOrder.payment_method === 'cod' ? 'COD' : 'E-Wallet'}</p>

          <h4>Item Pesanan:</h4>
          {selectedOrder.items && selectedOrder.items.map(item => (
            <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <p><strong>{item.name}</strong> x {item.qty} = Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
            </div>
          ))}

          <p style={{ marginTop: '15px', fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>Total: Rp {selectedOrder.total.toLocaleString('id-ID')}</p>
          <button onClick={() => setSelectedOrder(null)} style={{ marginTop: '10px', padding: '8px 15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
        </div>
      )}

      <Modal
        isOpen={statusModalOrder !== null}
        title="Ubah Status Pesanan"
        onClose={() => setStatusModalOrder(null)}
        onSubmit={handleUpdateStatus}
        submitText="Update Status"
        isLoading={updating}
      >
        {statusModalOrder && (
          <>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              <strong>Pesanan:</strong> #{statusModalOrder.id}
            </p>
            <FormSelect
              label="Status Baru"
              name="status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: 'pending', label: '⏳ Menunggu' },
                { value: 'processing', label: '⏳ Diproses' },
                { value: 'completed', label: '✓ Selesai' }
              ]}
              required
            />
          </>
        )}
      </Modal>
    </>
  )
}

function CustomersContent({ orders }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const getUniqueCustomers = () => {
    const customersMap = new Map()
    orders.forEach(order => {
      // Handle both cases: customer_email or just email
      const email = order.customer_email || order.email || 'unknown'
      const name = order.customer_name || order.name || 'Unknown'
      
      if (!customersMap.has(email)) {
        customersMap.set(email, {
          email,
          name,
          totalOrders: 0,
          totalSpent: 0
        })
      }
      const customer = customersMap.get(email)
      customer.totalOrders += 1
      customer.totalSpent += Number(order.total) || 0
    })
    return Array.from(customersMap.values())
  }

  const customers = getUniqueCustomers()

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Nama</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total Pesanan</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total Belanja</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.email} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setSelectedCustomer(customer)}>
              <td style={{ padding: '12px' }}>{customer.name}</td>
              <td style={{ padding: '12px' }}>{customer.email}</td>
              <td style={{ padding: '12px' }}>{customer.totalOrders}</td>
              <td style={{ padding: '12px' }}>Rp {Number(customer.totalSpent).toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCustomer && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>{selectedCustomer.name}</h3>
          <p><strong>Email:</strong> {selectedCustomer.email}</p>
          <p><strong>Total Pesanan:</strong> {selectedCustomer.totalOrders}</p>
          <p><strong>Total Belanja:</strong> Rp {Number(selectedCustomer.totalSpent).toLocaleString('id-ID')}</p>
          <button onClick={() => setSelectedCustomer(null)} style={{ marginTop: '10px', padding: '8px 15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
        </div>
      )}
    </>
  )
}

function SettingsContent() {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px' }}>
      <h2>⚙️ Pengaturan</h2>
      <p style={{ marginTop: '20px', color: '#666' }}>Fitur pengaturan akan segera tersedia.</p>
    </div>
  )
}
