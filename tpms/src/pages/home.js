import React from 'react';
import '../components/home.css';

const Home = () => {
    return (
        <div className="tpms-home">
            {/* Navbar is imported elsewhere */}
            
            <section className="hero-section">
                <h1 className="hero-title">Showcase Your <span>Talent</span></h1>
                <p className="hero-subtitle">
                    Connect with the best opportunities and grow your career with a community 
                    that values your skills and creativity.
                </p>
                <div className="cta-buttons">
                    <a href="/register" className="cta-button primary-button">Get Started</a>
                    <a href="/about" className="cta-button secondary-button">Learn More</a>
                </div>
            </section>

            <section className="features-section">
                <h2 className="features-title">Why Choose TPMS?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">💎</div>
                        <h3 className="feature-title">Premium Visibility</h3>
                        <p className="feature-description">
                            Get noticed by top employers and clients with our optimized talent profiles.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤝</div>
                        <h3 className="feature-title">Smart Matching</h3>
                        <p className="feature-description">
                            Our website connects you with opportunities that fit your skills perfectly.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🚀</div>
                        <h3 className="feature-title">Growth Tools</h3>
                        <p className="feature-description">
                            Access resources and analytics to accelerate your career.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;