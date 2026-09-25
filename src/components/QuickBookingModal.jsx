import { useState } from 'react';
import { X, CheckCircle2, QrCode, Calendar, Clock, Users, Zap, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GAMES } from '../data/games';
import { PASSES } from '../data/passes';

export const QuickBookingModal = ({ initialItem, onClose }) => {
  const [step, setStep] = useState(1); // 1: Details, 2: Confirmed Ticket
  const [selectedType, setSelectedType] = useState(
    initialItem?.name ? 'pass' : 'game'
  );
  const [selectedId, setSelectedId] = useState(
    initialItem?.id || GAMES[0].id
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('04:00 PM');
  const [players, setPlayers] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingId, setBookingId] = useState('');

  // Calculate Price
  const currentItem = selectedType === 'game' 
    ? GAMES.find(g => g.id === selectedId) || GAMES[0]
    : PASSES.find(p => p.id === selectedId) || PASSES[0];

  const unitPrice = currentItem.price || 399;
  const totalPrice = selectedType === 'game' ? unitPrice * players : unitPrice * players;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please provide your name and phone number to generate your pass.');
      return;
    }

    const code = 'BS-' + Math.floor(100000 + Math.random() * 900000);
    setBookingId(code);
    setStep(2);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {}
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>
              {step === 1 ? 'Instant Pass Booking' : 'Booking Confirmed!'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {step === 1 ? 'Select date, players & instant pass confirmation' : 'Present this QR pass at the arena reception'}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleConfirm}>
            {/* Type selector: Game vs Battle Pass */}
            <div className="form-group">
              <label className="form-label">Booking Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setSelectedType('game'); setSelectedId(GAMES[0].id); }}
                  className={`btn-cyber ${selectedType === 'game' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}
                >
                  Individual Arena
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedType('pass'); setSelectedId(PASSES[0].id); }}
                  className={`btn-cyber ${selectedType === 'pass' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}
                >
                  Combo Battle Pass
                </button>
              </div>
            </div>

            {/* Select Game or Pass */}
            <div className="form-group">
              <label className="form-label">Select Attraction / Pass</label>
              <select 
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
                className="form-select"
              >
                {selectedType === 'game' 
                  ? GAMES.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.title} (₹{g.price}/person)
                      </option>
                    ))
                  : PASSES.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price}/person)
                      </option>
                    ))
                }
              </select>
            </div>

            {/* Date & Time */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  value={date} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <select 
                  value={timeSlot} 
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="form-select"
                >
                  <option>12:00 PM</option>
                  <option>02:00 PM</option>
                  <option>04:00 PM</option>
                  <option>06:00 PM</option>
                  <option>08:00 PM</option>
                  <option>10:00 PM</option>
                </select>
              </div>
            </div>

            {/* Player Count */}
            <div className="form-group">
              <label className="form-label">Players Count</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  value={players} 
                  onChange={(e) => setPlayers(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', minWidth: '40px' }}>
                  {players} {players === 1 ? 'Player' : 'Players'}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul Sharma"
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="form-input" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input" 
                  required
                />
              </div>
            </div>

            {/* Summary Strip */}
            <div className="booking-summary-strip">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Estimated Total ({players}x)
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pay at Venue Desk</div>
              </div>
              <div className="summary-total">₹{totalPrice}</div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-cyber btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              <Zap size={18} />
              <span>Confirm Pass & Generate QR</span>
            </button>
          </form>
        ) : (
          /* Confirmation Step */
          <div className="ticket-success-box">
            <CheckCircle2 size={52} style={{ color: 'var(--accent-emerald)', margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Pass Reserved Successfully!</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Booking Reference: <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>{bookingId}</strong>
            </p>

            <div className="qr-code-placeholder">
              <QrCode size={135} style={{ color: '#090d16' }} />
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Guest Name:</span>
                <strong>{name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Attraction / Pass:</span>
                <strong>{currentItem.title || currentItem.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Schedule:</span>
                <strong>{date} @ {timeSlot}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount Payable:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>₹{totalPrice}</strong>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="btn-cyber btn-primary"
              style={{ width: '100%' }}
            >
              Done / Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
