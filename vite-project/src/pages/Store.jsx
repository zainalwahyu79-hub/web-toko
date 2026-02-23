import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import toastManager from '../components/Toast'
import { SkeletonLoader } from '../components/SkeletonLoader'
import './Store.css'

const getProductImage = (product) => {
  if (typeof product === 'object' && product) {
    if (product.image) {
      if (product.image.startsWith('http') || product.image.startsWith('/')) {
        return product.image
      }
    }
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
      return imageMap[product.name]
    }
  }
  return '/vite.svg'
}

export default function Store({ cart, onCartChange, user, onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState(cart || [])
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    setCartItems(cart || [])
  }, [cart])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts()
      setProducts(data)
    } catch (error) {
      toastManager.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id)
    let newCart

    if (existingItem) {
      newCart = cartItems.map(item =>
        item.id === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    } else {
      newCart = [...cartItems, { ...product, qty: 1 }]
    }

    setCartItems(newCart)
    onCartChange(newCart)
    toastManager.success(`${product.name} ditambahkan ke keranjang!`)
  }

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      onLogout()
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <SkeletonLoader count={6} />
      </div>
    )
  }

  return (
    <div className="store-container">
      {/* Header */}
      <div className="store-header">
        <div>
          <h1>🏪 Toko Baju Kami</h1>
          <p>Temukan koleksi fashion terbaik dengan harga terjangkau</p>
        </div>
        <div className="header-right">
          <span className="user-greeting">👤 {user?.name || 'Guest'}</span>
          <div className="cart-badge">
            🛒 <span className="badge-count">{cartItems.length}</span>
          </div>
          <button 
            className="btn-logout"
            onClick={handleLogout}
            style={{
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            🚪 Keluar
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>
            <p style={{ fontSize: '18px', color: '#999' }}>Tidak ada produk tersedia</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <img 
                  src={getProductImage(product)} 
                  alt={product.name}
                  className="product-image"
                />
                {product.stock <= 5 && (
                  <div className="stock-warning">⚠️ Stok Terbatas</div>
                )}
              </div>
              
              <div className="product-info">
                <div className="product-category">{product.category}</div>
                <h3 className="product-name">{product.name}</h3>
                
                <p className="product-description">
                  {product.description?.substring(0, 60)}...
                </p>

                <div className="product-footer">
                  <div>
                    <div className="product-price">
                      Rp {parseFloat(product.price).toLocaleString('id-ID')}
                    </div>
                    <div className="product-stock">
                      Stok: {product.stock}
                    </div>
                  </div>
                  <button
                    className="btn-add-cart"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    style={{
                      opacity: product.stock === 0 ? 0.5 : 1,
                      cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {product.stock === 0 ? 'Habis' : 'Tambah 🛒'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
