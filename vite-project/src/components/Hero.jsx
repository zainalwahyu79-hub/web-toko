import './Hero.css';

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-content animate-slide-up">
                <span className="hero-tag">Exclusive Collection 2026</span>
                <h1 className="hero-title">Redefine Your <br /><span>Everyday Style</span></h1>
                <p className="hero-description">
                    Temukan harmoni antara kenyamanan dan kemewahan dalam setiap jahitan.
                    Koleksi terbatas untuk Anda yang menghargai kualitas premium.
                </p>
                <div className="hero-actions">
                    <button className="btn-hero-primary">Belanja Sekarang</button>
                    <button className="btn-hero-secondary">Lihat Katalog</button>
                </div>
            </div>
            <div className="hero-image-container animate-fade-in">
                <img
                    src="/fashion_hero.png"
                    alt="Premium Fashion Hero"
                    className="hero-image"
                />
                <div className="hero-image-overlay"></div>
            </div>
        </section>
    );
}
