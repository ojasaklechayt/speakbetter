import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SidepanelApp from './sidepanel/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SidepanelApp />
  </StrictMode>,
)
