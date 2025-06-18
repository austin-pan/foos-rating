import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import Home from "./pages/Home/Home.jsx";

import "./main.scss";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ScopedCssBaseline />
    <Home/>
  </StrictMode>,
)
