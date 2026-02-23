import './FormInput.css'

export function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
  disabled,
  autoComplete,
  min,
  max,
}) {
  return (
    <div className="form-input-group">
      {label && (
        <label htmlFor={name} className="form-input-label">
          {label}
          {required && <span className="form-input-required">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        min={min}
        max={max}
        className={`form-input ${error ? 'form-input-error' : ''}`}
      />
      {error && <span className="form-input-error-message">{error}</span>}
    </div>
  )
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  error,
  required,
  disabled,
  placeholder,
}) {
  return (
    <div className="form-input-group">
      {label && (
        <label htmlFor={name} className="form-input-label">
          {label}
          {required && <span className="form-input-required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        className={`form-select ${error ? 'form-input-error' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="form-input-error-message">{error}</span>}
    </div>
  )
}

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
  disabled,
  rows = 4,
  maxLength,
}) {
  return (
    <div className="form-input-group">
      {label && (
        <label htmlFor={name} className="form-input-label">
          {label}
          {required && <span className="form-input-required">*</span>}
          {maxLength && (
            <span className="form-char-count">
              {value.length}/{maxLength}
            </span>
          )}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`form-textarea ${error ? 'form-input-error' : ''}`}
      />
      {error && <span className="form-input-error-message">{error}</span>}
    </div>
  )
}
