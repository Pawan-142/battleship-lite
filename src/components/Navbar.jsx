import { useState, useEffect } from 'react';
import { Sun, Moon, Zap, ArrowRight } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme, onOpenBooking }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let prev = false;
    const handleScroll = () => {
      const isOver = window.scrollY > 20;
      if (isOver !== prev) {
        prev = isOver;
        setScrolled(isOver);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header-root ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-bar">
        {/* Brand Logo & Name */}
        <a href="#hero" className="brand-link">
          <img 
            src="/images/bs_header_logo.png" 
            alt="Battleship Crest" 
            className="brand-crest"
          />
          <div className="brand-text-stack">
            <div className="brand-name">BATTLESHIP</div>
            <div className="brand-sub">GAMING ZONE • HYDERABAD</div>
          </div>
        </a>

        {/* Navigation Menu */}
        <nav>
          <ul className="nav-menu">
            <li><a href="#attractions" className="nav-item">Attractions</a></li>
            <li><a href="#passes" className="nav-item">Passes & Pricing</a></li>
            <li><a href="#arena-info" className="nav-item">Venue & Hours</a></li>
          </ul>
        </nav>

        {/* Action Block: Theme Switcher + Instant Booking */}
        <div className="nav-actions">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={() => onOpenBooking(null)} 
            className="btn-cyber btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.8rem' }}
          >
            <Zap size={15} />
            <span>Book Pass</span>
          </button>
        </div>
      </div>
    </header>
  );
};
