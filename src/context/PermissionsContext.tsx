import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  roles: string[];
  userCategories: string[];
  loading: boolean;
}

interface PermissionsContextType {
  authState: AuthState;
  can: (action: string, scopeType?: string, scopeId?: string) => boolean;
  canManageCategory: (category: string | null | undefined) => boolean;
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
  roles: [],
  userCategories: [],
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

      const { data: catAssignments } = await supabase
        .from('user_category_assignments')
        .select('category')
        .eq('user_id', userId);

      const roles: string[] = [];
      if (profile?.system_role) {
        roles.push(profile.system_role);
      }

      setAuthState({
        email,
        isAuthenticated: true,
        user: (profile as UserProfile) ?? null,
        roles,
        userCategories: catAssignments?.map(c => c.category) || [],
        loading: false,
      });
    } catch (err) {
      console.error('[PermissionsContext] fetchUser error:', err);
      setAuthState({
        email,
        isAuthenticated: true,
        user: null,
        roles: [],
        userCategories: [],
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

  const canManageCategory = (category: string | null | undefined): boolean => {
    const role = authState.user?.system_role?.toLowerCase() || '';
    if (role === 'super_admin' || role === 'admin') return true;
    
    if (!category) return false;
    const normCategory = category.trim().toUpperCase();
    return authState.userCategories.some(c => 
      c.trim().toUpperCase() === normCategory || normCategory.includes(c.trim().toUpperCase())
    );
  };

  return (
    <PermissionsContext.Provider value={{ authState, can, canManageCategory, logout }}>
      {children}
    </PermissionsContext.Provider>
  );
};
