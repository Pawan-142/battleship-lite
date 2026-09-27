import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { PASSES } from '../data/passes';
import { GAMES } from '../data/games';
import { CUSTOM_PASS_ID, customPassPerPerson } from '../data/pricing';

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

  // Pricing comes from the shared module the server also uses, so the number
  // previewed here is the number actually charged.
  // Tiers: 15% for 2 games, 20% for 3, 25% for 4+. One game gets no discount.
  const {
    perPerson: discountedPerPerson,
    base: basePricePerPerson,
    rate: discountRate,
  } = customPassPerPerson(selectedGames);

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
          {PASSES.map((pass, idx) => (
            <motion.div 
              key={pass.id} 
              className={`ticket-pass-card ${pass.popular ? 'highlighted' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.18 } }}
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

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenBooking(pass)}
                  className={pass.popular ? "btn-red" : "btn-secondary"}
                  style={{ width: '100%', marginBottom: '1.25rem' }}
                >
                  <span>Book {pass.name}</span>
                  <ArrowRight size={16} />
                </motion.button>

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
            </motion.div>
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
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
                  </motion.button>
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
              <div className="preview-pill">
                CUSTOM SQUAD BUNDLE
                {discountRate > 0 ? ` • ${Math.round(discountRate * 100)}% DISCOUNT` : ' • ADD A GAME TO UNLOCK 15%'}
              </div>
              <div className="preview-total">₹{customTotalPrice.toLocaleString()}</div>
              <div className="preview-per-person">
                ₹{discountedPerPerson} per player
                {totalSavings > 0 ? ` (Save ₹${totalSavings.toLocaleString()} total)` : ''}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                ✓ Includes {selectedGames.length} selected games for {playerCount} players<br />
                ✓ {playerCount * 25} Arcade game coins included<br />
                ✓ Fast-track lane queueing
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenBooking({
                id: CUSTOM_PASS_ID,
                // The server re-derives the price from these two fields. Sending
                // a price from the browser would let anyone name their own.
                selectedGameIds: selectedGames,
                players: playerCount,
              })}
              className="btn-red"
              style={{ width: '100%' }}
            >
              <span>Book Custom Pass (₹{customTotalPrice.toLocaleString()})</span>
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};
