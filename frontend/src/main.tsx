import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import axios from 'axios';
axios.defaults.withCredentials = true;

// ── One-time cleanup: remove the _hasHydrated key that was accidentally
//    persisted by a previous buggy version of authStore. Without this,
//    users see a permanent blank screen on the admin portal.
try {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    const parsed = JSON.parse(raw);
    if ('_hasHydrated' in (parsed?.state ?? {})) {
      delete parsed.state._hasHydrated;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  }
} catch (_) { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
