import { useState } from 'react';
import { X, Check, Calendar, Users, Clock, ArrowRight, Share2, Ticket } from 'lucide-react';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';

export const QuickBookingModal = ({ initialItem, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(() => {
    if (initialItem) {
      if (initialItem.id === 'custom-pass') return 'custom';
      if (initialItem.passCode || initialItem.badge) return 'pass';
      return 'single';
    }
    return 'single';
  });

  const [selectedId, setSelectedId] = useState(() => {
    return initialItem?.id || GAMES[0].id;
  });

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('18:00');
  const [players, setPlayers] = useState(() => initialItem?.players || 2);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Determine current selected item data
  let currentItem = null;
  let pricePerPerson = 0;
  let totalPrice = 0;

  if (selectedType === 'custom' && initialItem?.id === 'custom-pass') {
    currentItem = initialItem;
    pricePerPerson = initialItem.price;
    totalPrice = initialItem.totalCustomPrice || (pricePerPerson * players);
  } else if (selectedType === 'pass') {
    const pass = PASSES.find(p => p.id === selectedId) || PASSES[0];
    currentItem = pass;
    pricePerPerson = pass.price;
    totalPrice = pass.price * players;
  } else {
    const game = GAMES.find(g => g.id === selectedId) || GAMES[0];
    currentItem = game;
    pricePerPerson = game.price;
    totalPrice = game.price * players;
  }

  // Booking reference ID
  const bookingRef = `BS-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep(2); // Go to digital pass view
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="ticket-code-badge" style={{ marginBottom: '0.2rem' }}>
              {step === 1 ? 'FAST-TRACK CHECKOUT' : 'CONFIRMED PASS'}
            </div>
            <h3 className="modal-title">
              {step === 1 ? 'Reserve Arena Slots' : 'Digital Arena Pass'}
            </h3>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {step === 1 ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Type Switcher */}
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

              {/* Selection Dropdown */}
              {selectedType === 'single' && (
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

              {selectedType === 'pass' && (
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

              {/* Date & Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    value={date} 
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
                    <option value="12:00">12:00 PM (Afternoon)</option>
                    <option value="15:00">03:00 PM (Matinee)</option>
                    <option value="18:00">06:00 PM (Prime Evening)</option>
                    <option value="20:00">08:00 PM (Night Battle)</option>
                    <option value="21:30">09:30 PM (Late Session)</option>
                  </select>
                </div>
              </div>

              {/* Player Count */}
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

              {/* Contact Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="form-input"
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
                    required
                  />
                </div>
              </div>

              {/* Price Summary Strip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Estimated Due:</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                    ₹{totalPrice.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Pay at venue reception<br />Zero cancellation fees
                </div>
              </div>

              <button type="submit" className="btn-red" style={{ width: '100%', padding: '0.85rem' }}>
                <span>Confirm Reservation & Generate Pass</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* Digital Boarding Pass Ticket */
            <div className="digital-ticket-view">
              <div className="ticket-confirmed-badge">
                <Check size={14} />
                <span>Slot Reserved Successfully</span>
              </div>

              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                BOOKING REF: #{bookingRef}
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {currentItem?.title || currentItem?.name}
              </h2>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Guest: {guestName || 'VIP Player'} • {players} Players • {date} at {timeSlot}
              </div>

              {/* QR Code Mockup */}
              <div style={{ width: '140px', height: '140px', margin: '0 auto 1.5rem', background: '#fff', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=BATTLESHIP-${bookingRef}-${players}PLAYERS`} 
                  alt="Boarding Pass QR" 
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Show this QR code at Level 4 Battleship Reception for immediate wristband issuance.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a 
                  href={`https://wa.me/919876543210?text=Hello%20Battleship%2C%20my%20booking%20is%20${bookingRef}%20for%20${players}%20players%20on%20${date}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-red"
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <Share2 size={16} />
                  <span>Send to WhatsApp</span>
                </a>

                <button 
                  onClick={onClose} 
                  className="btn-secondary"
                  style={{ flex: 1 }}
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
