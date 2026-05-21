import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('[PWA] Attempting to register service worker...');
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(registration => {
        console.log('[PWA] SW registered successfully: ', registration);
        console.log('[PWA] SW state: ', registration.installing ? 'installing' : registration.waiting ? 'waiting' : registration.active ? 'active' : 'unknown');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('[PWA] New service worker found');
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] SW state changed to: ', newWorker.state);
          });
        });
      })
      .catch(registrationError => {
        console.error('[PWA] SW registration failed: ', registrationError);
      });
  });
} else {
  console.warn('[PWA] Service worker not supported');
}