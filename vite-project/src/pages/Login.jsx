import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const API_URL = 'http://localhost:3000/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Email dan password harus diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Kirim request ke backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Email atau password salah')
        setLoading(false)
        return
      }

      // Simpan user info dan token ke localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      localStorage.setItem('isLoggedIn', 'true')
      
      // Alert konfirmasi masuk dashboard
      if (window.confirm(`✅ Selamat datang ${data.user.name}!\n\nMasuk ke dashboard?`)) {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Tidak bisa terhubung ke server. Pastikan backend sudah running.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>👕 Toko Baju</h1>
          <p>Selamat Datang</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" /> Ingat saya
            </label>
            <a href="#forgot">Lupa password?</a>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="signup-link">
          <p style={{ marginBottom: '10px' }}>Demo Credentials:</p>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>Admin: admin@tokobaju.com / admin123</p>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>Customer: budi@email.com / budi123</p>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>Customer: siti@email.com / siti123</p>
        </div>
      </div>

      <div className="login-footer">
        <p>&copy; 2025 Toko Baju Online. Semua hak dilindungi.</p>
      </div>
    </div>
  )
}
