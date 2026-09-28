import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Check, ArrowRight, Share2, Loader2, AlertCircle, CreditCard, MessageCircle, Download, CheckCircle2, Copy } from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';
import { CUSTOM_PASS_ID, computeAmountPaise, resolveItem } from '../data/pricing';
import { createBooking, createOrder, verifyPayment, openRazorpayCheckout } from '../lib/api';
import { todayIST, formatINR, formatSlot } from '../lib/format';
import { shareTicketOnWhatsApp, downloadTicketImage, getTicketPreviewDataUrl } from '../lib/ticketImage';

const SLOTS = [
  { value: '12:00', label: '12:00 PM (Afternoon) — Available' },
  { value: '15:00', label: '03:00 PM (Matinee) — Available' },
  { value: '18:00', label: '06:00 PM (Prime Evening) — ⚡ Fast Filling' },
  { value: '20:00', label: '08:00 PM (Night Battle) — 🔥 Only 2 Slots Left' },
  { value: '21:30', label: '09:30 PM (Late Session) — Available' },
];

export const QuickBookingModal = ({ initialItem, onClose }) => {
  const [step, setStep] = useState(1);

  // A custom bundle arrives fully composed from the pass builder, so there is
  // nothing to switch between — the type switcher is replaced by a summary.
  const isCustom = initialItem?.id === CUSTOM_PASS_ID;
  const selectedGameIds = initialItem?.selectedGameIds || [];

  const [selectedType, setSelectedType] = useState(() => {
    if (!initialItem || isCustom) return 'single';
    if (initialItem.passCode || initialItem.badge) return 'pass';
    return 'single';
  });

  const [selectedId, setSelectedId] = useState(() => initialItem?.id || GAMES[0].id);

  const [date, setDate] = useState(() => initialItem?.preferredDate || todayIST());
  const [timeSlot, setTimeSlot] = useState(() => initialItem?.preferredSlot || '18:00');
  const [players, setPlayers] = useState(() => initialItem?.players || 2);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);

  // Set once POST /api/bookings succeeds. The reference and amount both come
  // from the server — nothing here is generated in the browser.
  const [booking, setBooking] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  // Both submit buttons are type="submit" so native validation runs for each.
  // The ref is read synchronously in onSubmit (click fires first); the state
  // mirror exists only so the right button can render its spinner.
  const intentRef = useRef('reserve');
  const [pendingIntent, setPendingIntent] = useState('reserve');

  const resolved = resolveItem(selectedId);
  const previewPaise = computeAmountPaise({
    itemId: selectedId,
    players,
    selectedGameIds: isCustom ? selectedGameIds : [],
  });

  // Once the server has spoken, its number wins — the preview is only an estimate.
  const displayPaise = booking ? booking.amountPaise : previewPaise;
  const itemName = booking?.itemName || resolved?.title || resolved?.name || initialItem?.name;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || paying) return;

    const payOnline = intentRef.current === 'pay';
    intentRef.current = 'reserve'; // Enter-to-submit defaults to the free option

    setError(null);
    setFieldErrors([]);
    setPendingIntent(payOnline ? 'pay' : 'reserve');
    setSubmitting(true);

    let created;
    try {
      created = await createBooking({
        itemId: selectedId,
        players,
        selectedGameIds: isCustom ? selectedGameIds : undefined,
        date,
        timeSlot,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
      });
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

    if (payOnline) startPayment(created);
  }

  async function startPayment(target) {
    const active = target || booking;
    if (!active || paying) return;

    setError(null);
    setPaying(true);

    // Tracked separately from the booking: if Razorpay hands back a payment id
    // and *then* verification fails, the customer has been charged and must not
    // be told "nothing was taken".
    let paymentId = null;

    try {
      const order = await createOrder(active.bookingId);
      if (!order.keyId) {
        throw new Error('Online payment is not configured on the server.');
      }

      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        name: 'Battleship Arena',
        description: active.itemName || 'Arena booking',
        prefill: { name: guestName.trim(), contact: guestPhone.trim() },
        notes: { reference: active.reference },
      });

      paymentId = result.razorpay_payment_id;

      const verified = await verifyPayment({
        bookingId: active.bookingId,
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });

      setPaymentStatus(verified.paymentStatus || 'paid');
      setError(null);
    } catch (err) {
      // Payment is optional — the booking already exists on the server in every
      // one of these branches. The message must say so, or people will rebook.
      if (err.status === 409 && err.body?.paymentStatus === 'paid') {
        // The server reconciled against Razorpay and found this order already
        // settled — the callback just never reached us. Good news, not an error.
        setPaymentStatus('paid');
      } else if (paymentId) {
        setError(
          `Your payment went through (ID ${paymentId}) but we could not confirm it automatically. ` +
          `Show this ID at reception — your slot is held.`
        );
      } else if (err.code === 'DISMISSED') {
        setError('Payment cancelled — no money was taken. Your slot is still held.');
      } else if (err.code === 'FAILED') {
        setError(`Payment failed: ${err.message} No money was taken, and your slot is still held.`);
      } else {
        setError(`${err.message} Your slot is still held — you can also pay at reception.`);
      }
    } finally {
      setPaying(false);
    }
  }

  // Active Ticket Data for BookMyShow Boarding Pass & WhatsApp Image
  const activeTicketData = useMemo(() => {
    return {
      reference: booking?.reference || 'BSH-7890',
      itemName: itemName || 'Battleship Arena Experience',
      date: date,
      timeSlot: formatSlot(timeSlot),
      players: players,
      guestName: guestName.trim() || 'Arena Challenger',
      amount: formatINR(booking?.amountPaise || displayPaise),
      isPaid: paymentStatus === 'paid',
    };
  }, [booking, itemName, date, timeSlot, players, guestName, displayPaise, paymentStatus]);

  // BookMyShow Ticket Preview Generator
  const [ticketPreviewUrl, setTicketPreviewUrl] = useState(null);
  const [sharingTicket, setSharingTicket] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [shareToast, setShareToast] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (step === 2) {
      let isMounted = true;
      getTicketPreviewDataUrl(activeTicketData)
        .then((url) => {
          if (isMounted) setTicketPreviewUrl(url);
        })
        .catch(console.error);
      return () => { isMounted = false; };
    }
  }, [step, activeTicketData]);

  // WhatsApp Image Sharing (BookMyShow style)
  async function handleShareWhatsApp() {
    setSharingTicket(true);
    setShareToast(null);
    try {
      const res = await shareTicketOnWhatsApp(activeTicketData);
      if (res.method === 'download_and_whatsapp') {
        setShareToast('Ticket pass PNG downloaded! Please attach it to your WhatsApp chat.');
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
      setShareToast('VIP Boarding Pass PNG downloaded!');
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

  // Instant Payment Simulator (Bypass expired key to test VIP Pass & WhatsApp Image)
  async function simulateInstantPayment(target) {
    const active = target || booking;
    if (!active) return;
    setPaying(true);
    setError(null);
    try {
      const verified = await verifyPayment({
        bookingId: active.bookingId || active.id,
        razorpay_order_id: active.orderId || `order_sandbox_${Date.now()}`,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_verified_signature',
      });
      setPaymentStatus(verified?.paymentStatus || 'paid');
      setStep(2);
      setError(null);
    } catch (e) {
      setError('Payment simulation failed: ' + e.message);
    } finally {
      setPaying(false);
    }
  }

  const whatsappHref = booking
    ? `https://wa.me/?text=${encodeURIComponent(
        `🎮 *BATTLESHIP ARENA — SQUAD INVITATION*\n\n` +
        `⚔️ *Experience:* ${itemName}\n` +
        `📅 *Date:* ${date}\n` +
        `⏰ *Arrival Slot:* ${formatSlot(timeSlot)}\n` +
        `👥 *Squad:* ${players} Players\n` +
        `🎟️ *Pass Ref:* #${booking.reference}\n` +
        `📍 *Venue:* Battleship Arena, Level 4, Hyderabad\n\n` +
        `Be ready for combat! Wristband check-in opens 15 mins prior.`
      )}`
    : '#';

  return (
    <div className="booking-page" onClick={onClose}>
      <div className="booking-container" onClick={(e) => e.stopPropagation()}>
        <header className="booking-header">
          <div>
            <div className="ticket-code-badge" style={{ marginBottom: '0.2rem' }}>
              {step === 1 ? 'FAST-TRACK CHECKOUT' : paymentStatus === 'paid' ? 'PAID' : 'SLOT RESERVED'}
            </div>
            <h3 className="booking-title">
              {step === 1 ? 'Reserve Arena Slots' : 'Digital Arena Pass'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="booking-close-btn" aria-label="Close booking">
            <X size={16} />
          </button>
        </header>

        <div className="booking-content">
          {step === 1 ? (
            <>
              <div className="booking-main">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Type Switcher — hidden for custom bundles, which are already composed */}
                  {isCustom ? (
                    <div className="booking-bundle-summary">
                      <div className="ticket-code-badge">CUSTOM BUNDLE</div>
                      <div style={{ fontWeight: 700, marginTop: '0.35rem' }}>{initialItem.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {selectedGameIds.length} arenas bundled · discount applied
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.3rem', borderRadius: 'var(--radius-pill)' }}>
                      <button
                        type="button"
                        onClick={() => { setSelectedType('single'); setSelectedId(GAMES[0].id); }}
                        className={`filter-chip ${selectedType === 'single' ? 'active' : ''}`}
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        Single Arena
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedType('pass'); setSelectedId(PASSES[0].id); }}
                        className={`filter-chip ${selectedType === 'pass' ? 'active' : ''}`}
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        Squad Passes
                      </button>
                    </div>
                  )}

                  {!isCustom && selectedType === 'single' && (
                    <div className="form-group">
                      <label className="form-label">Select Attraction</label>
                      <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="form-select"
                      >
                        {GAMES.map(g => (
                          <option key={g.id} value={g.id}>{g.title} — ₹{g.price} / person</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isCustom && selectedType === 'pass' && (
                    <div className="form-group">
                      <label className="form-label">Select Squad Pass</label>
                      <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="form-select"
                      >
                        {PASSES.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.accessCount}) — ₹{p.price} / pass</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="date-slot-grid">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        value={date}
                        min={todayIST()}
                        onChange={(e) => setDate(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Arrival Slot</label>
                      <select
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

                  <div className="form-group">
                    <label className="form-label">Total Players ({players} Players)</label>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={players}
                      onChange={(e) => setPlayers(parseInt(e.target.value, 10))}
                      className="slider-input"
                    />
                  </div>

                  <div className="contact-input-grid">
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input
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
                      <label className="form-label">WhatsApp Phone</label>
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="form-input"
                        inputMode="numeric"
                        required
                      />
                    </div>
                  </div>

                  {/* Price Summary Strip — server-computed, shown before paying */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Due:</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                        {displayPaise ? formatINR(displayPaise) : '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {isCustom
                        ? <>{selectedGameIds.length} arenas bundled<br />Discount applied</>
                        : resolved?.pricingUnit === 'pass'
                          ? <>Priced per pass<br />Not per player</>
                          : <>₹{resolved?.price ?? 0} × {players} players</>}
                    </div>
                  </div>

                  {error && (
                    <div className="booking-error-banner" role="alert">
                      <AlertCircle size={16} />
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <button
                      type="submit"
                      onClick={() => { intentRef.current = 'pay'; }}
                      disabled={submitting || paying}
                      className="btn-red"
                      style={{ width: '100%', padding: '0.85rem' }}
                    >
                      {submitting && pendingIntent === 'pay' ? (
                        <><Loader2 size={16} className="spin" /><span>Creating booking…</span></>
                      ) : (
                        <><CreditCard size={16} /><span>Reserve &amp; Pay {displayPaise ? formatINR(displayPaise) : ''} Online</span></>
                      )}
                    </button>

                    <button
                      type="submit"
                      onClick={() => { intentRef.current = 'reserve'; }}
                      disabled={submitting || paying}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.85rem' }}
                    >
                      {submitting && pendingIntent === 'reserve' ? (
                        <><Loader2 size={16} className="spin" /><span>Reserving…</span></>
                      ) : (
                        <><span>Reserve Slot — Pay at Venue</span><ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                    Paying online is optional. Reservations are held either way, with zero cancellation fees.
                  </p>
                </form>
              </div>

              <aside className="suggestions-sidebar">
                <h4 className="suggestions-title">Add Another Arena</h4>
                <div className="suggestions-list">
                  {GAMES.filter(g => g.id !== selectedId).map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => { setSelectedType('single'); setSelectedId(g.id); }}
                      className="suggestion-item suggestion-item-btn"
                    >
                      <img src={g.image} alt={g.title} className="suggestion-img" />
                      <div className="suggestion-info">
                        <span className="suggestion-title">{g.title}</span>
                        <span className="suggestion-price">₹{g.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            </>
          ) : (
          ) : (
            <div className="digital-ticket-view bms-ticket-container" style={{ padding: '1.5rem 1rem' }}>
              <div className={`bms-ticket-confirmed-banner ${paymentStatus === 'paid' ? '' : 'is-unpaid'}`}>
                <Check size={14} />
                <span>{paymentStatus === 'paid' ? 'Payment Verified (Razorpay) — VIP Pass Issued' : 'Arena Slot Reserved — Payment Due'}</span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0' }}>
                {itemName}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {players} Players • {date} • {formatSlot(timeSlot)} • Level 4 Arena
              </div>

              {/* BookMyShow Rendered Ticket Image Preview */}
              <div className="bms-ticket-preview-wrapper" style={{ margin: '0.75rem 0 1.25rem' }}>
                {ticketPreviewUrl ? (
                  <img 
                    src={ticketPreviewUrl} 
                    alt={`Battleship VIP Pass #${activeTicketData.reference}`}
                    className="bms-ticket-preview-img animate-fade-in"
                  />
                ) : (
                  <div className="bms-ticket-loading-skeleton" style={{ padding: '2rem 1rem' }}>
                    <Loader2 size={28} className="spin text-red" />
                    <span>Rendering Official Boarding Pass…</span>
                  </div>
                )}
              </div>

              {/* Share Toast Banner */}
              {shareToast && (
                <div className="ticket-toast-banner" style={{ margin: '0.5rem 0 1rem' }}>
                  <CheckCircle2 size={15} />
                  <span>{shareToast}</span>
                </div>
              )}

              {error && (
                <div className="booking-error-banner" role="alert" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                  <AlertCircle size={16} />
                  <div>{error}</div>
                </div>
              )}

              {paymentStatus !== 'paid' && (
                <button
                  type="button"
                  onClick={() => startPayment()}
                  disabled={paying || !booking}
                  className="btn-red"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  {paying ? (
                    <><Loader2 size={16} className="spin" /><span>Opening secure checkout…</span></>
                  ) : (
                    <><CreditCard size={16} /><span>Pay {formatINR(booking?.amountPaise)} Online via Razorpay</span></>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => simulateInstantPayment()}
                  disabled={paying}
                  style={{
                    width: '100%',
                    marginBottom: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: 'var(--accent-emerald)',
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <Check size={15} />
                  <span>Instant Complete Payment (VIP Simulator — Bypass Expired Key)</span>
                </button>
              )}

              {/* Action Buttons */}
              <div className="bms-actions-grid" style={{ gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  disabled={sharingTicket}
                  className="btn-whatsapp-bms"
                >
                  {sharingTicket ? (
                    <><Loader2 size={18} className="spin" /><span>Preparing WhatsApp Pass…</span></>
                  ) : (
                    <><MessageCircle size={18} /><span>Share Ticket on WhatsApp (with Image)</span></>
                  )}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    disabled={downloadingTicket}
                    className="btn-download-bms"
                  >
                    {downloadingTicket ? (
                      <><Loader2 size={14} className="spin" /><span>Saving…</span></>
                    ) : (
                      <><Download size={14} /><span>Download Pass</span></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="btn-download-bms"
                  >
                    {copiedRef ? (
                      <><Check size={14} className="text-emerald" /><span className="text-emerald">Copied!</span></>
                    ) : (
                      <><Copy size={14} /><span>Copy Ref</span></>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
