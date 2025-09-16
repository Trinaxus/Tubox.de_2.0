import { useState, useEffect } from 'react';

interface AdminCredentials {
  email: string;
  password: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: {
    username: string;
    email: string;
    displayName: string;
  } | null;
}

const ADMIN_CREDENTIALS = {
  email: 'trinax@gmx.de',
  username: 'admin',
  password: '000000',
  displayName: 'Admin'
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });

  useEffect(() => {
    // Check if user is already logged in (localStorage)
    const savedAuth = localStorage.getItem('trinax_admin_auth');
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        if (parsedAuth.isAuthenticated) {
          setAuthState(parsedAuth);
        }
      } catch (error) {
        localStorage.removeItem('trinax_admin_auth');
      }
    }
  }, []);

  const login = (credentials: AdminCredentials): boolean => {
    if (
      credentials.email === ADMIN_CREDENTIALS.email &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      const newAuthState = {
        isAuthenticated: true,
        user: {
          username: ADMIN_CREDENTIALS.username,
          email: ADMIN_CREDENTIALS.email,
          displayName: ADMIN_CREDENTIALS.displayName
        }
      };

      setAuthState(newAuthState);
      localStorage.setItem('trinax_admin_auth', JSON.stringify(newAuthState));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null
    });
    localStorage.removeItem('trinax_admin_auth');
  };

  return {
    ...authState,
    login,
    logout
  };
};