import { useState } from 'react';
import { MapPin, Clock, Phone, MessageSquare, ChevronDown, Sparkles } from 'lucide-react';

export const VenueInfo = () => {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'Do I need to book games in advance?',
      a: 'Walk-ins are always welcome, but online reservations get priority lane slots, especially during peak weekend evenings (6 PM – 11 PM).'
    },
    {
      q: 'Are grip socks and equipment provided?',
      a: 'Yes, all laser tag sensors, bowling shoes, and VR sanitation liners are provided at zero extra cost at the arena reception.'
    },
    {
      q: 'Can we book private birthday parties or corporate squad battles?',
      a: 'Absolutely. Our Private Squad Party Bay accommodates 10 to 50 guests with dedicated game marshals and lounge catering.'
    },
    {
      q: 'Where can we park at Nexus Mall?',
      a: 'Ample multi-level basement parking is available directly inside Nexus Hyderabad Mall. Take Lift Lobby B to Level 4.'
    }
  ];

  return (
    <section id="venue" className="section-padding">
      <div className="container">
        {/* Header */}
        <div className="section-header-editorial">
          <div>
            <div className="section-tag">Venue Tour</div>
            <h2 className="section-title-editorial">The Arena Space</h2>
          </div>
          <p style={{ maxWidth: '420px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            15,000 sq ft designed with acoustic dampening, custom blacklight arenas, and lounge zones for players and spectators.
          </p>
        </div>

        {/* Space Photo Collage */}
        <div className="space-gallery-grid">
          {/* Main Space Photo */}
          <div className="space-main-tile">
            <img src="/images/venue-entrance.jpg" alt="Battleship Arena Entrance" />
            <div className="space-tile-content">
              <span className="showcase-badge" style={{ position: 'static', display: 'inline-block', marginBottom: '0.5rem' }}>
                Main Floor & Briefing Zone
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff' }}>
                Level 4, Nexus Mall Hyderabad
              </h3>
            </div>
          </div>

          {/* Side Stack */}
          <div className="space-side-stack">
            <div className="space-stack-tile">
              <img src="/images/glow_bowling_lanes_1789902611355.jpg" alt="UV Glow Bowling Lounge" />
              <div className="space-tile-content" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Glow Bowling Bay & Lounge</span>
              </div>
            </div>

            <div className="space-stack-tile">
              <img src="/images/party-suite.jpg" alt="Private Squad Suite" />
              <div className="space-tile-content" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Private Squad Mezzanine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Practical Venue Details & FAQ Grid */}
        <div className="venue-details-grid">
          {/* Info Card */}
          <div className="venue-info-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800 }}>
              Visit & Contact Desk
            </h3>

            <div className="info-row">
              <div className="info-icon"><MapPin size={18} /></div>
              <div>
                <div className="info-text-title">Arena Location</div>
                <div className="info-text-sub">
                  4th Floor, Nexus Hyderabad Mall, KPHB Road, Kukatpally, Hyderabad 500072
                </div>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon"><Clock size={18} /></div>
              <div>
                <div className="info-text-title">Hours of Operation</div>
                <div className="info-text-sub">
                  Monday – Sunday: 11:00 AM – 11:00 PM<br />
                  Prime Night Hours: 6:00 PM – 11:00 PM
                </div>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon"><Phone size={18} /></div>
              <div>
                <div className="info-text-title">Front Desk & Bookings</div>
                <div className="info-text-sub">
                  +91 98765 43210 / +91 40 4567 8900
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <a 
                href="https://wa.me/919876543210?text=Hi%20Battleship%2C%20I%20would%20like%20to%20book%20a%20slot" 
                target="_blank" 
                rel="noreferrer"
                className="btn-red"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <MessageSquare size={16} />
                <span>WhatsApp Concierge</span>
              </a>

              <a 
                href="https://maps.google.com/?q=Nexus+Hyderabad+Mall" 
                target="_blank" 
                rel="noreferrer"
                className="btn-secondary"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <MapPin size={16} />
                <span>Google Maps</span>
              </a>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Frequently Asked Questions
            </h3>

            <div className="faq-accordion">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="faq-item"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <div className="faq-question">
                      <span>{faq.q}</span>
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform var(--transition-fast)'
                        }} 
                      />
                    </div>
                    {isOpen && (
                      <div className="faq-answer">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
