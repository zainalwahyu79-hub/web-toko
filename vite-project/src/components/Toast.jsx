import { useState, useEffect } from 'react'

const toastManager = {
  listeners: [],
  subscribe(listener) {
    this.listeners.push(listener)
    return () => { this.listeners = this.listeners.filter(l => l !== listener) }
  },
  notify(message, type = 'info', duration = 3000) {
    const id = Math.random()
    this.listeners.forEach(listener => listener({ id, message, type, duration }))
    return id
  },
  success(message, duration = 3000) { return this.notify(message, 'success', duration) },
  error(message, duration = 4000) { return this.notify(message, 'error', duration) },
  warning(message, duration = 3500) { return this.notify(message, 'warning', duration) },
  info(message, duration = 3000) { return this.notify(message, 'info', duration) },
}

const ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' }
const COLORS = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A', text: '#166534' },
  error: { bg: '#FEF2F2', border: '#FECACA', icon: '#EF4444', text: '#991B1B' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '#F59E0B', text: '#92400E' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', icon: '#3B82F6', text: '#1E40AF' },
}

export function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(toast => {
      setToasts(prev => [...prev, toast])
      if (toast.duration > 0) {
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), toast.duration)
      }
    })
    return unsubscribe
  }, [])

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', maxWidth: '360px' }}>
      {toasts.map(toast => {
        const c = COLORS[toast.type] || COLORS.info
        return (
          <div
            key={toast.id}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              animation: 'toastIn 0.25s ease',
              pointerEvents: 'auto',
              wordBreak: 'break-word',
            }}
          >
            {/* Icon badge */}
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: c.icon, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '800',
              flexShrink: 0, marginTop: '1px',
            }}>
              {ICONS[toast.type]}
            </div>
            <span style={{ fontSize: '13.5px', color: c.text, fontWeight: '500', lineHeight: '1.45', flex: 1 }}>
              {toast.message}
            </span>
          </div>
        )
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default toastManager
