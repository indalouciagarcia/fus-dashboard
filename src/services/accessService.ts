import { supabase } from '../lib/supabase';

// Helper pour assigner un ou plusieurs rôles à un utilisateur
export const assignUserRoles = async (userId: string, roleNames: string[]) => {
  // 1. Récupérer les IDs des roles en fonction des noms
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, name')
    .in('name', roleNames);
    
  if (rolesError) throw rolesError;
  
  // 2. Supprimer les anciens rôles de cet utilisateur
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
    
  if (deleteError) throw deleteError;

  if (roles && roles.length > 0) {
    // 3. Insérer les nouveaux rôles
    const rolesToInsert = roles.map(r => ({
      user_id: userId,
      role_id: r.id
    }));
    
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(rolesToInsert);
      
    if (insertError) throw insertError;
  }
};

// Helper pour assigner un ou plusieurs périmètres (équipes) à un utilisateur
export const assignUserTeams = async (userId: string, teamIds: string[]) => {
  // 1. Supprimer les affectations d'équipe existantes pour l'utilisateur
  const { error: deleteError } = await supabase
    .from('user_team_assignments')
    .delete()
    .eq('user_id', userId);
    
  if (deleteError) throw deleteError;

  if (teamIds && teamIds.length > 0) {
    // 2. Insérer les nouvelles requêtes d'équipes
    const teamsToInsert = teamIds.map(teamId => ({
      user_id: userId,
      team_id: teamId
    }));
    
    const { error: insertError } = await supabase
      .from('user_team_assignments')
      .insert(teamsToInsert);
      
    if (insertError) throw insertError;
  }
};

// Récupère les permissions et périmètres actuels d'un utilisateur (pour préremplir l'interface)
export const getUserAccessProfile = async (userId: string) => {
  // Roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);
    
  if (rolesError) throw rolesError;
  
  // Teams
  const { data: userTeams, error: teamsError } = await supabase
    .from('user_team_assignments')
    .select('team_id')
    .eq('user_id', userId);
    
  if (teamsError) throw teamsError;

  // Formatting output
  const roles = userRoles?.map((r: any) => r.roles.name) || [];
  const teams = userTeams?.map((t: any) => t.team_id) || [];

  return { roles, teams };
};

// Récupère l'ensemble des accès système (Rôles + Périmètres) mappés par staff_id
export const getAllStaffAccessProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      staff_id,
      user_roles (
        roles ( name )
      ),
      user_team_assignments ( team_id )
    `)
    .not('staff_id', 'is', null);

  if (error) throw error;
  
  const mapping: Record<string, { roles: string[], teams: string[] }> = {};
  
  data?.forEach((profile: any) => {
    if (profile.staff_id) {
      mapping[profile.staff_id] = {
        roles: profile.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [],
        teams: profile.user_team_assignments?.map((uta: any) => uta.team_id).filter(Boolean) || []
      };
    }
  });

  return mapping;
};
