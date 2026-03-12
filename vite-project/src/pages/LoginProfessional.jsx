import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FormInput } from '../components/FormInput'
import { Button } from '../components/Button'
import { validateLoginForm } from '../utils/validation'
import toastManager from '../components/Toast'
import * as api from '../api'
import './LoginProfessional.css'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail')
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateLoginForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    setErrors({})
    setServerError('')

    try {
      const data = await api.login(formData.email, formData.password)

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      localStorage.setItem('isLoggedIn', 'true')

      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email)
      } else {
        localStorage.removeItem('rememberEmail')
      }

      toastManager.success(`Selamat datang kembali, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.message || 'Email atau password salah'
      setServerError(msg)
      toastManager.error(msg)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
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
              Belum punya akun? <Link to="/register">Daftar sekarang</Link>
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

