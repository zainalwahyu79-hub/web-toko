import './Navbar.css';

export default function Navbar({ user, cartCount, onCartClick, activeMenu, setActiveMenu, onLogout }) {
    return (
        <nav className="navbar glass">
            <div className="navbar-container container">
                <div className="navbar-logo" onClick={() => setActiveMenu('shop')}>
                    <span className="logo-icon">👕</span>
                    <span className="logo-text">Toko<span>Pakaian</span></span>
                </div>

                <div className="navbar-links">
                    <button
                        className={`nav-link ${activeMenu === 'shop' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('shop')}
                    >
                        Shop
                    </button>
                    <button
                        className={`nav-link ${activeMenu === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('orders')}
                    >
                        My Orders
                    </button>
                    <button
                        className={`nav-link ${activeMenu === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('profile')}
                    >
                        Profile
                    </button>
                </div>

                <div className="navbar-actions">
                    <div className="cart-trigger" onClick={onCartClick}>
                        <span className="cart-icon-nav">🛒</span>
                        {cartCount > 0 && <span className="cart-badge-nav">{cartCount}</span>}
                    </div>
                    <div className="user-profile-nav">
                        <div className="avatar-nav">
                            {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.name[0]}
                        </div>
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <strong>{user.name}</strong>
                                <span>{user.email}</span>
                            </div>
                            <hr />
                            <button onClick={() => setActiveMenu('profile')}>Edit Profile</button>
                            <button className="logout-item" onClick={onLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
