'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Get user type and additional data from localStorage
        const storedUserType = localStorage.getItem('user_type');
        const storedUserData = localStorage.getItem('user_data');
        
        let userData = session.user;
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            userData = { ...userData, ...parsedData };
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }
        
        setUser({
          ...userData,
          userType: storedUserType,
        });
        console.log('User session restored from Supabase');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const storedUserType = localStorage.getItem('user_type');
        const storedUserData = localStorage.getItem('user_data');
        
        let userData = session.user;
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            userData = { ...userData, ...parsedData };
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }
        
        setUser({
          ...userData,
          userType: storedUserType,
        });
      } else {
        setUser(null);
        // Clear local storage when session ends
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_type');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear user state
      setUser(null);
      setSession(null);
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_type');
      
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Method to clear auth without API call (for when token is already invalid)
  const clearAuth = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    clearAuth,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
