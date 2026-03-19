import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import MicPermissionApp from './MicPermissionApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MicPermissionApp />
  </StrictMode>,
)
