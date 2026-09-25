import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { GAMES, CATEGORIES } from '../data/games';

export const Attractions = ({ onOpenBooking }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredGames = activeCategory === 'all'
    ? GAMES
    : GAMES.filter(g => g.categoryKey === activeCategory);

  return (
    <section id="attractions" className="section-padding">
      <div className="container">
        {/* Section Header with Category Chips */}
        <div className="section-header-editorial">
          <div>
            <div className="section-tag">Arena Experiences</div>
            <h2 className="section-title-editorial">Single-Game Bookings</h2>
          </div>

          {/* Interactive Category Filter */}
          <div className="category-filter-bar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Attractions Grid */}
        <div className="attractions-editorial-grid">
          {filteredGames.map((game) => (
            <div key={game.id} className="attraction-card">
              {/* Photo Media */}
              <div className="attraction-card-photo">
                <img src={game.image} alt={game.title} />
                <span className="attraction-card-tag">{game.category}</span>
              </div>

              {/* Body */}
              <div className="attraction-card-body">
                <div className="attraction-card-header">
                  <h3 className="attraction-card-name">{game.title}</h3>
                  <span className="attraction-card-price">₹{game.price}</span>
                </div>

                <p className="attraction-card-desc">{game.shortNote}</p>

                {/* Technical / Arena Specs */}
                <div className="attraction-spec-list">
                  <div className="spec-row">
                    <span>Duration:</span>
                    <span className="spec-val">{game.duration}</span>
                  </div>
                  <div className="spec-row">
                    <span>Squad Size:</span>
                    <span className="spec-val">{game.players}</span>
                  </div>
                  <div className="spec-row">
                    <span>Intensity:</span>
                    <span className="spec-val">{game.intensity}</span>
                  </div>
                </div>

                {/* CTA */}
                <button 
                  onClick={() => onOpenBooking(game)}
                  className="attraction-card-cta"
                >
                  <span>Reserve Slot</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
