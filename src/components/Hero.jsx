import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause, Sparkles, Check, Zap, Calendar, Users, Clock } from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';

export const Hero = ({ onOpenBooking }) => {
  // Carousel State (100vh Fullscreen)
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Available Experiences Selector State (Directly below carousel)
  const [selectedExperienceId, setSelectedExperienceId] = useState('vr-immersion'); // Default to Pimax 8K VR
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('18:00');
  const [selectedPlayers, setSelectedPlayers] = useState(2);

  // Combine Games and Passes for the Available Selector
  const allSelectableItems = [
    ...GAMES,
    {
      id: PASSES[1].id,
      title: 'Squad Warfare Combo Pass',
      category: '4-in-1 Combo',
      image: '/images/party-suite.jpg',
      price: PASSES[1].price,
      duration: 'Full Session',
      players: '2 to 10 players',
      tag: 'Best Value Pass',
      isPass: true,
      rawPass: PASSES[1]
    }
  ];

  // Auto-play interval for Hero Carousel
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
      handleNextSlide();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      handlePrevSlide();
    }
  };

  const currentSlideGame = GAMES[activeSlide];

  // Currently selected item in the selector deck
  const activeSelectedItem = allSelectableItems.find(item => item.id === selectedExperienceId) || allSelectableItems[0];
  const calculatedTotal = activeSelectedItem.price * selectedPlayers;

  const handleBookSelected = (e) => {
    e.preventDefault();
    if (activeSelectedItem.isPass) {
      onOpenBooking(activeSelectedItem.rawPass);
    } else {
      onOpenBooking({
        ...activeSelectedItem,
        preferredDate: selectedDate,
        preferredSlot: selectedTimeSlot,
        players: selectedPlayers
      });
    }
  };

  return (
    <>
      {/* ==========================================================================
         1. FULLSCREEN 100VH CAROUSEL (OCCUPIES ENTIRE FIRST PAGE VIEWPORT)
         ========================================================================== */}
      <section 
        id="hero" 
        className="hero-editorial-fullscreen"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="hero-carousel-fullscreen-stage">
          {/* Background Images for all slides (crossfade & scale transition) */}
          {GAMES.map((game, idx) => (
            <img
              key={game.id}
              src={game.image}
              alt={game.title}
              className={`carousel-slide-bg ${activeSlide === idx ? 'active' : 'inactive'}`}
            />
          ))}

          {/* Cinematic Dark Gradient Overlay */}
          <div className="carousel-gradient-overlay" />

          {/* Floating Left/Right Navigation Arrows */}
          <button 
            onClick={handlePrevSlide} 
            className="carousel-nav-btn prev"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={26} />
          </button>

          <button 
            onClick={handleNextSlide} 
            className="carousel-nav-btn next"
            aria-label="Next Slide"
          >
            <ChevronRight size={26} />
          </button>

          {/* Active Slide Content */}
          <div className="carousel-slide-content-fullscreen">
            <div className="carousel-slide-info">
              {/* Ticker Badge */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div className="carousel-slide-badge" style={{ marginBottom: 0 }}>
                  <Sparkles size={12} />
                  <span>{currentSlideGame.tag} • {currentSlideGame.category}</span>
                </div>

                <div className="carousel-meta-pill" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ● LEVEL 4, NEXUS MALL HYDERABAD
                </div>
              </div>

              <h1 className="carousel-slide-title">
                {currentSlideGame.title}
              </h1>

              <p className="carousel-slide-desc">
                {currentSlideGame.shortNote}
              </p>

              <div className="carousel-slide-meta">
                <span className="carousel-meta-pill">⏱ {currentSlideGame.duration}</span>
                <span className="carousel-meta-pill">👥 {currentSlideGame.players}</span>
                <span className="carousel-meta-pill" style={{ color: '#fff', fontWeight: 700 }}>
                  ₹{currentSlideGame.price} / person
                </span>
                <span className="carousel-meta-pill" style={{ opacity: 0.85 }}>
                  ⚡ {currentSlideGame.intensity}
                </span>
              </div>
            </div>

            {/* Action Buttons & Slide Counter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => onOpenBooking(currentSlideGame)}
                  className="btn-red"
                  style={{ padding: '0.85rem 1.8rem', fontSize: '0.9rem' }}
                >
                  <span>Book This Arena (₹{currentSlideGame.price})</span>
                  <ArrowRight size={16} />
                </button>

                <a 
                  href="#available-booking" 
                  className="btn-secondary"
                  style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}
                >
                  Select & Book Now
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

          {/* Bottom Slide Tabs Bar */}
          <div className="carousel-tabs-bar-fullscreen">
            {GAMES.map((game, idx) => (
              <button
                key={game.id}
                onClick={() => setActiveSlide(idx)}
                className={`carousel-tab-btn-fullscreen ${activeSlide === idx ? 'active' : ''}`}
              >
                <span className="carousel-tab-num">0{idx + 1} // {game.category}</span>
                <span>{game.title}</span>
                {activeSlide === idx && isPlaying && (
                  <div className="carousel-tab-progress-fullscreen" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================================================
         2. AVAILABLE EXPERIENCES SELECTOR & LIVE "BOOK NOW" BAR (BELOW CAROUSEL)
         ========================================================================== */}
      <section id="available-booking" className="available-experiences-section">
        <div className="container">
          {/* Header */}
          <div className="experience-selector-header">
            <div>
              <div className="section-tag" style={{ color: 'var(--accent-red)' }}>Live Arena Availability</div>
              <h2 className="section-title-editorial" style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)' }}>
                Select Available Game & Book Now
              </h2>
            </div>
            <p style={{ maxWidth: '400px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Click on any attraction below to select it, choose your squad size, and reserve instantly.
            </p>
          </div>

          {/* 6 Selectable Experience Cards Deck */}
          <div className="experience-selector-grid">
            {allSelectableItems.map((item) => {
              const isSelected = selectedExperienceId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedExperienceId(item.id)}
                  className={`experience-selector-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* Thumbnail Photo */}
                  <div className="selector-card-thumb">
                    <img src={item.image} alt={item.title} />
                    <span className="selector-status-badge">
                      <span className="status-live-dot" style={{ width: '5px', height: '5px' }} />
                      <span>Available Today</span>
                    </span>

                    {isSelected && (
                      <div className="selector-check-icon">
                        <Check size={12} />
                      </div>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                      {item.tag || item.category}
                    </div>
                    <div className="selector-card-title">
                      {item.title}
                    </div>
                  </div>

                  {/* Footer & Price */}
                  <div className="selector-card-footer">
                    <span>{item.duration}</span>
                    <span className="selector-card-price">₹{item.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Live "BOOK NOW" Controller Bar */}
          <form onSubmit={handleBookSelected} className="live-booking-control-bar">
            {/* Selected Game Details */}
            <div className="selected-game-banner">
              <span className="selected-game-label">SELECTED EXPERIENCE</span>
              <span className="selected-game-name">{activeSelectedItem.title}</span>
              <span className="selected-game-specs">
                ₹{activeSelectedItem.price} / player • {activeSelectedItem.duration}
              </span>
            </div>

            {/* Date Picker */}
            <div className="booker-field">
              <label className="booker-label">Session Date</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="booker-input"
              />
            </div>

            {/* Time Slot Picker */}
            <div className="booker-field">
              <label className="booker-label">Arrival Slot</label>
              <select 
                value={selectedTimeSlot} 
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="booker-select"
              >
                <option value="12:00">12:00 PM (Afternoon)</option>
                <option value="15:00">03:00 PM (Matinee)</option>
                <option value="18:00">06:00 PM (Prime Night)</option>
                <option value="20:00">08:00 PM (Peak Battle)</option>
                <option value="21:30">09:30 PM (Late Session)</option>
              </select>
            </div>

            {/* Squad Player Count */}
            <div className="booker-field">
              <label className="booker-label">Squad Size ({selectedPlayers} Players)</label>
              <select 
                value={selectedPlayers} 
                onChange={(e) => setSelectedPlayers(parseInt(e.target.value, 10))}
                className="booker-select"
              >
                <option value="1">1 Player (Solo)</option>
                <option value="2">2 Players (Duo)</option>
                <option value="4">4 Players (Squad)</option>
                <option value="6">6 Players (Group)</option>
                <option value="8">8 Players (Team)</option>
                <option value="12">12+ Players (Party)</option>
              </select>
            </div>

            {/* Primary Action Button with Dynamic Price */}
            <button 
              type="submit" 
              className="btn-red" 
              style={{ padding: '0.9rem 1.8rem', height: '100%', minHeight: '52px', fontSize: '0.95rem' }}
            >
              <Zap size={18} />
              <span>BOOK NOW (₹{calculatedTotal.toLocaleString()})</span>
            </button>
          </form>
        </div>
      </section>
    </>
  );
};
