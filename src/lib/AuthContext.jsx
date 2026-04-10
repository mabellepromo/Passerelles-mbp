import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await supabase.auth.refreshSession();
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.email,
          role: base44.auth.isUserAdmin(currentUser) ? 'admin' : (currentUser.user_metadata?.role || currentUser.app_metadata?.role || 'user'),
        });
        setIsAuthenticated(true);
      }
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(error || { message: 'Erreur d’authentification' });
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshAuth();
    });
    return () => subscription?.unsubscribe?.();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      refreshAuth,
      navigateToLogin: () => { window.location.href = '/login'; },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};