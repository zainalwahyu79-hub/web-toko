import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormInput } from '../components/FormInput'
import { Button } from '../components/Button'
import { validateLoginForm } from '../utils/validation'
import './LoginProfessional.css'

const API_URL = 'http://localhost:3000/api'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const validation = validateLoginForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    setErrors({})
    setServerError('')

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setServerError(data.error || 'Terjadi kesalahan saat login')
        return
      }

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      localStorage.setItem('isLoggedIn', 'true')

      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email)
      }

      // Alert konfirmasi masuk dashboard
      if (window.confirm(`✅ Selamat datang ${data.user.name}!\n\nMasuk ke dashboard?`)) {
        navigate('/dashboard')
      }
    } catch (err) {
      setServerError('Tidak bisa terhubung ke server. Pastikan backend running di http://localhost:3000')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape-1"></div>
        <div className="login-shape-2"></div>
        <div className="login-shape-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">👕</div>
            <h1>Toko Baju</h1>
            <p>Masuk ke Akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {serverError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠</span>
                {serverError}
              </div>
            )}

            <FormInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="contoh@email.com"
              required
              autoComplete="email"
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Minimal 6 karakter"
              required
              autoComplete="current-password"
            />

            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ingat saya</span>
              </label>
              <a href="#" className="forgot-password">Lupa password?</a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={loading}
              isLoading={loading}
              className="login-button"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

          <div className="login-footer">
            <p className="login-signup">
              Belum punya akun? <a href="#register">Daftar sekarang</a>
            </p>
          </div>
        </div>

        <div className="login-info">
          <h2>Selamat Datang</h2>
          <p>Kelola toko baju Anda dengan mudah dan efisien</p>
          <ul className="login-features">
            <li>✓ Kelola produk dengan mudah</li>
            <li>✓ Lacak pesanan pelanggan</li>
            <li>✓ Analitik penjualan real-time</li>
            <li>✓ Laporan keuangan lengkap</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
