import { Users, Clock, Zap, Star } from 'lucide-react';
import { GAMES } from '../data/games';

export const Attractions = ({ onOpenBooking }) => {
  return (
    <section id="attractions" className="section-padding" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Zap size={14} />
            <span>Arena Attractions</span>
          </div>
          <h2 className="section-title">6 Pulse-Pounding Arenas</h2>
          <p className="section-desc">
            Equipped with state-of-the-art sensory technology, smart scoring, and tournament-grade equipment.
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
                <h3 className="card-title">{game.title}</h3>
                <div className="card-tagline">{game.tagline}</div>
                <p className="card-desc">{game.desc}</p>

                {/* Specs */}
                <div className="card-specs">
                  <div className="spec-item">
                    <Users size={15} style={{ color: 'var(--accent-cyan)' }} />
                    <span>{game.players}</span>
                  </div>
                  <div className="spec-item">
                    <Clock size={15} style={{ color: 'var(--accent-cyan)' }} />
                    <span>{game.duration}</span>
                  </div>
                  <div className="spec-item" style={{ marginLeft: 'auto' }}>
                    <Star size={15} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    <span style={{ fontWeight: 700 }}>{game.rating}</span>
                  </div>
                </div>

                {/* Direct Action */}
                <button 
                  onClick={() => onOpenBooking(game)}
                  className="btn-cyber btn-primary"
                  style={{ width: '100%' }}
                >
                  <Zap size={16} />
                  <span>Book {game.title.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
