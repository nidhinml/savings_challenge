import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline app-shell caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New SaveSmart update available.');
  },
  onOfflineReady() {
    console.log('SaveSmart is ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
