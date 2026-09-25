import { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { PASSES } from '../data/passes';
import { GAMES } from '../data/games';

export const PricingPasses = ({ onOpenBooking }) => {
  // Custom Squad Pass Customizer State
  const [selectedGames, setSelectedGames] = useState(['laser-combat', 'electric-drift', 'glow-bowling']);
  const [playerCount, setPlayerCount] = useState(4);

  const toggleGameSelection = (gameId) => {
    setSelectedGames(prev => 
      prev.includes(gameId)
        ? (prev.length > 1 ? prev.filter(id => id !== gameId) : prev) // keep at least 1
        : [...prev, gameId]
    );
  };

  // Pricing formula for custom pass
  const basePricePerPerson = selectedGames.reduce((acc, gId) => {
    const g = GAMES.find(game => game.id === gId);
    return acc + (g ? g.price : 0);
  }, 0);

  // 15% discount for 2 games, 20% for 3 games, 25% for 4+ games
  const discountRate = selectedGames.length >= 4 ? 0.25 : (selectedGames.length === 3 ? 0.20 : 0.15);
  const discountedPerPerson = Math.round(basePricePerPerson * (1 - discountRate));
  const customTotalPrice = discountedPerPerson * playerCount;
  const totalSavings = (basePricePerPerson * playerCount) - customTotalPrice;

  return (
    <section id="passes" className="section-padding passes-section">
      <div className="container">
        {/* Header */}
        <div className="section-header-editorial">
          <div>
            <div className="section-tag">Curated Squad Packages</div>
            <h2 className="section-title-editorial">Physical Passes & Bundles</h2>
          </div>
          <p style={{ maxWidth: '400px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            All passes include complimentary arcade tap cards, beverage vouchers, and skip-the-line priority lanes.
          </p>
        </div>

        {/* 3-Column Luxury Boarding Passes */}
        <div className="passes-grid">
          {PASSES.map((pass) => (
            <div 
              key={pass.id} 
              className={`ticket-pass-card ${pass.popular ? 'highlighted' : ''}`}
            >
              {/* Ticket Top / Tear-off Header */}
              <div className="ticket-pass-header">
                <div className="ticket-code-badge">{pass.passCode}</div>
                <h3 className="ticket-title">{pass.name}</h3>
                <p className="ticket-subtext">{pass.subtitle}</p>
              </div>

              {/* Ticket Body */}
              <div className="ticket-pass-body">
                <div className="ticket-pricing-block">
                  <span className="ticket-price-main">₹{pass.price}</span>
                  <span className="ticket-price-original">₹{pass.originalPrice}</span>
                  <span className="ticket-savings-pill">{pass.savings}</span>
                </div>

                <ul className="ticket-features-list">
                  {pass.features.map((feat, idx) => (
                    <li key={idx} className="ticket-feature-item">
                      <Check size={16} className="ticket-feature-check" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => onOpenBooking(pass)}
                  className={pass.popular ? "btn-red" : "btn-secondary"}
                  style={{ width: '100%', marginBottom: '1.25rem' }}
                >
                  <span>Book {pass.name}</span>
                  <ArrowRight size={16} />
                </button>

                {/* Barcode representation */}
                <div className="ticket-barcode-footer">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                    {pass.accessCount}
                  </span>
                  {/* Decorative Barcode Lines */}
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {[8, 14, 6, 18, 10, 16, 4, 12, 18, 8, 14, 6, 10].map((h, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          width: i % 2 === 0 ? '2px' : '3px', 
                          height: `${h}px`, 
                          backgroundColor: 'var(--text-tertiary)',
                          opacity: 0.6
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Custom Squad Pass Calculator */}
        <div id="custom-pass" className="squad-calculator-box">
          <div>
            <div className="section-tag" style={{ color: 'var(--accent-amber)' }}>Live Pass Builder</div>
            <h3 className="calc-title">Build a Custom Squad Pass</h3>
            <p className="calc-sub">
              Select any combination of arenas for your group. Discounts apply automatically as you add experiences.
            </p>

            {/* Game Toggles */}
            <div className="calc-game-toggles">
              {GAMES.slice(0, 4).map((game) => {
                const isSelected = selectedGames.includes(game.id);
                return (
                  <button
                    key={game.id}
                    onClick={() => toggleGameSelection(game.id)}
                    className={`game-toggle-btn ${isSelected ? 'selected' : ''}`}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{game.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{game.price}</div>
                    </div>
                    <span className="check-badge">
                      {isSelected ? <Check size={12} /> : '+'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Player Count Slider */}
            <div className="player-slider-row">
              <div className="player-slider-header">
                <span>Number of Players:</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{playerCount} Players</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="16" 
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                className="slider-input"
              />
            </div>
          </div>

          {/* Generated Custom Pass Preview */}
          <div className="generated-ticket-preview">
            <div>
              <div className="preview-pill">CUSTOM SQUAD BUNDLE • {Math.round(discountRate * 100)}% DISCOUNT</div>
              <div className="preview-total">₹{customTotalPrice.toLocaleString()}</div>
              <div className="preview-per-person">
                ₹{discountedPerPerson} per player (Save ₹{totalSavings.toLocaleString()} total)
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                ✓ Includes {selectedGames.length} selected games for {playerCount} players<br />
                ✓ {playerCount * 25} Arcade game coins included<br />
                ✓ Fast-track lane queueing
              </div>
            </div>

            <button 
              onClick={() => onOpenBooking({
                id: 'custom-pass',
                name: `Custom ${selectedGames.length}-Game Squad Pass`,
                price: discountedPerPerson,
                totalCustomPrice: customTotalPrice,
                players: playerCount,
                selectedGamesCount: selectedGames.length
              })}
              className="btn-red"
              style={{ width: '100%' }}
            >
              <span>Book Custom Pass (₹{customTotalPrice.toLocaleString()})</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
