#!/usr/bin/env node

const API_URL = 'http://localhost:3000/api';

// Test login terlebih dahulu
async function testOrderFlow() {
  try {
    console.log('=== Testing Order Creation Flow ===\n');

    // Step 1: Login
    console.log('Step 1: Registering new user...');
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'testcustomer@test.com',
        password: 'testpass123'
      })
    });

    let loginData;
    if (registerRes.ok) {
      loginData = await registerRes.json();
      console.log('✓ User registered successfully');
    } else {
      // If registration fails, try login with existing user
      console.log('User might already exist, trying to login...');
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testcustomer@test.com',
          password: 'testpass123'
        })
      });

      if (!loginRes.ok) {
        throw new Error(`Login/Register failed: ${await loginRes.text()}`);
      }
      loginData = await loginRes.json();
      console.log('✓ Login successful');
    }

    const token = loginData.token;
    console.log('✓ Got authentication token:', token.substring(0, 20) + '...');

    // Step 2: Get products
    console.log('\nStep 2: Getting products...');
    const productsRes = await fetch(`${API_URL}/products`);
    const products = await productsRes.json();
    console.log(`✓ Got ${products.length} products`);

    if (products.length === 0) {
      throw new Error('No products available');
    }

    // Step 3: Create order
    console.log('\nStep 3: Creating order...');
    const product = products[0];
    const orderData = {
      items: [
        { id: product.id, qty: 1 }
      ],
      address: 'Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta 12190',
      phone: '081234567890',
      payment_method: 'transfer',
      discount_code: null,
      total: product.price
    };

    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const orderRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!orderRes.ok) {
      const errorData = await orderRes.json();
      throw new Error(`Order creation failed: ${errorData.error}`);
    }

    const order = await orderRes.json();
    console.log('✓ Order created successfully!');
    console.log('Order ID:', order.id);
    console.log('Order status:', order.status);
    console.log('Order total:', order.total);

    // Step 4: Get orders to verify
    console.log('\nStep 4: Verifying order was created...');
    const getOrdersRes = await fetch(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orders = await getOrdersRes.json();
    console.log(`✓ Customer has ${orders.length} orders`);
    console.log('Latest order:', orders[0]);

    console.log('\n=== All tests passed! ===');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  }
}

testOrderFlow();
