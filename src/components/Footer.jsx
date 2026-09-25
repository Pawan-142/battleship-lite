import { Zap } from 'lucide-react';

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
              Hyderabad's premier multi-level sensory physical entertainment arena. Laser combat, cyber bowling, bumper drift, and VR flight pods.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Explore
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <li><a href="#attractions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Attractions</a></li>
              <li><a href="#passes" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Battle Passes</a></li>
              <li><a href="#arena-info" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Location & Timings</a></li>
            </ul>
          </div>

          {/* Arena System Spec */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Arena Specs
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'monospace' }}>
              <div>SYS-ARENA // REV-04</div>
              <div>CAPACITY: 250+ GUESTS</div>
              <div>SAFETY: UV-C SANITIZED</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Battleship Gaming Zone. All Rights Reserved.</span>
          <span>Made for High-Octane Fun • Hyderabad</span>
        </div>
      </div>
    </footer>
  );
};
