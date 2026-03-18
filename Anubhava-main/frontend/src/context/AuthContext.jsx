import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { ME } from '../graphql/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(localStorage.getItem('token'));
  const [isQuizInProgress, setIsQuizInProgress] = useState(false);

  const [getMe, { data, error }] = useLazyQuery(ME);

  useEffect(() => {
    if (token) {
      getMe();
    } else {
      setLoading(false);
    }
  }, [token, getMe]);

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
      setLoading(false);
    } else if (error) {
      logout();
    }
  }, [data, error]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setTokenState(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setTokenState(null);
    setUser(null);
    setLoading(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isQuizInProgress,
        setIsQuizInProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};