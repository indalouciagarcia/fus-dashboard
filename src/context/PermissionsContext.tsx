import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface AuthState {
  /** Utilisateur Supabase authentifié (email) */
  email: string | null;
  /** Vrai si une session Supabase existe */
  isAuthenticated: boolean;
  /** Profil applicatif (user_profiles) */
  user: UserProfile | null;
  roles: string[];
  permissions: string[];
  teamAssignments: string[];
  matchAssignments: string[];
  loading: boolean;
}

interface PermissionsContextType {
  authState: AuthState;
  /** DEV uniquement : simuler un rôle sans requête DB */
  loginAs: (roleName: string) => void;
  can: (action: string, scopeType?: 'club' | 'category' | 'team' | 'match', scopeId?: string) => boolean;
  logout: () => Promise<void>;
}

// -------------------------------------------------------
// Permissions par rôle (source de vérité pour le DEV)
// En prod, ceci est remplacé par la jointure role_permissions
// -------------------------------------------------------

export const ROLE_LABELS: Record<string, string> = {
  super_admin:        'Super Admin',
  club_admin:         'Admin Club',
  technical_director: 'Directeur Technique',
  coach:              'Entraîneur',
  assistant_coach:    'Adjoint Technique',
  match_operator:     'Opérateur Match',
  viewer:             'Observateur',
};

const ROLE_PRIORITY = [
  'super_admin', 'club_admin', 'technical_director',
  'coach', 'assistant_coach', 'match_operator', 'viewer',
];

export function getPrimaryRole(roles: string[]): string {
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return roles[0] ?? 'viewer';
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'manage_users', 'manage_roles', 'manage_teams', 'manage_matches',
    'validate_match_data', 'track_live_match', 'edit_matches', 'manage_backups',
    'manage_convocations', 'manage_lineup', 'view_matches',
    'add_live_event', 'edit_live_event',
  ],
  club_admin: [
    'manage_roles', 'manage_users', 'manage_teams', 'manage_matches',
    'edit_matches', 'manage_convocations', 'manage_lineup',
    'view_matches', 'manage_backups',
  ],
  technical_director: [
    'validate_match_data', 'view_matches',
    'manage_convocations', 'manage_teams',
  ],
  coach: [
    'manage_lineup', 'manage_convocations',
    'edit_matches', 'view_matches', 'track_live_match',
  ],
  assistant_coach: [
    'manage_lineup', 'view_matches',
  ],
  match_operator: [
    'track_live_match', 'add_live_event', 'edit_live_event', 'view_matches',
  ],
  viewer: [
    'view_matches',
  ],
};

// -------------------------------------------------------
// Context
// -------------------------------------------------------

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions doit être utilisé dans un PermissionsProvider");
  return ctx;
};

// -------------------------------------------------------
// Provider
// -------------------------------------------------------

const EMPTY_STATE: AuthState = {
  email: null,
  isAuthenticated: false,
  user: null,
  roles: [],
  permissions: [],
  teamAssignments: [],
  matchAssignments: [],
  loading: true,
};

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(EMPTY_STATE);

  // -------------------------------------------------------
  // Chargement complet des permissions pour un utilisateur
  // -------------------------------------------------------
  const fetchUserPermissions = async (userId: string, email: string | null) => {
    try {
      // 1. Profil applicatif
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Rôles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      const roles: string[] = userRoles?.map((r: any) => r.roles?.name).filter(Boolean) ?? [];

      // 3. Permissions agrégées depuis les rôles
      let permissions: string[] = [];
      roles.forEach(r => {
        permissions = [...new Set([...permissions, ...(ROLE_PERMISSIONS[r] ?? [])])];
      });

      // 4. Périmètres PBAC
      const [teamRes, matchRes] = await Promise.all([
        supabase.from('user_team_assignments').select('team_id').eq('user_id', userId),
        supabase.from('user_match_assignments').select('match_id').eq('user_id', userId),
      ]);

      setAuthState({
        email,
        isAuthenticated: true,
        user: (profile as UserProfile) ?? null,
        roles,
        permissions,
        teamAssignments: teamRes.data?.map(t => t.team_id) ?? [],
        matchAssignments: matchRes.data?.map(m => m.match_id) ?? [],
        loading: false,
      });
    } catch (err) {
      console.error('[PermissionsContext] fetchUserPermissions error:', err);
      // Session valide mais erreur sur les données → on marque quand même comme authentifié
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        email,
        loading: false,
      }));
    }
  };

  // -------------------------------------------------------
  // Surveillance de la session Supabase
  // -------------------------------------------------------
  useEffect(() => {
    // Timeout de sécurité : si aucune réponse en 8s → pas de session
    const timeout = setTimeout(() => {
      setAuthState(prev => {
        if (prev.loading) {
          console.warn('[PermissionsContext] getSession timeout — redirection login');
          return { ...EMPTY_STATE, loading: false };
        }
        return prev;
      });
    }, 8000);

    // onAuthStateChange déclenche INITIAL_SESSION immédiatement (Supabase v2)
    // → pas besoin de getSession() séparé
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout);
      if (session?.user) {
        fetchUserPermissions(session.user.id, session.user.email ?? null);
      } else {
        setAuthState({ ...EMPTY_STATE, loading: false });
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------
  // Actions
  // -------------------------------------------------------

  /** DEV uniquement : simuler un rôle sans requête DB */
  const loginAs = (roleName: string) => {
    if (import.meta.env.MODE === 'production') return;
    setAuthState(prev => ({
      ...prev,
      roles: [roleName],
      permissions: ROLE_PERMISSIONS[roleName] ?? [],
    }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange déclenche le reset de l'état
  };

  const can = (
    action: string,
    scopeType?: 'club' | 'category' | 'team' | 'match',
    scopeId?: string,
  ): boolean => {
    if (authState.roles.includes('super_admin')) return true;
    if (!authState.permissions.includes(action)) return false;

    if (scopeType && scopeId) {
      switch (scopeType) {
        case 'team':  return authState.teamAssignments.includes(scopeId);
        case 'match': return authState.matchAssignments.includes(scopeId);
        default:      return false;
      }
    }
    return true;
  };

  return (
    <PermissionsContext.Provider value={{ authState, loginAs, can, logout }}>
      {children}
    </PermissionsContext.Provider>
  );
};
