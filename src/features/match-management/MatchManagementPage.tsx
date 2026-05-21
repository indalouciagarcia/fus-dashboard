import React, { useState, useMemo } from 'react';
import { useMatches } from '../../hooks/useMatches';
import { useClubData } from '../../hooks/useClubData';
import { useCompetitions } from '../../hooks/useCompetitions';
import { usePermissions } from '../../context/PermissionsContext';
import { useAutoMatchActivation } from '../../hooks/useAutoMatchActivation';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
   Trophy,
   LayoutPanelLeft,
   Calendar,
   MapPin,
   ChevronRight,
   Play,
   Plus,
   Users,
   Timer,
   Target,
   History,
   Trash2,
   Shield,
   Search,
   Filter,
   Activity,
   BarChart3,
   Video,
   X,
   Clock,
   Radio,
   Save
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import MatchPreparation from './MatchPreparation';
import LiveTracking from './LiveTracking';
import ScheduleMatchWizard from './ScheduleMatchWizard';
import MatchStatsView from './MatchStatsView';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_CATEGORIES } from '../../constants';
import type { Match } from '../../types';

// Match list item component
interface MatchListItemProps {
   match: Match;
   isSelected: boolean;
   onSelect: () => void;
   onDelete: (e: React.MouseEvent) => void;
   onStartLive?: (e: React.MouseEvent) => void;
   opponentClubs: any[];
   getOpponentName: (clubId: string) => string;
   variant: 'live' | 'upcoming' | 'past';
}

const MatchListItem: React.FC<MatchListItemProps> = ({ 
   match, isSelected, onSelect, onDelete, onStartLive, opponentClubs, getOpponentName, variant 
}) => {
   const getVariantStyles = () => {
      switch (variant) {
         case 'live':
            return isSelected 
               ? 'bg-red-50/50 border-red-400 shadow-lg shadow-red-500/10' 
               : 'bg-white border-red-200 hover:border-red-300';
         case 'upcoming':
            return isSelected 
               ? 'bg-emerald-50/50 border-emerald-400 shadow-lg shadow-emerald-500/10' 
               : 'bg-white border-emerald-200 hover:border-emerald-300';
         case 'past':
            return isSelected 
               ? 'bg-slate-50 border-slate-400 shadow-lg' 
               : 'bg-white border-slate-200 hover:border-slate-300';
      }
   };

   const getScoreBadge = () => {
      if (match.status !== 'finished') return null;
      const fusScore = match.is_home ? match.score_home : match.score_away;
      const oppScore = match.is_home ? match.score_away : match.score_home;
      return (
         <div className="flex items-center gap-1 text-sm font-black tabular-nums">
            <span>{fusScore || 0}</span>
            <span className="text-muted-foreground">-</span>
            <span>{oppScore || 0}</span>
         </div>
      );
   };

   return (
      <motion.div
         layout
         onClick={onSelect}
         whileHover={{ scale: 1.02 }}
         whileTap={{ scale: 0.98 }}
         className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden ${getVariantStyles()}`}
      >
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-white border flex items-center justify-center p-1.5 shadow-sm transition-all ${isSelected ? 'ring-2 ring-primary/20' : ''}`}>
               <img 
                  src={opponentClubs.find(c => c.id === match.opponent_id)?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random`} 
                  alt="" 
                  className="w-full h-full object-contain" 
               />
            </div>
            <div>
               <h5 className="text-[12px] font-black uppercase tracking-tight text-foreground leading-none">
                  {getOpponentName(match.opponent_id)}
               </h5>
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                  {match.match_date} • {match.category}
               </p>
               {match.status === 'live' && (
                  <Badge className="mt-1 bg-red-500 text-white text-[8px] font-black px-2 py-0 rounded-full">
                     LIVE
                  </Badge>
               )}
            </div>
         </div>
         
         <div className="flex items-center gap-3">
            {match.match_phase === 'won' && (
               <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">✅ Gagné</span>
            )}
            {match.match_phase === 'lost' && (
               <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-red-100 text-red-700">❌ Perdu</span>
            )}
            {match.video_url && (
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm" title="Vidéo disponible">
                  <Video className="w-4 h-4" />
               </div>
            )}
            {getScoreBadge()}
            {/* Live en cours button for scheduled matches */}
            {variant === 'upcoming' && onStartLive && (
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartLive}
                  className="h-8 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
               >
                  <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                  <span className="text-[9px] font-black uppercase">Live</span>
               </Button>
            )}
            {(variant === 'upcoming' || variant === 'live') ? (
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 px-3 rounded-lg bg-orange-50 hover:bg-red-100 text-orange-600 hover:text-red-600 border border-orange-200 hover:border-red-200 transition-all"
               >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-[9px] font-black uppercase">Annuler</span>
               </Button>
            ) : (
               <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onDelete}
                  className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
               >
                  <Trash2 className="w-4 h-4" />
               </Button>
            )}
            <ChevronRight className={`w-4 h-4 transition-all ${isSelected ? 'text-primary translate-x-1' : 'text-muted-foreground opacity-20'}`} />
         </div>
      </motion.div>
   );
};

const MatchManagementPage: React.FC = () => {
   const { matches, deleteMatch, updateMatch, isLoading: matchesLoading, refetch } = useMatches();
   const { mainClub, opponentClubs, isLoading: clubLoading } = useClubData();
   const { leagues } = useCompetitions();
   const { can } = usePermissions();
   
   const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<'details' | 'preparation' | 'live' | 'wizard' | 'stats'>('details');
   const [listFilter, setListFilter] = useState<'scheduled' | 'finished' | 'today'>('scheduled');
   const [deletingId, setDeletingId] = useState<string | null>(null);
   const [categoryFilter, setCategoryFilter] = useState<string>('All');
   const [leagueFilter, setLeagueFilter] = useState<string>('All');
   const [dateFilter, setDateFilter] = useState<string>('');
   const [editingVideoUrl, setEditingVideoUrl] = useState<string>('');
   const [showVideoInput, setShowVideoInput] = useState(false);
   const [viewMode, setViewMode] = useState<'list' | 'planning'>('list');
   const [currentMonth, setCurrentMonth] = useState(new Date());

   const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
   ];
   const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

   // Calendar Drag and Drop handlers
   // Calendar Drag and Drop handlers using local React state for maximum reliability
   const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null);

   const handleDragStart = (e: React.DragEvent, matchId: string) => {
      setDraggedMatchId(matchId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', matchId);
   };

   const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
   };

   const handleDrop = async (e: React.DragEvent, targetDate: string) => {
      e.preventDefault();
      const matchId = draggedMatchId || e.dataTransfer.getData('text/plain');
      if (matchId && matchId !== 'drag') {
         try {
            await updateMatch({ id: matchId, data: { match_date: targetDate } });
            refetch?.();
         } catch (err) {
            console.error('Failed to reschedule match via Drag and Drop:', err);
         }
      }
      setDraggedMatchId(null);
   };

   // Month calculation logic
   const year = currentMonth.getFullYear();
   const month = currentMonth.getMonth();

   const firstDayOfMonth = new Date(year, month, 1);
   let startDayOfWeek = firstDayOfMonth.getDay();
   // Adjust so Monday is 0 and Sunday is 6
   startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

   const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

   const prevMonthYear = month === 0 ? year - 1 : year;
   const prevMonthIndex = month === 0 ? 11 : month - 1;
   const totalDaysInPrevMonth = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();

   const calendarDays: Array<{ date: Date; isCurrentMonth: boolean; formattedDate: string }> = [];

   // Pad with previous month
   for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = totalDaysInPrevMonth - i;
      const d = new Date(prevMonthYear, prevMonthIndex, day);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      calendarDays.push({
         date: d,
         isCurrentMonth: false,
         formattedDate: `${yyyy}-${mm}-${dd}`
      });
   }

   // Current month days
   for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      calendarDays.push({
         date: d,
         isCurrentMonth: true,
         formattedDate: `${yyyy}-${mm}-${dd}`
      });
   }

   // Pad with next month days to complete 42 cells
   const nextMonthYear = month === 11 ? year + 1 : year;
   const nextMonthIndex = month === 11 ? 0 : month + 1;
   const remainingCells = 42 - calendarDays.length;
   for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(nextMonthYear, nextMonthIndex, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      calendarDays.push({
         date: d,
         isCurrentMonth: false,
         formattedDate: `${yyyy}-${mm}-${dd}`
      });
   }

   // Auto-activate scheduled matches when their time arrives
   useAutoMatchActivation(matches, (matchId) => {
      // Refresh matches when one is auto-activated
      refetch?.();
      // If the activated match is selected, refresh the view
      if (selectedMatchId === matchId) {
         setListFilter('today');
      }
   });

   const isLoading = matchesLoading || clubLoading;

   // Auto-select first match once loaded
   useMemo(() => {
      if (!selectedMatchId && matches.length > 0) {
         const first = matches.find(m => m.status === (listFilter === 'today' ? 'live' : listFilter))?.id || matches[0].id;
         setSelectedMatchId(first);
      }
   }, [matches, selectedMatchId, listFilter]);

   const selectedMatch = matches.find(m => m.id === selectedMatchId);

   // Reset video input state when selected match changes
   React.useEffect(() => {
      setShowVideoInput(false);
      setEditingVideoUrl('');
   }, [selectedMatchId]);

   const getYouTubeEmbedUrl = (url: string): string | null => {
      if (!url) return null;
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const m = url.match(regExp);
      if (m && m[2].length === 11) return `https://www.youtube.com/embed/${m[2]}?rel=0`;
      return null;
   };

   const handleWizardSuccess = () => {
      setListFilter('scheduled');
      setActiveTab('details');
   };

   const handleStartLive = async (matchId: string) => {
      try {
         // Update match status to live
         await updateMatch({ 
            id: matchId, 
            data: { 
               status: 'live',
               current_half: 1
            } 
         });
         // Select the match and open live tracking
         setSelectedMatchId(matchId);
         setListFilter('today');
         setActiveTab('live');
         refetch?.();
      } catch (error) {
         console.error('Error starting live:', error);
      }
   };

   const getOpponentName = (clubId: string) => opponentClubs.find(c => c.id === clubId)?.name || 'Adversaire Inconnu';
   const isSameAsMainClub = (clubId: string) => {
      const opp = opponentClubs.find(c => c.id === clubId);
      return !!opp && opp.name?.toLowerCase().trim() === mainClub?.name?.toLowerCase().trim();
   };
   const getStadiumName = (stadiumId: string) => 'Stadium Venue'; 

   const categoryCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      matches.forEach(m => {
         counts[m.category] = (counts[m.category] || 0) + 1;
      });
      return counts;
   }, [matches]);

   const filteredMatches = useMemo(() => {
      return matches.filter(m => {
         const matchCategory = categoryFilter === 'All' || m.category === categoryFilter;
         if (!matchCategory) return false;

         const matchLeague = leagueFilter === 'All' || m.league_id === leagueFilter;
         if (!matchLeague) return false;

         // Date filter takes priority over listFilter if set
         if (dateFilter) {
            return m.match_date === dateFilter;
         }

         const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
         if (listFilter === 'today') {
            return m.match_date === todayStr;
         }
         return m.status === listFilter;
      });
   }, [matches, categoryFilter, listFilter, leagueFilter, dateFilter]);

   if (isLoading && matches.length === 0) {
      return (
         <div className="space-y-8 pb-10">
            <Skeleton className="h-48 w-full rounded-[3rem]" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8">
                  <Skeleton className="h-[500px] w-full rounded-[3rem]" />
               </div>
               <div className="lg:col-span-4 space-y-4">
                  <Skeleton className="h-14 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-8 pb-10">
         <AnimatePresence mode="wait">
            {activeTab === 'details' && (
               <motion.div 
                 key="list-view" 
                 initial={{ opacity: 0, scale: 0.98 }} 
                 animate={{ opacity: 1, scale: 1 }} 
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="space-y-8"
               >
                  {/* Premium Dashboard Header */}
                  <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl sm:rounded-[3rem] px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 text-white overflow-hidden shadow-2xl border-b-4 sm:border-b-[8px] border-blue-500/20">
                     <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
                        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
                           <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] bg-white/10 flex items-center justify-center text-blue-400 shadow-2xl border border-white/20 ring-4 sm:ring-6 lg:ring-8 ring-white/5 shrink-0">
                              <Activity className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                           </div>
                           <div className="min-w-0">
                              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase italic leading-none">Centre de Matchs</h1>
                              <p className="text-white/40 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-2 sm:mt-3">Gestion des rencontres & analyses</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                           <Button 
                              onClick={() => setViewMode(v => v === 'list' ? 'planning' : 'list')} 
                              className="bg-white/10 hover:bg-white/20 text-white h-11 sm:h-14 lg:h-16 px-4 sm:px-6 lg:px-8 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] gap-2 sm:gap-3 border border-white/20 shadow-2xl transition-all hover:scale-105 active:scale-95 shrink-0"
                           >
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                              <span className="hidden sm:inline">{viewMode === 'list' ? 'Planning' : 'Liste'}</span>
                              <span className="sm:hidden">{viewMode === 'list' ? 'Plan' : 'List'}</span>
                           </Button>
                           <Button onClick={() => setActiveTab('wizard')} className="bg-white hover:bg-white/90 text-blue-900 h-11 sm:h-14 lg:h-16 px-4 sm:px-6 lg:px-10 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] gap-2 sm:gap-4 shadow-2xl transition-all hover:scale-105 active:scale-95 group shrink-0">
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-500" /> 
                              <span className="hidden sm:inline">Planifier un Match</span>
                              <span className="sm:hidden">Planifier</span>
                           </Button>
                        </div>
                     </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="flex flex-col gap-4 sm:gap-6">
                     {/* Category filters - scrollable on mobile */}
                     <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                        {['All', ...PLAYER_CATEGORIES].map(cat => {
                           const count = cat === 'All' ? matches.length : (categoryCounts[cat] || 0);
                           return (
                           <Button
                              key={cat}
                              variant={categoryFilter === cat ? 'default' : 'ghost'}
                              onClick={() => setCategoryFilter(cat)}
                              className={`rounded-xl sm:rounded-[1.2rem] px-3 sm:px-4 lg:px-6 font-black uppercase tracking-widest text-[9px] sm:text-[10px] h-10 sm:h-12 transition-all gap-1.5 sm:gap-2 shrink-0 ${categoryFilter === cat ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : count === 0 ? 'opacity-30 text-muted-foreground hover:bg-secondary' : 'text-muted-foreground hover:bg-secondary'}`}
                           >
                              {cat}
                              <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md ${categoryFilter === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                 {count}
                              </span>
                           </Button>
                           );
                        })}
                     </div>
                     
                     {/* Secondary filters */}
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="bg-secondary/40 p-1 sm:p-1.5 rounded-xl sm:rounded-[1.5rem] flex border shadow-inner overflow-x-auto">
                           {[
                              { id: 'scheduled', label: 'Calendrier', icon: Calendar, shortLabel: 'Cal' },
                              { id: 'today', label: 'Aujourd\'hui', icon: Timer, shortLabel: 'Auj' },
                              { id: 'finished', label: 'Passé', icon: History, shortLabel: 'Passé' }
                           ].map(f => (
                              <button
                                 key={f.id}
                                 onClick={() => setListFilter(f.id as any)}
                                 className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] font-black uppercase tracking-widest transition-all gap-1.5 sm:gap-2 flex items-center justify-center shrink-0 ${listFilter === f.id ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-white/50'}`}
                              >
                                 <f.icon className="w-3.5 h-3.5 shrink-0" /> 
                                 <span className="hidden sm:inline">{f.label}</span>
                                 <span className="sm:hidden">{f.shortLabel}</span>
                              </button>
                           ))}
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto">
                             <div className="flex items-center gap-2 sm:gap-3 bg-white/50 p-1 sm:p-1.5 px-2 sm:px-4 rounded-xl sm:rounded-[1.5rem] border shadow-sm group shrink-0">
                                <Trophy className="w-4 h-4 text-emerald-500 shrink-0" />
                                <select 
                                   value={leagueFilter}
                                   onChange={(e) => setLeagueFilter(e.target.value)}
                                   className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-0 cursor-pointer pr-2 sm:pr-4"
                                >
                                   <option value="All">Toutes les Ligues</option>
                                   {leagues.map(l => (
                                      <option key={l.id} value={l.id}>{l.name}</option>
                                   ))}
                                </select>
                             </div>

                             {leagueFilter !== 'All' && (
                                <button 
                                   onClick={() => { setLeagueFilter('All'); }}
                                   className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all border border-slate-200 shrink-0"
                                >
                                   <X className="w-4 h-4" />
                                </button>
                             )}
                         </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-2 shrink-0">
                           <div className="flex items-center gap-2 sm:gap-3 bg-white p-1 sm:p-1.5 px-2 sm:px-4 rounded-xl sm:rounded-[1.5rem] border shadow-sm">
                              <Calendar className="w-4 h-4 text-primary shrink-0" />
                              <input
                                 type="date"
                                 value={dateFilter}
                                 onChange={(e) => setDateFilter(e.target.value)}
                                 className="bg-transparent border-none text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-0 cursor-pointer"
                                 placeholder="Choisir une date"
                              />
                           </div>
                           {dateFilter && (
                              <button 
                                 onClick={() => setDateFilter('')}
                                 className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all border border-slate-200 shrink-0"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                     </div>
                  </div>

                  {viewMode === 'planning' ? (
                     <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-white border rounded-2xl sm:rounded-[3rem] p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 overflow-x-auto"
                     >
                        {/* Month Navigation Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 sm:pb-6 gap-4">
                           <div className="flex items-center gap-3 sm:gap-4">
                              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800">
                                 {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                              </h2>
                              <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border">
                                 <button 
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                    className="p-1 sm:p-1.5 hover:bg-white hover:text-primary rounded-lg transition-all text-slate-500"
                                 >
                                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                                 </button>
                                 <button 
                                    onClick={() => setCurrentMonth(new Date())}
                                    className="px-2 sm:px-4 py-1 sm:py-1.5 bg-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg text-slate-700 hover:text-primary shadow-sm transition-all"
                                 >
                                    Aujourd'hui
                                 </button>
                                 <button 
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                    className="p-1 sm:p-1.5 hover:bg-white hover:text-primary rounded-lg transition-all text-slate-500"
                                 >
                                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                 </button>
                              </div>
                           </div>

                           {/* Calendar legend / info */}
                           <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-wider flex-wrap">
                              {categoryFilter !== 'All' && (() => {
                                 const monthMatchCount = matches.filter(m => {
                                    const d = new Date(m.match_date);
                                    return d.getFullYear() === year && d.getMonth() === month && m.category === categoryFilter;
                                 }).length;
                                 return (
                                    <span className={`px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${monthMatchCount === 0 ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                       {monthMatchCount === 0 ? `Aucun match ${categoryFilter}` : `${monthMatchCount} match${monthMatchCount > 1 ? 's' : ''} ${categoryFilter}`}
                                    </span>
                                 );
                              })()}
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                 <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500" />
                                 <span>Live</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                 <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500" />
                                 <span>Planifié</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                 <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-400" />
                                 <span>Terminé</span>
                              </div>
                           </div>
                        </div>

                        {/* Weekdays Header - Hide on very small screens */}
                        <div className="hidden sm:grid grid-cols-7 gap-2 sm:gap-3 text-center">
                           {daysOfWeek.map(day => (
                              <div key={day} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 py-2">
                                 {day}
                              </div>
                           ))}
                        </div>

                        {/* Mobile: List view of days with matches */}
                        <div className="sm:hidden space-y-3">
                           {calendarDays
                              .filter(({ formattedDate }) => {
                                 const dayMatches = matches.filter(m => {
                                    const matchesDate = m.match_date === formattedDate;
                                    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
                                    const matchesLeague = leagueFilter === 'All' || m.league_id === leagueFilter;
                                    return matchesDate && matchesCategory && matchesLeague;
                                 });
                                 return dayMatches.length > 0 || new Date().toLocaleDateString('en-CA') === formattedDate;
                              })
                              .map(({ date, isCurrentMonth, formattedDate }) => {
                                 const dayMatches = matches.filter(m => {
                                    const matchesDate = m.match_date === formattedDate;
                                    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
                                    const matchesLeague = leagueFilter === 'All' || m.league_id === leagueFilter;
                                    return matchesDate && matchesCategory && matchesLeague;
                                 });
                                 const isToday = new Date().toLocaleDateString('en-CA') === formattedDate;
                                 
                                 return (
                                    <div
                                       key={formattedDate}
                                       className={`p-3 sm:p-4 rounded-xl border-2 ${
                                          isToday 
                                             ? 'bg-blue-50/30 border-primary' 
                                             : 'bg-slate-50/30 border-slate-100'
                                       }`}
                                    >
                                       <div className="flex items-center justify-between mb-3">
                                          <span className={`text-sm font-black ${isToday ? 'text-primary' : 'text-slate-700'}`}>
                                             {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                          </span>
                                          {isToday && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-black">AUJ</span>}
                                       </div>
                                       <div className="space-y-2">
                                          {dayMatches.map(match => (
                                             <div
                                                key={match.id}
                                                onClick={() => {
                                                   setSelectedMatchId(match.id);
                                                   setViewMode('list');
                                                }}
                                                className={`p-2.5 rounded-lg text-xs font-black uppercase flex items-center justify-between border cursor-pointer ${
                                                   match.status === 'live' 
                                                      ? 'bg-red-50 border-red-200 text-red-700' 
                                                      : match.status === 'scheduled' 
                                                         ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                                         : 'bg-slate-50 border-slate-200 text-slate-700'
                                                }`}
                                             >
                                                <div className="flex items-center gap-2">
                                                   <div className="w-6 h-6 rounded bg-white flex items-center justify-center border shrink-0">
                                                      <img 
                                                         src={opponentClubs.find(c => c.id === match.opponent_id)?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random`} 
                                                         alt="" 
                                                         className="w-full h-full object-contain p-0.5" 
                                                      />
                                                   </div>
                                                   <span className="truncate">{getOpponentName(match.opponent_id)}</span>
                                                </div>
                                                <span className="font-mono text-[10px] opacity-75">{match.match_time?.slice(0, 5)}</span>
                                             </div>
                                          ))}
                                          {dayMatches.length === 0 && (
                                             <p className="text-xs text-muted-foreground text-center py-2">Aucun match</p>
                                          )}
                                       </div>
                                    </div>
                                 );
                              })}
                        </div>

                        {/* Desktop Calendar Grid cells */}
                        <div className="hidden sm:grid grid-cols-7 gap-2 sm:gap-3 min-w-[600px]">
                           {calendarDays.map(({ date, isCurrentMonth, formattedDate }, idx) => {
                              const dayMatches = matches.filter(m => {
                                 // Filter match_date
                                 const matchesDate = m.match_date === formattedDate;
                                 if (!matchesDate) return false;

                                 // Filter category
                                 const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
                                 if (!matchesCategory) return false;

                                 // Filter league
                                 const matchesLeague = leagueFilter === 'All' || m.league_id === leagueFilter;
                                 if (!matchesLeague) return false;

                                 return true;
                              });

                              const isToday = new Date().toLocaleDateString('en-CA') === formattedDate;

                              return (
                                 <div
                                    key={idx}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, formattedDate)}
                                    className={`min-h-[100px] sm:min-h-[140px] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col justify-between group ${
                                       isCurrentMonth 
                                          ? isToday 
                                             ? 'bg-blue-50/30 border-primary shadow-lg shadow-primary/5' 
                                             : 'bg-slate-50/30 border-slate-100 hover:border-slate-300 hover:bg-slate-50/50' 
                                          : 'bg-slate-100/10 border-slate-100 opacity-40'
                                    }`}
                                 >
                                    {/* Cell Day Header */}
                                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                                       <span className={`text-[10px] sm:text-[11px] font-black tracking-tight ${
                                          isToday 
                                             ? 'bg-primary text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center' 
                                             : 'text-slate-600'
                                       }`}>
                                          {date.getDate()}
                                       </span>
                                       
                                       <button
                                          onClick={() => {
                                             setDateFilter(formattedDate);
                                             setActiveTab('wizard');
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
                                          title="Planifier un match ce jour"
                                       >
                                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                       </button>
                                    </div>

                                    {/* Matches List inside this Day */}
                                    <div className="flex-1 space-y-1 sm:space-y-1.5 overflow-y-auto max-h-[80px] sm:max-h-[100px] scrollbar-hide">
                                       {dayMatches.map(match => (
                                          <div
                                             key={match.id}
                                             draggable
                                             onDragStart={(e) => handleDragStart(e, match.id)}
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMatchId(match.id);
                                                setViewMode('list');
                                             }}
                                             className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-tight flex items-center justify-between border cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all ${
                                                match.status === 'live' 
                                                   ? 'bg-red-50 border-red-200 text-red-700 shadow-md shadow-red-500/5' 
                                                   : match.status === 'scheduled' 
                                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-md shadow-emerald-500/5' 
                                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                             }`}
                                          >
                                             <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                                                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-white flex items-center justify-center border shrink-0">
                                                   <img 
                                                      src={opponentClubs.find(c => c.id === match.opponent_id)?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random`} 
                                                      alt="" 
                                                      className="w-full h-full object-contain p-0.5" 
                                                   />
                                                </div>
                                                <span className="truncate hidden sm:inline">{getOpponentName(match.opponent_id)}</span>
                                             </div>
                                             <span className="shrink-0 font-mono text-[7px] sm:text-[8px] opacity-75">{match.match_time?.slice(0, 5)}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </motion.div>
                  ) : (
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Match Details Card */}
                        <div className="lg:col-span-8 space-y-6">
                           <AnimatePresence mode="wait">
                              {selectedMatch ? (
                                 <motion.div key={selectedMatch.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <Card className="border shadow-2xl rounded-[4rem] overflow-hidden bg-white relative group min-h-[500px]">
                                       <div className="absolute top-0 right-0 w-96 h-96 -mr-48 -mt-48 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
                                       <CardContent className="p-0 flex flex-col h-full">
                                          <div className="p-16 border-b border-secondary/50 flex-1">
                                             <div className="flex justify-between items-center mb-16">
                                                <div className="flex items-center gap-3">
                                                   <Badge className={`border-none font-black uppercase italic text-[10px] tracking-widest px-6 py-2.5 rounded-xl shadow-sm ${selectedMatch.status === 'finished' ? 'bg-slate-900 text-white' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                      {selectedMatch.status === 'scheduled' ? 'Prochain Match' : selectedMatch.status === 'finished' ? 'Terminé' : 'En cours'}
                                                   </Badge>
                                                   {isSameAsMainClub(selectedMatch.opponent_id) && (
                                                      <Badge className="border-none font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-xl shadow-sm bg-amber-400 text-white">
                                                         ⚠️ Adversaire identique au club
                                                      </Badge>
                                                   )}
                                                   {selectedMatch.match_phase === 'won' && (
                                                      <Badge className="border-none font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-xl shadow-sm bg-emerald-500 text-white">
                                                         ✅ Gagné
                                                      </Badge>
                                                   )}
                                                   {selectedMatch.match_phase === 'lost' && (
                                                      <Badge className="border-none font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-xl shadow-sm bg-red-500 text-white">
                                                         ❌ Perdu
                                                      </Badge>
                                                   )}
                                                   {selectedMatch.match_phase && !['won', 'lost'].includes(selectedMatch.match_phase) && (
                                                      <Badge className="border-none font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-xl shadow-sm bg-blue-500/10 text-blue-700 border border-blue-200">
                                                         {({
                                                            league: 'Ligue',
                                                            round_of_32: '32èmes',
                                                            round_of_16: '16èmes',
                                                            quarter_final: 'Quart de Finale',
                                                            semi_final: 'Demi-Finale',
                                                            third_place: '3ème Place',
                                                            final: 'Finale',
                                                         } as Record<string, string>)[selectedMatch.match_phase] || selectedMatch.match_phase}
                                                      </Badge>
                                                   )}
                                                </div>
                                                <div className="flex items-center gap-4 text-muted-foreground px-6 py-3 rounded-2xl bg-secondary/30 border-2 border-dashed border-secondary">
                                                   <Calendar className="w-4.5 h-4.5 text-primary" />
                                                   <span className="text-[11px] font-black uppercase tracking-widest">{selectedMatch.match_date} @ {selectedMatch.match_time}</span>
                                                </div>
                                             </div>

                                             <div className={`flex items-center justify-between gap-12 ${!selectedMatch.is_home ? 'flex-row-reverse' : ''}`}>
                                                {/* Home Team */}
                                                <div className="flex flex-col items-center gap-8 group/home relative flex-1">
                                                   <div className="w-40 h-40 rounded-[3rem] bg-white flex items-center justify-center shadow-2xl border-4 border-white transition-all group-hover/home:scale-110 group-hover/home:-rotate-6 overflow-hidden relative">
                                                      {mainClub?.logo_url ? (
                                                         <img src={mainClub.logo_url} alt={mainClub.club_name} className="w-full h-full object-contain p-6" />
                                                      ) : (
                                                         <Shield className="w-20 h-20 text-primary/10" />
                                                      )}
                                                   </div>
                                                   <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 bg-primary text-white text-[10px] font-black px-5 py-2 rounded-xl shadow-xl border-4 border-white z-10 rotate-12">
                                                      {selectedMatch.category}
                                                   </div>
                                                   <div className="text-center">
                                                      <h4 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none">
                                                         {mainClub?.club_name || 'My Club'}
                                                      </h4>
                                                      <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest mt-2">{selectedMatch.is_home ? 'Domicile' : 'Extérieur'}</p>
                                                   </div>
                                                </div>

                                                {/* VS Divider */}
                                                <div className="flex flex-col items-center gap-6">
                                                   {selectedMatch.status === 'finished' ? (
                                                      <div className="text-center">
                                                         <div className="flex items-center gap-8 mb-4">
                                                            <span className="text-7xl font-black tabular-nums tracking-tighter">{selectedMatch.score_home}</span>
                                                            <span className="text-3xl font-black text-muted-foreground opacity-10 italic">/</span>
                                                            <span className="text-7xl font-black tabular-nums tracking-tighter">{selectedMatch.score_away}</span>
                                                         </div>
                                                         <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest text-emerald-500 bg-emerald-500/5 border-emerald-500/20 px-4 py-1.5">Score Officiel</Badge>
                                                      </div>
                                                   ) : (
                                                      <>
                                                         <div className="w-20 h-20 rounded-[2rem] bg-secondary/50 border-2 border-white flex flex-col items-center justify-center gap-1 shadow-inner relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em] relative z-10 italic">VS</span>
                                                         </div>
                                                         <div className="h-px w-32 bg-gradient-to-r from-transparent via-secondary to-transparent" />
                                                      </>
                                                   )}
                                                </div>

                                                {/* Away Team */}
                                                <div className="flex flex-col items-center gap-8 group/away relative flex-1">
                                                   <div className="w-40 h-40 rounded-[3rem] bg-white flex items-center justify-center shadow-2xl border-4 border-white transition-all group-hover/away:scale-110 group-hover/away:rotate-6 overflow-hidden relative">
                                                      {opponentClubs.find(c => c.id === selectedMatch.opponent_id)?.logo_url ? (
                                                         <img 
                                                            src={opponentClubs.find(c => c.id === selectedMatch.opponent_id)?.logo_url} 
                                                            alt={getOpponentName(selectedMatch.opponent_id)} 
                                                            className="w-full h-full object-contain p-6" 
                                                      />
                                                      ) : (
                                                         <Target className="w-20 h-20 text-muted-foreground/10" />
                                                      )}
                                                   </div>
                                                   <div className="text-center">
                                                      <h4 className="text-3xl font-black tracking-tighter uppercase italic text-muted-foreground/40 leading-none">{getOpponentName(selectedMatch.opponent_id)}</h4>
                                                      <p className="text-[10px] font-black text-muted-foreground opacity-20 uppercase tracking-widest mt-2">{!selectedMatch.is_home ? 'Domicile' : 'Extérieur'}</p>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>

                                          {/* Video Section */}
                                          <div className="mx-12 mb-6 space-y-3">
                                             {selectedMatch.video_url && !showVideoInput ? (() => {
                                                const embedUrl = getYouTubeEmbedUrl(selectedMatch.video_url);
                                                return (
                                                   <div className="space-y-3">
                                                      {embedUrl ? (
                                                         <div className="relative w-full rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-xl bg-black" style={{ paddingBottom: '56.25%' }}>
                                                            <iframe
                                                               src={embedUrl}
                                                               className="absolute inset-0 w-full h-full"
                                                               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                               allowFullScreen
                                                               title="Vidéo du match"
                                                            />
                                                         </div>
                                                      ) : (
                                                         <a
                                                            href={selectedMatch.video_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all group"
                                                         >
                                                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                                                               <Video className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                               <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Vidéo du match</p>
                                                               <p className="text-xs font-mono text-slate-500 truncate">{selectedMatch.video_url}</p>
                                                            </div>
                                                         </a>
                                                      )}
                                                      <button
                                                         onClick={() => { setEditingVideoUrl(selectedMatch.video_url || ''); setShowVideoInput(true); }}
                                                         className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
                                                      >
                                                         <Video className="w-3.5 h-3.5" /> Modifier le lien vidéo
                                                      </button>
                                                   </div>
                                                );
                                             })() : showVideoInput ? (
                                                <div className="flex items-center gap-3">
                                                   <Input
                                                      value={editingVideoUrl}
                                                      onChange={e => setEditingVideoUrl(e.target.value)}
                                                      placeholder="https://youtube.com/watch?v=..."
                                                      className="flex-1 h-12 rounded-2xl border-2 font-mono text-sm"
                                                      autoFocus
                                                   />
                                                   <Button
                                                      onClick={async () => {
                                                         await updateMatch({ id: selectedMatch.id, data: { video_url: editingVideoUrl || null } });
                                                         setShowVideoInput(false);
                                                         refetch?.();
                                                      }}
                                                      className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] shrink-0"
                                                   >
                                                      <Save className="w-4 h-4 mr-2" /> Sauvegarder
                                                   </Button>
                                                   <Button
                                                      onClick={() => setShowVideoInput(false)}
                                                      variant="outline"
                                                      className="h-12 px-4 rounded-2xl shrink-0"
                                                   >
                                                      <X className="w-4 h-4" />
                                                   </Button>
                                                </div>
                                             ) : (
                                                <button
                                                   onClick={() => { setEditingVideoUrl(''); setShowVideoInput(true); }}
                                                   className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-3 text-slate-400 hover:border-primary hover:text-primary transition-all"
                                                >
                                                   <Video className="w-4 h-4" />
                                                   <span className="text-[10px] font-black uppercase tracking-widest">Ajouter une vidéo replay</span>
                                                </button>
                                             )}
                                          </div>

                                          <div className="p-12 bg-secondary/20 flex flex-wrap items-center justify-center gap-6">
                                             <Button onClick={() => setActiveTab('preparation')} className="h-16 px-12 rounded-[2rem] bg-white hover:bg-secondary text-foreground border shadow-xl font-black uppercase tracking-widest text-xs gap-4 transition-all hover:scale-105 group">
                                                <LayoutPanelLeft className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                                {selectedMatch.status === 'finished' ? 'Consulter la Compo' : 'Orchestrer le Match'}
                                             </Button>
                                             {selectedMatch.status === 'finished' && (
                                                <Button onClick={() => setActiveTab('stats')} className="h-16 px-12 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 font-black uppercase tracking-widest text-xs gap-4 transition-all hover:scale-105 group">
                                                   <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                                                   Voir les Stats
                                                </Button>
                                             )}
                                             {selectedMatch.status !== 'finished' && (
                                                <Button onClick={() => handleStartLive(selectedMatch.id)} className="h-16 px-12 rounded-[2rem] bg-primary hover:bg-slate-900 text-white shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-xs gap-4 transition-all hover:scale-105 active:scale-95 group">
                                                   <Play className="w-5 h-5 group-hover:translate-x-1 transition-all" /> Lancer le Live Tracking
                                                </Button>
                                             )}
                                          </div>
                                       </CardContent>
                                    </Card>
                                 </motion.div>
                              ) : (
                                 <div className="h-[500px] rounded-[4rem] border-4 border-dashed border-secondary/50 flex flex-col items-center justify-center text-muted-foreground gap-8 bg-white/30 backdrop-blur-sm">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center text-muted-foreground/30 animate-bounce duration-[2000ms]">
                                       <Trophy className="w-12 h-12" />
                                    </div>
                                    <div className="text-center space-y-2">
                                       <p className="text-2xl font-black uppercase tracking-tighter italic">Aucun match sélectionné</p>
                                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Planifiez une nouvelle rencontre pour commencer</p>
                                    </div>
                                 </div>
                              )}
                           </AnimatePresence>
                        </div>

                        {/* Right Column: Organized Match List */}
                        <div className="lg:col-span-4 space-y-6">
                           <div className="flex items-center justify-between px-6">
                              <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-muted-foreground">Registre des Rencontres</h4>
                              <Badge className="bg-secondary text-foreground rounded-lg font-black text-[9px]">{filteredMatches.length}</Badge>
                           </div>

                           <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide pb-10">
                              {/* LIVE MATCHES */}
                              {filteredMatches.filter(m => m.status === 'live').length > 0 && (
                                 <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                       <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                       <h4 className="text-[10px] font-black tracking-[0.15em] uppercase text-red-500">En Direct</h4>
                                       <div className="flex-1 h-px bg-red-200" />
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                       {filteredMatches.filter(m => m.status === 'live').map(m => (
                                          <MatchListItem 
                                             key={m.id} 
                                             match={m} 
                                             isSelected={selectedMatchId === m.id}
                                             onSelect={() => setSelectedMatchId(m.id)}
                                             onDelete={(e) => { e.stopPropagation(); if (confirm(`Annuler définitivement le match vs ${getOpponentName(m.opponent_id)} du ${m.match_date} ?`)) deleteMatch(m.id); }}
                                             opponentClubs={opponentClubs}
                                             getOpponentName={getOpponentName}
                                             variant="live"
                                          />
                                       ))}
                                    </AnimatePresence>
                                 </div>
                              )}

                              {/* UPCOMING MATCHES */}
                              {filteredMatches.filter(m => m.status === 'scheduled').length > 0 && (
                                 <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                       <h4 className="text-[10px] font-black tracking-[0.15em] uppercase text-emerald-600">Prochains Matchs</h4>
                                       <div className="flex-1 h-px bg-emerald-200" />
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                       {filteredMatches
                                          .filter(m => m.status === 'scheduled')
                                          .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                                          .map(m => (
                                          <MatchListItem 
                                             key={m.id} 
                                             match={m} 
                                             isSelected={selectedMatchId === m.id}
                                             onSelect={() => setSelectedMatchId(m.id)}
                                             onDelete={(e) => { e.stopPropagation(); if (confirm(`Annuler définitivement le match vs ${getOpponentName(m.opponent_id)} du ${m.match_date} ?`)) deleteMatch(m.id); }}
                                             onStartLive={(e) => { e.stopPropagation(); handleStartLive(m.id); }}
                                             opponentClubs={opponentClubs}
                                             getOpponentName={getOpponentName}
                                             variant="upcoming"
                                          />
                                       ))}
                                    </AnimatePresence>
                                 </div>
                              )}

                              {/* PAST MATCHES */}
                              {filteredMatches.filter(m => m.status === 'finished').length > 0 && (
                                 <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                       <div className="w-2 h-2 rounded-full bg-slate-400" />
                                       <h4 className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-500">Matchs Terminés</h4>
                                       <div className="flex-1 h-px bg-slate-200" />
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                       {filteredMatches
                                          .filter(m => m.status === 'finished')
                                          .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
                                          .map(m => (
                                          <MatchListItem 
                                             key={m.id} 
                                             match={m} 
                                             isSelected={selectedMatchId === m.id}
                                             onSelect={() => setSelectedMatchId(m.id)}
                                             onDelete={(e) => { e.stopPropagation(); deleteMatch(m.id); }}
                                             opponentClubs={opponentClubs}
                                             getOpponentName={getOpponentName}
                                             variant="past"
                                          />
                                       ))}
                                    </AnimatePresence>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            )}

            {activeTab === 'preparation' && selectedMatchId && (
               <motion.div key="prep" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}>
                  <MatchPreparation matchId={selectedMatchId} onBack={() => setActiveTab('details')} />
               </motion.div>
            )}

            {activeTab === 'live' && selectedMatchId && (
               <motion.div key="live" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -100 }}>
                  <LiveTracking matchId={selectedMatchId} onMatchFinished={async () => { await refetch?.(); setListFilter('finished'); setActiveTab('details'); }} />
               </motion.div>
            )}

            {activeTab === 'wizard' && (
               <motion.div key="wizard" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}>
                  <ScheduleMatchWizard
                     onBack={() => setActiveTab('details')}
                     onSuccess={handleWizardSuccess}
                  />
               </motion.div>
            )}

            {activeTab === 'stats' && selectedMatchId && selectedMatch && (
               <motion.div key="stats" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                     <Button variant="ghost" size="icon" onClick={() => setActiveTab('details')} className="w-12 h-12 rounded-2xl bg-white border shadow-sm">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                     </Button>
                     <h2 className="text-2xl font-black uppercase italic tracking-tight">
                        Stats: {mainClub?.club_name || 'FuscClub'} vs {opponentClubs.find(c => c.id === selectedMatch.opponent_id)?.name || 'Adversaire'}
                     </h2>
                  </div>
                  <MatchStatsView 
                     matchId={selectedMatchId} 
                     match={selectedMatch}
                     mainClub={mainClub}
                     opponentClubs={opponentClubs}
                  />
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default MatchManagementPage;
