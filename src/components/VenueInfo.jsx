import { MapPin, Clock, MessageSquare, Car, Phone } from 'lucide-react';

export const VenueInfo = () => {
  return (
    <section id="arena-info" className="section-padding" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <MapPin size={14} />
            <span>Location</span>
          </div>
          <h2 className="section-title">Hours & Directions</h2>
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
                <p>Nexus Mall Cyber Gateway, 4th Floor, Madhapur - 500081</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-box">
                <Clock size={20} />
              </div>
              <div className="info-text">
                <h4>Open 7 Days a Week</h4>
                <p>11:00 AM – 11:00 PM (Friday & Saturday till 11:30 PM)</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon-box">
                <Car size={20} />
              </div>
              <div className="info-text">
                <h4>Mall Parking Available</h4>
                <p>Ample covered 4-wheeler and 2-wheeler parking with valet</p>
              </div>
            </div>
          </div>

          {/* Quick Support & Direct Contact Card */}
          <div className="glass-card venue-card" style={{ justifyContent: 'center', textAlign: 'center', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Questions or Birthday Bookings?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '360px' }}>
              Call our front desk on <strong>+91 98765 43210</strong> or message us on WhatsApp for instant slot availability.
            </p>

            <a 
              href="https://wa.me/919876543210?text=Hi%20Battleship%20Gaming%20Zone,%20I%20would%20like%20to%20inquire%20about%20booking%20slots."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cyber btn-primary"
              style={{ padding: '0.85rem 2rem' }}
            >
              <MessageSquare size={18} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
