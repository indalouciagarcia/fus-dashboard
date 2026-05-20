import React, { useState } from 'react';
import { useStaff } from '../../hooks/useStaff';
import { useTeams } from '../../hooks/useTeams';
import { usePermissions } from '../../context/PermissionsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Shield, 
  UserCog, 
  KeySquare, 
  Blocks, 
  Check, 
  Save, 
  Search, 
  LayoutGrid,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';
import type { Staff, Role } from '../../types';
import { getUserAccessProfile, assignUserRoles, assignUserTeams } from '../../services/accessService';
import { Skeleton } from '../../components/ui/skeleton';

type DetailedRole = Role & { permissions: string[] };

const SYSTEM_ROLES: DetailedRole[] = [
  { id: 'role-1', name: 'super_admin', description: 'Accès global absolu', permissions: ['system_config', 'manage_all_clubs', 'manage_users', 'bypass_pbac_all', 'manage_roles'] },
  { id: 'role-2', name: 'club_admin', description: 'Gérant de club total', permissions: ['manage_club_settings', 'create_staff', 'manage_all_teams', 'delete_assets'] },
  { id: 'role-3', name: 'technical_director', description: 'Directeur Sportif', permissions: ['view_all_teams', 'edit_tactics_global', 'manage_transfers', 'view_advanced_stats'] },
  { id: 'role-4', name: 'coach', description: 'Entraîneur titulaire', permissions: ['view_assigned_teams_only', 'edit_match_lineups', 'edit_training_sessions', 'validate_matches'] },
  { id: 'role-5', name: 'assistant_coach', description: 'Adjoint technique', permissions: ['view_assigned_teams_only', 'edit_match_lineups', 'view_stats'] },
  { id: 'role-6', name: 'match_operator', description: 'Live Tracker', permissions: ['view_assigned_teams_only', 'input_live_events', 'input_match_stats'] },
  { id: 'role-7', name: 'viewer', description: 'Consultatif', permissions: ['view_assigned_teams_only', 'read_only_stats', 'view_calendar'] },
];

const AccessCenter: React.FC = () => {
  const { staff, isLoading: staffLoading } = useStaff();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { can } = usePermissions();
  const [showEditor, setShowEditor] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state to simulate assignments before saving to DB
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [draftTeams, setDraftTeams] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Security Gate
  if (!can('manage_roles')) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
         <div className="w-24 h-24 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center">
            <Shield className="w-12 h-12 text-destructive opacity-50" />
         </div>
         <h1 className="text-3xl font-black uppercase tracking-tighter italic">Accès Refusé</h1>
         <p className="text-muted-foreground font-bold">Vous devez avoir les privilèges d'administrateur système pour accéder à ce module.</p>
      </div>
    );
  }

  const handleSelectStaff = async (member: Staff) => {
    setSelectedStaff(member);
    setDraftRoles([]);
    setDraftTeams([]);
    setShowEditor(true);

    if (!member.user_id) {
      // Ce membre du staff n'a pas de compte utilisateur lié
      return;
    }

    setLoadingProfile(true);
    try {
      const profile = await getUserAccessProfile(member.user_id);
      setDraftRoles(profile.roles);
      setDraftTeams(profile.teams);
    } catch (e) {
      console.error("Failed to load access profile:", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const toggleRole = (roleName: string) => {
    // Force la sélection d'un UNIQUE rôle global RBAC (Remplace au lieu d'ajouter)
    setDraftRoles([roleName]);
  };

  const toggleTeam = (teamId: string) => {
    setDraftTeams(prev => prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]);
  };

  const saveAssignments = async () => {
    if (!selectedStaff?.user_id) {
       alert("Erreur critique : Ce membre n'a pas d'Identifiant Utilisateur (user_id) rattaché.");
       return;
    }

    setSaving(true);
    try {
      await assignUserRoles(selectedStaff.user_id, draftRoles);
      await assignUserTeams(selectedStaff.user_id, draftTeams);
      alert(`✅ Succès : Profil d'accès enregistré pour ${selectedStaff.full_name}.`);
    } catch (err: any) {
      console.error(err);
      alert(`Erreur de sauvegarde: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staff.filter(member => 
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = staffLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <Skeleton className="h-40 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 overflow-visible">
      <AnimatePresence mode="wait">
        {!showEditor ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
              <div className="flex items-center gap-6 relative z-10 text-white">
                 <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <KeySquare className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Centre d'Habilitations</h2>
                    <p className="text-white/50 text-sm font-medium">Gestion des Identités, Rôles (RBAC) et Périmètres (PBAC)</p>
                 </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[2rem] border shadow-sm relative max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-30" />
              <input 
                type="text" 
                placeholder="Rechercher un membre du staff..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-transparent border-none outline-none font-bold text-lg" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {filteredStaff.map(member => (
                 <motion.button 
                   key={member.id} 
                   onClick={() => handleSelectStaff(member)}
                   whileHover={{ y: -5 }}
                   className="flex items-center gap-4 p-5 rounded-[2.5rem] border-2 border-secondary bg-white hover:border-primary hover:shadow-xl transition-all text-left group"
                 >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border border-secondary shadow-inner shrink-0 group-hover:border-primary/50 transition-colors">
                       <img src={(member.photo_url && member.photo_url !== 'null') ? member.photo_url : `https://i.pravatar.cc/300?u=${member.id}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-sm uppercase truncate group-hover:text-primary transition-colors">{member.full_name}</h4>
                       <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{member.role}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all pr-2" />
                 </motion.button>
               ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-5xl mx-auto"
          >
             <div className="flex items-center gap-6 mb-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowEditor(false)} 
                  className="w-14 h-14 rounded-2xl bg-white border shadow-sm hover:bg-secondary transition-all"
                >
                  <X className="w-6 h-6 rotate-90" />
                </Button>
                <div>
                   <h3 className="text-4xl font-black tracking-tight uppercase italic font-black">Habilitations</h3>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Identity Access Management</p>
                </div>
             </div>

             <div className="bg-white border-none shadow-2xl rounded-[4rem] overflow-hidden relative">
                {loadingProfile && (
                  <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Chargement du profil...</p>
                  </div>
                )}

                <div className="p-12 border-b bg-gradient-to-br from-slate-950 to-slate-900 flex items-center gap-8 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                   <div className="w-24 h-24 rounded-[3rem] bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 relative z-10">
                      <img src={(selectedStaff?.photo_url && selectedStaff.photo_url !== 'null') ? selectedStaff.photo_url : `https://i.pravatar.cc/300?u=${selectedStaff?.id}`} className="w-full h-full object-cover" />
                   </div>
                   <div className="relative z-10">
                      <Badge className="bg-primary text-white border-none uppercase tracking-widest text-[9px] font-black px-4 py-1.5 mb-3 shadow-lg shadow-primary/20">Profil de Sécurité</Badge>
                      <h3 className="text-4xl font-black tracking-tighter uppercase italic">{selectedStaff?.full_name}</h3>
                      <p className="text-sm font-bold text-white/40 uppercase tracking-widest">{selectedStaff?.role} • {selectedStaff?.email || 'Aucun email associé'}</p>
                   </div>
                </div>

                <div className="p-12 space-y-16">
                   {/* Section 1: RBAC Roles */}
                   <div className="space-y-8">
                      {!selectedStaff?.user_id && (
                        <div className="bg-destructive/10 text-destructive border-2 border-destructive/20 p-6 rounded-[2rem] flex items-center gap-4">
                           <Shield className="w-8 h-8 shrink-0" />
                           <p className="text-xs font-black uppercase leading-relaxed">Attention : Ce membre n'a pas encore de compte utilisateur lié (user_id manquant). Les modifications resteront virtuelles.</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                             <Shield className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-[0.3em]">1. Rôle Global Systémique (RBAC)</h4>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {SYSTEM_ROLES.map(role => {
                            const isActive = draftRoles.includes(role.name);
                            return (
                              <button 
                                key={role.id} 
                                onClick={() => toggleRole(role.name)} 
                                className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start text-left relative group overflow-hidden ${isActive ? 'bg-primary/5 border-primary shadow-xl scale-[1.02]' : 'bg-white border-secondary hover:border-primary/30'}`}
                              >
                                 <div className={`p-3 rounded-xl mb-4 transition-colors ${isActive ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                                    <UserCog className="w-5 h-5" />
                                 </div>
                                 <span className={`text-sm font-black uppercase tracking-widest mb-2 ${isActive ? 'text-primary' : 'text-foreground'}`}>{role.name.replace('_', ' ')}</span>
                                 <span className="text-[10px] font-medium text-muted-foreground leading-relaxed h-10">{role.description}</span>

                                 <div className="mt-6 flex flex-wrap gap-1.5 pt-6 border-t border-secondary/50 w-full">
                                    {role.permissions.map((p, idx) => (
                                       <span key={idx} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${p.includes('assigned') ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                          {p.split('_')[0]}
                                       </span>
                                    ))}
                                 </div>
                              </button>
                            )
                         })}
                       </div>
                   </div>

                   {/* Section 2: PBAC Perimeters */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Blocks className="w-5 h-5" />
                         </div>
                         <h4 className="text-sm font-black uppercase tracking-[0.3em]">2. Périmètre d'Action (PBAC)</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                         <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4">
                            <LayoutGrid className="w-8 h-8 text-primary mb-2" />
                            <h5 className="text-xs font-black uppercase tracking-widest">Assignation des Sections</h5>
                            <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase">Si le rôle est soumis à un périmètre spécifique (ex: Coach), l'utilisateur n'aura accès qu'aux unités sélectionnées ici.</p>
                         </div>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {teams.map(team => {
                              const isActive = draftTeams.includes(team.id);
                              return (
                                <button 
                                  key={team.id} 
                                  onClick={() => toggleTeam(team.id)} 
                                  className={`h-16 px-6 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-slate-50 border-secondary text-muted-foreground hover:border-emerald-500/30'}`}
                                >
                                   {team.category} • {team.name}
                                </button>
                              )
                            })}
                         </div>
                      </div>
                   </div>

                   {/* Save Bar */}
                   <div className="pt-12 border-t border-secondary/50 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 text-muted-foreground">
                         <div className={`w-3 h-3 rounded-full animate-pulse ${saving ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                         <span className="text-[10px] font-black uppercase tracking-widest">{saving ? 'Synchronisation en cours...' : 'Système Opérationnel'}</span>
                      </div>
                      <div className="flex gap-4 w-full md:w-auto">
                         <Button variant="ghost" onClick={() => setShowEditor(false)} className="flex-1 md:flex-none h-20 px-10 rounded-[2rem] font-bold uppercase tracking-widest text-xs">Annuler</Button>
                         <Button disabled={saving} onClick={saveAssignments} className="flex-1 md:flex-none h-20 px-16 rounded-[3rem] bg-slate-950 hover:bg-black text-white shadow-2xl transition-all font-black uppercase tracking-widest text-xs gap-4 active:scale-95">
                            {saving ? 'Enregistrement...' : 'Confirmer les Habilitations'} <Save className="w-6 h-6" />
                         </Button>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessCenter;
