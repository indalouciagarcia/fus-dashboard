import React, { useState, useMemo } from 'react';
import { useTeams } from '../../hooks/useTeams';
import { useStaff } from '../../hooks/useStaff';
import { usePlayers } from '../../hooks/usePlayers';
import { useClubData } from '../../hooks/useClubData';
import { usePermissions } from '../../context/PermissionsContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Shield, 
  LayoutGrid, 
  List as ListIcon,
  User,
  TrendingUp,
  X,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '../../services/teamService';
import type { Player } from '../../types';
import { useSurclassements } from '../../hooks/useSurclassements';
import { Skeleton } from '../../components/ui/skeleton';

const TeamManagement: React.FC = () => {
  const { teams, isLoading: teamsLoading, addTeam, updateTeam, deleteTeam } = useTeams();
  const { staff } = useStaff();
  const { players, updatePlayer } = usePlayers();
  const { mainClub, isLoading: clubLoading } = useClubData();
  const { can } = usePermissions();
  const { surclassements } = useSurclassements();

  const [viewState, setViewState] = useState<'LIST' | 'FORM' | 'ROSTER'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [isAssignMode, setIsAssignMode] = useState(false);
  
  // Settings sync
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(mainClub?.preferred_view_mode || 'list');
  const [pageSize, setPageSize] = useState(mainClub?.pagination_limit || 10);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    if (mainClub?.preferred_view_mode) setDisplayMode(mainClub.preferred_view_mode);
    if (mainClub?.pagination_limit) setPageSize(mainClub.pagination_limit);
  }, [mainClub]);

  const [formData, setFormData] = useState<Omit<Team, 'id' | 'created_at'>>({
    name: '',
    category: 'U13',
    coach_id: '',
    photo_url: ''
  });

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const perimAccess = can('manage_teams') || can('manage_lineup', 'team', t.id);
      if (!perimAccess) return false;

      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || t.category?.toUpperCase() === categoryFilter.toUpperCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [teams, searchTerm, categoryFilter, can]);

  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTeams.slice(start, start + pageSize);
  }, [filteredTeams, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTeams.length / pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // IDs des joueurs surclassés actifs vers cette équipe
  const surclassedIdsForRoster = useMemo(() => {
    if (!rosterTeam) return new Set<string>();
    return new Set(
      surclassements
        .filter(s => s.status === 'active' && s.target_team_id === rosterTeam.id)
        .map(s => s.player_id)
    );
  }, [surclassements, rosterTeam]);

  // Map playerId → original_category pour badge
  const surclassedOriginMap = useMemo(() => {
    if (!rosterTeam) return {} as Record<string, string>;
    return Object.fromEntries(
      surclassements
        .filter(s => s.status === 'active' && s.target_team_id === rosterTeam.id)
        .map(s => [s.player_id, s.original_category])
    );
  }, [surclassements, rosterTeam]);

  // Map playerId → target_jersey_number pour joueurs surclassés
  const surclassedJerseyMap = useMemo(() => {
    if (!rosterTeam) return {} as Record<string, number | null>;
    return Object.fromEntries(
      surclassements
        .filter(s => s.status === 'active' && s.target_team_id === rosterTeam.id && s.target_jersey_number != null)
        .map(s => [s.player_id, s.target_jersey_number])
    );
  }, [surclassements, rosterTeam]);

  // État pour l'édition inline du numéro de maillot
  const [editingJerseyId, setEditingJerseyId] = useState<string | null>(null);
  const [editingJerseyValue, setEditingJerseyValue] = useState<string>('');

  const rosterPlayers = useMemo(() => {
    if (!rosterTeam) return [];
    const regular = players.filter(p => (p as any).team_id === rosterTeam.id);
    const surclassed = players.filter(p =>
      surclassedIdsForRoster.has(p.id) && (p as any).team_id !== rosterTeam.id
    );
    return [...regular, ...surclassed];
  }, [rosterTeam, players, surclassedIdsForRoster]);

  const availablePlayers = useMemo(() => {
    if (!rosterTeam) return [];
    return players.filter(p =>
      (p as any).team_id !== rosterTeam.id &&
      p.category?.toUpperCase() === rosterTeam.category?.toUpperCase() &&
      !surclassedIdsForRoster.has(p.id)
    );
  }, [rosterTeam, players, surclassedIdsForRoster]);

  const handleAssignPlayer = async (player: Player) => {
    if (!rosterTeam) return;
    try {
      await updatePlayer({ id: player.id, data: { team_id: rosterTeam.id } as Partial<Player> });
    } catch (e) {
      console.error("Failed to assign player", e);
    }
  };

  const handleRemovePlayer = async (player: Player) => {
    try {
      await updatePlayer({ id: player.id, data: { team_id: null } as any });
    } catch (e) {
      console.error("Failed to remove player", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       if (editingTeam) {
         await updateTeam({ id: editingTeam.id, data: formData });
       } else {
         await addTeam(formData);
       }
       setViewState('LIST');
    } catch (err) {
       console.error("Failed to save team:", err);
    }
  };

  const handleOpenAdd = () => {
    setEditingTeam(null);
    setFormData({ name: '', category: 'U13', coach_id: '', photo_url: '' });
    setViewState('FORM');
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      category: team.category,
      coach_id: team.coach_id || '',
      photo_url: (team.photo_url && team.photo_url !== 'null') ? team.photo_url : ''
    });
    setViewState('FORM');
  };

  const handleOpenRoster = (team: Team) => {
    setRosterTeam(team);
    setViewState('ROSTER');
  };

  const getCoachName = (coachId?: string) => {
    if (!coachId) return 'Aucun Coach';
    const member = staff.find(s => s.id === coachId);
    return member ? member.full_name : 'Staff Inconnu';
  };

  const getAssistantCoachName = (coachId?: string) => {
    if (!coachId) return null;
    const assistant = staff.find(s => s.role === 'assistant_coach' && s.parent_coach_id === coachId);
    return assistant ? assistant.full_name : null;
  };

  if (teamsLoading || clubLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="h-40 w-full rounded-[2.5rem] bg-secondary/20 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 overflow-visible">
      <AnimatePresence mode="wait">
        {viewState === 'LIST' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden">
               <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                     <Users className="w-8 h-8" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black tracking-tighter uppercase italic">Unités de Squad</h2>
                     <p className="text-muted-foreground text-sm font-medium">Gestion des catégories d'âge et des effectifs</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 relative z-10">
                  <div className="flex bg-secondary/50 p-1.5 rounded-2xl border">
                     <Button 
                       variant={displayMode === 'list' ? 'default' : 'ghost'} 
                       size="icon" 
                       onClick={() => setDisplayMode('list')}
                       className="rounded-xl w-10 h-10"
                     >
                        <ListIcon className="w-4 h-4" />
                     </Button>
                     <Button 
                       variant={displayMode === 'grid' ? 'default' : 'ghost'} 
                       size="icon" 
                       onClick={() => setDisplayMode('grid')}
                       className="rounded-xl w-10 h-10"
                     >
                        <LayoutGrid className="w-4 h-4" />
                     </Button>
                  </div>
                  {can('manage_teams') && (
                    <Button onClick={handleOpenAdd} className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                       <Plus className="w-4 h-4" /> Nouveau Squad
                    </Button>
                  )}
               </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 p-4 rounded-[2rem] bg-white border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-30" />
                    <Input 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Filtrer par nom ou catégorie..." 
                      className="h-14 pl-14 pr-6 rounded-2xl bg-secondary/20 border-none font-bold text-sm focus:bg-white transition-all shadow-inner"
                    />
                </div>
                
                <div className="flex bg-secondary/30 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                  {(['ALL', 'U7', 'U9', 'U11', 'U13', 'U14', 'U15', 'U16', 'U17', 'U19', 'U21', 'SENIOR'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        categoryFilter === cat ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
            </div>

            {displayMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {paginatedTeams.map((team) => (
                    <motion.div key={team.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                       <Card className="group relative border shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white">
                          <div className="aspect-[4/3] bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary group-hover:from-primary/10 transition-colors" />
                             
                             {mainClub?.logo_url ? (
                               <img src={mainClub.logo_url} alt="Club" className="w-32 h-32 object-contain opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700 blur-[2px] group-hover:blur-0" />
                             ) : (
                               <Shield className="w-32 h-32 text-primary/5 opacity-10" />
                             )}
                             
                             <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center p-4 transform -rotate-3 group-hover:rotate-0 transition-transform">
                                   {mainClub?.logo_url ? (
                                     <img src={mainClub.logo_url} alt="Club Logo" className="w-full h-full object-contain" />
                                   ) : (
                                     <Shield className="w-10 h-10 text-primary" />
                                   )}
                                </div>
                                <span className="px-6 py-2 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl transform translate-y-2 translate-x-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                                   {team.category}
                                </span>
                             </div>

                             {can('manage_teams') && (
                               <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                  <Button size="icon" onClick={() => handleOpenEdit(team)} className="w-10 h-10 rounded-xl bg-white/95 text-primary hover:bg-primary hover:text-white shadow-xl">
                                     <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" onClick={() => deleteTeam(team.id)} className="w-10 h-10 rounded-xl bg-white/95 text-destructive hover:bg-destructive hover:text-white shadow-xl">
                                     <Trash2 className="w-4 h-4" />
                                  </Button>
                               </div>
                             )}
                          </div>
                          <CardContent className="p-8">
                             <h3 className="text-xl font-black tracking-tight uppercase mb-4 group-hover:text-primary transition-colors truncate">{team.name}</h3>
                             <div className="space-y-3">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                   <User className="w-3.5 h-3.5 text-primary" />
                                   <span className="text-xs font-bold">{getCoachName(team.coach_id)}</span>
                                </div>
                                {getAssistantCoachName(team.coach_id) && (
                                  <div className="flex items-center gap-3 text-muted-foreground">
                                     <UserCog className="w-3.5 h-3.5 text-emerald-500" />
                                     <span className="text-xs font-bold text-emerald-600">{getAssistantCoachName(team.coach_id)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-muted-foreground">
                                   <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                   <span className="text-xs font-bold uppercase tracking-widest text-[9px]">Elite Performance Level</span>
                                </div>
                             </div>
                             <Button onClick={() => handleOpenRoster(team)} variant="ghost" className="w-full mt-8 rounded-xl bg-secondary/30 hover:bg-primary hover:text-white font-black uppercase tracking-widest text-[10px] h-10 transition-all active:scale-95 group/btn">
                                 Voir l'Effectif <Users className="w-3 h-3 ml-2 opacity-50 group-hover/btn:opacity-100" />
                             </Button>
                          </CardContent>
                       </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/10 border-b">
                    <tr>
                      <th className="text-left px-10 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Squad</th>
                      <th className="text-left py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coach</th>
                      <th className="text-right px-10 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary/30">
                    {paginatedTeams.map((team) => (
                      <tr key={team.id} className="group hover:bg-secondary/5 transition-colors">
                        <td className="px-10 py-4">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-secondary/30 overflow-hidden border-2 border-white shadow-md flex items-center justify-center">
                                 {mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-full h-full object-contain p-2" /> : <Shield className="w-6 h-6 text-primary" />}
                              </div>
                              <span className="font-black text-base uppercase italic tracking-tighter">{team.name}</span>
                           </div>
                        </td>
                        <td className="py-4">
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-muted-foreground uppercase">{getCoachName(team.coach_id)}</span>
                              {getAssistantCoachName(team.coach_id) && (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                  <UserCog className="w-3 h-3 inline mr-1" />{getAssistantCoachName(team.coach_id)}
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-10 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenRoster(team)} className="rounded-xl font-black uppercase text-[9px] h-10 px-4 mr-2 hover:bg-primary hover:text-white transition-all">Roster</Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(team)} className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md transition-all"><Edit2 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteTeam(team.id)} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                 <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    Affichage {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredTeams.length)} sur {filteredTeams.length}
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-10 h-10 rounded-2xl bg-white border-secondary"><ChevronLeft className="w-4 h-4" /></Button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button key={i} variant={currentPage === i + 1 ? 'default' : 'ghost'} size="sm" onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-2xl font-black text-[11px] ${currentPage === i + 1 ? 'shadow-lg shadow-primary/20 bg-primary' : 'bg-white border-secondary border'}`}>{i + 1}</Button>
                    ))}
                    <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="w-10 h-10 rounded-2xl bg-white border-secondary"><ChevronRight className="w-4 h-4" /></Button>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Par page:</span>
                    <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="h-10 w-20 rounded-2xl bg-white border border-secondary font-black text-xs px-2 appearance-none cursor-pointer text-center">
                       {[5, 10, 15, 20, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                 </div>
              </div>
            )}
            
            {filteredTeams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                 <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                    <Users className="w-8 h-8 opacity-20" />
                 </div>
                 <p className="text-muted-foreground font-medium italic uppercase tracking-widest text-[10px]">Aucun squad trouvé.</p>
              </div>
            )}
          </motion.div>
        ) : viewState === 'FORM' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto"
          >
             <div className="flex items-center gap-6 mb-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewState('LIST')} 
                  className="w-14 h-14 rounded-2xl bg-white border shadow-sm hover:bg-secondary transition-all"
                >
                  <X className="w-6 h-6 rotate-90" />
                </Button>
                <div>
                   <h3 className="text-4xl font-black tracking-tight uppercase italic">{editingTeam ? 'Elite Edit' : 'New Squad Unit'}</h3>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Official Squad Setup</p>
                </div>
             </div>

             <Card className="border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white">
                <form onSubmit={handleSubmit} className="p-12 space-y-12">
                   <div className="space-y-10">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nom de l'Unité / Équipe</label>
                         <Input 
                           required
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                           placeholder="ex. FUS Casablanca U15" 
                           className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20" 
                         />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Catégorie d'Âge</label>
                            <select 
                              value={formData.category}
                              onChange={e => setFormData({...formData, category: e.target.value})}
                              className="w-full h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg outline-none appearance-none cursor-pointer focus:ring-2 ring-primary/20"
                            >
                               {['U7', 'U9', 'U11', 'U13', 'U14', 'U15', 'U16', 'U17', 'U19', 'U21', 'Senior', 'Veteran'].map(cat => (
                                 <option key={cat} value={cat}>{cat} Unit</option>
                               ))}
                            </select>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Entraîneur Principal</label>
                            <select 
                              value={formData.coach_id}
                              onChange={e => setFormData({...formData, coach_id: e.target.value})}
                              className="w-full h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg outline-none appearance-none cursor-pointer focus:ring-2 ring-primary/20"
                            >
                               <option value="">-- Aucun Coach Assigné --</option>
                               {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                            </select>
                         </div>
                      </div>

                      <div className="p-10 rounded-[3rem] bg-secondary/20 flex items-center gap-8 text-left relative overflow-hidden text-slate-900/80">
                         <div className="absolute top-0 right-0 w-40 h-40 bg-white/40 rounded-full blur-[80px] pointer-events-none" />
                         <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center p-4 relative z-10">
                            {mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-12 h-12 text-primary" />}
                         </div>
                         <div className="relative z-10 leading-none">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Branding Automatique</p>
                            <p className="text-xs font-bold italic leading-relaxed">"Cette unité sera automatiquement badgée avec les insignes officiels du club et passera sous le contrôle du département technique."</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-8 border-t border-secondary/50">
                      <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-secondary" onClick={() => setViewState('LIST')}>Annuler</Button>
                      <Button type="submit" className="flex-1 h-16 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">
                         {editingTeam ? 'Mettre à Jour le Squad' : 'Initialiser l\'Unité'}
                      </Button>
                   </div>
                </form>
             </Card>
          </motion.div>
        ) : (
          <motion.div
            key="roster"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-5xl mx-auto"
          >
             {rosterTeam && (
               <div className="space-y-10">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setViewState('LIST'); setIsAssignMode(false); }} 
                          className="w-14 h-14 rounded-2xl bg-white border shadow-sm hover:bg-secondary transition-all"
                        >
                          <X className="w-6 h-6 rotate-90" />
                        </Button>
                        <div>
                           <div className="flex items-center gap-3">
                              <h3 className="text-4xl font-black tracking-tight uppercase italic">{rosterTeam.name}</h3>
                              <Badge className="bg-primary text-white font-black uppercase px-4 py-1 border-none text-[10px]">{rosterTeam.category}</Badge>
                           </div>
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Official Team Roster • {rosterPlayers.length} Athlètes</p>
                        </div>
                     </div>
                     <Button 
                        variant={isAssignMode ? "default" : "outline"} 
                        onClick={() => setIsAssignMode(!isAssignMode)} 
                        className={`rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs gap-3 shadow-lg transition-all ${isAssignMode ? 'bg-primary text-white' : 'border-secondary'}`}
                     >
                        {isAssignMode ? 'Fermer la Gestion' : 'Modifier l\'Effectif'} <UserCog className="w-4 h-4" />
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                     <div className={isAssignMode ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-10">
                           <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-3">
                              <div className="w-8 h-px bg-primary/30" /> Effectif Actuel ({rosterPlayers.length})
                           </h4>
                           
                           <div className={`grid gap-4 ${isAssignMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                              {rosterPlayers.length > 0 ? (
                                 rosterPlayers.map(player => {
                                    const originCat = surclassedOriginMap[player.id];
                                    const isSurclasse = !!originCat;
                                    const displayJersey = surclassedJerseyMap[player.id] ?? player.jersey_number;
                                    const isEditingJersey = editingJerseyId === player.id;
                                    return (
                                    <motion.div key={player.id} layout className={`flex items-center gap-6 p-4 rounded-3xl border transition-all ${isAssignMode ? 'bg-red-50/20 border-red-100' : isSurclasse ? 'bg-orange-50/30 border-orange-200' : 'bg-slate-50/50 border-secondary'} group`}>
                                       <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex items-center justify-center relative shrink-0 border shadow-sm">
                                          <img src={(player.photo_url && player.photo_url !== 'null') ? player.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`} alt={player.full_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-black text-lg uppercase truncate leading-none">{player.full_name}</h4>
                                            {isSurclasse && (
                                              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 text-[9px] font-black uppercase">
                                                ↑ {originCat}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 mt-2">
                                             {isEditingJersey ? (
                                               <div className="flex items-center gap-2">
                                                 <span className="text-[10px] font-black text-muted-foreground">#</span>
                                                 <input
                                                   type="number"
                                                   min={1} max={99}
                                                   autoFocus
                                                   value={editingJerseyValue}
                                                   onChange={e => setEditingJerseyValue(e.target.value)}
                                                   onBlur={async () => {
                                                     const n = parseInt(editingJerseyValue, 10);
                                                     if (!isNaN(n) && n > 0 && n !== player.jersey_number) {
                                                       try {
                                                         await updatePlayer({ id: player.id, data: { jersey_number: n } as any });
                                                       } catch {
                                                         setEditingJerseyValue(String(player.jersey_number ?? ''));
                                                         return;
                                                       }
                                                     }
                                                     setEditingJerseyId(null);
                                                   }}
                                                   onKeyDown={async e => {
                                                     if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                     if (e.key === 'Escape') setEditingJerseyId(null);
                                                   }}
                                                   className="w-16 px-2 py-1 text-xs font-black text-center rounded-lg border-2 border-primary bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                 />
                                                 <span className="text-[9px] text-muted-foreground">↵ valider</span>
                                               </div>
                                             ) : (
                                               <div className="flex items-center gap-2">
                                                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                   #{displayJersey ?? '—'}
                                                   {isSurclasse && surclassedJerseyMap[player.id] != null && (
                                                     <span className="ml-1 text-orange-500 text-[9px]">(surclassé)</span>
                                                   )}
                                                 </span>
                                                 <button
                                                   onMouseDown={e => e.stopPropagation()}
                                                   onClick={e => {
                                                     e.stopPropagation();
                                                     e.preventDefault();
                                                     setEditingJerseyId(player.id);
                                                     setEditingJerseyValue(String(player.jersey_number ?? ''));
                                                   }}
                                                   title="Modifier le numéro de maillot"
                                                   className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:border-primary hover:text-primary text-muted-foreground transition-all text-[9px] font-black uppercase cursor-pointer"
                                                 >
                                                   <Edit2 className="w-2.5 h-2.5" />
                                                   Modifier
                                                 </button>
                                               </div>
                                             )}
                                             <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-5">{player.position}</Badge>
                                          </div>
                                       </div>
                                       {isAssignMode && !isSurclasse && (
                                          <Button size="icon" variant="ghost" onClick={() => handleRemovePlayer(player)} className="h-12 w-12 rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all shrink-0">
                                             <X className="w-5 h-5" />
                                          </Button>
                                       )}
                                    </motion.div>
                                    );
                                 })
                              ) : (
                                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-30 border-2 border-dashed border-secondary rounded-[3rem]">
                                    <Users className="w-12 h-12 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Effectif Vide</p>
                                 </div>
                              )}
                           </div>
                        </Card>
                     </div>

                     {isAssignMode && (
                        <div className="lg:col-span-5">
                           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-10">
                                 <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-8 flex items-center gap-3">
                                    <div className="w-8 h-px bg-emerald-300" /> Disponibles ({rosterTeam.category})
                                 </h4>

                                 <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                                    {availablePlayers.length > 0 ? (
                                       availablePlayers.map(player => (
                                          <div key={player.id} className="flex items-center gap-5 p-4 rounded-3xl border border-emerald-100 bg-emerald-50/10 hover:border-emerald-300 transition-all group">
                                             <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden flex items-center justify-center relative shrink-0 shadow-sm border border-emerald-100">
                                                <img src={(player.photo_url && player.photo_url !== 'null') ? player.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`} alt={player.full_name} className="w-full h-full object-cover" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-sm uppercase truncate text-slate-700 leading-none">{player.full_name}</h4>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mt-2">#{player.jersey_number} • {player.position}</p>
                                             </div>
                                             <Button size="icon" variant="ghost" onClick={() => handleAssignPlayer(player)} className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white shrink-0 shadow-sm transition-all">
                                                <Plus className="w-5 h-5" />
                                             </Button>
                                          </div>
                                       ))
                                    ) : (
                                       <div className="text-center py-10 opacity-30">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aucun joueur disponible en {rosterTeam.category}.</p>
                                       </div>
                                    )}
                                 </div>
                              </Card>
                           </motion.div>
                        </div>
                     )}
                  </div>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagement;
