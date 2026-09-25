export const Footer = () => {
  return (
    <footer className="footer-editorial">
      <div className="container">
        <div className="footer-inner">
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
              BATTLESHIP ARENA
            </span>
            <span style={{ marginLeft: '0.75rem', color: 'var(--text-tertiary)' }}>
              Level 4, Nexus Hyderabad Mall • Open Daily 11 AM - 11 PM
            </span>
          </div>

          <div className="footer-nav">
            <a href="#attractions" className="nav-link-item">Attractions</a>
            <a href="#passes" className="nav-link-item">Squad Passes</a>
            <a href="#venue" className="nav-link-item">Hours & Location</a>
            <a href="tel:+919876543210" className="nav-link-item">+91 98765 43210</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
