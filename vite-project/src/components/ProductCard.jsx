import './ProductCard.css';

const getProductImage = (product) => {
    if (product && product.image) {
        if (typeof product.image === 'string') {
            if (product.image.startsWith('http')) return product.image;
            if (product.image.startsWith('/')) return product.image;
            return '/' + product.image;
        }
    }
    return '/vite.svg';
}

export default function ProductCard({ product, onAddToCart, onClick, index }) {
    const isOutOfStock = product.stock === 0;

    return (
        <div
            className="product-card-premium animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="product-card-badge">
                {isOutOfStock ? (
                    <span className="badge-out">Out of Stock</span>
                ) : (
                    <span className="badge-new">New Arrival</span>
                )}
            </div>

            <div className="product-card-media" onClick={onClick}>
                <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="product-card-image"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523381235312-3a1647fa9917?auto=format&fit=crop&q=80&w=800'; }}
                />
                <div className="product-card-overlay">
                    <button className="btn-quick-view">Quick View</button>
                </div>
            </div>

            <div className="product-card-content">
                <div className="product-card-header">
                    <span className="product-card-cat">{product.category}</span>
                    <h3 className="product-card-title" onClick={onClick}>{product.name}</h3>
                </div>

                <div className="product-card-rating">
                    <span className="stars">★★★★★</span>
                    <span className="rating-text">5.0</span>
                </div>

                <p className="product-card-excerpt">
                    {product.description ? (product.description.substring(0, 60) + '...') : 'Kualitas premium dengan desain modern...'}
                </p>

                <div className="product-card-footer">
                    <div className="product-card-price-info">
                        <span className="product-card-price">Rp {Number(product.price).toLocaleString('id-ID')}</span>
                    </div>
                    <button
                        className="btn-add-cart"
                        onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                        disabled={isOutOfStock}
                    >
                        <span className="cart-icon">🛒</span>
                        <span>+</span>
                    </button>
                </div>

                <div className="product-card-stock-bar">
                    <div className="stock-label">
                        {isOutOfStock ? 'Stok Habis' : `Tersisa ${product.stock} produk`}
                    </div>
                    <div className="progress-bg">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
