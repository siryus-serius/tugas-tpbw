import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Pasang tema sebelum render agar tidak berkedip (lihat hooks/useTheme.js)
try {
  const saved = localStorage.getItem('tema')
  document.documentElement.dataset.theme =
    saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="too-small" role="alert">
      <strong>Layar lu kurang gede boss</strong>
      <span>Buka di layar yang lebih lebar (min. 320 px) atau putar HP ke mode lanskap.</span>
    </div>
    <App />
  </StrictMode>,
)
