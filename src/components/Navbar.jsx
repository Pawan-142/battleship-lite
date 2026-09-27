import { Sun, Moon, Sparkles } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme, activeTab, onNavigate }) => {
  return (
    <header className="navbar-wrap">
      <div className="navbar-inner">
        {/* Brand */}
        <a 
          href="#hero" 
          onClick={(e) => { e.preventDefault(); onNavigate('home'); }} 
          className="nav-brand"
        >
          <div className="nav-brand-icon">B</div>
          <span>BATTLESHIP</span>
        </a>

        {/* Navigation Links */}
        <nav className="nav-links">
          <a 
            href="#attractions" 
            onClick={() => onNavigate('home')} 
            className="nav-link-item"
          >
            Attractions
          </a>
          <a 
            href="#passes" 
            onClick={() => onNavigate('home')} 
            className="nav-link-item"
          >
            Passes & Squads
          </a>
          <a 
            href="#custom-pass" 
            onClick={() => onNavigate('home')} 
            className="nav-link-item"
          >
            Customizer
          </a>
          <a 
            href="#venue" 
            onClick={() => onNavigate('home')} 
            className="nav-link-item"
          >
            The Space
          </a>
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
            onClick={() => onNavigate('booking')} 
            className="btn-red"
          >
            {activeTab === 'booking' ? 'Arena Overview' : 'Book Slot'}
          </button>
        </div>
      </div>
    </header>
  );
};
