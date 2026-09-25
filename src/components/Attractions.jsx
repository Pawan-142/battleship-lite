import { Users, Clock, Zap } from 'lucide-react';
import { GAMES } from '../data/games';

export const Attractions = ({ onOpenBooking }) => {
  return (
    <section id="attractions" className="section-padding" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Zap size={14} />
            <span>Arenas</span>
          </div>
          <h2 className="section-title">Attractions</h2>
          <p className="section-desc">
            Tournament-grade equipment, dynamic UV lighting, and smart sensory scoring.
          </p>
        </div>

        <div className="attractions-grid">
          {GAMES.map((game) => (
            <div key={game.id} className="glass-card attraction-card">
              {/* Media banner */}
              <div className="card-media">
                <img src={game.image} alt={game.title} />
                <span className="card-category-badge">{game.category}</span>
                <span className="card-price-tag">₹{game.price}</span>
              </div>

              {/* Body */}
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>{game.title}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>★ {game.rating}</span>
                </div>

                {/* Quick Minimal Specs */}
                <div className="card-specs">
                  <div className="spec-item">
                    <Users size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span>{game.players}</span>
                  </div>
                  <div className="spec-item" style={{ marginLeft: 'auto' }}>
                    <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span>{game.duration}</span>
                  </div>
                </div>

                {/* Direct Action */}
                <button 
                  onClick={() => onOpenBooking(game)}
                  className="btn-cyber btn-primary"
                  style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.82rem' }}
                >
                  <Zap size={15} />
                  <span>Book Slot • ₹{game.price}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
