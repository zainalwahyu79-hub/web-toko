const API_URL = 'http://localhost:3000/api'

// Helper untuk get token dari localStorage
const getToken = () => localStorage.getItem('token')

// Helper untuk headers dengan auth
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
})

// ===== PRODUCTS API =====
export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`)
    if (!response.ok) throw new Error('Gagal fetch products')
    return await response.json()
  } catch (error) {
    console.error('Get products error:', error)
    throw error
  }
}

export const getProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`)
    if (!response.ok) throw new Error('Gagal fetch product')
    return await response.json()
  } catch (error) {
    console.error('Get product error:', error)
    throw error
  }
}

export const createProduct = async (productData) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal create product')
    return data
  } catch (error) {
    console.error('Create product error:', error)
    throw error
  }
}

export const updateProduct = async (id, productData) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal update product')
    return data
  } catch (error) {
    console.error('Update product error:', error)
    throw error
  }
}

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal delete product')
    return data
  } catch (error) {
    console.error('Delete product error:', error)
    throw error
  }
}

// ===== ORDERS API =====
export const getOrders = async () => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal fetch orders')
    return data
  } catch (error) {
    console.error('Get orders error:', error)
    throw error
  }
}

export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal create order')
    return data
  } catch (error) {
    console.error('Create order error:', error)
    throw error
  }
}

export const updateOrder = async (id, status) => {
  try {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal update order')
    return data
  } catch (error) {
    console.error('Update order error:', error)
    throw error
  }
}

// ===== ANALYTICS API =====
export const getAnalytics = async () => {
  try {
    const response = await fetch(`${API_URL}/analytics/dashboard`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal fetch analytics')
    return data
  } catch (error) {
    console.error('Get analytics error:', error)
    throw error
  }
}
