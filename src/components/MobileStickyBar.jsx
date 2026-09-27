import { useState, useEffect } from 'react';
import { Zap, Calendar, ArrowRight } from 'lucide-react';

export const MobileStickyBar = ({ onOpenBooking }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show only after user scrolls past the hero section (300px)
      if (window.scrollY > 320) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="mobile-sticky-dock-root animate-fade-in">
      <div className="mobile-sticky-dock-inner">
        <div className="mobile-sticky-info">
          <span className="mobile-sticky-tag">
            <span className="live-pulse-dot" /> LIVE ARENA BOOKINGS
          </span>
          <span className="mobile-sticky-title">Reserve Prime Battle Slots</span>
        </div>

        <button
          type="button"
          onClick={() => onOpenBooking()}
          className="mobile-sticky-action-btn"
        >
          <span>FAST-TRACK BOOK</span>
          <ArrowRight size={15} />
        </button>
      </div>

      <style>{`
        .mobile-sticky-dock-root {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          z-index: 99;
          display: none;
        }

        @media (max-width: 868px) {
          .mobile-sticky-dock-root {
            display: block;
          }
        }

        .mobile-sticky-dock-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(14, 14, 18, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 51, 68, 0.35);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(176, 58, 46, 0.2);
          border-radius: 9999px;
          padding: 0.6rem 0.8rem 0.6rem 1.25rem;
          gap: 0.75rem;
        }

        [data-theme="light"] .mobile-sticky-dock-inner {
          background: rgba(255, 255, 255, 0.96);
          border-color: rgba(217, 28, 46, 0.3);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .mobile-sticky-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .mobile-sticky-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #ff4d5a;
          text-transform: uppercase;
        }

        .live-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulseGlow 1.8s infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }

        .mobile-sticky-title {
          font-family: var(--font-display, sans-serif);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-sticky-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #d91c2e, #8f121e);
          color: #ffffff;
          border: none;
          padding: 0.65rem 1.1rem;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(217, 28, 46, 0.4);
          transition: transform 0.2s ease;
        }

        .mobile-sticky-action-btn:active {
          transform: scale(0.96);
        }

        .animate-fade-in {
          animation: stickySlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes stickySlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
