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
   Save,
   Table,
   List,
   LayoutGrid
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import MatchPreparation from './MatchPreparation';
import LiveTracking from './LiveTracking';
import ScheduleMatchWizard from './ScheduleMatchWizard';
import MatchStatsView from './MatchStatsView';
import MatchOverviewPanel from './MatchOverviewPanel';
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
   mainClub?: any;
   getOpponentName: (clubId: string) => string;
   variant: 'live' | 'upcoming' | 'past';
}

const MatchListItem: React.FC<MatchListItemProps> = ({ 
   match, isSelected, onSelect, onDelete, onStartLive, opponentClubs, mainClub, getOpponentName, variant 
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
      
      const hasPenalties = (match.penalty_score_home ?? 0) > 0 || (match.penalty_score_away ?? 0) > 0;
      const fusPenScore = match.is_home ? match.penalty_score_home : match.penalty_score_away;
      const oppPenScore = match.is_home ? match.penalty_score_away : match.penalty_score_home;

      return (
         <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-black tabular-nums">
               <span>{fusScore || 0}</span>
               <span className="text-muted-foreground">-</span>
               <span>{oppScore || 0}</span>
            </div>
            {hasPenalties && (
               <div className="mt-1 bg-purple-50 text-purple-700 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-purple-200 shadow-sm">
                  ({fusPenScore} - {oppPenScore} TAB)
               </div>
            )}
         </div>
      );
   };

   return (
      <motion.div
         layout
         onClick={onSelect}
         whileHover={{ scale: 1.02 }}
         whileTap={{ scale: 0.98 }}
         className={`w-full p-4 rounded-2xl border-2 transition-all flex flex-col group cursor-pointer relative overflow-hidden ${getVariantStyles()}`}
      >
         <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-center gap-1 w-1/3">
               <div className={`w-12 h-12 rounded-xl bg-white border flex items-center justify-center p-1.5 shadow-sm transition-all ${isSelected ? 'ring-2 ring-primary/20' : ''}`}>
                  {mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-full h-full object-contain" /> : <div className="bg-yellow-500 w-full h-full text-white font-black text-[12px] flex items-center justify-center rounded-lg">FUS</div>}
               </div>
               <span className="text-[10px] font-black uppercase tracking-tight text-foreground truncate max-w-full text-center">
                  {mainClub?.club_name || 'FUS'}
               </span>
            </div>

            <div className="flex flex-col items-center justify-center w-1/3 text-center">
               {getScoreBadge()}
               {match.status !== 'finished' && (
                  <span className="text-xl font-black text-slate-300">-</span>
               )}
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-80 whitespace-nowrap">
                  {match.match_date}
               </p>
               <p className="text-[8px] font-black text-primary/70 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                  {match.category}
               </p>
               {match.status === 'live' && (
                  <Badge className="mt-1 bg-red-500 text-white text-[8px] font-black px-2 py-0 rounded-full animate-pulse shadow-sm shadow-red-500/20">
                     LIVE
                  </Badge>
               )}
            </div>

            <div className="flex flex-col items-center gap-1 w-1/3">
               <div className={`w-12 h-12 rounded-xl bg-white border flex items-center justify-center p-1.5 shadow-sm transition-all ${isSelected ? 'ring-2 ring-primary/20' : ''}`}>
                  <img 
                     src={opponentClubs.find(c => c.id === match.opponent_id)?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random`} 
                     alt="" 
                     className="w-full h-full object-contain" 
                  />
               </div>
               <span className="text-[10px] font-black uppercase tracking-tight text-foreground truncate max-w-full text-center">
                  {getOpponentName(match.opponent_id)}
               </span>
            </div>
         </div>
         
         <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 w-full">
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
   const [listFilter, setListFilter] = useState<'all' | 'scheduled' | 'finished' | 'today'>('all');
   const [deletingId, setDeletingId] = useState<string | null>(null);
   const [categoryFilter, setCategoryFilter] = useState<string>('All');
   const [leagueFilter, setLeagueFilter] = useState<string>('All');
   const [dateFilter, setDateFilter] = useState<string>('');
   const [editingVideoUrl, setEditingVideoUrl] = useState<string>('');
   const [showVideoInput, setShowVideoInput] = useState(false);
   const [viewMode, setViewMode] = useState<'grid' | 'table' | 'planning'>('grid');
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
   


   const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
   ];
   const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

   // Calendar Drag and Drop handlers
   // Calendar Drag and Drop handlers using local React state for maximum reliability
   const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null);

   const handleDragStart = (e: React.DragEvent, matchId: string) => {
      const match = matches.find(m => m.id === matchId);
      if (match?.status === 'finished') {
         e.preventDefault();
         return;
      }
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

         if (listFilter === 'all') return true;

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
                        <div className="flex items-center gap-2">
                             <div className="flex items-center bg-white/10 p-1 rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl shrink-0">
                               {listFilter === 'scheduled' && (
                                  <button
                                     onClick={() => setViewMode('planning')}
                                     className={`h-9 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center gap-2 transition-all ${
                                        viewMode === 'planning' 
                                           ? 'bg-white text-blue-950 shadow-lg' 
                                           : 'text-white/60 hover:text-white hover:bg-white/5'
                                     }`}
                                  >
                                     <Calendar className="w-3.5 h-3.5 shrink-0" />
                                     <span className="hidden md:inline">Calendrier</span>
                                  </button>
                               )}
                               <button
                                  onClick={() => setViewMode('grid')}
                                  className={`h-9 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center gap-2 transition-all ${
                                     viewMode === 'grid' 
                                        ? 'bg-white text-blue-955 shadow-lg' 
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                  }`}
                               >
                                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                                  <span className="hidden md:inline">Grille</span>
                               </button>
                               <button
                                  onClick={() => setViewMode('table')}
                                  className={`h-9 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center gap-2 transition-all ${
                                     viewMode === 'table' 
                                        ? 'bg-white text-blue-955 shadow-lg' 
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                  }`}
                               >
                                  <Table className="w-3.5 h-3.5 shrink-0" />
                                  <span className="hidden md:inline">Tableau</span>
                               </button>
                            </div>
                           {can('create_match') && (
                             <Button onClick={() => setActiveTab('wizard')} className="bg-white hover:bg-white/90 text-blue-900 h-11 sm:h-14 lg:h-16 px-4 sm:px-6 lg:px-10 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] gap-2 sm:gap-4 shadow-2xl transition-all hover:scale-105 active:scale-95 group shrink-0">
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-500" /> 
                                <span className="hidden sm:inline">Planifier un Match</span>
                                <span className="sm:hidden">Planifier</span>
                             </Button>
                           )}
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
                              { id: 'all', label: 'Tout', icon: LayoutGrid, shortLabel: 'All' },
                              { id: 'scheduled', label: 'Calendrier', icon: Calendar, shortLabel: 'Cal' },
                              { id: 'today', label: 'Aujourd\'hui', icon: Timer, shortLabel: 'Auj' },
                              { id: 'finished', label: 'Passé', icon: History, shortLabel: 'Passé' }
                           ].map(f => (
                              <button
                                 key={f.id}
                                 onClick={() => {
                                    const nextFilter = f.id as 'all' | 'scheduled' | 'finished' | 'today';
                                    setListFilter(nextFilter);
                                    if (nextFilter === 'scheduled') {
                                       setViewMode('planning');
                                    } else if (viewMode === 'planning') {
                                       setViewMode('grid');
                                    }
                                 }}
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
                         className="space-y-4 sm:space-y-5"
                      >
                        {/* Calendar Card */}
                        <div className="bg-white border rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl overflow-x-auto">
                         {/* Month Navigation Header */}
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 sm:pb-5 gap-4 mb-4 sm:mb-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                               <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">
                                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                               </h2>
                               <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border">
                                  <button 
                                     onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                     className="p-1.5 hover:bg-white hover:text-primary rounded-lg transition-all text-slate-500"
                                  >
                                     <ChevronRight className="w-4 h-4 rotate-180" />
                                  </button>
                                  <button 
                                     onClick={() => setCurrentMonth(new Date())}
                                     className="px-3 py-1 bg-white text-[10px] font-black uppercase tracking-wider rounded-lg text-slate-700 hover:text-primary shadow-sm transition-all"
                                  >
                                     Aujourd'hui
                                  </button>
                                  <button 
                                     onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                     className="p-1.5 hover:bg-white hover:text-primary rounded-lg transition-all text-slate-500"
                                  >
                                     <ChevronRight className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span>Live</span></div>
                               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Prévu</span></div>
                               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span>Terminé</span></div>
                            </div>
                         </div>

                         {/* Weekdays Header */}
                         <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                            {daysOfWeek.map(day => (
                               <div key={day} className="text-[9px] font-black uppercase tracking-widest text-slate-400 py-1">{day}</div>
                            ))}
                         </div>

                         {/* Calendar Grid */}
                         <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                            {calendarDays.map(({ date, isCurrentMonth, formattedDate }, idx) => {
                               const dayMatches = matches.filter(m => {
                                  if (m.match_date !== formattedDate) return false;
                                  if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
                                  if (leagueFilter !== 'All' && m.league_id !== leagueFilter) return false;
                                  return true;
                               });
                               const isToday = new Date().toLocaleDateString('en-CA') === formattedDate;
                               const isSelected = calendarSelectedDate === formattedDate;
                               const hasMatches = dayMatches.length > 0;

                               return (
                                  <div
                                     key={idx}
                                     onDragOver={handleDragOver}
                                     onDrop={(e) => handleDrop(e, formattedDate)}
                                     onClick={() => {
                                       if (hasMatches) setCalendarSelectedDate(isSelected ? null : formattedDate);
                                     }}
                                     className={`relative min-h-[64px] sm:min-h-[80px] p-1 sm:p-1.5 rounded-xl border-2 transition-all flex flex-col group ${
                                        !isCurrentMonth ? 'opacity-30 border-transparent' :
                                        isSelected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' :
                                        isToday ? 'border-primary/50 bg-blue-50/50' :
                                        hasMatches ? 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-md cursor-pointer' :
                                        'border-slate-100 bg-slate-50/30'
                                     }`}
                                  >
                                     {/* Day number */}
                                     <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] sm:text-xs font-black ${
                                           isToday ? 'bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center' :
                                           isSelected ? 'text-primary' : 'text-slate-600'
                                        }`}>{date.getDate()}</span>
                                        {can('create_match') && (
                                           <button
                                              onClick={(e) => { e.stopPropagation(); setDateFilter(formattedDate); setActiveTab('wizard'); }}
                                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-all"
                                              title="Planifier un match"
                                           ><Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
                                        )}
                                     </div>
                                     {/* Match logos in cells */}
                                     <div className="flex flex-wrap gap-0.5 justify-center">
                                        {dayMatches.slice(0, 3).map(match => {
                                           const oppClub = opponentClubs.find(c => c.id === match.opponent_id);
                                           return (
                                              <div key={match.id} className="flex flex-col items-center gap-0.5">
                                                 <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 bg-white flex items-center justify-center overflow-hidden shadow-sm ${
                                                    match.status === 'live' ? 'border-red-400' :
                                                    match.status === 'scheduled' ? 'border-emerald-400' : 'border-slate-200'
                                                 }`}>
                                                    <img src={oppClub?.logo_url && oppClub.logo_url !== 'null' ? oppClub.logo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random&color=fff&size=64`} alt="" className="w-full h-full object-contain p-0.5" />
                                                 </div>
                                                 {/* Status dot */}
                                                 <div className={`w-1 h-1 rounded-full ${match.status === 'live' ? 'bg-red-500' : match.status === 'scheduled' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                              </div>
                                           );
                                        })}
                                        {dayMatches.length > 3 && (
                                           <span className="text-[8px] font-black text-slate-400 self-center">+{dayMatches.length - 3}</span>
                                        )}
                                     </div>
                                  </div>
                               );
                            })}
                         </div>
                        </div>

                        {/* Selected Date Match Panel — like the mobile app */}
                        <AnimatePresence>
                        {calendarSelectedDate && (() => {
                           const panelMatches = matches.filter(m => {
                              if (m.match_date !== calendarSelectedDate) return false;
                              if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
                              if (leagueFilter !== 'All' && m.league_id !== leagueFilter) return false;
                              return true;
                           });
                           if (panelMatches.length === 0) return null;
                           const selDate = new Date(calendarSelectedDate + 'T00:00:00');
                           const dayLabel = selDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
                           return (
                              <motion.div
                                 key={calendarSelectedDate}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 20 }}
                                 className="space-y-3"
                              >
                                 {/* Date header */}
                                 <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-5 bg-primary rounded-full" />
                                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{dayLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <span className="bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full">{panelMatches.length} match{panelMatches.length > 1 ? 's' : ''}</span>
                                       <button onClick={() => setCalendarSelectedDate(null)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                                          <X className="w-3.5 h-3.5 text-slate-500" />
                                       </button>
                                    </div>
                                 </div>

                                 {/* Match cards — dark style like the app */}
                                 {panelMatches.map(match => {
                                    const oppClub = opponentClubs.find(c => c.id === match.opponent_id);
                                    const fusScore = match.is_home ? match.score_home : match.score_away;
                                    const oppScore = match.is_home ? match.score_away : match.score_home;
                                    const hasScore = match.status === 'finished' || match.status === 'live';
                                    const league = leagues.find(l => l.id === match.league_id);
                                    const resultLabel = hasScore ? ((fusScore ?? 0) > (oppScore ?? 0) ? 'V' : (fusScore ?? 0) < (oppScore ?? 0) ? 'D' : 'N') : null;
                                    const resultColor = resultLabel === 'V' ? 'bg-emerald-500' : resultLabel === 'D' ? 'bg-red-500' : 'bg-amber-500';
                                    const mainClubName = (mainClub as any)?.club_name || (mainClub as any)?.name || 'Mon Club';
                                    const mainClubLogo = mainClub?.logo_url && mainClub.logo_url !== 'null' ? mainClub.logo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(mainClubName)}&background=1a1a2e&color=fff&size=128`;
                                    const oppLogo = oppClub?.logo_url && oppClub.logo_url !== 'null' ? oppClub.logo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random&color=fff&size=128`;

                                    return (
                                       <motion.div
                                          key={match.id}
                                          whileHover={{ scale: 1.005 }}
                                          onClick={() => { setSelectedMatchId(match.id); setActiveTab('overview'); }}
                                          className="bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-xl border border-slate-700/50"
                                       >
                                          {/* Top info bar */}
                                          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
                                             <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                   {selDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                                </span>
                                                {league && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{league.name}</span>}
                                             </div>
                                             <div className="flex items-center gap-2">
                                                {match.status === 'live' && (
                                                   <span className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full animate-pulse">
                                                      <Radio className="w-2.5 h-2.5" /> LIVE
                                                   </span>
                                                )}
                                                <span className={`text-[9px] font-black text-white px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1`}>
                                                   <span>{match.is_home ? '🏠' : '✈️'}</span>
                                                   <span>{match.is_home ? 'DOMICILE' : 'EXTÉRIEUR'}</span>
                                                </span>
                                                {resultLabel && (
                                                   <span className={`text-[10px] font-black text-white w-7 h-7 rounded-full flex items-center justify-center ${resultColor}`}>
                                                      {resultLabel}
                                                   </span>
                                                )}
                                             </div>
                                          </div>

                                          {/* Main match content */}
                                          <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 gap-4">
                                             {/* Our Club */}
                                             <div className="flex flex-col items-center gap-2 flex-1">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden p-2 shadow-lg">
                                                   <img src={mainClubLogo} alt={mainClubName} className="w-full h-full object-contain drop-shadow-lg" />
                                                </div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight text-center max-w-[80px] leading-tight">{mainClubName}</span>
                                                {match.category && <span className="text-[8px] font-black bg-white/10 text-white/70 px-2 py-0.5 rounded-full uppercase">{match.category}</span>}
                                             </div>

                                             {/* Score / VS */}
                                             <div className="flex flex-col items-center gap-2 shrink-0">
                                                {match.match_time && (
                                                   <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                      <Clock className="w-2.5 h-2.5" /> {match.match_time.slice(0, 5)}
                                                   </span>
                                                )}
                                                {hasScore ? (
                                                   <div className="flex items-center gap-2">
                                                      <div className="bg-primary rounded-xl px-4 py-2.5 shadow-lg shadow-primary/30 min-w-[48px] flex items-center justify-center">
                                                         <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{fusScore ?? 0}</span>
                                                      </div>
                                                      <span className="text-slate-500 font-black text-lg">-</span>
                                                      <div className="bg-primary rounded-xl px-4 py-2.5 shadow-lg shadow-primary/30 min-w-[48px] flex items-center justify-center">
                                                         <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{oppScore ?? 0}</span>
                                                      </div>
                                                   </div>
                                                ) : (
                                                   <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
                                                      <span className="text-lg font-black text-white/50 italic tracking-widest">VS</span>
                                                   </div>
                                                )}
                                                {hasScore && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Score Final</span>}
                                             </div>

                                             {/* Opponent */}
                                             <div className="flex flex-col items-center gap-2 flex-1">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden p-2 shadow-lg">
                                                   <img src={oppLogo} alt={getOpponentName(match.opponent_id)} className="w-full h-full object-contain drop-shadow-lg" />
                                                </div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight text-center max-w-[80px] leading-tight">{getOpponentName(match.opponent_id)}</span>
                                                {match.formation && <span className="text-[8px] font-black bg-white/10 text-white/70 px-2 py-0.5 rounded-full uppercase">{match.formation}</span>}
                                             </div>
                                          </div>

                                          {/* Bottom action bar */}
                                          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-700/50 bg-slate-800/40">
                                             <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3" />
                                                {match.match_date}
                                             </span>
                                             <div className="flex items-center gap-2">
                                                {match.status === 'scheduled' && (
                                                   <button
                                                      onClick={async (e) => { e.stopPropagation(); await handleStartLive(match.id); }}
                                                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl transition-all"
                                                   >
                                                      <Radio className="w-3 h-3 animate-pulse" /> Démarrer Live
                                                   </button>
                                                )}
                                                <button
                                                   onClick={(e) => { e.stopPropagation(); setSelectedMatchId(match.id); setActiveTab('overview'); }}
                                                   className="flex items-center gap-1 text-slate-400 hover:text-white text-[9px] font-black transition-all"
                                                >
                                                   Détails <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                             </div>
                                          </div>
                                       </motion.div>
                                    );
                                 })}
                              </motion.div>
                           );
                        })()}
                        </AnimatePresence>

                        {/* Empty state when no date selected */}
                        {!calendarSelectedDate && (
                           <div className="flex items-center justify-center gap-2 py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              <Calendar className="w-4 h-4" />
                              Cliquez sur un jour avec des matches pour voir les détails
                           </div>
                        )}
                      </motion.div>

                  ) : viewMode === 'table' ? (
                     <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-white border rounded-[2rem] p-4 sm:p-6 shadow-xl overflow-hidden"
                     >
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="border-b-2 border-slate-100">
                                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Heure</th>
                                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Adversaire</th>
                                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</th>
                                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Statut</th>
                                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Score</th>
                                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {filteredMatches.map(match => (
                                    <tr key={match.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                       <td className="py-4 px-4 whitespace-nowrap">
                                          <div className="flex items-center gap-2">
                                             <Calendar className="w-4 h-4 text-slate-400" />
                                             <span className="text-xs font-bold text-slate-700">{match.match_date}</span>
                                             <span className="text-xs text-slate-500">{match.match_time?.substring(0, 5)}</span>
                                          </div>
                                       </td>
                                       <td className="py-4 px-4">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center p-1">
                                                <img 
                                                   src={opponentClubs.find(c => c.id === match.opponent_id)?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOpponentName(match.opponent_id))}&background=random`} 
                                                   alt="" 
                                                   className="w-full h-full object-contain" 
                                                />
                                             </div>
                                             <span className="text-xs font-black uppercase tracking-tight text-slate-800">{getOpponentName(match.opponent_id)}</span>
                                          </div>
                                       </td>
                                       <td className="py-4 px-4 whitespace-nowrap">
                                          <Badge className="bg-slate-100 text-slate-700 border-none text-[9px] font-bold">{match.category}</Badge>
                                       </td>
                                       <td className="py-4 px-4 text-center whitespace-nowrap">
                                          <Badge className={`border-none text-[9px] font-black uppercase ${match.status === 'finished' ? 'bg-slate-800 text-white' : match.status === 'live' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                             {match.status === 'finished' ? 'Terminé' : match.status === 'live' ? 'En cours' : 'À venir'}
                                          </Badge>
                                       </td>
                                       <td className="py-4 px-4 text-center whitespace-nowrap text-sm font-black tabular-nums">
                                          {match.status === 'finished' ? `${match.is_home ? match.score_home : match.score_away} - ${match.is_home ? match.score_away : match.score_home}` : '-'}
                                       </td>
                                       <td className="py-4 px-4 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             {match.status === 'scheduled' && (
                                                <Button 
                                                   variant="ghost" 
                                                   size="sm" 
                                                   onClick={async (e) => { e.stopPropagation(); await handleStartLive(match.id); }}
                                                   className="h-8 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all flex items-center gap-1"
                                                   title="Démarrer Live"
                                                >
                                                   <Radio className="w-3.5 h-3.5 animate-pulse" />
                                                   <span className="text-[9px] font-black uppercase">Live</span>
                                                </Button>
                                             )}
                                             <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => { setSelectedMatchId(match.id); setActiveTab('overview'); }}
                                                className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 p-0 flex items-center justify-center"
                                                title="Voir les détails"
                                             >
                                                <Activity className="w-4 h-4" />
                                             </Button>
                                             {can('manage_matches') && (
                                                <Button 
                                                   variant="ghost" 
                                                   size="sm"
                                                   onClick={async () => {
                                                      if (window.confirm('Voulez-vous vraiment supprimer ce match ?')) {
                                                         await deleteMatch(match.id);
                                                         if (selectedMatchId === match.id) setSelectedMatchId(null);
                                                      }
                                                   }}
                                                   className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 p-0"
                                                   title="Supprimer"
                                                >
                                                   <Trash2 className="w-4 h-4" />
                                                </Button>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                                 {filteredMatches.length === 0 && (
                                    <tr>
                                       <td colSpan={6} className="py-12 text-center text-slate-400 text-sm font-medium">
                                          Aucun match trouvé pour ces filtres.
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </motion.div>
                  ) : viewMode === 'grid' ? (
                     <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                     >
                        {filteredMatches.map(match => (
                           <MatchListItem 
                              key={match.id}
                              match={match}
                              isSelected={false}
                              onSelect={() => {
                                 setSelectedMatchId(match.id);
                                 setActiveTab('overview');
                              }}
                              onDelete={async (e) => { 
                                 e.stopPropagation(); 
                                 if (window.confirm('Voulez-vous vraiment supprimer ce match ?')) {
                                    await deleteMatch(match.id); 
                                 }
                              }}
                              opponentClubs={opponentClubs}
                              mainClub={mainClub}
                              getOpponentName={getOpponentName}
                              variant={match.status === 'live' ? 'live' : match.status === 'scheduled' ? 'upcoming' : 'past'}
                           />
                        ))}
                        {filteredMatches.length === 0 && (
                           <div className="col-span-full py-12 text-center text-slate-400 text-sm font-medium">
                              Aucun match trouvé pour ces filtres.
                           </div>
                        )}
                     </motion.div>
                  ) : null}
               </motion.div>
            )}

            {activeTab === 'overview' && selectedMatchId && selectedMatch && (
               <motion.div key="overview" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
                  <MatchOverviewPanel
                     match={selectedMatch}
                     mainClub={mainClub}
                     opponentClubs={opponentClubs}
                     getOpponentName={getOpponentName}
                     onOrchestrate={() => setActiveTab('preparation')}
                     onStats={() => setActiveTab('stats')}
                     onBack={() => setActiveTab('details')}
                  />
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
