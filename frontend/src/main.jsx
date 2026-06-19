import React from 'react';
import { createRoot } from 'react-dom/client';
import { IconContext } from '@phosphor-icons/react';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Peso padrão dos ícones Phosphor em todo o app (duotone = cara mais personalizada).
// Cada ícone ainda pode sobrescrever size/color/weight individualmente.
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <IconContext.Provider value={{ weight: 'duotone' }}>
      <App />
    </IconContext.Provider>
  </ErrorBoundary>
);

// PWA — registra o service worker em produção (HTTPS).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
