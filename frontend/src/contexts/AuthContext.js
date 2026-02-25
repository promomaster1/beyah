import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getAuthHeaders, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};