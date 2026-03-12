import { useState, useEffect } from 'react';
import './CheckoutFlow.css';
import toastManager from './Toast';

const STEPS = [
    { id: 'cart', label: 'Keranjang', icon: '🛒' },
    { id: 'shipping', label: 'Pengiriman', icon: '📍' },
    { id: 'payment', label: 'Pembayaran', icon: '💳' },
    { id: 'review', label: 'Selesai', icon: '✅' }
];

export default function CheckoutFlow({
    cart,
    onUpdateQty,
    onRemove,
    onClose,
    onSubmit,
    subtotal,
    discount,
    total,
    initialData = {}
}) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        address: initialData.address || '',
        phone: initialData.phone || '',
        payment_method: initialData.payment_method || 'transfer',
        discount_code: initialData.discount_code || '',
        ...initialData
    });
    const [errors, setErrors] = useState({});

    const nextStep = () => {
        if (step === 2) {
            if (!formData.address || !formData.phone) {
                setErrors({
                    address: !formData.address ? 'Alamat wajib diisi' : '',
                    phone: !formData.phone ? 'Nomor telepon wajib diisi' : ''
                });
                toastManager.warning('Lengkapi data pengiriman');
                return;
            }
        }
        setStep(s => Math.min(s + 1, 4));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleFinish = async () => {
        setLoading(true);
        // Simulate payment processing delay
        setTimeout(async () => {
            try {
                await onSubmit(formData);
                nextStep(); // Move to step 4 (Success)
            } catch (err) {
                toastManager.error('Pembayaran gagal: ' + err.message);
            } finally {
                setLoading(false);
            }
        }, 2000);
    };

    return (
        <div className="checkout-flow-container animate-fade-in">
            {/* Progress Indicator */}
            <div className="checkout-progress">
                {STEPS.map((s, i) => (
                    <div key={s.id} className={`progress-step ${step > i + 1 ? 'completed' : step === i + 1 ? 'active' : ''}`}>
                        <div className="step-num">{step > i + 1 ? '✓' : i + 1}</div>
                        <div className="step-label">{s.label}</div>
                        {i < STEPS.length - 1 && <div className="step-line"></div>}
                    </div>
                ))}
            </div>

            <div className="checkout-content-layout">
                <div className="checkout-main-panel">
                    {step === 1 && (
                        <div className="step-panel animate-slide-up">
                            <h3 className="panel-title">🛒 Tinjau Keranjang</h3>
                            <div className="cart-list-premium">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item-premium">
                                        <img src={item.image || '/vite.svg'} alt={item.name} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p>Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="cart-item-qty">
                                            <button onClick={() => onUpdateQty(item.id, item.qty - 1)}>−</button>
                                            <span>{item.qty}</span>
                                            <button onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
                                        </div>
                                        <button className="btn-remove-item" onClick={() => onRemove(item.id)}>🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-panel animate-slide-up">
                            <h3 className="panel-title">📍 Informasi Pengiriman</h3>
                            <div className="form-group-premium">
                                <label>Alamat Lengkap</label>
                                <textarea
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Jl. Merdeka No. 123..."
                                    className={errors.address ? 'error' : ''}
                                />
                                {errors.address && <span className="error-msg">{errors.address}</span>}
                            </div>
                            <div className="form-group-premium">
                                <label>Nomor Telepon</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="08123456789"
                                    className={errors.phone ? 'error' : ''}
                                />
                                {errors.phone && <span className="error-msg">{errors.phone}</span>}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-panel animate-slide-up">
                            <h3 className="panel-title">💳 Pilih Metode Pembayaran</h3>
                            <div className="payment-grid-premium">
                                {[
                                    { id: 'transfer', name: 'Transfer Bank', icon: '🏦', desc: 'Verifikasi manual 10-30 menit' },
                                    { id: 'ewallet', name: 'E-Wallet (QRIS)', icon: '📱', desc: 'Instan & Otomatis' },
                                    { id: 'cod', name: 'COD', icon: '🏠', desc: 'Bayar saat barang sampai' },
                                ].map(m => (
                                    <div
                                        key={m.id}
                                        className={`payment-card-premium ${formData.payment_method === m.id ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, payment_method: m.id })}
                                    >
                                        <div className="payment-icon">{m.icon}</div>
                                        <div className="payment-info">
                                            <strong>{m.name}</strong>
                                            <p>{m.desc}</p>
                                        </div>
                                        <div className="payment-radio"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="step-panel animate-scale-in flex-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
                            <div className="success-lottie">🎉</div>
                            <h2 className="success-title">Pembayaran Berhasil!</h2>
                            <p className="success-desc">Pesanan Anda telah kami terima dan sedang diproses. Silakan cek status di menu Pesanan.</p>
                            <button className="btn-finish-premium" onClick={onClose}>Selesai & Tutup</button>
                        </div>
                    )}

                    {step < 4 && (
                        <div className="checkout-summary-section">
                            <hr className="summary-divider-line" />
                            <div className="summary-card-inline">
                                <div className="summary-row">
                                    <span>Subtotal ({cart.length} item)</span>
                                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Ongkos Kirim</span>
                                    <span className="free-shipping">Gratis</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total Pembayaran</span>
                                    <span className="total-amount-highlight">Rp {total.toLocaleString('id-ID')}</span>
                                </div>

                                <div className="summary-actions-inline">
                                    {step > 1 && (
                                        <button className="btn-back-inline" onClick={prevStep}>Kembali</button>
                                    )}
                                    {step < 3 ? (
                                        <button className="btn-next-inline" onClick={nextStep}>Lanjut ke {STEPS[step].label}</button>
                                    ) : (
                                        <button
                                            className="btn-pay-inline"
                                            onClick={handleFinish}
                                            disabled={loading}
                                        >
                                            {loading ? <div className="dot-loader"></div> : `Konfirmasi & Bayar Rp ${total.toLocaleString('id-ID')}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
