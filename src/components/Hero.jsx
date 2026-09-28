import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause, Sparkles, Check, Zap, Calendar, Users, Clock } from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';
import { CUSTOM_PASS_ID, customPassPerPerson } from '../data/pricing';
import { todayIST } from '../lib/format';

export const Hero = ({ onOpenBooking }) => {
  // Carousel State (100vh Fullscreen)
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Available Experiences Selector State (Directly below carousel)
  const [selectorMode, setSelectorMode] = useState('games'); // 'games' or 'passes'
  const [checkedGameIds, setCheckedGameIds] = useState(['vr-immersion']); // Checkbox array
  const [selectedPassId, setSelectedPassId] = useState(() => PASSES[1].id); // Squad Warfare Pass

  const [selectedDate, setSelectedDate] = useState(() => todayIST());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('18:00');
  const [selectedPlayers, setSelectedPlayers] = useState(2);

  // Toggle arena checkbox
  const handleToggleGame = (gameId) => {
    setCheckedGameIds(prev => {
      if (prev.includes(gameId)) {
        if (prev.length <= 1) return prev; // Keep at least 1 checked
        return prev.filter(id => id !== gameId);
      } else {
        return [...prev, gameId];
      }
    });
  };

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
    touchEndX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
    touchEndX.current = 0;
  };

  const currentSlideGame = GAMES[activeSlide];

  // Pricing calculation
  const isMultiGame = checkedGameIds.length > 1;
  const bundle = customPassPerPerson(checkedGameIds);
  const bundleDiscountRate = bundle.rate;

  let calculatedTotal = 0;
  let summaryLabel = '';
  let summarySpecs = '';

  if (selectorMode === 'games') {
    if (isMultiGame) {
      calculatedTotal = bundle.perPerson * selectedPlayers;
      summaryLabel = `${checkedGameIds.length} Arenas Checked (${Math.round(bundleDiscountRate * 100)}% OFF)`;
      summarySpecs = `₹${bundle.perPerson} / player • ${checkedGameIds.length} Arenas Bundled`;
    } else {
      const g = GAMES.find(x => x.id === checkedGameIds[0]) || GAMES[0];
      calculatedTotal = g.price * selectedPlayers;
      summaryLabel = g.title;
      summarySpecs = `₹${g.price} / player • ${g.duration}`;
    }
  } else {
    const p = PASSES.find(x => x.id === selectedPassId) || PASSES[0];
    calculatedTotal = p.price;
    summaryLabel = p.name;
    summarySpecs = `₹${p.price.toLocaleString('en-IN')} (Squad Pass) • ${p.accessCount}`;
  }

  const handleBookSelected = (e) => {
    e.preventDefault();
    const preferences = {
      preferredDate: selectedDate,
      preferredSlot: selectedTimeSlot,
      players: selectedPlayers,
    };

    if (selectorMode === 'games') {
      if (isMultiGame) {
        onOpenBooking({
          id: CUSTOM_PASS_ID,
          selectedGameIds: checkedGameIds,
          name: `Custom Squad Pass (${checkedGameIds.length} Arenas)`,
          ...preferences,
        });
      } else {
        const g = GAMES.find(x => x.id === checkedGameIds[0]) || GAMES[0];
        onOpenBooking({ ...g, ...preferences });
      }
    } else {
      const p = PASSES.find(x => x.id === selectedPassId) || PASSES[0];
      onOpenBooking({ ...p, ...preferences });
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevSlide();
            }} 
            className="carousel-nav-btn prev"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={26} />
          </button>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextSlide();
            }} 
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

            {/* Action Buttons & Slide Counter — Unified Row Alignment */}
            <div className="hero-slide-actions-wrap">
              <div className="hero-action-buttons-group">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBooking(currentSlideGame);
                  }}
                  className="btn-red hero-main-cta"
                >
                  <span>Book Now</span>
                  <ArrowRight size={16} />
                </button>

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
          {/* Header & Tabs */}
          <div className="experience-selector-header">
            <div>
              <div className="section-tag" style={{ color: 'var(--accent-red)' }}>Live Arena Availability</div>
              <h2 className="section-title-editorial" style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)' }}>
                Select Available Game & Book Now
              </h2>
            </div>
            
            {/* Mode Switcher Tabs */}
            <div className="selector-tabs-pills">
              <button
                type="button"
                onClick={() => setSelectorMode('games')}
                className={`selector-tab-btn ${selectorMode === 'games' ? 'active' : ''}`}
              >
                <span>⚔️ Arena Attractions (6)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectorMode('passes')}
                className={`selector-tab-btn ${selectorMode === 'passes' ? 'active' : ''}`}
              >
                <span>🎟️ Squad VIP Passes (3)</span>
              </button>
            </div>
          </div>

          {/* Subtitle & Live Volume Discount Notification */}
          <div className="selector-sub-banner">
            <p className="selector-sub-text">
              {selectorMode === 'games'
                ? 'Check one or more attractions to bundle your session. Adding multiple arenas activates volume discounts!'
                : 'Choose an all-inclusive squad pass for multiple attractions and priority VIP access.'}
            </p>

            {selectorMode === 'games' && (
              <div className={`selector-discount-badge ${bundleDiscountRate > 0 ? 'active' : ''}`}>
                {bundleDiscountRate > 0 ? (
                  <>
                    <Zap size={14} />
                    <span><strong>{Math.round(bundleDiscountRate * 100)}% Squad Discount</strong> Checked & Active!</span>
                  </>
                ) : (
                  <span>Check 2+ arenas to unlock <strong>15% to 25% OFF</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Minimalist 3-Step "How Battleship Works" Explainer */}
          <motion.div 
            className="how-it-works-banner"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.12 }
              }
            }}
          >
            <motion.div 
              className="how-step-card"
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              <div className="how-step-num">01</div>
              <div className="how-step-content">
                <div className="how-step-title">Choose Your Arenas</div>
                <div className="how-step-desc">Pick 1 arena or check multiple attractions (Laser Tag, Drift Cars, VR, Bowling).</div>
              </div>
            </motion.div>
            <motion.div 
              className="how-step-card"
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              <div className="how-step-num">02</div>
              <div className="how-step-content">
                <div className="how-step-title">Unlock Squad Savings</div>
                <div className="how-step-desc">Checking 2+ arenas automatically activates 15% to 25% OFF per player.</div>
              </div>
            </motion.div>
            <motion.div 
              className="how-step-card"
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              <div className="how-step-num">03</div>
              <div className="how-step-content">
                <div className="how-step-title">Instant WhatsApp Pass</div>
                <div className="how-step-desc">Get your QR boarding pass instantly on WhatsApp. Show on Level 4 Nexus Mall and play!</div>
              </div>
            </motion.div>
          </motion.div>

          {/* 1. ARENAS MODE: EXACTLY 6 BALANCED CARDS WITH CHECKBOXES */}
          {selectorMode === 'games' ? (
            <div className="experience-selector-grid">
              {GAMES.map((game, idx) => {
                const isChecked = checkedGameIds.includes(game.id);
                return (
                  <motion.div
                    key={game.id}
                    onClick={() => handleToggleGame(game.id)}
                    className={`experience-selector-card ${isChecked ? 'selected' : ''}`}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.98 }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleToggleGame(game.id);
                      }
                    }}
                  >
                    {/* Thumbnail Photo with Status Badge and Checkbox Icon */}
                    <div className="selector-card-thumb">
                      <img src={game.image} alt={game.title} />
                      <span className="selector-status-badge">
                        <span className="status-live-dot" style={{ width: '5px', height: '5px' }} />
                        <span>Available Today</span>
                      </span>

                      <div className={`selector-checkbox-indicator ${isChecked ? 'checked' : ''}`}>
                        <AnimatePresence>
                          {isChecked && (
                            <motion.div
                              initial={{ scale: 0, rotate: -20 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 20 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                            >
                              <Check size={12} strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                        {game.tag || game.category}
                      </div>
                      <div className="selector-card-title">
                        {game.title}
                      </div>
                    </div>

                    {/* Footer & Price */}
                    <div className="selector-card-footer">
                      <span>{game.duration}</span>
                      <span className="selector-card-price">₹{game.price}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* 2. PASSES MODE: EXACTLY 3 BALANCED CARDS */
            <div className="experience-passes-grid">
              {PASSES.map((pass, idx) => {
                const isSelected = selectedPassId === pass.id;
                return (
                  <motion.div
                    key={pass.id}
                    onClick={() => setSelectedPassId(pass.id)}
                    className={`experience-pass-card ${isSelected ? 'selected' : ''}`}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="experience-pass-header">
                      <span className="experience-pass-tag">{pass.tag}</span>
                      <div className={`selector-radio-indicator ${isSelected ? 'checked' : ''}`}>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                            >
                              <Check size={12} strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="experience-pass-name">{pass.name}</div>
                    <div className="experience-pass-access">{pass.accessCount} · {pass.players}</div>
                    <div className="experience-pass-price">₹{pass.price.toLocaleString('en-IN')}</div>
                    <p className="experience-pass-desc">{pass.description}</p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Dynamic Live "BOOK NOW" Controller Bar */}
          <form onSubmit={handleBookSelected} className="live-booking-control-bar">
            {/* Selected Game Details */}
            <div className="selected-game-banner">
              <span className="selected-game-label">RESERVATION PREVIEW</span>
              <span className="selected-game-name">{summaryLabel}</span>
              <span className="selected-game-specs">{summarySpecs}</span>
            </div>

            {/* Date Picker */}
            <div className="booker-field">
              <label className="booker-label">Session Date</label>
              <input
                type="date"
                value={selectedDate}
                min={todayIST()}
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
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-red booker-submit-btn" 
            >
              <Zap size={18} />
              <span>BOOK NOW (₹{calculatedTotal.toLocaleString()})</span>
            </motion.button>
          </form>
        </div>
      </section>
    </>
  );
};
