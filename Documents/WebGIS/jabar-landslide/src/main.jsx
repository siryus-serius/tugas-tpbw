import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="too-small" role="alert">
      <strong>Layar lu kurang gede boss</strong>
      <span>Buka di layar yang lebih lebar (min. 320 px) atau putar HP ke mode lanskap.</span>
    </div>
    <App />
  </StrictMode>,
)
