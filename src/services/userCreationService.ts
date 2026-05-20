import { supabase } from '../lib/supabase';
import { getMyClubId } from './_helpers';
import type { AgeCategory } from '../types';

export type AppPermissionLevel = 'viewer' | 'reporter' | 'editor' | 'live_tracker';
export type AppAction = 'report' | 'edit' | 'live_track';

// -------------------------------------------------------
// Création compte via fetch() direct sur /auth/v1/signup
// → aucun GoTrueClient secondaire → session admin intacte
// -------------------------------------------------------
const signUpViaREST = async (email: string, password: string, metadata: Record<string, string>) => {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password, data: metadata }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.msg || json.error_description || 'Erreur création compte');
  return json as { id: string };
};

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface CreateUserParams {
  email:     string;
  password:  string;
  firstName: string;
  lastName:  string;
  phone?:    string;
}

export interface AppUser {
  user_id:          string;
  email:            string | null;
  full_name:        string;
  first_name:       string | null;
  last_name:        string | null;
  phone:            string | null;
  photo_url:        string | null;
  is_active:        boolean;
  category:         AgeCategory | null;
  permission_level: AppPermissionLevel | null;
  allowed_actions:  AppAction[];
  created_at:       string;
}

// -------------------------------------------------------
// Génération de mot de passe sécurisé
// -------------------------------------------------------

export const generatePassword = (): string => {
  const upper   = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const digits  = '23456789';
  const symbols = '@#!$%';

  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

  // Garantit au moins 1 de chaque type
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const all = upper + lower + digits + symbols;
  const rest = Array.from({ length: 8 }, () => pick(all));

  return [...required, ...rest]
    .sort(() => Math.random() - 0.5)
    .join('');
};

// -------------------------------------------------------
// Création d'un utilisateur (sans affecter la session admin)
// -------------------------------------------------------

export const createAppUser = async (
  params: CreateUserParams
): Promise<{ user_id: string }> => {
  const data = await signUpViaREST(
    params.email.trim().toLowerCase(),
    params.password,
    {
      first_name: params.firstName,
      last_name:  params.lastName,
      full_name:  `${params.firstName} ${params.lastName}`.trim(),
      phone:      params.phone ?? '',
    }
  );

  // Le trigger `on_auth_user_created` crée automatiquement user_profiles.

  return { user_id: data.id };
};

// -------------------------------------------------------
// Récupère tous les app users avec leurs assignations
// -------------------------------------------------------

export const listAppUsers = async (): Promise<AppUser[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      is_active,
      created_at,
      staff:staff_id (
        full_name,
        email,
        phone,
        photo_url
      ),
      user_category_assignments (
        category,
        permission_level,
        allowed_actions
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p: any) => {
    const s          = Array.isArray(p.staff) ? p.staff[0] : p.staff;
    const assignment = p.user_category_assignments?.[0] ?? null;

    // Récupère les metadata Supabase auth si disponibles (stockées à la création)
    // Pour les users créés via createAppUser, le nom est dans staff ou metadata
    const fullName = s?.full_name ?? `Utilisateur ${(p.id as string).slice(0, 8)}`;

    return {
      user_id:          p.id,
      email:            s?.email     ?? null,
      full_name:        fullName,
      first_name:       s?.full_name?.split(' ')[0] ?? null,
      last_name:        s?.full_name?.split(' ').slice(1).join(' ') ?? null,
      phone:            s?.phone     ?? null,
      photo_url:        s?.photo_url ?? null,
      is_active:        p.is_active,
      category:         assignment?.category         ?? null,
      permission_level: assignment?.permission_level ?? null,
      allowed_actions:  Array.isArray(assignment?.allowed_actions) ? assignment.allowed_actions : [],
      created_at:       p.created_at,
    };
  });
};

// -------------------------------------------------------
// Assigner catégorie + permission à un utilisateur
// -------------------------------------------------------

export const assignCategoryPermission = async (
  userId:          string,
  category:        AgeCategory,
  permissionLevel: AppPermissionLevel,
  allowedActions:  AppAction[] = []
): Promise<void> => {
  const clubId = await getMyClubId();

  await supabase
    .from('user_category_assignments')
    .delete()
    .eq('user_id', userId);

  const { error } = await supabase
    .from('user_category_assignments')
    .insert({ user_id: userId, category, club_id: clubId, permission_level: permissionLevel, allowed_actions: allowedActions });

  if (error) throw error;
};

// -------------------------------------------------------
// Supprimer l'assignation d'un utilisateur
// -------------------------------------------------------

export const revokeAccess = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_category_assignments')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
};
