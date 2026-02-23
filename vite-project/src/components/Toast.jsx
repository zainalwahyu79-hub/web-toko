import { useState, useEffect } from 'react'

const toastManager = {
  listeners: [],
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  },
  notify(message, type = 'info', duration = 3000) {
    const id = Math.random()
    this.listeners.forEach(listener => listener({ id, message, type, duration }))
    return id
  },
  success(message, duration = 3000) {
    return this.notify(message, 'success', duration)
  },
  error(message, duration = 4000) {
    return this.notify(message, 'error', duration)
  },
  warning(message, duration = 3500) {
    return this.notify(message, 'warning', duration)
  },
  info(message, duration = 3000) {
    return this.notify(message, 'info', duration)
  }
}

export function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(toast => {
      setToasts(prev => [...prev, toast])
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id))
        }, toast.duration)
      }
    })
    return unsubscribe
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            marginBottom: '10px',
            padding: '16px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.3s ease-out',
            pointerEvents: 'auto',
            minWidth: '300px',
            maxWidth: '400px',
            wordWrap: 'break-word',
            background:
              toast.type === 'success' ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' :
              toast.type === 'error' ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' :
              toast.type === 'warning' ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' :
              'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'warning' && '⚠️'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default toastManager
