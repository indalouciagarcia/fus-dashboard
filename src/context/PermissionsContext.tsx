import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

interface PermissionsContextType {
  authState: AuthState;
  can: (action: string, scopeType?: string, scopeId?: string) => boolean;
  logout: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions doit être utilisé dans un PermissionsProvider");
  return ctx;
};

const EMPTY_STATE: AuthState = {
  email: null,
  isAuthenticated: false,
  user: null,
  loading: true,
};

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(EMPTY_STATE);

  const fetchUser = async (userId: string, email: string | null) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setAuthState({
        email,
        isAuthenticated: true,
        user: (profile as UserProfile) ?? null,
        loading: false,
      });
    } catch (err) {
      console.error('[PermissionsContext] fetchUser error:', err);
      setAuthState({
        email,
        isAuthenticated: true,
        user: null,
        loading: false,
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthState(prev => {
        if (prev.loading) {
          return { ...EMPTY_STATE, loading: false };
        }
        return prev;
      });
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout);
      if (session?.user) {
        fetchUser(session.user.id, session.user.email ?? null);
      } else {
        setAuthState({ ...EMPTY_STATE, loading: false });
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const can = (_action: string) => {
    // Super Admin & authenticated users have FULL UNRESTRICTED ACCESS to all features
    return true; 
  };

  return (
    <PermissionsContext.Provider value={{ authState, can, logout }}>
      {children}
    </PermissionsContext.Provider>
  );
};
