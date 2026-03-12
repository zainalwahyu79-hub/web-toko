import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import * as api from '../api'
import toastManager from '../components/Toast'
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput'
import { Modal, ConfirmModal } from '../components/Modal'
import { validateProductForm, validateCheckoutForm } from '../utils/validation'

// New Components
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import CheckoutFlow from '../components/CheckoutFlow'

// Fungsi untuk mendapatkan gambar produk dari folder public atau uploads
const getProductImage = (product) => {
  if (product && product.image) {
    if (typeof product.image === 'string') {
      if (product.image.startsWith('http')) return product.image;
      if (product.image.startsWith('/')) return product.image;
      return '/' + product.image;
    }
  }
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

  if (!user || loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="premium-loader"></div>
        <p style={{ color: 'var(--gray-500)', fontWeight: '600' }}>Menyiapkan pengalaman belanja Anda...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{ color: 'var(--danger)' }}>Waduh! Terjadi Kesalahan</h2>
        <p style={{ color: 'var(--gray-600)', maxWidth: '400px', textAlign: 'center' }}>{error}</p>
        <button className="btn-primary" onClick={loadData}>Coba Muat Ulang</button>
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
  const [discountAmount, setDiscountAmount] = useState(0)
  const [creatingOrder, setCreatingOrder] = useState(false)

  const CATEGORIES = ['semua', 'Kemeja', 'Celana', 'T-Shirt', 'Jaket', 'Hoodie', 'Polo']

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'semua' || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const addToCart = (product, qty = 1) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      if (existingItem.qty + qty <= product.stock) {
        existingItem.qty += qty
        toastManager.info(`${qty}x ${product.name} ditambah ke keranjang`)
      } else {
        toastManager.warning('Stok tidak mencukupi untuk jumlah tersebut')
      }
    } else if (product.stock >= qty) {
      cart.push({ ...product, qty: qty })
      toastManager.success(`${qty}x ${product.name} ditambah ke keranjang`)
    } else {
      toastManager.warning('Stok tidak mencukupi')
    }
    setCart([...cart])
  }

  const updateCartQty = (productId, qty) => {
    const item = cart.find(c => c.id === productId)
    if (item) {
      const product = products.find(p => p.id === productId)
      if (qty > 0 && qty <= product.stock) {
        item.qty = qty
      } else if (qty <= 0) {
        removeFromCart(productId)
        return
      }
    }
    setCart([...cart])
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(c => c.id !== productId))
  }

  const getCartSubtotal = () => cart.reduce((total, item) => total + (item.price * item.qty), 0)
  const getCartTotal = () => getCartSubtotal() - discountAmount

  const handleCreateOrder = async (checkoutData) => {
    try {
      const orderData = {
        ...checkoutData,
        items: cart,
        total: getCartTotal(),
      }
      await api.createOrder(orderData)
      toastManager.success('Order berhasil dibuat!')
      setCart([])
      onRefresh()
      return true
    } catch (error) {
      toastManager.error('Gagal membuat order: ' + error.message)
      throw error
    }
  }

  return (
    <div className="customer-dashboard-premium animate-fade-in">
      <Navbar
        user={user}
        cartCount={cart.length}
        onCartClick={() => setShowCart(true)}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onLogout={handleLogout}
      />

      <main className="container main-layout-premium">
        {activeMenu === 'shop' && (
          <div className="shop-section animate-slide-up">
            <Hero />

            <div className="shop-controls">
              <div className="search-box-premium">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Cari gaya favoritmu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="category-tabs-premium">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <CustomerShop
              products={filteredProducts}
              onAddToCart={addToCart}
            />
          </div>
        )}

        {activeMenu === 'orders' && <CustomerOrders orders={orders.filter(o => o.user_id === user.id)} />}
        {activeMenu === 'profile' && <CustomerProfile user={user} />}
      </main>

      {/* Modern Cart Sidebar */}
      {showCart && (
        <div className="cart-overlay-premium" onClick={() => setShowCart(false)}>
          <div className="cart-slide-panel" onClick={e => e.stopPropagation()}>
            <div className="cart-panel-header">
              <h3>🛒 Keranjang Saya</h3>
              <button className="btn-close-cart" onClick={() => setShowCart(false)}>✕</button>
            </div>

            <div className="cart-panel-body">
              {cart.length === 0 ? (
                <div className="empty-cart flex-center" style={{ height: '100%', flexDirection: 'column' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
                  <p>Keranjang masih kosong nih.</p>
                  <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowCart(false)}>Mulai Belanja</button>
                </div>
              ) : (
                <>
                  <div className="cart-items-scroll">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item-mini">
                        <img src={item.image || '/vite.svg'} alt={item.name} />
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <p>Rp {Number(item.price).toLocaleString('id-ID')}</p>
                          <div className="qty-ctrl-mini">
                            <button onClick={() => updateCartQty(item.id, item.qty - 1)}>−</button>
                            <span>{item.qty}</span>
                            <button onClick={() => updateCartQty(item.id, item.qty + 1)}>+</button>
                          </div>
                        </div>
                        <button className="btn-del-mini" onClick={() => removeFromCart(item.id)}>🗑️</button>
                      </div>
                    ))}
                  </div>

                  <div className="cart-panel-footer">
                    <div className="cart-summary-line">
                      <span>Subtotal</span>
                      <strong>Rp {getCartSubtotal().toLocaleString('id-ID')}</strong>
                    </div>
                    <p className="cart-hint">Pajak dan ongkir dihitung saat checkout.</p>
                    <button
                      className="btn-checkout-premium"
                      onClick={() => { setShowCart(false); setShowCheckout(true); }}
                    >
                      Checkout Sekarang
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <Modal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          title="Selesaikan Pesanan"
          size="large"
          hideFooter
        >
          <CheckoutFlow
            cart={cart}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onClose={() => setShowCheckout(false)}
            onSubmit={handleCreateOrder}
            subtotal={getCartSubtotal()}
            discount={discountAmount}
            total={getCartTotal()}
            initialData={{
              address: user.address,
              phone: user.phone
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function CustomerShop({ products, onAddToCart }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailQty, setDetailQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState('M')

  const handleOpenDetail = (product) => {
    setSelectedProduct(product)
    setDetailQty(1)
    setSelectedSize('M')
  }

  const handleAddToCartWithQty = (product) => {
    onAddToCart({ ...product, size: selectedSize }, detailQty);
    setSelectedProduct(null);
  }

  return (
    <>
      {products.length === 0 ? (
        <div className="flex-center" style={{ padding: '80px 0', flexDirection: 'column', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: '64px' }}>🧥</div>
          <h3>Produk Tidak Ditemukan</h3>
          <p>Coba gunakan kata kunci atau kategori lain.</p>
        </div>
      ) : (
        <div className="products-grid-premium">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onAddToCart={onAddToCart}
              onClick={() => handleOpenDetail(product)}
            />
          ))}
        </div>
      )}

      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title="Detail Produk"
          size="large"
          hideFooter
        >
          <div className="product-detail-premium animate-fade-in">
            <div className="detail-media">
              <div className="media-main-wrapper">
                <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="main-image-premium" />
                <div className="image-overlay-tags">
                  <span className="tag-premium">Koleksi Terbatas</span>
                </div>
              </div>
            </div>

            <div className="detail-info-premium">
              <div className="detail-header-tags">
                <span className="detail-cat-badge">{selectedProduct.category}</span>
                {selectedProduct.stock < 10 && selectedProduct.stock > 0 && (
                  <span className="low-stock-pill">Hampir Habis! Sisa {selectedProduct.stock} lagi</span>
                )}
              </div>
              
              <h2 className="detail-title">{selectedProduct.name}</h2>
              
              <div className="detail-price-section">
                <div className="price-tag-wrapper">
                  <span className="currency-symbol">Rp</span>
                  <span className="price-value">{Number(selectedProduct.price).toLocaleString('id-ID')}</span>
                </div>
                <div className="rating-mini">
                  <span className="stars">★★★★★</span>
                  <span className="review-count">(124 Review)</span>
                </div>
              </div>

              <div className="detail-section-divider"></div>

              <div className="detail-description-box">
                <h4>Deskripsi</h4>
                <p className="detail-desc">{selectedProduct.description || 'Produk premium dengan kualitas terbaik. Didesain untuk kenyamanan dan gaya maksimal bagi Anda.'}</p>
              </div>

              <div className="detail-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Bahan</span>
                  <span className="spec-value">100% Katun Organik</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Potongan</span>
                  <span className="spec-value">Tailored Fit</span>
                </div>
                <div className="spec-item size-spec">
                  <span className="spec-label">Ukuran</span>
                  <div className="size-options-mini">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <span 
                        key={size} 
                        className={`size-pill ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="detail-inventory-status">
                <div className={`status-dot ${selectedProduct.stock > 0 ? 'active' : ''}`}></div>
                <span className="status-text">
                  {selectedProduct.stock > 0 ? `Stok Tersedia & Siap Kirim` : 'Saat Ini Tidak Tersedia'}
                </span>
              </div>

              <div className="detail-actions-panel">
                <div className="qty-selector-premium">
                  <button 
                    className="qty-btn" 
                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                  >-</button>
                  <span className="qty-value">{detailQty}</span>
                  <button 
                    className="qty-btn" 
                    onClick={() => setDetailQty(Math.min(selectedProduct.stock, detailQty + 1))}
                  >+</button>
                </div>
                
                <button
                  className="btn-add-detail-premium"
                  disabled={selectedProduct.stock === 0}
                  onClick={() => handleAddToCartWithQty(selectedProduct)}
                >
                  {selectedProduct.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </button>
              </div>

              <div className="trust-footer-mini">
                <div className="trust-item">
                  <span>🚚</span>
                  <small>Gratis Ongkir</small>
                </div>
                <div className="trust-item">
                  <span>🔄</span>
                  <small>Return 30 Hari</small>
                </div>
                <div className="trust-item">
                  <span>🔒</span>
                  <small>Garansi Produk</small>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function CustomerOrders({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null)

  if (!orders || orders.length === 0) {
    return (
      <div className="empty-orders glass animate-fade-in flex-center" style={{ padding: '60px', flexDirection: 'column' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
        <h3>Belum Ada Pesanan</h3>
        <p>Ayo mulai belanja dan temukan gaya favoritmu!</p>
      </div>
    )
  }

  return (
    <div className="orders-section animate-slide-up">
      <h2 className="section-title-premium">Riwayat Pesanan</h2>
      <div className="orders-grid-premium">
        {orders.map(order => (
          <div key={order.id} className="order-card-premium" onClick={() => setSelectedOrder(order)}>
            <div className="order-card-header">
              <span className="order-id">ORD-{order.id.toString().padStart(5, '0')}</span>
              <span className={`badge-premium badge-${order.status}`}>
                {order.status === 'completed' ? 'Selesai' : order.status === 'processing' ? 'Diproses' : 'Menunggu'}
              </span>
            </div>
            <div className="order-card-body">
              <div className="order-meta-info">
                <span className="order-date">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="order-items-count">{order.items?.length || 0} Produk</span>
              </div>
              <div className="order-total-amount">Rp {order.total.toLocaleString('id-ID')}</div>
            </div>
            <div className="order-card-footer">
              <button className="btn-detail-order">Lihat Detail</button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Detail Pesanan #ORD-${selectedOrder.id.toString().padStart(5, '0')}`}
          size="medium"
          hideFooter
        >
          <div className="order-detail-premium">
            <div className="detail-status-banner">
              Status: <strong>{selectedOrder.status.toUpperCase()}</strong>
            </div>

            <div className="detail-section">
              <h4>📦 Daftar Produk</h4>
              <div className="detail-items-list">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="detail-item-row">
                    <span>{item.name} <small>x{item.qty}</small></span>
                    <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4>📍 Info Pengiriman</h4>
              <p><strong>Penerima:</strong> {selectedOrder.phone}</p>
              <p><strong>Alamat:</strong> {selectedOrder.address}</p>
            </div>

            <div className="detail-total-box">
              <div className="total-label">Total Pembayaran</div>
              <div className="total-value">Rp {selectedOrder.total.toLocaleString('id-ID')}</div>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setSelectedOrder(null)}>Tutup</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function CustomerProfile({ user }) {
  const [tab, setTab] = useState('info')
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', address: user.address || '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null)

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value })

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { toastManager.warning('Nama tidak boleh kosong'); return }
    setSaving(true)
    try {
      const result = await api.updateProfile(form)
      // Update localStorage user
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...stored, name: result.user.name, phone: result.user.phone, address: result.user.address }))
      toastManager.success('Profil berhasil disimpan!')
    } catch (err) { toastManager.error(err.message) } finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password) { toastManager.warning('Semua field harus diisi'); return }
    if (pwForm.new_password !== pwForm.confirm_password) { toastManager.warning('Password baru tidak cocok'); return }
    if (pwForm.new_password.length < 6) { toastManager.warning('Password minimal 6 karakter'); return }
    setSaving(true)
    try {
      await api.changePassword(pwForm)
      toastManager.success('Password berhasil diubah!')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) { toastManager.error(err.message) } finally { setSaving(false) }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    try {
      const res = await api.uploadAvatar(file)
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...stored, avatar: res.avatar }))
      toastManager.success('Foto profil diperbarui!')
    } catch (err) { toastManager.error(err.message) }
  }

  const tabStyle = (active) => ({ padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: active ? '700' : '400', background: active ? '#667eea' : '#f0f0f0', color: active ? 'white' : '#333', marginRight: '8px' })

  return (
    <div style={{ maxWidth: '550px' }}>
      <h2 style={{ marginBottom: '20px' }}>👤 Profil Saya</h2>
      <div style={{ marginBottom: '20px' }}>
        <button style={tabStyle(tab === 'info')} onClick={() => setTab('info')}>ℹ️ Info</button>
        <button style={tabStyle(tab === 'password')} onClick={() => setTab('password')}>🔒 Password</button>
      </div>

      {tab === 'info' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', overflow: 'hidden', margin: '0 auto' }}>
                {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '0', right: '0', background: '#667eea', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>✏️
                <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>Klik ikon edit untuk ubah foto</p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Nama Lengkap *</label>
            <input name="name" value={form.name} onChange={handleFormChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Email</label>
            <input value={user.email} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: '#f5f5f5', boxSizing: 'border-box' }} />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Email tidak dapat diubah</p>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Nomor Telepon</label>
            <input name="phone" value={form.phone} onChange={handleFormChange} placeholder="08xxxxxxxxxx" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Alamat</label>
            <textarea name="address" value={form.address} onChange={handleFormChange} rows={3} placeholder="Alamat lengkap Anda" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button onClick={handleSaveProfile} disabled={saving} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px' }}>
            {saving ? 'Menyimpan...' : '💾 Simpan Profil'}
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>🔒 Ganti Password</h3>
          {['current_password', 'new_password', 'confirm_password'].map((field, i) => (
            <div key={field} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>{['Password Lama *', 'Password Baru *', 'Konfirmasi Password Baru *'][i]}</label>
              <input type="password" name={field} value={pwForm[field]} onChange={handlePwChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={saving} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px' }}>
            {saving ? 'Memproses...' : '🔑 Ganti Password'}
          </button>
        </div>
      )}
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

  const getTotalRevenue = () => orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.total), 0)
  const getTotalOrders = () => orders.length
  const getCompletedOrders = () => orders.filter(o => o.status === 'completed').length
  const getTotalProducts = () => products.length
  const getTotalStock = () => products.reduce((sum, p) => sum + Number(p.stock), 0)
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Total Pendapatan', value: `Rp ${getTotalRevenue().toLocaleString('id-ID')}`, icon: '💰', color: '#27ae60' },
              { label: 'Total Pesanan', value: getTotalOrders(), icon: '📦', color: '#2980b9' },
              { label: 'Pesanan Selesai', value: getCompletedOrders(), icon: '✅', color: '#8e44ad' },
              { label: 'Total Produk', value: getTotalProducts(), icon: '👕', color: '#e67e22' },
              { label: 'Total Stok', value: getTotalStock(), icon: '📊', color: '#16a085' },
              { label: 'Stok Menipis', value: getLowStockCount(), icon: '⚠️', color: getLowStockCount() > 0 ? '#e74c3c' : '#27ae60' },
            ].map(card => (
              <div key={card.label} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${card.color}` }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{card.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>🏆 Produk Terlaris</h3>
              {getBestSellers().length === 0
                ? <p style={{ color: '#999', fontSize: '13px' }}>Belum ada data penjualan</p>
                : getBestSellers().map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '13px' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#667eea', fontWeight: '700', flexShrink: 0 }}>{item.total} terjual</span>
                  </div>
                ))
              }
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>🕐 Pesanan Terbaru</h3>
              {orders.slice(0, 5).map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>#{order.id} — {order.customer_name || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#667eea' }}>Rp {Number(order.total).toLocaleString('id-ID')}</div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: order.status === 'completed' ? '#d4edda' : order.status === 'cancelled' ? '#f8d7da' : '#fff3cd', color: order.status === 'completed' ? '#155724' : order.status === 'cancelled' ? '#721c24' : '#856404' }}>
                      {order.status === 'completed' ? 'Selesai' : order.status === 'processing' ? 'Diproses' : order.status === 'shipped' ? 'Dikirim' : order.status === 'cancelled' ? 'Dibatalkan' : 'Menunggu'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                <span className={`badge-premium badge-${order.status}`}>
                  {order.status === 'completed' ? '✓ Selesai' :
                    order.status === 'processing' ? '⏳ Diproses' :
                      '⏳ Menunggu'}
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
          <p><strong>Status:</strong> <span className={`badge-premium badge-${selectedOrder.status}`}>
            {selectedOrder.status === 'completed' ? '✓ Selesai' :
              selectedOrder.status === 'processing' ? '⏳ Diproses' :
                '⏳ Menunggu'}
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
  const [settings, setSettings] = useState(null)
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('store')
  const [newDiscount, setNewDiscount] = useState({ code: '', discount_type: 'percentage', discount_value: '', max_discount: '', max_uses: '', expires_at: '', description: '' })
  const [addingDiscount, setAddingDiscount] = useState(false)

  useEffect(() => {
    Promise.all([api.getSettings(), api.getDiscountCodes()])
      .then(([s, d]) => { setSettings(s); setDiscounts(d) })
      .catch(err => toastManager.error('Gagal memuat pengaturan'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value })

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings(settings)
      toastManager.success('Pengaturan berhasil disimpan!')
    } catch (err) { toastManager.error(err.message) } finally { setSaving(false) }
  }

  const handleAddDiscount = async () => {
    if (!newDiscount.code || !newDiscount.discount_value) { toastManager.warning('Kode dan nilai diskon harus diisi'); return }
    setAddingDiscount(true)
    try {
      const result = await api.createDiscountCode({ ...newDiscount, discount_value: parseFloat(newDiscount.discount_value), max_discount: newDiscount.max_discount || null, max_uses: newDiscount.max_uses || null, expires_at: newDiscount.expires_at || null })
      setDiscounts([result, ...discounts])
      setNewDiscount({ code: '', discount_type: 'percentage', discount_value: '', max_discount: '', max_uses: '', expires_at: '', description: '' })
      toastManager.success('Kode diskon berhasil dibuat!')
    } catch (err) { toastManager.error(err.message) } finally { setAddingDiscount(false) }
  }

  const handleToggleDiscount = async (id, isActive) => {
    try {
      await api.toggleDiscountCode(id, !isActive)
      setDiscounts(discounts.map(d => d.id === id ? { ...d, is_active: !isActive } : d))
      toastManager.info(`Kode diskon ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
    } catch (err) { toastManager.error(err.message) }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat pengaturan...</div>

  const tabStyle = (active) => ({ padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: active ? '700' : '400', background: active ? '#667eea' : '#f0f0f0', color: active ? 'white' : '#333', marginRight: '8px', marginBottom: '20px' })
  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', marginTop: '5px' }
  const labelStyle = { display: 'block', fontWeight: '600', fontSize: '13px', color: '#555' }

  return (
    <div style={{ maxWidth: '680px' }}>
      <h2 style={{ marginBottom: '20px' }}>⚙️ Pengaturan Toko</h2>
      <div style={{ marginBottom: '4px' }}>
        <button style={tabStyle(tab === 'store')} onClick={() => setTab('store')}>🏪 Toko</button>
        <button style={tabStyle(tab === 'discount')} onClick={() => setTab('discount')}>🎫 Kode Diskon</button>
      </div>

      {tab === 'store' && settings && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {[['store_name', 'Nama Toko'], ['store_email', 'Email Toko'], ['store_phone', 'Telepon Toko']].map(([name, label]) => (
            <div key={name} style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>{label}</label>
              <input name={name} value={settings[name] || ''} onChange={handleChange} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Deskripsi Toko</label>
            <textarea name="store_description" value={settings.store_description || ''} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Alamat Toko</label>
            <textarea name="store_address" value={settings.store_address || ''} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div><label style={labelStyle}>Batas Stok Menipis</label><input type="number" name="low_stock_threshold" value={settings.low_stock_threshold || 5} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Ongkos Kirim (Rp)</label><input type="number" name="shipping_cost" value={settings.shipping_cost || 0} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Gratis Ongkir {'>'} (Rp)</label><input type="number" name="free_shipping_min" value={settings.free_shipping_min || 300000} onChange={handleChange} style={inputStyle} /></div>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px' }}>
            {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
          </button>
        </div>
      )}

      {tab === 'discount' && (
        <div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>➕ Buat Kode Diskon Baru</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Kode *</label><input value={newDiscount.code} onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })} placeholder="SAVE10" style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipe Diskon *</label>
                <select value={newDiscount.discount_type} onChange={e => setNewDiscount({ ...newDiscount, discount_type: e.target.value })} style={inputStyle}>
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                </select>
              </div>
              <div><label style={labelStyle}>Nilai Diskon *</label><input type="number" value={newDiscount.discount_value} onChange={e => setNewDiscount({ ...newDiscount, discount_value: e.target.value })} placeholder={newDiscount.discount_type === 'percentage' ? '10' : '50000'} style={inputStyle} /></div>
              <div><label style={labelStyle}>Maks. Diskon (Rp)</label><input type="number" value={newDiscount.max_discount} onChange={e => setNewDiscount({ ...newDiscount, max_discount: e.target.value })} placeholder="100000" style={inputStyle} /></div>
              <div><label style={labelStyle}>Maks. Penggunaan</label><input type="number" value={newDiscount.max_uses} onChange={e => setNewDiscount({ ...newDiscount, max_uses: e.target.value })} placeholder="100" style={inputStyle} /></div>
              <div><label style={labelStyle}>Kadaluarsa</label><input type="datetime-local" value={newDiscount.expires_at} onChange={e => setNewDiscount({ ...newDiscount, expires_at: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ marginTop: '12px' }}><label style={labelStyle}>Deskripsi</label><input value={newDiscount.description} onChange={e => setNewDiscount({ ...newDiscount, description: e.target.value })} placeholder="Diskon untuk member baru" style={inputStyle} /></div>
            <button onClick={handleAddDiscount} disabled={addingDiscount} style={{ marginTop: '14px', padding: '10px 22px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              {addingDiscount ? 'Membuat...' : '✓ Buat Kode'}
            </button>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '12px' }}>🎫 Daftar Kode Diskon</h3>
            {discounts.length === 0 ? <p style={{ color: '#999' }}>Belum ada kode diskon</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ background: '#f5f5f5' }}>{['Kode', 'Tipe', 'Nilai', 'Dipakai', 'Status', 'Aksi'].map(h => <th key={h} style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{h}</th>)}</tr></thead>
                <tbody>{discounts.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 8px' }}><strong>{d.code}</strong></td>
                    <td style={{ padding: '10px 8px' }}>{d.discount_type === 'percentage' ? `${d.discount_value}%` : `Rp ${Number(d.discount_value).toLocaleString('id-ID')}`}</td>
                    <td style={{ padding: '10px 8px' }}>{d.discount_type === 'percentage' ? `${d.discount_value}%` : `Rp ${Number(d.discount_value).toLocaleString('id-ID')}`}</td>
                    <td style={{ padding: '10px 8px' }}>{d.used_count || 0}{d.max_uses ? `/${d.max_uses}` : ''}</td>
                    <td style={{ padding: '10px 8px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', background: d.is_active ? '#d4edda' : '#f8d7da', color: d.is_active ? '#155724' : '#721c24' }}>{d.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td style={{ padding: '10px 8px' }}><button onClick={() => handleToggleDiscount(d.id, d.is_active)} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '12px' }}>{d.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

