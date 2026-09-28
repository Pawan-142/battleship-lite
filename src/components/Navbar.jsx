import { Sun, Moon, Sparkles, ArrowLeft, Crosshair, Calendar } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme, activeTab, onNavigate }) => {
  const isBooking = activeTab === 'booking';

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    if (isBooking) {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar-wrap ${isBooking ? 'is-booking-header' : ''}`}>
      <div className="navbar-inner">
        {/* Left Group: Brand + Divider + Nav Links */}
        <div className="nav-left-group">
          <a 
            href="#hero" 
            onClick={(e) => { e.preventDefault(); onNavigate('home'); }} 
            className="nav-brand"
          >
            <div className="nav-brand-icon">
              <Crosshair size={17} strokeWidth={2.5} />
            </div>
            <div className="nav-brand-text">
              <span className="brand-main">BATTLESHIP</span>
              <span className="brand-sub">ARENA</span>
            </div>
          </a>

          <span className="nav-divider" />

          {/* Navigation Links or Booking Chip */}
          {isBooking ? (
            <div className="nav-booking-indicator">
              <span className="booking-badge-chip">
                <Sparkles size={14} className="text-red" />
                <span>Squad Reservation Desk</span>
              </span>
            </div>
          ) : (
            <nav className="nav-links">
              <a 
                href="#attractions" 
                onClick={(e) => handleNavClick(e, 'attractions')} 
                className="nav-link-item"
              >
                Attractions
              </a>
              <a 
                href="#passes" 
                onClick={(e) => handleNavClick(e, 'passes')} 
                className="nav-link-item"
              >
                Passes & Squads
              </a>
              <a 
                href="#custom-pass" 
                onClick={(e) => handleNavClick(e, 'custom-pass')} 
                className="nav-link-item"
              >
                Customizer
              </a>
              <a 
                href="#venue" 
                onClick={(e) => handleNavClick(e, 'venue')} 
                className="nav-link-item"
              >
                The Space
              </a>
            </nav>
          )}
        </div>

        {/* Right Group: Action Buttons */}
        <div className="nav-actions">
          {isBooking ? (
            <button 
              type="button"
              onClick={() => onNavigate('home')} 
              className="booking-back-nav-btn"
              title="Return to Arena Overview"
            >
              <ArrowLeft size={15} />
              <span>Exit to Overview</span>
            </button>
          ) : (
            <button 
              onClick={() => onNavigate('booking')} 
              className="btn-red nav-book-cta"
            >
              <Calendar size={15} />
              <span>Book Slot</span>
            </button>
          )}

          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn" 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};

