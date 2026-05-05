import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/400-italic.css'
import App from './App.jsx'
import PasswordGate from './components/PasswordGate.jsx'
import { supabase } from './api/base44Client'

window.__authEvent = null;
window.__authSession = null;

supabase.auth.onAuthStateChange((event, session) => {
  window.__authEvent = event;
  window.__authSession = session;
});

createRoot(document.getElementById('root')).render(
  <PasswordGate>
    <App />
  </PasswordGate>
)