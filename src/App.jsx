import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Attractions } from './components/Attractions';
import { PricingPasses } from './components/PricingPasses';
import { VenueInfo } from './components/VenueInfo';
import { Footer } from './components/Footer';
import { BookingPage } from './components/BookingPage';
import { MobileStickyBar } from './components/MobileStickyBar';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('battleship-theme') || 'dark';
  });

  // Page Routing / Tab State ('home' or 'booking')
  const [activeTab, setActiveTab] = useState(() => {
    return window.location.hash === '#booking' ? 'booking' : 'home';
  });
  const [selectedBookingItem, setSelectedBookingItem] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('battleship-theme', theme);
  }, [theme]);

  // Sync hash routing so browser Back / Forward buttons and bookmarks work seamlessly
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#booking') {
        setActiveTab('booking');
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenBooking = (item = null) => {
    setSelectedBookingItem(item);
    setActiveTab('booking');
    window.location.hash = '#booking';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActiveTab('home');
    window.location.hash = '#hero';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      {/* Navigation Header */}
      <Navbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'booking') {
            handleOpenBooking(null);
          } else {
            handleBackToHome();
          }
        }}
      />

      {/* Main Content: Full-Page Tab Routing */}
      {activeTab === 'home' ? (
        <main>
          <Hero onOpenBooking={handleOpenBooking} />
          <Attractions onOpenBooking={handleOpenBooking} />
          <PricingPasses onOpenBooking={handleOpenBooking} />
          <VenueInfo />
        </main>
      ) : (
        <main>
          <ErrorBoundary>
            <BookingPage 
              initialItem={selectedBookingItem} 
              onBackToHome={handleBackToHome} 
            />
          </ErrorBoundary>
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Booking Bar — only on Home overview */}
      {activeTab === 'home' && (
        <MobileStickyBar onOpenBooking={handleOpenBooking} />
      )}
    </div>
  );
}
