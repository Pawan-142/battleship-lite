import { MapPin, Clock, Phone, MessageSquare, ShieldCheck, Car } from 'lucide-react';

export const VenueInfo = () => {
  return (
    <section id="arena-info" className="section-padding" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <MapPin size={14} />
            <span>Venue Information</span>
          </div>
          <h2 className="section-title">Visit The Arena</h2>
          <p className="section-desc">
            Located in the heart of Hitech City, Hyderabad with multi-level valet parking and high-capacity arcade lounge.
          </p>
        </div>

        <div className="venue-grid">
          {/* Location & Timings Card */}
          <div className="glass-card venue-card">
            <div className="info-row">
              <div className="info-icon-box">
                <MapPin size={22} />
              </div>
              <div className="info-text">
                <h4>Arena Address</h4>
                <p>
                  Battleship Gaming Zone, 4th Floor, Nexus Mall Cyber Gateway, Hitech City Main Road, Madhapur, Hyderabad - 500081.
                </p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-box">
                <Clock size={22} />
              </div>
              <div className="info-text">
                <h4>Operating Hours</h4>
                <p>
                  Monday – Friday: 11:00 AM – 11:00 PM<br />
                  Saturday – Sunday: 10:30 AM – 11:30 PM (Midnight Slots Open)
                </p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-box">
                <Car size={22} />
              </div>
              <div className="info-text">
                <h4>Free Valet & Parking</h4>
                <p>
                  Complimentary 3-hour covered valet parking for all booked guests and gaming pass holders.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Support & Direct Contact Card */}
          <div className="glass-card venue-card" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="info-row" style={{ marginBottom: '1.5rem' }}>
                <div className="info-icon-box">
                  <Phone size={22} />
                </div>
                <div className="info-text">
                  <h4>Direct Front-Desk Hotline</h4>
                  <p>+91 98765 43210 / +91 40 4567 8900</p>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon-box">
                  <ShieldCheck size={22} />
                </div>
                <div className="info-text">
                  <h4>Safety & Equipment Standards</h4>
                  <p>
                    All vests, dodgems, and headsets are sanitized after every session with UV-C technology.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Quick Connect Button */}
            <a 
              href="https://wa.me/919876543210?text=Hi%20Battleship%20Gaming%20Zone,%20I%20would%20like%20to%20inquire%20about%20booking%20a%20slot."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cyber btn-primary"
              style={{ width: '100%', padding: '0.85rem 1.5rem' }}
            >
              <MessageSquare size={18} />
              <span>Chat On WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
