import { useState } from 'react';
import { ArrowRight, MapPin, Zap } from 'lucide-react';
import { GAMES } from '../data/games';

export const Hero = ({ onOpenBooking }) => {
  const [isSwiping, setIsSwiping] = useState(false);

  const handleCtaSwipe = (e) => {
    e.preventDefault();
    if (isSwiping) return;
    setIsSwiping(true);
    setTimeout(() => {
      setIsSwiping(false);
      const el = document.getElementById('attractions');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  return (
    <section id="hero" className="hero-section">
      <div className="hero-bg-backdrop">
        <img 
          src="/images/hero_battleship_arena_bg.jpg" 
          alt="Battleship Arena" 
          className="hero-bg-img"
        />
        <div className="hero-overlay" />
      </div>

      <div className="container hero-grid">
        {/* Left Column: Minimal Headline & Swipe CTA */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="dot-live" />
            <span>ARENA LIVE • HYDERABAD</span>
          </div>

          <h1 className="hero-heading">
            ENTER THE BATTLE.<br />
            <span style={{ color: 'var(--accent-cyan)' }}>LIVE THE GAME.</span>
          </h1>

          <p className="hero-subtitle">
            Next-gen physical gaming arena. Laser combat, electric drift dodgems, and glow bowling in Hitech City.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {/* Interactive Swipe CTA */}
            <button 
              onClick={handleCtaSwipe}
              className={`hero-cta-pill ${isSwiping ? 'is-swiping' : ''}`}
              type="button"
            >
              <div className="cta-circle-arrow">
                <ArrowRight size={18} />
              </div>
              <span style={{ position: 'relative', zIndex: 2 }}>EXPLORE ARENAS</span>
              <div className="cta-swipe-trail" />
            </button>

            <button 
              onClick={() => onOpenBooking(null)}
              className="btn-cyber btn-primary"
            >
              <Zap size={16} />
              <span>BOOK PASS</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
            <MapPin size={15} style={{ color: 'var(--accent-cyan)' }} />
            <span>HITECH CITY, HYDERABAD • OPEN DAILY 11 AM - 11 PM</span>
          </div>
        </div>

        {/* Right Column: 3 Minimalist Cards */}
        <div className="hero-right">
          <div className="hero-cards-stack">
            {GAMES.slice(0, 3).map((game) => (
              <div 
                key={game.id} 
                onClick={() => onOpenBooking(game)}
                className="hero-preview-item"
              >
                <img src={game.image} alt={game.title} className="preview-thumb" />
                <div className="preview-info">
                  <h4>{game.title}</h4>
                  <p>{game.category} • ₹{game.price}</p>
                </div>
                <ArrowRight size={16} className="preview-arrow" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
