import { Sun, Moon, Sparkles } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme, onOpenBooking }) => {
  return (
    <header className="navbar-wrap">
      <div className="navbar-inner">
        {/* Brand */}
        <a href="#hero" className="nav-brand">
          <div className="nav-brand-icon">B</div>
          <span>BATTLESHIP</span>
        </a>

        {/* Navigation Links */}
        <nav className="nav-links">
          <a href="#attractions" className="nav-link-item">Attractions</a>
          <a href="#passes" className="nav-link-item">Passes & Squads</a>
          <a href="#custom-pass" className="nav-link-item">Customizer</a>
          <a href="#venue" className="nav-link-item">The Space</a>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn" 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button 
            onClick={() => onOpenBooking(null)} 
            className="btn-red"
          >
            Book Slot
          </button>
        </div>
      </div>
    </header>
  );
};
