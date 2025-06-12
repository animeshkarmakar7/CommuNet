// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterWrapper } from './userRouter'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterWrapper />
  </React.StrictMode>
)
