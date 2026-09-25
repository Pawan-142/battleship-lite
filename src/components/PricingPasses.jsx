import { Check, Zap } from 'lucide-react';
import { PASSES } from '../data/passes';

export const PricingPasses = ({ onOpenBooking }) => {
  return (
    <section id="passes" className="section-padding">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Zap size={14} />
            <span>Combo Passes</span>
          </div>
          <h2 className="section-title">Value Passes</h2>
          <p className="section-desc">
            Bundle multiple games together and save on individual ticket prices.
          </p>
        </div>

        <div className="passes-grid">
          {PASSES.map((pass) => (
            <div 
              key={pass.id} 
              className={`glass-card pass-card ${pass.popular ? 'featured' : ''}`}
            >
              {pass.badge && <span className="pass-badge">{pass.badge}</span>}
              <h3 className="pass-name">{pass.name}</h3>

              <div className="pass-price-wrap">
                <span className="pass-price">₹{pass.price}</span>
                {pass.originalPrice && <span className="pass-original">₹{pass.originalPrice}</span>}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ person</span>
              </div>

              <ul className="pass-features-list">
                {pass.features.map((feat, idx) => (
                  <li key={idx} className="pass-feature-item">
                    <Check size={16} className="check-icon" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => onOpenBooking(pass)}
                className={`btn-cyber ${pass.popular ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%' }}
              >
                <Zap size={16} />
                <span>Select {pass.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
