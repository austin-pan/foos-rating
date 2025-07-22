import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AuthSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token);
    }
    navigate("/");
  }, [login, navigate, params]);

  return <p>Logging in...</p>;
}

export default AuthSuccess;