import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Attractions } from './components/Attractions';
import { PricingPasses } from './components/PricingPasses';
import { VenueInfo } from './components/VenueInfo';
import { Footer } from './components/Footer';
import { QuickBookingModal } from './components/QuickBookingModal';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('battleship-theme') || 'dark';
  });

  const [bookingModalItem, setBookingModalItem] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('battleship-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenBooking = (item = null) => {
    setBookingModalItem(item);
    setIsBookingOpen(true);
  };

  return (
    <div className="app-root">
      {/* Navigation Header */}
      <Navbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onOpenBooking={handleOpenBooking} 
      />

      {/* Main Content */}
      <main>
        <Hero onOpenBooking={handleOpenBooking} />
        <Attractions onOpenBooking={handleOpenBooking} />
        <PricingPasses onOpenBooking={handleOpenBooking} />
        <VenueInfo />
      </main>

      {/* Footer */}
      <Footer />

      {/* Instant 2-Step Quick Booking Modal */}
      {isBookingOpen && (
        <QuickBookingModal 
          initialItem={bookingModalItem} 
          onClose={() => setIsBookingOpen(false)} 
        />
      )}
    </div>
  );
}
