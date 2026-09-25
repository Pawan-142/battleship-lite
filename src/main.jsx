import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Prevent unwanted browser drag ghost previews on links, images, and buttons
if (typeof window !== 'undefined') {
  window.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'IMG' || e.target.closest('a') || e.target.closest('button')) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
