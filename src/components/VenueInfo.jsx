import { MapPin, Clock, MessageSquare, Car } from 'lucide-react';

export const VenueInfo = () => {
  return (
    <section id="arena-info" className="section-padding" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <MapPin size={14} />
            <span>Venue</span>
          </div>
          <h2 className="section-title">Location & Hours</h2>
        </div>

        <div className="venue-grid">
          {/* Location & Timings Card */}
          <div className="glass-card venue-card">
            <div className="info-row">
              <div className="info-icon-box">
                <MapPin size={20} />
              </div>
              <div className="info-text">
                <h4>Hitech City, Hyderabad</h4>
                <p>4th Floor, Nexus Cyber Gateway, Madhapur - 500081</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-box">
                <Clock size={20} />
              </div>
              <div className="info-text">
                <h4>Open Daily</h4>
                <p>11:00 AM – 11:00 PM (Weekends until 11:30 PM)</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-box">
                <Car size={20} />
              </div>
              <div className="info-text">
                <h4>Free Valet Parking</h4>
                <p>Complimentary 3-hour covered parking for all visitors</p>
              </div>
            </div>
          </div>

          {/* Quick Support & Direct Contact Card */}
          <div className="glass-card venue-card" style={{ justifyContent: 'center', textAlign: 'center', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Need Quick Help or Group Bookings?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '360px' }}>
              Direct hotline: +91 98765 43210. Connect with an arena marshal instantly on WhatsApp.
            </p>

            <a 
              href="https://wa.me/919876543210?text=Hi%20Battleship%20Gaming%20Zone,%20I%20would%20like%20to%20inquire%20about%20booking%20a%20slot."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cyber btn-primary"
              style={{ padding: '0.85rem 2rem' }}
            >
              <MessageSquare size={18} />
              <span>WhatsApp Direct Connect</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
