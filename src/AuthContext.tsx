import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from './services/api';

interface AuthContextType {
  userToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(localStorage.getItem('phoneComputeToken'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check token validity when the app loads
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('phoneComputeToken');
      if (!token) return;

      try {
        // Use real API instead of mock
        const result = await apiService.validateToken();
        
        if (!result.valid) {
          // Token is invalid, remove it
          localStorage.removeItem('phoneComputeToken');
          setUserToken(null);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        // Clean up on error to be safe
        localStorage.removeItem('phoneComputeToken');
        setUserToken(null);
      }
    };

    validateToken();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Use real API instead of mock
      const result = await apiService.login(username, password);

      if (!result.success) {
        return false;
      }

      localStorage.setItem('phoneComputeToken', result.token);
      setUserToken(result.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('phoneComputeToken');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{
      userToken,
      isAuthenticated: !!userToken,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};