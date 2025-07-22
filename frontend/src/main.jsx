import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';

import Home from "./pages/Home/Home.jsx";
import AuthSuccess from "./pages/AuthSuccess/AuthSuccess.jsx";
import AuthProvider from './context/AuthProvider';

import "./main.scss";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ScopedCssBaseline />
    <AuthProvider>
      {/* Have to use a hash router for GitHub static hosting */}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>,
)
