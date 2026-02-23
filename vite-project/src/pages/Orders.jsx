import { useState } from 'react'
import './Orders.css'

const ORDERS = [
  {
    id: 'ORD001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi@email.com',
    date: '2025-01-15',
    status: 'completed',
    total: 450000,
    items: [
      { id: 1, name: 'Kemeja Casual Putih', price: 150000, qty: 2 },
      { id: 2, name: 'Celana Jeans Biru', price: 200000, qty: 1 },
    ]
  },
  {
    id: 'ORD002',
    customerName: 'Siti Nurhaliza',
    customerEmail: 'siti@email.com',
    date: '2025-01-18',
    status: 'pending',
    total: 330000,
    items: [
      { id: 3, name: 'T-Shirt Premium Hitam', price: 120000, qty: 2 },
      { id: 4, name: 'Jaket Denim Biru', price: 300000, qty: 1 },
    ]
  },
  {
    id: 'ORD003',
    customerName: 'Budi Santoso',
    customerEmail: 'budi@email.com',
    date: '2025-01-20',
    status: 'processing',
    total: 600000,
    items: [
      { id: 1, name: 'Kemeja Casual Putih', price: 150000, qty: 3 },
      { id: 5, name: 'Celana Chino Coklat', price: 180000, qty: 1 },
    ]
  },
  {
    id: 'ORD004',
    customerName: 'Ahmad Wijaya',
    customerEmail: 'ahmad@email.com',
    date: '2025-01-22',
    status: 'completed',
    total: 280000,
    items: [
      { id: 7, name: 'Hoodie Abu-abu', price: 280000, qty: 1 },
    ]
  },
  {
    id: 'ORD005',
    customerName: 'Siti Nurhaliza',
    customerEmail: 'siti@email.com',
    date: '2025-01-25',
    status: 'pending',
    total: 320000,
    items: [
      { id: 10, name: 'Jaket Bomber Hijau', price: 320000, qty: 1 },
    ]
  },
]

export default function OrdersContent() {
  const [selectedOrder, setSelectedOrder] = useState(null)

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#27ae60'
      case 'processing': return '#f39c12'
      case 'pending': return '#e74c3c'
      default: return '#999'
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div>
      <h1>Pesanan</h1>
      <div className="orders-container">
        <div className="orders-list">
          <table className="table">
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Pelanggan</th>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.customerName}</td>
                  <td>{formatDate(order.date)}</td>
                  <td>Rp {order.total.toLocaleString('id-ID')}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status)
                      }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-small"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <div className="order-detail">
            <div className="detail-header">
              <h2>Detail Pesanan</h2>
              <button 
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h3>Informasi Pesanan</h3>
                <div className="detail-row">
                  <span className="detail-label">ID Pesanan:</span>
                  <span className="detail-value">{selectedOrder.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tanggal:</span>
                  <span className="detail-value">{formatDate(selectedOrder.date)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: getStatusColor(selectedOrder.status) + '20',
                      color: getStatusColor(selectedOrder.status)
                    }}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Informasi Pelanggan</h3>
                <div className="detail-row">
                  <span className="detail-label">Nama:</span>
                  <span className="detail-value">{selectedOrder.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedOrder.customerEmail}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Item Pesanan</h3>
                <div className="items-table">
                  <div className="items-header">
                    <div className="items-col-name">Produk</div>
                    <div className="items-col-qty">Qty</div>
                    <div className="items-col-price">Harga</div>
                    <div className="items-col-subtotal">Subtotal</div>
                  </div>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="items-row">
                      <div className="items-col-name">{item.name}</div>
                      <div className="items-col-qty">{item.qty}</div>
                      <div className="items-col-price">Rp {item.price.toLocaleString('id-ID')}</div>
                      <div className="items-col-subtotal">Rp {(item.price * item.qty).toLocaleString('id-ID')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="total-row">
                  <span className="total-label">Total Pesanan:</span>
                  <span className="total-value">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
