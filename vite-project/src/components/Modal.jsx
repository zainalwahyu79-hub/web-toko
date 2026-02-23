import { useEffect } from 'react'
import './Modal.css'

export function Modal({ isOpen, title, children, onClose, onSubmit, submitText = 'Simpan', cancelText = 'Batal', isLoading = false }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">{children}</div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          {onSubmit && (
            <button
              className="modal-btn modal-btn-submit"
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading && <span className="modal-spinner"></span>}
              {submitText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Konfirmasi', isDangerous = false, isLoading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      onSubmit={onConfirm}
      submitText={confirmText}
      cancelText="Batal"
      isLoading={isLoading}
    >
      <p className={`confirm-modal-message ${isDangerous ? 'confirm-modal-danger' : ''}`}>
        {message}
      </p>
    </Modal>
  )
}
