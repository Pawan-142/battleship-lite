import { useState } from 'react';
import { ArrowRight, Calendar, Users, Zap } from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';

export const Hero = ({ onOpenBooking }) => {
  const [selectedActivity, setSelectedActivity] = useState('laser-combat');
  const [selectedSquadSize, setSelectedSquadSize] = useState('4');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const handleQuickBook = (e) => {
    e.preventDefault();
    const game = GAMES.find(g => g.id === selectedActivity);
    const pass = PASSES.find(p => p.id === selectedActivity);
    onOpenBooking(game || pass || null);
  };

  return (
    <section id="hero" className="hero-editorial">
      <div className="container">
        {/* Live Status & Coordinates Ticker */}
        <div className="hero-ticker">
          <span className="status-live-dot" />
          <span>OPEN TODAY TIL 11:00 PM • 17.4875° N, 78.3853° E • NEXUS MALL 4TH FL</span>
        </div>

        {/* Cinematic Headline */}
        <h1 className="hero-title-editorial">
          Physical Gaming,<br />
          <span className="accent-text">Elevated.</span>
        </h1>

        <p className="hero-desc-editorial">
          15,000 sq ft of high-intensity laser combat, electric bumper drift, regulation UV glow bowling, and VR motion simulation in Hyderabad.
        </p>

        {/* Interactive Quick Booker Widget */}
        <form onSubmit={handleQuickBook} className="hero-booker-bar">
          <div className="booker-field">
            <label className="booker-label">Experience</label>
            <select 
              value={selectedActivity} 
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="booker-select"
            >
              <optgroup label="Single Attractions">
                {GAMES.map(game => (
                  <option key={game.id} value={game.id}>{game.title} (₹{game.price})</option>
                ))}
              </optgroup>
              <optgroup label="Squad Passes">
                {PASSES.map(pass => (
                  <option key={pass.id} value={pass.id}>{pass.name} (₹{pass.price})</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="booker-field">
            <label className="booker-label">Session Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="booker-input"
            />
          </div>

          <div className="booker-field">
            <label className="booker-label">Squad Size</label>
            <select 
              value={selectedSquadSize} 
              onChange={(e) => setSelectedSquadSize(e.target.value)}
              className="booker-select"
            >
              <option value="2">2 Players (Duo)</option>
              <option value="4">4 Players (Squad)</option>
              <option value="6">6 Players (Group)</option>
              <option value="10">10+ Players (Party)</option>
            </select>
          </div>

          <button type="submit" className="btn-red" style={{ height: '100%', minHeight: '48px' }}>
            <span>Reserve Slot</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Photo Showcase Reel */}
        <div className="hero-showcase-grid">
          {/* Main Featured Photo */}
          <div 
            className="showcase-featured-tile"
            onClick={() => onOpenBooking(GAMES[0])}
          >
            <img src={GAMES[0].image} alt={GAMES[0].title} />
            <span className="showcase-badge">Featured Combat Zone</span>
            <div className="showcase-tile-overlay">
              <h3 className="showcase-heading">{GAMES[0].title}</h3>
              <div className="showcase-meta-line">
                <span>{GAMES[0].duration} • {GAMES[0].players}</span>
                <span>•</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>₹{GAMES[0].price} / player</span>
              </div>
            </div>
          </div>

          {/* Side Tile 1 */}
          <div 
            className="showcase-side-tile"
            onClick={() => onOpenBooking(GAMES[1])}
          >
            <img src={GAMES[1].image} alt={GAMES[1].title} />
            <span className="showcase-badge">Velocity Track</span>
            <div className="showcase-tile-overlay">
              <h3 className="showcase-heading" style={{ fontSize: '1.25rem' }}>{GAMES[1].title}</h3>
              <div className="showcase-meta-line">
                <span>₹{GAMES[1].price}</span>
              </div>
            </div>
          </div>

          {/* Side Tile 2 */}
          <div 
            className="showcase-side-tile"
            onClick={() => onOpenBooking(GAMES[2])}
          >
            <img src={GAMES[2].image} alt={GAMES[2].title} />
            <span className="showcase-badge">Lounge & Lanes</span>
            <div className="showcase-tile-overlay">
              <h3 className="showcase-heading" style={{ fontSize: '1.25rem' }}>{GAMES[2].title}</h3>
              <div className="showcase-meta-line">
                <span>₹{GAMES[2].price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Metric Strip */}
        <div className="venue-stat-strip">
          <div className="stat-item">
            <span className="stat-number">15,000</span>
            <span className="stat-desc">Sq Ft Arena Floor</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">6 Arenas</span>
            <span className="stat-desc">Tactical, Track & VR</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50+ Games</span>
            <span className="stat-desc">Arcade & Redemption</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">4.9 ★</span>
            <span className="stat-desc">Over 2,400+ Verified Visits</span>
          </div>
        </div>
      </div>
    </section>
  );
};
