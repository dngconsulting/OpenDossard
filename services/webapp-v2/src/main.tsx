import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import { initErrorListeners } from '@/utils/error-handler'

// Initialize global error listeners for runtime errors
initErrorListeners()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
