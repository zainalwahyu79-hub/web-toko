export function SkeletonLoader({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f0f0f0'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'loading 1.5s infinite'
            }}
          />
          <div style={{ padding: '16px' }}>
            <div
              style={{
                height: '16px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s infinite',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <div
              style={{
                height: '12px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s infinite',
                borderRadius: '4px',
                marginBottom: '15px',
                width: '70%'
              }}
            />
            <div
              style={{
                height: '16px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s infinite',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes loading {
          0% { backgroundPosition: 200% 0; }
          100% { backgroundPosition: -200% 0; }
        }
      `}</style>
    </div>
  )
}
