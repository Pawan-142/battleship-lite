import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, CreditCard, Building, Wallet, CheckCircle2, 
  X, QrCode, Zap, AlertCircle, ArrowRight, Copy, Check 
} from 'lucide-react';
import { formatINR } from '../lib/format';

export const MockGatewayModal = ({
  isOpen,
  onClose,
  amountPaise,
  itemName = 'Battleship Arena Pass',
  customer = {},
  orderId,
  onSuccess,
  onFailure
}) => {
  const [activeTab, setActiveTab] = useState('UPI_QR');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiIdInput, setUpiIdInput] = useState(customer.phone ? `${customer.phone}@upi` : 'challenger@okhdfcbank');
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [cardName, setCardName] = useState(customer.name || 'Arena Challenger');

  // Selected Bank
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Flow State: 'IDLE' | 'PROCESSING' | 'OTP_CHALLENGE' | 'SUCCESS' | 'FAILED'
  const [gatewayState, setGatewayState] = useState('IDLE');
  const [otpValue, setOtpValue] = useState('4829');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min session

  useEffect(() => {
    if (!isOpen) {
      setGatewayState('IDLE');
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const displayAmount = formatINR(amountPaise);

  const handleSimulatePayment = (forcedSuccess = true) => {
    if (activeTab === 'CARD' && forcedSuccess && gatewayState !== 'OTP_CHALLENGE') {
      setGatewayState('OTP_CHALLENGE');
      return;
    }

    setGatewayState('PROCESSING');

    setTimeout(() => {
      if (forcedSuccess) {
        setGatewayState('SUCCESS');
        const paymentTxnId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        // Audio chime if supported
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        } catch (e) {}

        setTimeout(() => {
          onSuccess({
            razorpay_payment_id: paymentTxnId,
            razorpay_order_id: orderId || `order_sandbox_${Date.now()}`,
            razorpay_signature: 'mock_verified_signature',
            method: activeTab,
            amountPaise
          });
        }, 1100);
      } else {
        setGatewayState('FAILED');
        setTimeout(() => {
          if (onFailure) onFailure("Simulation: Bank declined transaction.");
          setGatewayState('IDLE');
        }, 1800);
      }
    }, 1400);
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText('battleship.arena@hdfcbank');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 4, 8, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#090d18',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 240, 255, 0.15)',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div style={{
          background: 'linear-gradient(90deg, #0b1329 0%, #060913 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>RAZORPAY GATEWAY</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: '#00f0ff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 240, 255, 0.3)'
                }}>
                  SANDBOX TEST
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                BATTLESHIP ARENA HYDERABAD
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>AMOUNT DUE</span>
              <strong style={{ fontSize: '1.15rem', color: '#00f0ff', fontFamily: 'monospace' }}>
                {displayAmount}
              </strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Body Content */}
        <div style={{ padding: '1.25rem' }}>
          
          {/* PROCESSING STATE */}
          {gatewayState === 'PROCESSING' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '3px solid rgba(0, 240, 255, 0.2)',
                borderTopColor: '#00f0ff',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1.25rem'
              }} />
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#ffffff' }}>Connecting to Bank Server…</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Authorizing {displayAmount} via Razorpay 256-bit Secure Gateway. Do not close or refresh.
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {gatewayState === 'SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#10b981' }}>Payment Successful!</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                Your arena slot has been locked. Generating your verified boarding pass…
              </p>
            </div>
          )}

          {/* FAILED STATE */}
          {gatewayState === 'FAILED' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 0, 85, 0.15)',
                border: '2px solid #ff0055',
                color: '#ff0055',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <AlertCircle size={36} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#ff0055' }}>Payment Declined</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                The simulated transaction was declined. Returning to options…
              </p>
            </div>
          )}

          {/* 3D-SECURE OTP CHALLENGE */}
          {gatewayState === 'OTP_CHALLENGE' && (
            <div style={{ padding: '1rem 0', textAlign: 'center' }}>
              <ShieldCheck size={42} color="#00f0ff" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem' }}>3D-Secure Bank SMS Verification</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                Enter the one-time authentication code sent to your registered mobile <strong>(Ending in 4829)</strong>
              </p>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  One Time Password (OTP)
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={otpValue}
                  onChange={e => setOtpValue(e.target.value)}
                  style={{
                    width: '140px',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    letterSpacing: '0.4em',
                    background: '#040711',
                    border: '1.5px solid #00f0ff',
                    borderRadius: '8px',
                    color: '#00f0ff',
                    padding: '0.4rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setGatewayState('IDLE')}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true)}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)',
                    border: 'none',
                    color: '#000000',
                    fontWeight: 700,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Verify & Pay {displayAmount}
                </button>
              </div>
            </div>
          )}

          {/* IDLE NORMAL SELECTION MODE */}
          {gatewayState === 'IDLE' && (
            <>
              {/* Payment Method Selector Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                background: 'rgba(3, 7, 18, 0.7)',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                {[
                  { id: 'UPI_QR', label: 'UPI / QR', icon: QrCode },
                  { id: 'CARD', label: 'Cards', icon: CreditCard },
                  { id: 'NETBANKING', label: 'NetBanking', icon: Building },
                  { id: 'WALLETS', label: 'Wallets', icon: Wallet },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                        border: isActive ? '1px solid #00f0ff' : '1px solid transparent',
                        color: isActive ? '#00f0ff' : '#94a3b8',
                        borderRadius: '8px',
                        padding: '8px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: UPI & QR SCANNER */}
              {activeTab === 'UPI_QR' && (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    {/* Simulated Dynamic UPI QR SVG */}
                    <div style={{ textAlign: 'center', background: '#ffffff', padding: '10px', borderRadius: '10px' }}>
                      <svg viewBox="0 0 100 100" style={{ width: '100%', maxHeight: '110px', display: 'block' }}>
                        <rect width="100" height="100" fill="#ffffff"/>
                        <rect x="5" y="5" width="28" height="28" fill="#000000"/>
                        <rect x="8" y="8" width="22" height="22" fill="#ffffff"/>
                        <rect x="12" y="12" width="14" height="14" fill="#000000"/>

                        <rect x="67" y="5" width="28" height="28" fill="#000000"/>
                        <rect x="70" y="8" width="22" height="22" fill="#ffffff"/>
                        <rect x="74" y="12" width="14" height="14" fill="#000000"/>

                        <rect x="5" y="67" width="28" height="28" fill="#000000"/>
                        <rect x="8" y="70" width="22" height="22" fill="#ffffff"/>
                        <rect x="12" y="74" width="14" height="14" fill="#000000"/>

                        <circle cx="50" cy="20" r="4" fill="#000000" />
                        <circle cx="40" cy="35" r="3" fill="#000000" />
                        <circle cx="60" cy="35" r="3" fill="#000000" />
                        <circle cx="50" cy="50" r="5" fill="#0077ff" />
                        <circle cx="35" cy="50" r="3" fill="#000000" />
                        <circle cx="65" cy="50" r="3" fill="#000000" />
                        <circle cx="50" cy="65" r="3" fill="#000000" />
                        <circle cx="40" cy="80" r="4" fill="#000000" />
                        <circle cx="60" cy="80" r="4" fill="#000000" />
                      </svg>
                      <span style={{ fontSize: '0.62rem', color: '#000000', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                        SCAN VIA ANY UPI APP
                      </span>
                    </div>

                    {/* QR Details */}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>VPA Merchant ID:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '3px 0 8px' }}>
                        <code style={{ fontSize: '0.75rem', color: '#00f0ff', background: '#020617', padding: '2px 6px', borderRadius: '4px' }}>
                          battleship@hdfc
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                          title="Copy VPA"
                        >
                          {copiedUpi ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <span key={app} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                            {app}
                          </span>
                        ))}
                      </div>

                      <span style={{ fontSize: '0.68rem', color: '#10b981' }}>
                        ⚡ Expires in {timeFormatted}
                      </span>
                    </div>
                  </div>

                  {/* UPI Apps selector */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      Or Enter UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={e => setUpiIdInput(e.target.value)}
                      placeholder="username@upi"
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CARDS */}
              {activeTab === 'CARD' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Test Card Details</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('4111 1111 1111 1111');
                        setCardExpiry('12/28');
                        setCardCvv('789');
                      }}
                      style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '4px',
                        color: '#00f0ff',
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Auto-Fill Test Visa
                    </button>
                  </div>

                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="Card Number"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      marginBottom: '0.6rem',
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      maxLength="4"
                      style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: NET BANKING */}
              {activeTab === 'NETBANKING' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Select Test Net Banking Bank
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'Yes Bank'].map(bank => (
                      <div
                        key={bank}
                        onClick={() => setSelectedBank(bank)}
                        style={{
                          background: selectedBank === bank ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                          border: `1px solid ${selectedBank === bank ? '#00f0ff' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '8px',
                          padding: '0.65rem 0.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {bank}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: WALLETS */}
              {activeTab === 'WALLETS' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Select Digital Wallet
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {['Amazon Pay', 'Paytm Wallet', 'PhonePe', 'Mobikwik'].map(w => (
                      <div
                        key={w}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.5rem',
                          textAlign: 'center',
                          fontSize: '0.78rem',
                          color: '#ffffff'
                        }}
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION BUTTONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)',
                    border: 'none',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    padding: '0.9rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0, 240, 255, 0.35)'
                  }}
                >
                  <Lock size={16} />
                  <span>PAY {displayAmount} VIA RAZORPAY</span>
                  <ArrowRight size={16} />
                </button>

                {/* SIMULATE FAILURE BUTTON */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSimulatePayment(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.7rem',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Simulate Gateway Failure / Decline
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Security Badge */}
        <div style={{
          background: '#040711',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Lock size={11} color="#10b981" />
            <span>256-bit TLS Encrypted Session</span>
          </div>
          <span>Razorpay Software Pvt Ltd</span>
        </div>

      </motion.div>
    </div>
  );
};
