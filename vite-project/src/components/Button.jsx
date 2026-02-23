import './Button.css'

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  isLoading = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="btn-spinner"></span>}
      <span className={isLoading ? 'btn-text-loading' : ''}>{children}</span>
    </button>
  )
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = 'secondary',
  size = 'small',
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`btn btn-icon btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      {...props}
    >
      {icon}
    </button>
  )
}

export function ButtonGroup({ children, className = '' }) {
  return <div className={`btn-group ${className}`}>{children}</div>
}
