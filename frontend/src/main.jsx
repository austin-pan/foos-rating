import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from "./pages/Home/Home.jsx";

import "./main.scss";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Home/>
  </StrictMode>,
)
