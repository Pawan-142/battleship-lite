import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause, Zap, Sparkles } from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';

export const Hero = ({ onOpenBooking }) => {
  // Quick Booker Bar State
  const [selectedActivity, setSelectedActivity] = useState('laser-combat');
  const [selectedSquadSize, setSelectedSquadSize] = useState('4');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % GAMES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, activeSlide]);

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev + 1) % GAMES.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev - 1 + GAMES.length) % GAMES.length);
  };

  // Touch Handlers for Mobile Swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      handleNextSlide(); // Swipe left -> next
    }
    if (touchStartX.current - touchEndX.current < -50) {
      handlePrevSlide(); // Swipe right -> prev
    }
  };

  const handleQuickBook = (e) => {
    e.preventDefault();
    const game = GAMES.find(g => g.id === selectedActivity);
    const pass = PASSES.find(p => p.id === selectedActivity);
    onOpenBooking(game || pass || null);
  };

  const currentSlideGame = GAMES[activeSlide];

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

        {/* Interactive Quick Booker Bar */}
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

        {/* ==========================================================================
           CINEMATIC HERO CAROUSEL
           ========================================================================== */}
        <div 
          className="hero-carousel-container"
          onMouseEnter={() => setIsPlaying(false)}
          onMouseLeave={() => setIsPlaying(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Slide Tabs Navigation */}
          <div className="carousel-tabs-bar">
            {GAMES.map((game, idx) => (
              <button
                key={game.id}
                onClick={() => setActiveSlide(idx)}
                className={`carousel-tab-btn ${activeSlide === idx ? 'active' : ''}`}
              >
                <span className="carousel-tab-num">0{idx + 1} // {game.category}</span>
                <span>{game.title}</span>
                {activeSlide === idx && isPlaying && (
                  <div className="carousel-tab-progress" />
                )}
              </button>
            ))}
          </div>

          {/* Carousel Stage */}
          <div className="hero-carousel-stage">
            {/* Background Images for all slides (preloaded & smooth crossfade) */}
            {GAMES.map((game, idx) => (
              <img
                key={game.id}
                src={game.image}
                alt={game.title}
                className={`carousel-slide-bg ${activeSlide === idx ? 'active' : 'inactive'}`}
              />
            ))}

            {/* Gradient Dark Overlay */}
            <div className="carousel-gradient-overlay" />

            {/* Left/Right Floating Navigation Arrows */}
            <button 
              onClick={handlePrevSlide} 
              className="carousel-nav-btn prev"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={22} />
            </button>

            <button 
              onClick={handleNextSlide} 
              className="carousel-nav-btn next"
              aria-label="Next Slide"
            >
              <ChevronRight size={22} />
            </button>

            {/* Active Slide Content */}
            <div className="carousel-slide-content">
              <div className="carousel-slide-info">
                <div className="carousel-slide-badge">
                  <Sparkles size={12} />
                  <span>{currentSlideGame.tag} • {currentSlideGame.category}</span>
                </div>

                <h2 className="carousel-slide-title">
                  {currentSlideGame.title}
                </h2>

                <p className="carousel-slide-desc">
                  {currentSlideGame.shortNote}
                </p>

                <div className="carousel-slide-meta">
                  <span className="carousel-meta-pill">⏱ {currentSlideGame.duration}</span>
                  <span className="carousel-meta-pill">👥 {currentSlideGame.players}</span>
                  <span className="carousel-meta-pill" style={{ color: '#fff', fontWeight: 700 }}>
                    ₹{currentSlideGame.price} / person
                  </span>
                  <span className="carousel-meta-pill" style={{ opacity: 0.8 }}>
                    ⚡ {currentSlideGame.intensity}
                  </span>
                </div>
              </div>

              {/* Action Buttons & Slide Counter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => onOpenBooking(currentSlideGame)}
                    className="btn-red"
                    style={{ padding: '0.75rem 1.4rem' }}
                  >
                    <span>Book This Game (₹{currentSlideGame.price})</span>
                    <ArrowRight size={16} />
                  </button>

                  <a 
                    href="#passes" 
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.2rem' }}
                  >
                    View Passes
                  </a>
                </div>

                {/* Bottom Status & Pause/Play Control */}
                <div className="carousel-controls-bottom">
                  <button 
                    onClick={() => setIsPlaying(prev => !prev)} 
                    className="carousel-play-toggle"
                    title={isPlaying ? 'Pause Autoplay' : 'Resume Autoplay'}
                    aria-label="Play / Pause Carousel"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <span className="carousel-counter-text">
                    0{activeSlide + 1} / 0{GAMES.length}
                  </span>
                </div>
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
