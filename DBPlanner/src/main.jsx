import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' 
import './components/jsonCard.css'

import Generate from './generate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Generate />
  </StrictMode>,
)
