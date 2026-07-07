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

  const can = (action: string) => {
    if (!authState.user) return false;
    const role = authState.user.system_role;
    
    // Super Admin can do everything
    if (role === 'super_admin') return true;

    // Actions dictionary for other roles
    switch (action) {
      case 'manage_users':
        return false; // Only super_admin
      case 'create_match':
        // Permettre aux directeurs techniques et coachs de créer des matchs
        // Si vous voulez que tout le monde puisse créer, remplacez par `return true;`
        return ['technical_director', 'coach', 'assistant_coach'].includes(role) || !role; // fallback temporaire pour "Membre"
      case 'manage_roles':
        return false; // Only super_admin
      case 'manage_teams':
        return ['technical_director'].includes(role);
      case 'track_live_match':
      case 'prepare_match':
        return ['technical_director', 'coach', 'assistant_coach'].includes(role);
      case 'view_all_categories':
        return ['technical_director'].includes(role);
      default:
        // By default, let's allow read actions if not explicitly protected
        return true; 
    }
  };

  return (
    <PermissionsContext.Provider value={{ authState, can, logout }}>
      {children}
    </PermissionsContext.Provider>
  );
};
