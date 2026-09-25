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
          alt="Battleship Gaming Zone Arena" 
          className="hero-bg-img"
        />
        <div className="hero-overlay" />
      </div>

      <div className="container hero-grid">
        {/* Left Column */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span>GAMING ARENA • HITECH CITY</span>
          </div>

          <h1 className="hero-heading">
            HYDERABAD’S BIGGEST<br />
            <span style={{ color: 'var(--accent-cyan)' }}>GAMING ARENA.</span>
          </h1>

          <p className="hero-subtitle">
            Laser tag, electric bumper cars, glow bowling, and VR rides. Open every day till 11 PM.
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
              <span style={{ position: 'relative', zIndex: 2 }}>VIEW GAMES</span>
              <div className="cta-swipe-trail" />
            </button>

            <button 
              onClick={() => onOpenBooking(null)}
              className="btn-cyber btn-primary"
            >
              <Zap size={16} />
              <span>BOOK SLOTS</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
            <MapPin size={15} style={{ color: 'var(--accent-cyan)' }} />
            <span>NEXUS MALL, 4TH FLOOR, MADHAPUR • HYDERABAD</span>
          </div>
        </div>

        {/* Right Column: 3 Real Quick Cards */}
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
                  <p>{game.duration} • ₹{game.price} per person</p>
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
