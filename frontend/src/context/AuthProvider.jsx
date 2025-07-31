import React, { useState, useEffect } from 'react';

import { AuthContext } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/user`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (!res.ok) {
          throw new Error("User not found");
        }

        const user = await res.json();
        if (user.authenticated) {
          setUser(user.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    fetchUser();
  }, [token]);

  const login = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
