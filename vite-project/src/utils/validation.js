// Form Validation Utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Password harus diisi' }
  if (password.length < 6) return { valid: false, error: 'Password minimal 6 karakter' }
  return { valid: true }
}

export const validateProductForm = (data) => {
  const errors = {}
  
  // Validasi nama produk
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Nama produk tidak boleh kosong'
  } else if (data.name.length > 100) {
    errors.name = 'Nama produk maksimal 100 karakter'
  }
  
  // Validasi harga
  if (!data.price || data.price === '') {
    errors.price = 'Harga tidak boleh kosong'
  } else if (isNaN(data.price) || data.price <= 0) {
    errors.price = 'Harga harus berupa angka positif'
  } else if (data.price > 999999999) {
    errors.price = 'Harga terlalu besar'
  }
  
  // Validasi stok
  if (data.stock === '' || data.stock === undefined) {
    errors.stock = 'Stok tidak boleh kosong'
  } else if (isNaN(data.stock) || data.stock < 0) {
    errors.stock = 'Stok harus berupa angka positif'
  }
  
  // Validasi kategori
  if (!data.category || data.category.trim().length === 0) {
    errors.category = 'Kategori harus dipilih'
  }
  
  // Validasi deskripsi (optional tapi ada batas)
  if (data.description && data.description.length > 500) {
    errors.description = 'Deskripsi maksimal 500 karakter'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateCheckoutForm = (data) => {
  const errors = {}
  
  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Alamat tidak boleh kosong'
  } else if (data.address.length < 10) {
    errors.address = 'Alamat terlalu pendek (minimal 10 karakter)'
  }
  
  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = 'Nomor telepon tidak boleh kosong'
  } else if (!/^[0-9\-\+\s]{10,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Nomor telepon tidak valid (10-15 digit)'
  }
  
  if (!data.payment_method || data.payment_method === '') {
    errors.payment_method = 'Metode pembayaran harus dipilih'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateLoginForm = (data) => {
  const errors = {}
  
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Email tidak valid'
  }
  
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
