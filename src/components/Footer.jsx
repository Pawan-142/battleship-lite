export const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img 
                src="/images/bs_header_logo.png" 
                alt="Battleship Crest" 
                style={{ width: '38px', height: '38px', borderRadius: '50%' }}
              />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.1em' }}>
                BATTLESHIP
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '380px' }}>
              Battleship Gaming Zone. 4th Floor, Nexus Mall Cyber Gateway, Hitech City, Hyderabad.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <li><a href="#attractions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Games</a></li>
              <li><a href="#passes" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Passes</a></li>
              <li><a href="#arena-info" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Hours & Location</a></li>
            </ul>
          </div>

          {/* Timing & Contact */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Opening Hours
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>Mon - Thu: 11:00 AM - 11:00 PM</div>
              <div>Fri - Sun: 11:00 AM - 11:30 PM</div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Phone: +91 98765 43210</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Battleship Gaming Zone. All rights reserved.</span>
          <span>Nexus Mall • Hitech City, Hyderabad</span>
        </div>
      </div>
    </footer>
  );
};
