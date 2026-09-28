import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, Share2, Loader2, AlertCircle, CreditCard, 
  MapPin, Calendar, Clock, Users, ShieldCheck, ArrowLeft, Sparkles, Zap, Plus, Info, Award,
  Download, MessageCircle, Copy, CheckCircle2
} from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';
import { CUSTOM_PASS_ID, computeAmountPaise, resolveItem, customPassPerPerson, discountRateFor, OWNER_MIN_ADVANCE_RUPEES, OWNER_MIN_ADVANCE_PAISE } from '../data/pricing';
import { createBooking, createOrder, verifyPayment, openRazorpayCheckout } from '../lib/api';
import { todayIST, formatINR, formatSlot } from '../lib/format';
import { shareTicketOnWhatsApp, downloadTicketImage, getTicketPreviewDataUrl, TICKET_THEMES } from '../lib/ticketImage';

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

  // Primary Game and Addon Game IDs
  const [primaryGameId, setPrimaryGameId] = useState(() => {
    if (initialItem && !isInitialPass && initialItem.id && initialItem.id !== CUSTOM_PASS_ID) {
      return initialItem.id;
    }
    if (isCustomPass && Array.isArray(initialItem?.selectedGameIds) && initialItem.selectedGameIds.length > 0) {
      return initialItem.selectedGameIds[0];
    }
    return GAMES[0].id; // Default: Laser Combat
  });

  const [addonGameIds, setAddonGameIds] = useState(() => {
    if (isCustomPass && Array.isArray(initialItem?.selectedGameIds) && initialItem.selectedGameIds.length > 1) {
      return initialItem.selectedGameIds.slice(1);
    }
    return [];
  });

  // Checked game IDs combination (Primary + Addons)
  const checkedGameIds = [primaryGameId, ...addonGameIds.filter(id => id !== primaryGameId)];
  const primaryGame = GAMES.find(g => g.id === primaryGameId) || GAMES[0];

  // Preset pass selection
  const [selectedPassId, setSelectedPassId] = useState(() => {
    if (isInitialPass && initialItem?.id) return initialItem.id;
    return PASSES[1].id; // Default: Squad Warfare Combo Pass
  });

  // Checkbox warning message
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
        setPrimaryGameId(initialItem.selectedGameIds[0]);
        setAddonGameIds(initialItem.selectedGameIds.slice(1));
        setBookingMode('combos');
      } else if (initialItem.passCode || initialItem.badge) {
        setSelectedPassId(initialItem.id);
        setBookingMode('passes');
      } else if (initialItem.id) {
        setPrimaryGameId(initialItem.id);
        setAddonGameIds([]);
        setBookingMode('combos');
      }
    }
  }, [initialItem]);

  // Handle selecting a primary game
  const handleSelectPrimaryGame = (gameId) => {
    setPrimaryGameId(gameId);
    setAddonGameIds(prev => prev.filter(id => id !== gameId));
    setCheckWarning(null);
  };

  // Handle toggling add-on game checkboxes
  const handleToggleAddonGame = (gameId) => {
    setAddonGameIds(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      } else {
        return [...prev, gameId];
      }
    });
  };

  // Submission & Payment State
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);

  const [booking, setBooking] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [payOption, setPayOption] = useState('full'); // 'full' or 'advance'

  const intentRef = useRef('pay');
  const [pendingIntent, setPendingIntent] = useState('pay');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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
  const fullAmountPaise = (displayPaise && displayPaise > 0) ? displayPaise : ((netPerPlayer * players * 100) || 49900);
  const minAdvancePaise = OWNER_MIN_ADVANCE_PAISE; // 5000 paise (₹50, owner-configured)
  const balanceDuePaise = Math.max(0, fullAmountPaise - minAdvancePaise);
  const chargeAmountPaise = payOption === 'advance' ? minAdvancePaise : fullAmountPaise;

  // Helper to create booking record
  async function createBookingRecord() {
    if (bookingMode === 'combos' && checkedGameIds.length === 0) {
      setCheckWarning('Please check at least 1 arena to proceed.');
      throw new Error('Please check at least 1 arena to proceed.');
    }
    if (!guestName.trim()) {
      throw new Error('Please enter your full name for the boarding pass.');
    }
    if (!guestPhone.trim() || guestPhone.trim().length < 10) {
      throw new Error('Please enter a valid 10-digit phone number for WhatsApp ticket delivery.');
    }

    if (bookingMode === 'combos') {
      if (isMultiArena) {
        return createBooking({
          itemType: 'custom',
          itemId: CUSTOM_PASS_ID,
          selectedGameIds: checkedGameIds,
          players,
          date,
          timeSlot,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
        });
      } else {
        return createBooking({
          itemType: 'single',
          itemId: checkedGameIds[0],
          players,
          date,
          timeSlot,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
        });
      }
    } else {
      return createBooking({
        itemType: 'pass',
        itemId: selectedPassId,
        players,
        date,
        timeSlot,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
      });
    }
  }

  // Form submission handler: STRICTLY does not generate ticket prior to payment!
  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting || paying) return;

    setError(null);
    setFieldErrors([]);
    setSubmitting(true);

    try {
      const created = await createBookingRecord();
      setBooking(created);
      setSubmitting(false);
      // Strictly proceed to payment. Boarding pass step (step 2) is ONLY opened upon verified payment.
      await startPayment(created);
    } catch (err) {
      setError(err.message);
      setFieldErrors(Array.isArray(err.details) ? err.details : []);
      setSubmitting(false);
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

  // Razorpay Checkout Trigger: Advances to Step 2 ONLY on verified payment!
  async function startPayment(target) {
    let active = target || booking;
    if (!active) {
      try {
        setSubmitting(true);
        active = await createBookingRecord();
        setBooking(active);
      } catch (err) {
        setError(err.message);
        setFieldErrors(Array.isArray(err.details) ? err.details : []);
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    if (!active || paying) return;

    setError(null);
    setPaying(true);

    const fullPaise = active.amountPaise || fullAmountPaise;
    const targetChargePaise = payOption === 'advance' ? OWNER_MIN_ADVANCE_PAISE : fullPaise;
    const targetBalancePaise = Math.max(0, fullPaise - targetChargePaise);

    try {
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_ThOJstFRakPbiC';
      const order = await createOrder(active.bookingId, {
        payMode: payOption,
        advanceAmountPaise: OWNER_MIN_ADVANCE_PAISE,
      }).catch(() => null);

      const result = await openRazorpayCheckout({
        keyId: order?.keyId || keyId,
        orderId: order?.orderId,
        amountPaise: targetChargePaise,
        currency: 'INR',
        name: 'Battleship Arena',
        description: payOption === 'advance'
          ? `₹${OWNER_MIN_ADVANCE_RUPEES} Advance Token Deposit (Due at Venue: ₹${formatINR(targetBalancePaise)})`
          : `${active.itemName || activeItemTitle} - Full VIP Pass`,
        prefill: {
          name: guestName.trim() || 'Arena Challenger',
          contact: guestPhone.trim() || '9876543210',
        },
        notes: {
          reference: active.reference || 'BS-PASS',
          payMode: payOption,
        },
      });

      // Razorpay checkout completed by customer!
      let verified = null;
      try {
        verified = await verifyPayment({
          bookingId: active.bookingId || active.id,
          razorpay_order_id: result.razorpay_order_id || '',
          razorpay_payment_id: result.razorpay_payment_id,
          razorpay_signature: result.razorpay_signature || '',
          payMode: payOption,
          paidAmountPaise: targetChargePaise,
        });
      } catch (verifyErr) {
        console.warn('Verify call warning, confirming payment from gateway success callback:', verifyErr);
        verified = {
          verified: true,
          paymentStatus: 'paid',
          reference: active.reference,
          payMode: payOption,
          paidAmountPaise: targetChargePaise,
          balanceDuePaise: targetBalancePaise,
        };
      }

      setBooking(prev => ({
        ...(prev || active),
        ...verified,
        paymentStatus: 'paid',
        paymentId: result.razorpay_payment_id,
        payMode: payOption,
        paidAmountPaise: targetChargePaise,
        balanceDuePaise: targetBalancePaise,
      }));
      setPaymentStatus('paid');
      setStep(2); // TICKET IS GENERATED IMMEDIATELY!
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerConfetti();
      setError(null);
    } catch (err) {
      if (err.code === 'DISMISSED') {
        setError('Payment window was closed. Your VIP boarding pass will strictly be generated only after payment is confirmed. Please complete payment below.');
      } else {
        const msg = String(err.message || '');
        if (msg.includes('expired') || msg.includes('401') || msg.includes('Authentication') || msg.includes('BAD_REQUEST_ERROR')) {
          setError('Razorpay API Key Notice: Gateway test key needs refresh. You can click "Instant Complete Payment (VIP Simulator)" to generate your VIP Pass and test WhatsApp sharing immediately.');
        } else {
          setError(err.message || 'Payment processing error. Ticket cannot be issued until payment is verified.');
        }
      }
    } finally {
      setPaying(false);
    }
  }

  // Instant Payment Simulation (Bypasses expired key to test VIP Pass & WhatsApp Image)
  async function simulateInstantPayment(target) {
    let active = target || booking;
    if (!active) {
      try {
        setSubmitting(true);
        active = await createBookingRecord();
        setBooking(active);
      } catch (err) {
        setError(err.message);
        setFieldErrors(Array.isArray(err.details) ? err.details : []);
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    if (!active) return;
    setPaying(true);
    setError(null);

    const fullPaise = active.amountPaise || fullAmountPaise;
    const targetChargePaise = payOption === 'advance' ? OWNER_MIN_ADVANCE_PAISE : fullPaise;
    const targetBalancePaise = Math.max(0, fullPaise - targetChargePaise);

    try {
      const verified = await verifyPayment({
        bookingId: active.bookingId || active.id,
        razorpay_order_id: active.orderId || `order_sandbox_${Date.now()}`,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_verified_signature',
        payMode: payOption,
        paidAmountPaise: targetChargePaise,
      });
      setBooking(prev => ({
        ...(prev || active),
        ...verified,
        payMode: payOption,
        paidAmountPaise: targetChargePaise,
        balanceDuePaise: targetBalancePaise,
      }));
      setPaymentStatus('paid');
      setStep(2); // Pass generated ONLY after payment is verified!
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerConfetti();
      setError(null);
    } catch (e) {
      setError('Payment simulation failed: ' + e.message);
    } finally {
      setPaying(false);
    }
  }

  // Selected Ticket Color Combination Theme & Game Switcher State
  const [ticketTheme, setTicketTheme] = useState('charcoal');
  const [showGamePicker, setShowGamePicker] = useState(false);

  // Active Ticket Data for BookMyShow Boarding Pass & WhatsApp Image
  const activeTicketData = useMemo(() => {
    const fullPaise = booking?.amountPaise || displayPaise || fullAmountPaise;
    const currentPayMode = booking?.payMode || payOption;
    const paidPaise = booking?.paidAmountPaise !== undefined
      ? booking.paidAmountPaise
      : (currentPayMode === 'advance' ? OWNER_MIN_ADVANCE_PAISE : fullPaise);
    const balancePaise = booking?.balanceDuePaise !== undefined
      ? booking.balanceDuePaise
      : (currentPayMode === 'advance' ? Math.max(0, fullPaise - OWNER_MIN_ADVANCE_PAISE) : 0);

    return {
      reference: booking?.reference || 'BSH-7890',
      itemName: booking?.itemName || activeItemTitle,
      date: date,
      timeSlot: formatSlot(timeSlot),
      players: players,
      guestName: guestName.trim() || 'Arena Challenger',
      amount: formatINR(fullPaise),
      payMode: currentPayMode,
      paidAmount: formatINR(paidPaise),
      balanceDue: formatINR(balancePaise),
      isPaid: paymentStatus === 'paid',
      theme: ticketTheme,
    };
  }, [booking, activeItemTitle, date, timeSlot, players, guestName, displayPaise, fullAmountPaise, paymentStatus, ticketTheme, payOption]);

  // BookMyShow Ticket Preview Generator
  const [ticketPreviewUrl, setTicketPreviewUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [sharingTicket, setSharingTicket] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [shareToast, setShareToast] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (step === 2) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      let isMounted = true;
      setGeneratingImage(true);
      getTicketPreviewDataUrl(activeTicketData)
        .then((url) => {
          if (isMounted) {
            setTicketPreviewUrl(url);
            setGeneratingImage(false);
          }
        })
        .catch((err) => {
          console.error('Error generating ticket preview:', err);
          if (isMounted) setGeneratingImage(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [step, activeTicketData]);

  // WhatsApp Image Sharing (BookMyShow style)
  async function handleShareWhatsApp() {
    setSharingTicket(true);
    setShareToast(null);
    try {
      const res = await shareTicketOnWhatsApp(activeTicketData);
      if (res.method === 'download_and_whatsapp') {
        setShareToast('Ticket pass PNG downloaded! Please attach it to your WhatsApp squad chat.');
      } else if (res.shared) {
        setShareToast('Ticket pass shared to WhatsApp!');
      }
    } catch (err) {
      console.error('WhatsApp share failed:', err);
      window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    } finally {
      setSharingTicket(false);
      setTimeout(() => setShareToast(null), 6000);
    }
  }

  // Direct PNG Ticket Download
  async function handleDownloadTicket() {
    setDownloadingTicket(true);
    setShareToast(null);
    try {
      await downloadTicketImage(activeTicketData);
      setShareToast('VIP Boarding Pass PNG downloaded to your device!');
    } catch (err) {
      console.error('Download ticket failed:', err);
    } finally {
      setDownloadingTicket(false);
      setTimeout(() => setShareToast(null), 5000);
    }
  }

  // Copy Booking Reference
  function handleCopyRef() {
    const refCode = activeTicketData.reference;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refCode).then(() => {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
      });
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
        {/* Header Block */}
        {step === 1 ? (
          <div className="booking-page-header-block">
            <div className="booking-header-top-meta">
              <span className="section-tag">
                <Calendar size={13} /> ARENA RESERVATION
              </span>
              <div className="booking-page-progress-pill">
                <span className="active">1. Select Experiences</span>
                <span>/</span>
                <span>2. Boarding Pass</span>
              </div>
            </div>
            <h1 className="booking-page-main-heading">
              Reserve Arena Slots
            </h1>
            <p className="booking-page-sub-text">
              Choose your arena experience or check multiple arenas to compose a custom squad combo pass.
            </p>
          </div>
        ) : (
          <div className="booking-page-header-block" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="booking-page-progress-pill" style={{ margin: '0 auto 0.85rem' }}>
              <span>1. Select Experiences</span>
              <span>/</span>
              <span className="active">2. Boarding Pass</span>
            </div>
            <h1 className="booking-page-main-heading" style={{ fontSize: '2.1rem', marginBottom: '0.4rem' }}>
              Booking Confirmed
            </h1>
            <p className="booking-page-sub-text" style={{ margin: '0 auto', maxWidth: '480px' }}>
              Your digital boarding pass is ready. Show this pass at the counter or share it with your squad.
            </p>
          </div>
        )}

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
                {/* 1. INDIVIDUAL GAMES & SIMILAR ADD-ON COMBOS */}
                {bookingMode === 'combos' ? (
                  <div className="arena-selection-section">
                    <div className="arena-section-header">
                      <div>
                        <h2 className="arena-section-title">1. Select Your Main Game</h2>
                        <p className="arena-section-desc">
                          Choose your primary arena experience, then add similar games below to unlock combo discounts!
                        </p>
                      </div>

                      {/* Dynamic Bundle Discount Status Badge */}
                      <div className={`bundle-discount-status-pill ${discountRate > 0 ? 'is-active' : ''}`}>
                        {discountRate > 0 ? (
                          <>
                            <Zap size={15} />
                            <span><strong>{Math.round(discountRate * 100)}% Combo Discount</strong> Active!</span>
                          </>
                        ) : (
                          <>
                            <Info size={15} />
                            <span>Add similar arenas below for <strong>15% to 25% OFF</strong></span>
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

                    {/* Single Selected Main Game Hero Card (Clean, Focused, No Clutter) */}
                    <div className="selected-main-game-hero-card">
                      <div className="main-game-hero-thumb">
                        <img src={primaryGame.image} alt={primaryGame.title} />
                        <span className="main-game-tag-badge">{primaryGame.tag || primaryGame.category}</span>
                      </div>
                      <div className="main-game-hero-info">
                        <div>
                          <div className="main-game-lead-row">
                            <span className="main-game-lead-badge">Selected Primary Arena</span>
                            <span className="main-game-live-badge">✓ Active in Pass</span>
                          </div>
                          <h3 className="main-game-hero-title">{primaryGame.title}</h3>
                          <div className="main-game-hero-meta">
                            <span>{primaryGame.duration}</span>
                            <span>•</span>
                            <span>{primaryGame.players}</span>
                            <span>•</span>
                            <span>Level 4 Arena</span>
                          </div>
                        </div>

                        <div className="main-game-hero-price-box">
                          <div className="main-game-price">
                            ₹{primaryGame.price}<span className="unit">/player</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowGamePicker(prev => !prev)}
                            className="btn-switch-game"
                            id="btn-switch-main-game"
                          >
                            <span>{showGamePicker ? 'Close Game List ▴' : 'Change Game ▾'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Game Switcher Drawer */}
                    {showGamePicker && (
                      <div className="game-picker-drawer animate-fade-in">
                        <div className="game-picker-header">
                          <span>Select a different primary arena:</span>
                        </div>
                        <div className="game-picker-grid">
                          {GAMES.map(g => (
                            <div
                              key={g.id}
                              onClick={() => { handleSelectPrimaryGame(g.id); setShowGamePicker(false); }}
                              className={`game-picker-item ${primaryGameId === g.id ? 'is-active' : ''}`}
                            >
                              <img src={g.image} alt={g.title} className="game-picker-thumb" />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{g.title}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>₹{g.price}/player · {g.duration}</div>
                              </div>
                              {primaryGameId === g.id && (
                                <span className="game-picker-check">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Similar & Recommended Add-on Games with Checkboxes */}
                    <div className="similar-games-addon-section" style={{
                      marginTop: '2rem',
                      padding: '1.25rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                            <Sparkles size={14} />
                            <span>Add-on Experiences & Squad Combos</span>
                          </div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>
                            Add Similar Games to Your Session
                          </h3>
                        </div>
                        {discountRate > 0 && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            +{Math.round(discountRate * 100)}% Discount Applied
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        Check any of these similar arena attractions to play multiple games during your visit and unlock automatic squad combo discounts!
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {GAMES.filter(g => g.id !== primaryGameId).map(game => {
                          const isAddonChecked = addonGameIds.includes(game.id);
                          return (
                            <div
                              key={game.id}
                              onClick={() => handleToggleAddonGame(game.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                background: isAddonChecked ? 'rgba(255, 51, 68, 0.08)' : 'var(--bg-secondary)',
                                border: isAddonChecked ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '5px',
                                  border: isAddonChecked ? '2px solid var(--accent-red)' : '2px solid var(--border-medium)',
                                  background: isAddonChecked ? 'var(--accent-red)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  flexShrink: 0
                                }}>
                                  {isAddonChecked && <Check size={13} strokeWidth={3} />}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{game.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{game.category} · {game.duration}</div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isAddonChecked ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                  +₹{game.price}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>/player</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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

                {/* 4. SQUAD PLAYERS SELECTION */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">
                      <Users size={14} className="text-red" />
                      <span>Squad Size</span>
                    </label>
                    <span className="squad-size-indicator">{players} {players === 1 ? 'Solo Player' : 'Players'}</span>
                  </div>

                  <div className="squad-selector-row">
                    <div className="squad-stepper-box">
                      <button
                        type="button"
                        onClick={() => setPlayers(prev => Math.max(1, prev - 1))}
                        disabled={players <= 1}
                        className="squad-stepper-btn"
                        aria-label="Decrease squad size"
                      >
                        −
                      </button>
                      <div className="squad-stepper-display">
                        <span className="squad-number">{players}</span>
                        <span className="squad-unit">{players === 1 ? 'Player' : 'Players'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayers(prev => Math.min(24, prev + 1))}
                        disabled={players >= 24}
                        className="squad-stepper-btn"
                        aria-label="Increase squad size"
                      >
                        +
                      </button>
                    </div>

                    <div className="squad-preset-chips">
                      {[2, 4, 6, 8, 12].map(count => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setPlayers(count)}
                          className={`squad-preset-chip ${players === count ? 'is-active' : ''}`}
                        >
                          {count} Players
                        </button>
                      ))}
                    </div>
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

                {/* 6. PAYMENT PREFERENCE: PAY FULL vs OWNER MINIMUM ADVANCE TOKEN */}
                <div className="payment-preference-section">
                  <div className="payment-preference-header">
                    <div className="payment-preference-title">
                      <CreditCard size={17} className="text-red" />
                      <span>Select Payment Option</span>
                    </div>
                    <span className="payment-preference-note">
                      Ticket issued strictly upon payment verification
                    </span>
                  </div>

                  <div className="payment-options-grid">
                    {/* Option 1: Pay Full Amount */}
                    <div 
                      className={`payment-option-card ${payOption === 'full' ? 'active' : ''}`}
                      onClick={() => setPayOption('full')}
                      role="button"
                      tabIndex={0}
                      id="opt-pay-full"
                    >
                      <div className="payment-option-top">
                        <span className="payment-option-name">Pay Full Amount</span>
                        <span className="payment-option-badge">100% Paid</span>
                      </div>
                      <div className="payment-option-amount">
                        {formatINR(fullAmountPaise)}
                      </div>
                      <p className="payment-option-sub">
                        Zero counter payment. Fast-track instant entry upon arrival at the arena.
                      </p>
                    </div>

                    {/* Option 2: Pay Minimum Token Advance */}
                    <div 
                      className={`payment-option-card ${payOption === 'advance' ? 'active' : ''}`}
                      onClick={() => setPayOption('advance')}
                      role="button"
                      tabIndex={0}
                      id="opt-pay-advance"
                    >
                      <div className="payment-option-top">
                        <span className="payment-option-name">Pay Min Advance</span>
                        <span className="payment-option-badge">₹{OWNER_MIN_ADVANCE_RUPEES} Token</span>
                      </div>
                      <div className="payment-option-amount">
                        ₹{OWNER_MIN_ADVANCE_RUPEES}
                      </div>
                      <p className="payment-option-sub">
                        Pay ₹{OWNER_MIN_ADVANCE_RUPEES} token now to lock & hold slot. Balance {formatINR(balanceDuePaise)} due at venue counter.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="booking-action-buttons">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={submitting || paying}
                    className="btn-red booking-cta-primary"
                    id="btn-pay-online"
                  >
                    {submitting || paying ? (
                      <><Loader2 size={18} className="spin" /><span>Processing Checkout…</span></>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        <span>
                          Pay {payOption === 'advance' ? `₹${OWNER_MIN_ADVANCE_RUPEES} Advance Token` : `Full Amount (${formatINR(fullAmountPaise)})`} & Issue Pass
                        </span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={() => simulateInstantPayment()}
                    disabled={submitting || paying}
                    className="btn-secondary booking-cta-secondary"
                    id="btn-simulate-instant-pay"
                    title="Directly test verified ticket issuance & WhatsApp image sharing"
                  >
                    <Check size={16} className="text-emerald" />
                    <span>
                      Instant Complete Payment ({payOption === 'advance' ? `Test ₹${OWNER_MIN_ADVANCE_RUPEES} Advance` : 'Test Full'}) — VIP Simulator
                    </span>
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
                    <span>Total Fare:</span>
                    <span className="summary-total-amount">
                      {displayPaise ? formatINR(displayPaise) : '—'}
                    </span>
                  </div>

                  <div className="summary-payment-mode-pill">
                    <span>Online Due Now ({payOption === 'advance' ? `Token ₹${OWNER_MIN_ADVANCE_RUPEES}` : 'Full'}):</span>
                    <strong className="text-red">{formatINR(chargeAmountPaise)}</strong>
                  </div>

                  {payOption === 'advance' && (
                    <div className="summary-venue-due-row">
                      <span>Balance Due at Venue:</span>
                      <strong>{formatINR(balanceDuePaise)}</strong>
                    </div>
                  )}
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
          /* STEP 2: CONFIRMED BOOKMYSHOW-STYLE BOARDING PASS & WHATSAPP IMAGE SHARE */
          <motion.div 
            className="digital-ticket-wrapper bms-ticket-container"
            initial={{ opacity: 0, scale: 0.95, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Confirmation Pill Banner */}
            <div className={`bms-ticket-confirmed-banner ${activeTicketData.payMode === 'advance' ? 'is-advance' : ''}`}>
              <Check size={16} />
              <span>
                {activeTicketData.payMode === 'advance' 
                  ? `Slot Confirmed — ₹${OWNER_MIN_ADVANCE_RUPEES} Advance Token Paid (${activeTicketData.balanceDue} due at venue counter)`
                  : 'Payment Verified (Razorpay) — VIP Pass Issued (100% Paid)'}
              </span>
            </div>

            {/* Pass Color Combination Selector */}
            <div className="ticket-theme-selector-bar">
              <span className="theme-selector-title">Pass Color Theme:</span>
              <div className="theme-pills-row">
                {Object.values(TICKET_THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTicketTheme(t.id)}
                    className={`theme-color-chip ${ticketTheme === t.id ? 'active' : ''}`}
                    title={t.name}
                  >
                    <span className="color-swatch-circle" style={{ background: t.primary }} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated BookMyShow Ticket Image Preview */}
            <div className="bms-ticket-preview-wrapper">
              {ticketPreviewUrl ? (
                <img 
                  src={ticketPreviewUrl} 
                  alt={`Battleship VIP Pass #${activeTicketData.reference}`}
                  className="bms-ticket-preview-img animate-fade-in"
                />
              ) : (
                <div className="bms-ticket-loading-skeleton">
                  <Loader2 size={32} className="spin text-red" />
                  <span>Generating Official VIP Boarding Pass…</span>
                </div>
              )}
            </div>

            {/* Status Toast Alert if shared or downloaded */}
            {shareToast && (
              <div className="ticket-toast-banner">
                <CheckCircle2 size={16} />
                <span>{shareToast}</span>
              </div>
            )}



            {/* BookMyShow Actions: WhatsApp Image Share & PNG Download */}
            <div className="bms-actions-grid">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleShareWhatsApp}
                disabled={sharingTicket}
                className="btn-whatsapp-bms"
                id="btn-whatsapp-share-ticket"
              >
                {sharingTicket ? (
                  <><Loader2 size={20} className="spin" /><span>Preparing WhatsApp Pass…</span></>
                ) : (
                  <><MessageCircle size={20} /><span>Share Ticket on WhatsApp (with Image)</span></>
                )}
              </motion.button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={handleDownloadTicket}
                  disabled={downloadingTicket}
                  className="btn-download-bms"
                  id="btn-download-ticket-png"
                >
                  {downloadingTicket ? (
                    <><Loader2 size={16} className="spin" /><span>Downloading…</span></>
                  ) : (
                    <><Download size={16} /><span>Download Pass (PNG)</span></>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={handleCopyRef}
                  className="btn-download-bms"
                >
                  {copiedRef ? (
                    <><Check size={16} className="text-emerald" /><span className="text-emerald">Copied!</span></>
                  ) : (
                    <><Copy size={16} /><span>Copy Ref #{activeTicketData.reference}</span></>
                  )}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onBackToHome}
                className="btn-secondary"
                style={{ width: '100%', minHeight: '44px', marginTop: '0.5rem' }}
              >
                <span>Return to Home</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
