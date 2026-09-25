import { useState } from 'react';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
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
      {/* Background Graphic */}
      <div className="hero-bg-backdrop">
        <img 
          src="/images/hero_battleship_arena_bg.jpg" 
          alt="Battleship Arena" 
          className="hero-bg-img"
        />
        <div className="hero-overlay" />
      </div>

      <div className="container hero-grid">
        {/* Left Column: Heading & CTA */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            <Sparkles size={16} />
            <span>Hyderabad's Next-Gen Physical Gaming Zone</span>
          </div>

          <h1 className="hero-heading">
            Enter The Battle.<br />
            <span style={{ color: 'var(--accent-cyan)' }}>Live The Experience.</span>
          </h1>

          <p className="hero-subtitle">
            Immerse yourself in tactical laser combat, high-torque electric bumper cars, cyber glow bowling, and VR flight pods at Hyderabad’s most advanced arena.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {/* Interactive Swipe CTA */}
            <button 
              onClick={handleCtaSwipe}
              className={`hero-cta-pill ${isSwiping ? 'is-swiping' : ''}`}
              type="button"
            >
              <div className="cta-circle-arrow">
                <ArrowRight size={18} />
              </div>
              <span style={{ position: 'relative', zIndex: 2 }}>EXPLORE ATTRACTIONS</span>
              <div className="cta-swipe-trail" />
            </button>

            <button 
              onClick={() => onOpenBooking(null)}
              className="btn-cyber btn-outline"
            >
              <span>Instant Pass Booking</span>
            </button>
          </div>

          {/* Coordinates Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}>
            <MapPin size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>17.4483° N, 78.3915° E • HITECH CITY, HYDERABAD</span>
          </div>
        </div>

        {/* Right Column: 3 Quick Highlight Cards */}
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
                  <p>{game.tagline}</p>
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
