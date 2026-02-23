// Simple test script to verify order creation
const API_URL = 'http://localhost:3000/api';

// Assuming you have a token from login
const TOKEN = 'your_jwt_token_here';

async function testOrderCreation() {
  try {
    // First, get products to get a valid product ID
    const productsRes = await fetch(`${API_URL}/products`);
    const products = await productsRes.json();
    
    if (products.length === 0) {
      console.error('No products available');
      return;
    }

    const product = products[0];
    console.log('Using product:', product);

    // Create order
    const orderData = {
      items: [
        { id: product.id, qty: 1 }
      ],
      address: 'Jl. Test No. 123, Kota Test, Provinsi Test 12345',
      phone: '081234567890',
      payment_method: 'transfer',
      discount_code: null,
      total: product.price,
    };

    console.log('Sending order data:', orderData);

    const orderRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await orderRes.json();
    console.log('Response status:', orderRes.status);
    console.log('Response:', result);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOrderCreation();
