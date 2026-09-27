import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, Share2, Loader2, AlertCircle, CreditCard, 
  MapPin, Calendar, Clock, Users, ShieldCheck, ArrowLeft, Sparkles, Zap, Plus, Info, Award
} from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';
import { CUSTOM_PASS_ID, computeAmountPaise, resolveItem, customPassPerPerson, discountRateFor } from '../data/pricing';
import { createBooking, createOrder, verifyPayment, openRazorpayCheckout } from '../lib/api';
import { todayIST, formatINR, formatSlot } from '../lib/format';

const SLOTS = [
  { value: '12:00', label: '12:00 PM (Afternoon) — Available', peak: false },
  { value: '15:00', label: '03:00 PM (Matinee) — Available', peak: false },
  { value: '18:00', label: '06:00 PM (Prime Evening) — ⚡ Fast Filling', peak: true },
  { value: '20:00', label: '08:00 PM (Night Battle) — 🔥 Only 2 Slots Left', peak: true },
  { value: '21:30', label: '09:30 PM (Late Session) — Available', peak: false },
];

const parsePlayerCount = (val) => {
  if (typeof val === 'number' && !isNaN(val) && val >= 1) return val;
  if (typeof val === 'string') {
    const match = val.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
  }
  return 2;
};

export const BookingPage = ({ initialItem, onBackToHome }) => {
  const [step, setStep] = useState(1);

  // Determine initial booking mode: 'combos' (arenas with checkboxes) or 'passes' (fixed VIP packages)
  const isInitialPass = Boolean(initialItem?.passCode || initialItem?.badge);
  const isCustomPass = initialItem?.id === CUSTOM_PASS_ID;

  const [bookingMode, setBookingMode] = useState(() => {
    return isInitialPass ? 'passes' : 'combos';
  });

  // Arena Checkbox state: array of checked game IDs
  const [checkedGameIds, setCheckedGameIds] = useState(() => {
    if (isCustomPass && Array.isArray(initialItem?.selectedGameIds) && initialItem.selectedGameIds.length > 0) {
      return initialItem.selectedGameIds;
    }
    if (initialItem && !isInitialPass && initialItem.id) {
      return [initialItem.id];
    }
    return [GAMES[0].id]; // Default: Laser Combat
  });

  // Preset pass selection
  const [selectedPassId, setSelectedPassId] = useState(() => {
    if (isInitialPass && initialItem?.id) return initialItem.id;
    return PASSES[1].id; // Default: Squad Warfare Combo Pass
  });

  // Checkbox warning message (e.g. if user tries to uncheck last arena)
  const [checkWarning, setCheckWarning] = useState(null);

  // Reservation Form State
  const [date, setDate] = useState(() => initialItem?.preferredDate || todayIST());
  const [timeSlot, setTimeSlot] = useState(() => initialItem?.preferredSlot || '18:00');
  const [players, setPlayers] = useState(() => parsePlayerCount(initialItem?.players));
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Sync state if initialItem changes
  useEffect(() => {
    if (initialItem) {
      if (initialItem.players) {
        setPlayers(parsePlayerCount(initialItem.players));
      }
      if (initialItem.id === CUSTOM_PASS_ID && Array.isArray(initialItem.selectedGameIds) && initialItem.selectedGameIds.length > 0) {
        setCheckedGameIds(initialItem.selectedGameIds);
        setBookingMode('combos');
      } else if (initialItem.passCode || initialItem.badge) {
        setSelectedPassId(initialItem.id);
        setBookingMode('passes');
      } else if (initialItem.id) {
        setCheckedGameIds([initialItem.id]);
        setBookingMode('combos');
      }
    }
  }, [initialItem]);

  // Submission & Payment State
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);

  const [booking, setBooking] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  const intentRef = useRef('reserve');
  const [pendingIntent, setPendingIntent] = useState('reserve');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Handle toggling arena checkboxes
  const handleToggleGame = (gameId) => {
    setCheckedGameIds(prev => {
      if (prev.includes(gameId)) {
        if (prev.length <= 1) {
          setCheckWarning('At least 1 arena must remain checked to complete a reservation.');
          setTimeout(() => setCheckWarning(null), 3500);
          return prev;
        }
        setCheckWarning(null);
        return prev.filter(id => id !== gameId);
      } else {
        setCheckWarning(null);
        return [...prev, gameId];
      }
    });
  };

  // Pricing calculations for checked arenas
  const isMultiArena = checkedGameIds.length > 1;
  const bundleCalculation = customPassPerPerson(checkedGameIds);
  const discountRate = bundleCalculation.rate;
  const regularBasePerPlayer = bundleCalculation.base;
  const netPerPlayer = bundleCalculation.perPerson;
  const totalSavingsRupees = (regularBasePerPlayer - netPerPlayer) * players;

  // Selected Item details for Summary Sidebar
  let previewPaise = 0;
  let activeItemTitle = '';
  let activeItemSubtitle = '';

  if (bookingMode === 'combos') {
    if (isMultiArena) {
      previewPaise = computeAmountPaise({
        itemId: CUSTOM_PASS_ID,
        players,
        selectedGameIds: checkedGameIds,
      });
      activeItemTitle = `Custom Squad Pass (${checkedGameIds.length} Arenas Checked)`;
      activeItemSubtitle = `${checkedGameIds.length} Arenas with ${Math.round(discountRate * 100)}% Squad Discount`;
    } else {
      const singleGame = GAMES.find(g => g.id === checkedGameIds[0]) || GAMES[0];
      previewPaise = computeAmountPaise({
        itemId: singleGame.id,
        players,
      });
      activeItemTitle = singleGame.title;
      activeItemSubtitle = `${singleGame.category} · ${singleGame.duration}`;
    }
  } else {
    const passObj = PASSES.find(p => p.id === selectedPassId) || PASSES[0];
    previewPaise = computeAmountPaise({
      itemId: passObj.id,
      players,
    });
    activeItemTitle = passObj.name;
    activeItemSubtitle = `${passObj.accessCount} · Squad Pass Tier`;
  }

  const displayPaise = booking ? booking.amountPaise : previewPaise;

  // Form submission handler
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || paying) return;

    if (bookingMode === 'combos' && checkedGameIds.length === 0) {
      setCheckWarning('Please check at least 1 arena to proceed.');
      return;
    }

    setError(null);
    setFieldErrors([]);
    setSubmitting(true);
    setPendingIntent(intentRef.current);

    const payOnline = intentRef.current === 'pay';

    let created;
    try {
      if (bookingMode === 'combos') {
        if (isMultiArena) {
          created = await createBooking({
            itemType: 'custom',
            itemId: CUSTOM_PASS_ID,
            selectedGameIds: checkedGameIds,
            players,
            date,
            timeSlot,
            guestName,
            guestPhone,
          });
        } else {
          created = await createBooking({
            itemType: 'single',
            itemId: checkedGameIds[0],
            players,
            date,
            timeSlot,
            guestName,
            guestPhone,
          });
        }
      } else {
        created = await createBooking({
          itemType: 'pass',
          itemId: selectedPassId,
          players,
          date,
          timeSlot,
          guestName,
          guestPhone,
        });
      }
    } catch (err) {
      setError(err.message);
      setFieldErrors(Array.isArray(err.details) ? err.details : []);
      setSubmitting(false);
      return;
    }

    setBooking(created);
    setPaymentStatus(created.paymentStatus || 'unpaid');
    setStep(2);
    setSubmitting(false);

    if (payOnline) {
      startPayment(created);
    }
  }

  const triggerConfetti = () => {
    import('canvas-confetti').then((module) => {
      const confetti = module.default || module;
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    }).catch(() => {});
  };

  // Razorpay Official Checkout Trigger
  async function startPayment(target) {
    const active = target || booking;
    if (!active || paying) return;

    setError(null);
    setPaying(true);

    try {
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_ThAj1DL3VOR6NT';
      const order = await createOrder(active.bookingId).catch(() => null);

      const result = await openRazorpayCheckout({
        keyId: order?.keyId || keyId,
        orderId: order?.orderId,
        amountPaise: active.amountPaise || displayPaise,
        currency: 'INR',
        name: 'Battleship Arena',
        description: active.itemName || 'Arena Pass Reservation',
        prefill: {
          name: guestName.trim() || 'Arena Challenger',
          contact: guestPhone.trim() || '9876543210',
        },
        notes: {
          reference: active.reference || 'BS-PASS',
        },
      });

      const verified = await verifyPayment({
        bookingId: active.bookingId || active.id,
        razorpay_order_id: result.razorpay_order_id || '',
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature || '',
      });

      setPaymentStatus(verified?.paymentStatus || 'paid');
      triggerConfetti();
      setError(null);
    } catch (err) {
      if (err.code === 'DISMISSED') {
        setError('Payment window was closed. Your slot remains held.');
      } else {
        setError(err.message || 'Razorpay checkout error.');
      }
    } finally {
      setPaying(false);
    }
  }

  const whatsappHref = booking
    ? `https://wa.me/?text=${encodeURIComponent(
        `🎮 *BATTLESHIP ARENA — SQUAD INVITATION*\n\n` +
        `⚔️ *Experience:* ${booking.itemName || activeItemTitle}\n` +
        `📅 *Date:* ${date}\n` +
        `⏰ *Arrival Slot:* ${formatSlot(timeSlot)}\n` +
        `👥 *Squad:* ${players} Players\n` +
        `🎟️ *Pass Ref:* #${booking.reference}\n` +
        `📍 *Venue:* Battleship Arena, Level 4 Nexus Mall, Hyderabad\n\n` +
        `Be ready for combat! Wristband check-in opens 15 mins prior.`
      )}`
    : '#';

  return (
    <div className="booking-page-full-root animate-fade-in">
      <div className="container">
        {/* In-Page Step Indicator */}
        <div className="booking-page-header-block">
          <div className="booking-header-top-meta">
            <span className="section-tag">
              <Sparkles size={13} /> REAL-TIME ARENA RESERVATION
            </span>
            <div className="booking-page-progress-pill">
              <span className={step === 1 ? 'active' : ''}>1. Select Experiences</span>
              <span>/</span>
              <span className={step === 2 ? 'active' : ''}>2. Boarding Pass</span>
            </div>
          </div>
          <h1 className="booking-page-main-heading">
            Reserve Arena <span className="text-red">Slots</span>
          </h1>
          <p className="booking-page-sub-text">
            Choose your arena experience or check multiple arenas to compose a custom squad combo pass with volume savings.
          </p>
        </div>

        {step === 1 ? (
          <div className="booking-page-grid">
            {/* Left Column: Interactive Form & Experience Selector */}
            <div className="booking-page-form-col">

              {/* Mode Switcher Tabs */}
              <div className="booking-tab-switcher">
                <button
                  type="button"
                  onClick={() => setBookingMode('combos')}
                  className={`booking-tab-pill ${bookingMode === 'combos' ? 'active' : ''}`}
                >
                  <Sparkles size={14} />
                  <span>Check Arenas & Build Combo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode('passes')}
                  className={`booking-tab-pill ${bookingMode === 'passes' ? 'active' : ''}`}
                >
                  <Award size={14} />
                  <span>Pre-set Squad VIP Passes</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="booking-full-form">
                {/* 1. ARENA SELECTION WITH INTERACTIVE CHECKBOXES */}
                {bookingMode === 'combos' ? (
                  <div className="arena-selection-section">
                    <div className="arena-section-header">
                      <div>
                        <h2 className="arena-section-title">Check Arenas to Include</h2>
                        <p className="arena-section-desc">
                          Check 1 arena for standard play, or check multiple to unlock automatic bundle discounts!
                        </p>
                      </div>

                      {/* Dynamic Bundle Discount Status Badge */}
                      <div className={`bundle-discount-status-pill ${discountRate > 0 ? 'is-active' : ''}`}>
                        {discountRate > 0 ? (
                          <>
                            <Zap size={15} />
                            <span><strong>{Math.round(discountRate * 100)}% Combo Discount</strong> Checked & Active!</span>
                          </>
                        ) : (
                          <>
                            <Info size={15} />
                            <span>Check 2+ arenas to unlock <strong>15% to 25% OFF</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {checkWarning && (
                      <div className="check-warning-banner animate-fade-in" role="alert">
                        <AlertCircle size={16} />
                        <span>{checkWarning}</span>
                      </div>
                    )}

                    {/* Interactive Arena Checklist Grid — Consistent with Home Cards */}
                    <div className="booking-arena-cards-grid" role="group" aria-label="Available Arena Experiences">
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
                            initial={{ opacity: 0, y: 14 }}
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
                            <div className="selector-card-thumb">
                              <img src={game.image} alt={game.title} />
                              <span className="selector-status-badge">
                                <span className="status-live-dot" />
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

                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                {game.tag || game.category}
                              </div>
                              <div className="selector-card-title">
                                {game.title}
                              </div>
                            </div>

                            <div className="selector-card-footer">
                              <span>{game.duration}</span>
                              <span className="selector-card-price">₹{game.price}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 2. PRE-SET VIP PASSES SELECTION */
                  <div className="preset-passes-section">
                    <h2 className="arena-section-title">Select VIP Squad Multi-Pass</h2>
                    <p className="arena-section-desc">
                      Pre-packaged tier passes granting all-inclusive multi-game entries and VIP priority queue access.
                    </p>

                    <div className="preset-passes-grid">
                      {PASSES.map((p, idx) => {
                        const isSelected = selectedPassId === p.id;
                        return (
                          <motion.div
                            key={p.id}
                            onClick={() => setSelectedPassId(p.id)}
                            className={`preset-pass-card ${isSelected ? 'is-selected' : ''}`}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -4, transition: { duration: 0.18 } }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="preset-pass-top">
                              <span className="preset-pass-tag">{p.tag}</span>
                              <div className={`pass-radio-box ${isSelected ? 'active' : ''}`}>
                                <AnimatePresence>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                    >
                                      <Check size={14} strokeWidth={3} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <h3 className="preset-pass-name">{p.name}</h3>
                            <div className="preset-pass-price">₹{p.price.toLocaleString('en-IN')}</div>
                            <div className="preset-pass-access">{p.accessCount} · {p.players}</div>
                            <p className="preset-pass-desc">{p.description}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. DATE & TIME SELECTION */}
                <div className="booking-form-section-divider">
                  <span>Match Schedule & Squad Size</span>
                </div>

                <div className="booking-two-col-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="booking-date">
                      <Calendar size={14} className="text-red" />
                      <span>Select Match Date</span>
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      value={date}
                      min={todayIST()}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="booking-time-slot">
                      <Clock size={14} className="text-red" />
                      <span>Arrival Window</span>
                    </label>
                    <select
                      id="booking-time-slot"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="form-select"
                    >
                      {SLOTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. SQUAD PLAYERS SLIDER */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label" htmlFor="players-slider">
                      <Users size={14} className="text-red" />
                      <span>Total Squad Size ({players} {players === 1 ? 'Player' : 'Players'})</span>
                    </label>
                    <span className="slider-value-badge">{players} {players === 1 ? 'SOLO' : 'PLAYERS'}</span>
                  </div>
                  <input
                    id="players-slider"
                    type="range"
                    min="1"
                    max="16"
                    value={players}
                    onChange={(e) => setPlayers(parseInt(e.target.value, 10))}
                    className="slider-input custom-slider"
                  />
                  <div className="slider-marks">
                    <span>1 Solo</span>
                    <span>4 Squad</span>
                    <span>8 Team</span>
                    <span>16 Clan</span>
                  </div>
                </div>

                {/* 5. CAPTAIN CONTACT INFO */}
                <div className="booking-two-col-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="captain-name">Captain / Player Name</label>
                    <input
                      id="captain-name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="form-input"
                      maxLength={80}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="captain-phone">WhatsApp Number (For Instant Pass QR)</label>
                    <input
                      id="captain-phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="form-input"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="booking-error-banner animate-fade-in" role="alert">
                    <AlertCircle size={18} />
                    <div>
                      <div>{error}</div>
                      {fieldErrors.length > 0 && (
                        <ul className="booking-field-errors">
                          {fieldErrors.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="booking-action-buttons">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    onClick={() => { intentRef.current = 'pay'; }}
                    disabled={submitting || paying}
                    className="btn-red booking-cta-primary"
                    id="btn-pay-online"
                  >
                    {submitting && pendingIntent === 'pay' ? (
                      <><Loader2 size={18} className="spin" /><span>Initializing Checkout…</span></>
                    ) : (
                      <><CreditCard size={18} /><span>Pay Online via Razorpay ({formatINR((displayPaise && displayPaise > 0) ? displayPaise : ((netPerPlayer * players * 100) || 49900))})</span></>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    onClick={() => { intentRef.current = 'reserve'; }}
                    disabled={submitting || paying}
                    className="btn-secondary booking-cta-secondary"
                    id="btn-reserve-at-venue"
                  >
                    {submitting && pendingIntent === 'reserve' ? (
                      <><Loader2 size={18} className="spin" /><span>Securing Slot Reservation…</span></>
                    ) : (
                      <span>Reserve Slot — Pay at Venue Reception</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* Right Column: Live Reservation Summary Card */}
            <aside className="booking-page-summary-col">
              <div className="summary-sticky-card">
                <span className="summary-card-tag">RESERVATION OVERVIEW</span>
                <h3 className="summary-game-title">{activeItemTitle}</h3>
                <p className="summary-game-sub">{activeItemSubtitle}</p>

                {/* Checked Arenas Checklist */}
                {bookingMode === 'combos' && (
                  <div className="summary-checked-arenas-box">
                    <span className="summary-subhead">
                      {checkedGameIds.length} {checkedGameIds.length === 1 ? 'Arena Checked' : 'Arenas Checked'}:
                    </span>
                    <ul className="summary-arenas-list">
                      {checkedGameIds.map(id => {
                        const g = GAMES.find(x => x.id === id);
                        if (!g) return null;
                        return (
                          <li key={g.id} className="summary-arena-item">
                            <Check size={14} className="text-emerald" />
                            <span className="arena-title-sub">{g.title}</span>
                            <span className="arena-price-sub">₹{g.price}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Venue & Time Meta */}
                <div className="summary-meta-list">
                  <div className="summary-meta-row">
                    <MapPin size={15} className="text-red" />
                    <span>Battleship Arena, Nexus Mall Level 4</span>
                  </div>
                  <div className="summary-meta-row">
                    <Calendar size={15} className="text-red" />
                    <span>{date}</span>
                  </div>
                  <div className="summary-meta-row">
                    <Clock size={15} className="text-red" />
                    <span>Arrival: <strong>{formatSlot(timeSlot)}</strong></span>
                  </div>
                  <div className="summary-meta-row">
                    <Users size={15} className="text-red" />
                    <span>Squad: <strong>{players} {players === 1 ? 'Player' : 'Players'}</strong></span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="summary-price-box">
                  {bookingMode === 'combos' ? (
                    <>
                      <div className="summary-fare-row">
                        <span>Combined Base (Per Person):</span>
                        <span>₹{regularBasePerPlayer}</span>
                      </div>

                      {discountRate > 0 && (
                        <div className="summary-fare-row text-emerald font-bold">
                          <span>Combo Discount ({Math.round(discountRate * 100)}% OFF):</span>
                          <span>- ₹{regularBasePerPlayer - netPerPlayer} / player</span>
                        </div>
                      )}

                      <div className="summary-fare-row">
                        <span>Rate Per Player:</span>
                        <span>₹{netPerPlayer} × {players}</span>
                      </div>

                      {discountRate > 0 && totalSavingsRupees > 0 && (
                        <div className="summary-savings-callout">
                          <Zap size={14} />
                          <span>Squad Saves ₹{totalSavingsRupees.toLocaleString('en-IN')} on this combo!</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="summary-fare-row">
                      <span>VIP Pass Rate:</span>
                      <span>₹{(displayPaise / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="summary-total-row">
                    <span>Total Due:</span>
                    <span className="summary-total-amount">
                      {displayPaise ? formatINR(displayPaise) : '—'}
                    </span>
                  </div>
                </div>

                <div className="summary-guarantee-badge">
                  <ShieldCheck size={18} className="text-emerald" />
                  <div>
                    <strong>100% Free Cancellation:</strong> Cancel anytime prior to slot time with zero penalty fees.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* STEP 2: CONFIRMED BOARDING PASS & WRISTBAND TICKET */
          <motion.div 
            className="digital-ticket-wrapper"
            initial={{ opacity: 0, scale: 0.95, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="digital-ticket-view">
              <div className={`ticket-confirmed-badge ${paymentStatus === 'paid' ? 'is-paid' : ''}`}>
                <Check size={16} />
                <span>{paymentStatus === 'paid' ? 'Online Payment Verified — VIP Pass Issued' : 'Arena Slot Reserved Successfully'}</span>
              </div>

              <div className="ticket-reference-block">
                <div className="ticket-reference-label">BOARDING PASS REFERENCE</div>
                <div className="ticket-reference-code">{booking?.reference || 'BSH-7890'}</div>
              </div>

              <h2 className="ticket-experience-title">
                {booking?.itemName || activeItemTitle}
              </h2>
              <p className="ticket-sub-details">
                {players} Players · {date} · {formatSlot(timeSlot)} · Level 4 Arena
              </p>

              {/* Payment or Due status banner */}
              {paymentStatus === 'paid' ? (
                <div className="ticket-paid-row">
                  <span>Payment Complete (Razorpay):</span>
                  <strong>{formatINR(booking?.amountPaise || displayPaise)}</strong>
                </div>
              ) : (
                <div className="ticket-due-row">
                  <span>Pay at Venue Counter:</span>
                  <strong>{formatINR(booking?.amountPaise || displayPaise)}</strong>
                </div>
              )}

              {/* Online payment retry button if reserved unpaid */}
              {paymentStatus !== 'paid' && (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => startPayment()}
                  disabled={paying}
                  className="btn-red ticket-pay-now-btn"
                >
                  {paying ? (
                    <><Loader2 size={16} className="spin" /><span>Opening Razorpay…</span></>
                  ) : (
                    <><CreditCard size={16} /><span>Pay Online Now ({formatINR(booking?.amountPaise || displayPaise)})</span></>
                  )}
                </motion.button>
              )}

              {/* Share with Squad Actions */}
              <div className="ticket-action-row">
                <motion.a
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-emerald ticket-whatsapp-btn"
                >
                  <Share2 size={16} />
                  <span>Share Pass on WhatsApp</span>
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={onBackToHome}
                  className="btn-secondary"
                >
                  <span>Return to Home</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
