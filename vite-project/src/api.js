const API_URL = 'http://localhost:3000/api'

// Helper untuk get token dari localStorage
const getToken = () => localStorage.getItem('token')

// Helper untuk headers dengan auth
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
})

// Helper untuk response handling
const handleResponse = async (response) => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan server')
  return data
}

// ===== AUTH API =====
export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  return handleResponse(response)
}

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse(response)
}

export const verifyToken = async () => {
  const response = await fetch(`${API_URL}/auth/verify`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

// ===== PROFILE API =====
export const getProfile = async () => {
  const response = await fetch(`${API_URL}/profile`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  })
  return handleResponse(response)
}

export const changePassword = async (passwordData) => {
  const response = await fetch(`${API_URL}/profile/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(passwordData),
  })
  return handleResponse(response)
}

export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await fetch(`${API_URL}/profile/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData,
  })
  return handleResponse(response)
}

// ===== PRODUCTS API =====
export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${API_URL}/products${query ? '?' + query : ''}`)
  return handleResponse(response)
}

export const getProduct = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}`)
  return handleResponse(response)
}

export const getCategoriesStats = async () => {
  const response = await fetch(`${API_URL}/products/categories-stats`)
  return handleResponse(response)
}

export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`)
  return handleResponse(response)
}

export const getCategory = async (id) => {
  const response = await fetch(`${API_URL}/categories/${id}`)
  return handleResponse(response)
}

export const createCategory = async (categoryData) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  })
  return handleResponse(response)
}

export const updateCategory = async (id, categoryData) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  })
  return handleResponse(response)
}

export const deleteCategory = async (id) => {
  // Sesuai Jobsheet menggunakan POST delete
  const response = await fetch(`${API_URL}/categories/delete/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export const createProduct = async (productData) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  })
  return handleResponse(response)
}

export const uploadProductImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await fetch(`${API_URL}/products/upload-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData,
  })
  return handleResponse(response)
}

export const updateProduct = async (id, productData) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  })
  return handleResponse(response)
}

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export const deleteProductPost = async (id) => {
  // Sesuai Jobsheet menggunakan POST delete
  const response = await fetch(`${API_URL}/products/delete/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

// ===== WISHLIST API =====
export const getWishlist = async () => {
  const response = await fetch(`${API_URL}/wishlist`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const addToWishlist = async (productId) => {
  const response = await fetch(`${API_URL}/wishlist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ product_id: productId }),
  })
  return handleResponse(response)
}

export const removeFromWishlist = async (productId) => {
  const response = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

// ===== ORDERS API =====
export const getOrders = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${API_URL}/orders${query ? '?' + query : ''}`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const getOrder = async (id) => {
  const response = await fetch(`${API_URL}/orders/${id}`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const createOrder = async (orderData) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
  })
  return handleResponse(response)
}

export const updateOrder = async (id, status, notes = '') => {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes }),
  })
  return handleResponse(response)
}

export const cancelOrder = async (id) => {
  const response = await fetch(`${API_URL}/orders/${id}/cancel`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export const deleteOrderPost = async (id) => {
  // Sesuai Jobsheet menggunakan POST delete
  const response = await fetch(`${API_URL}/orders/delete/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

// ===== CUSTOMERS API (Admin) =====
export const getCustomers = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${API_URL}/customers${query ? '?' + query : ''}`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const getCustomer = async (id) => {
  const response = await fetch(`${API_URL}/customers/${id}`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

// ===== ANALYTICS API (Admin) =====
export const getAnalytics = async (period = 30) => {
  const response = await fetch(`${API_URL}/analytics/dashboard?period=${period}`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const getCategoryAnalytics = async () => {
  const response = await fetch(`${API_URL}/analytics/categories`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

// ===== REVIEWS API =====
export const getProductReviews = async (productId) => {
  const response = await fetch(`${API_URL}/products/${productId}/reviews`)
  return handleResponse(response)
}

export const addProductReview = async (productId, reviewData) => {
  const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(reviewData),
  })
  return handleResponse(response)
}

// ===== NOTIFICATIONS API =====
export const getNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const markNotificationRead = async (id) => {
  const response = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export const markAllNotificationsRead = async () => {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

// ===== RESERVATIONS API =====
export const getReservations = async () => {
  const response = await fetch(`${API_URL}/reservations`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const getReservation = async (id) => {
  const response = await fetch(`${API_URL}/reservations/${id}`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const createReservation = async (reservationData) => {
  const response = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(reservationData),
  })
  return handleResponse(response)
}

export const updateReservation = async (id, status, notes = '') => {
  const response = await fetch(`${API_URL}/reservations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes }),
  })
  return handleResponse(response)
}

export const deleteReservationPost = async (id) => {
  // Sesuai Jobsheet menggunakan POST delete
  const response = await fetch(`${API_URL}/reservations/delete/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

// ===== DISCOUNT API =====
export const validateDiscount = async (code, subtotal) => {
  const response = await fetch(`${API_URL}/discount/validate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, subtotal }),
  })
  return handleResponse(response)
}

export const getDiscountCodes = async () => {
  const response = await fetch(`${API_URL}/discount`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const createDiscountCode = async (discountData) => {
  const response = await fetch(`${API_URL}/discount`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(discountData),
  })
  return handleResponse(response)
}

export const toggleDiscountCode = async (id, isActive) => {
  const response = await fetch(`${API_URL}/discount/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  })
  return handleResponse(response)
}

// ===== SETTINGS API (Admin) =====
export const getSettings = async () => {
  const response = await fetch(`${API_URL}/settings`, { headers: getAuthHeaders() })
  return handleResponse(response)
}

export const updateSettings = async (settingsData) => {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settingsData),
  })
  return handleResponse(response)
}
