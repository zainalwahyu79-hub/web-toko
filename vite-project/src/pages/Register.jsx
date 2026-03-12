import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FormInput } from '../components/FormInput'
import { Button } from '../components/Button'
import toastManager from '../components/Toast'
import * as api from '../api'
import './LoginProfessional.css'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Nama tidak boleh kosong'
    }

    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = 'Email tidak boleh kosong'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.password) {
      newErrors.password = 'Password tidak boleh kosong'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Konfirmasi password tidak boleh kosong'
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Password tidak cocok'
    }

    return { valid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateForm()
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    setErrors({})
    setServerError('')

    try {
      const data = await api.register(formData)

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      localStorage.setItem('isLoggedIn', 'true')

      toastManager.success('Pendaftaran berhasil! Selamat datang.')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.message || 'Gagal mendaftar. Silakan coba lagi.'
      setServerError(msg)
      toastManager.error(msg)
      console.error('Register error:', err)
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
            <p>Daftar Akun Baru</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {serverError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠</span>
                {serverError}
              </div>
            )}

            <FormInput
              label="Nama Lengkap"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Masukkan nama lengkap Anda"
              required
              autoComplete="name"
            />

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
              autoComplete="new-password"
            />

            <FormInput
              label="Konfirmasi Password"
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              error={errors.password_confirm}
              placeholder="Ketik ulang password Anda"
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={loading}
              isLoading={loading}
              className="login-button"
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </form>

          <div className="login-footer">
            <p className="login-signup">
              Sudah punya akun? <Link to="/login">Masuk di sini</Link>
            </p>
          </div>
        </div>

        <div className="login-info">
          <h2>Bergabunglah dengan Kami</h2>
          <p>Dapatkan pengalaman berbelanja yang menyenangkan</p>
          <ul className="login-features">
            <li>✓ Belanja koleksi fashion terlengkap</li>
            <li>✓ Pembayaran aman dan terpercaya</li>
            <li>✓ Pengiriman cepat ke seluruh Indonesia</li>
            <li>✓ Dukungan pelanggan 24/7</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

