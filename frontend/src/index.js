import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Pre-warm Railway backend before React renders to reduce cold-start delays.
// We do NOT block indefinitely: we attempt the ping, but render regardless after a short timeout.
// In production on Vercel we proxy `/api/*` to the backend via `frontend/vercel.json`,
// so we can ping the same-origin `/api/auth/ping` and avoid CORS/env-cache issues.
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_ORIGIN = isLocalhost
  ? (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/+$/, '') ||
    `${window.location.protocol}//${window.location.hostname}:8080`
  : '';
const PING_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api/auth/ping` : '/api/auth/ping';

const renderApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const timeout = new Promise((resolve) => setTimeout(resolve, 1200));
const pingAttempt = PING_URL
  ? (() => {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 1200);
        return fetch(PING_URL, { signal: controller.signal })
          .catch(() => {})
          .finally(() => clearTimeout(t));
      } catch {
        return Promise.resolve();
      }
    })()
  : Promise.resolve();

Promise.race([pingAttempt, timeout]).finally(renderApp);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
