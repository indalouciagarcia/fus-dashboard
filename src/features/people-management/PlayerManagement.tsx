import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlayers } from '../../hooks/usePlayers';
import { useTeams } from '../../hooks/useTeams';
import { useClubData } from '../../hooks/useClubData';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  CalendarDays,
  Ruler,
  Weight,
  Footprints,
  Globe,
  User as UserIcon,
  X,
  Camera,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  BarChart3,
  Trophy,
  Clock,
  Target,
  Users,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Save,
  Loader2,
  CheckSquare,
  Star,
  GripHorizontal,
  CheckCircle2,
  NotebookPen,
  ArrowUpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, Team } from '../../types';
import { storageService } from '../../services/storageService';
import { supabase } from '../../lib/supabase';
import ImageCropperModal from '../../components/ImageCropperModal';
import { Skeleton } from '../../components/ui/skeleton';
import { PLAYER_CATEGORIES } from '../../constants';

import ErrorEmptyState from '../../components/ErrorEmptyState';
import { useSurclassements, usePlayerSurclassements } from '../../hooks/useSurclassements';
import SurclassementModal from './SurclassementModal';

// ─── Fake player generation utilities ────────────────────────────────────────
const _FIRST_NAMES = [
  'Yassine','Mehdi','Soufiane','Omar','Amine','Hamza','Bilal','Rachid',
  'Karim','Saad','Adil','Younes','Tarik','Zakaria','Hicham','Khalid',
  'Abdellah','Nabil','Said','Driss','Mouad','Ayoub','Reda','Othmane',
  'Ilyas','Marouane','Nassim','Walid','Badr','Sami','Anass','Imad',
  'Hakim','Ryad','Taha','Brahim','Jawad','Aziz','Salim','Fouad',
];
const _LAST_NAMES = [
  'Benali','El Amrani','Ouali','Benabdallah','Rami','Hajji','Benameur',
  'Zine','Hassani','El Idrissi','Boukhari','Sebari','Naciri','El Housni',
  'Khadhraoui','Derras','Benkhali','Lahmidi','Talbi','Bensalem','Arabi',
  'Mouttaki','Faqir','Cherkaoui','Alaoui','Benjelloun','El Khamlichi',
  'Boussairi','Rahimi','Tlemçani','El Yamani','Chaabi','Ghazali','Essafi',
];
const _POSITIONS = [
  'GK','GK','GK',
  'CB','CB','CB','CB','RB','RB','LB','LB',
  'CDM','CDM','CM','CM','CAM',
  'LW','LW','RW','RW','ST','ST',
];
const _CAT_YEAR: Record<string, number> = {
  U7:2019, U9:2017, U11:2015, U13:2013, U14:2012,
  U15:2011, U16:2010, U17:2009, U19:2007, U21:2005,
  U23:2003, SENIOR:1998, PRO:1997, OTHER:1998,
};
const _r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const _pick = <T,>(arr: T[]): T => arr[_r(0, arr.length - 1)];
const _shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function buildFakePlayers(category: string, teamId: string) {
  const year    = _CAT_YEAR[category] ?? 1998;
  const isYouth = ['U7','U9','U11'].includes(category);
  const isMid   = ['U13','U14','U15','U16'].includes(category);
  const isAdol  = ['U17','U19'].includes(category);
  const feet    = ['right','right','right','left','left','both'] as const;

  // Numéros 1-99 mélangés, on prend les 22 premiers
  const jerseys  = _shuffle(Array.from({ length: 99 }, (_, i) => i + 1)).slice(0, 22);
  const positions = _shuffle([..._POSITIONS]);

  // Pool de noms : toutes les combinaisons prénom+nom possibles, mélangées
  const namePool = _shuffle(
    _FIRST_NAMES.flatMap(f => _LAST_NAMES.map(l => `${f} ${l}`))
  );

  return Array.from({ length: 22 }, (_, i) => {
    const birthYear = year + _r(-1, 1);
    const birthDate = `${birthYear}-${String(_r(1,12)).padStart(2,'0')}-${String(_r(1,28)).padStart(2,'0')}`;
    let height: number, weight: number;
    if (isYouth)      { height = _r(110,135); weight = _r(25,40); }
    else if (isMid)   { height = _r(140,165); weight = _r(38,58); }
    else if (isAdol)  { height = _r(160,182); weight = _r(55,72); }
    else              { height = _r(170,192); weight = _r(65,85); }
    return {
      full_name:      namePool[i],
      jersey_number:  jerseys[i],
      position:       positions[i],
      birth_date:     birthDate,
      nationality:    'Maroc',
      height,
      weight,
      preferred_foot: _pick([...feet]) as 'right'|'left'|'both',
      photo_url:      null,
      team_id:        teamId,
      category:       category === 'PRO' ? 'SENIOR' : category,
      is_active:      true,
    };
  });
}

// ─── Planning utilities ───────────────────────────────────────────────────────
const FR_DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_DAYS_FULL  = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FR_MONTHS     = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

const getWeekDays = (offset: number): string[] => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
};

const fmtShort = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${FR_DAYS_SHORT[d.getDay()]} ${d.getDate()}`;
};
const fmtFull = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${FR_DAYS_FULL[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]}`;
};

type Attendance = 'present' | 'absent' | 'blesse' | 'suspendu';
interface PlanningEntry { attendance: Attendance; rating: number; notes: string; }
interface PlanningData  { [playerId: string]: { [isoDate: string]: PlanningEntry } }
interface ScheduleModal { players: Player[]; days: string[]; }

const ATTENDANCE_OPTS: { value: Attendance; label: string; color: string }[] = [
  { value: 'present',   label: '✅ Présent',   color: 'emerald' },
  { value: 'absent',    label: '❌ Absent',    color: 'red'     },
  { value: 'blesse',    label: '🤕 Blessé',    color: 'orange'  },
  { value: 'suspendu',  label: '🚫 Suspendu',  color: 'amber'   },
];

const ATTENDANCE_BG: Record<Attendance, string> = {
  present:  'bg-emerald-500',
  absent:   'bg-red-500',
  blesse:   'bg-orange-500',
  suspendu: 'bg-amber-500',
};

const PlayerManagement: React.FC = () => {
  const { players, isLoading: playersLoading, isError: playersError, addPlayer, updatePlayer, deletePlayer, bulkDeletePlayers, isBulkDeleting, bulkAddPlayers, isBulkAdding } = usePlayers();
  const { teams, isLoading: teamsLoading, isError: teamsError } = useTeams();
  const { mainClub, isLoading: clubLoading } = useClubData();
  const {
    activeByPlayerId,
    createSurclassement,
    isCreating: isSurclassing,
    revertSurclassement,
    isReverting,
  } = useSurclassements();

  const queryClient = useQueryClient();

  // ─── Generate fake players ────────────────────────────────────────────────
  const [genModal, setGenModal]       = useState(false);
  const [genCategory, setGenCategory] = useState('');
  const [genTeamId, setGenTeamId]     = useState('');
  const [genProgress, setGenProgress] = useState(0);
  const [genRunning, setGenRunning]   = useState(false);

  const genTeams = useMemo(
    () => teams.filter(t => t.category === genCategory),
    [teams, genCategory],
  );

  const handleGenerateFakePlayers = async () => {
    if (!genTeamId || !genCategory) return;

    // Vérification session Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Session expirée — veuillez vous reconnecter (Déconnexion → reconnexion)');
      return;
    }

    setGenRunning(true);
    setGenProgress(0);

    // Progression animée pendant l'insert bulk
    const timer = setInterval(() => {
      setGenProgress(p => (p < 21 ? p + 1 : p));
    }, 120);

    try {
      const fakePlayers = buildFakePlayers(genCategory, genTeamId);
      await bulkAddPlayers(fakePlayers as any);
      clearInterval(timer);
      setGenProgress(22);
      setTimeout(() => {
        setGenModal(false);
        setGenCategory('');
        setGenTeamId('');
        setGenRunning(false);
        setGenProgress(0);
      }, 600);
    } catch (err: any) {
      clearInterval(timer);
      toast.error(`Erreur génération : ${err.message}`);
      setGenRunning(false);
      setGenProgress(0);
    }
  };

  // Surclassement modal state
  const [surclassementPlayer, setSurclassementPlayer] = useState<Player | null>(null);

  const handleOpenSurclassement = (player: Player) => setSurclassementPlayer(player);
  const handleCloseSurclassement = () => setSurclassementPlayer(null);
  
  // Settings sync
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(mainClub?.preferred_view_mode || 'list');
  const [pageSize, setPageSize] = useState(mainClub?.pagination_limit || 10);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    if (mainClub?.preferred_view_mode) setDisplayMode(mainClub.preferred_view_mode);
    if (mainClub?.pagination_limit) setPageSize(mainClub.pagination_limit);
  }, [mainClub]);

  const isLoading = playersLoading || teamsLoading || clubLoading;
  const isError = playersError || teamsError;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewState, setViewState] = useState<'LIST' | 'FORM' | 'VIEW' | 'STATS' | 'PLANNING' | 'BULK_ADD'>('LIST');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  // Multi-sélection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk add
  type BulkRow = {
    id: string; full_name: string; jersey_number: number; position: string;
    birth_date: string; nationality: string; team_id: string; category: string;
    photo_url: string; uploading: boolean;
  };
  const newBulkRow = (idx: number): BulkRow => ({
    id: crypto.randomUUID(), full_name: '', jersey_number: players.length + idx + 1,
    position: 'FW', birth_date: '2012-01-01', nationality: 'Maroc', team_id: '', category: 'U13',
    photo_url: '', uploading: false,
  });
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([newBulkRow(0)]);
  const updateBulkRow = (id: string, field: keyof BulkRow, value: any) =>
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const removeBulkRow = (id: string) => setBulkRows(prev => prev.filter(r => r.id !== id));

  const handleBulkPhotoUpload = async (rowId: string, file: File) => {
    updateBulkRow(rowId, 'uploading', true);
    try {
      const url = await storageService.uploadFile(file, 'players');
      updateBulkRow(rowId, 'photo_url', url);
    } catch { toast.error('Erreur upload photo'); }
    finally { updateBulkRow(rowId, 'uploading', false); }
  };

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.full_name.trim());
    if (!valid.length) { toast.error('Remplissez au moins un nom'); return; }
    const payload = valid.map(({ id, uploading, ...r }) => ({
      ...r,
      jersey_number: Number(r.jersey_number),
      team_id: r.team_id || null,
      birth_date: r.birth_date || null,
      category: r.category === 'PRO' ? 'SENIOR' : r.category,
      preferred_foot: 'right' as const,
      photo_url: r.photo_url || null, height: null, weight: null,
    }));
    await bulkAddPlayers(payload as any);
    setBulkRows([newBulkRow(0)]);
    setViewState('LIST');
  };
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  // Player Stats State
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Planning State
  const [weekOffset, setWeekOffset]       = useState(0);
  const [selectedDays, setSelectedDays]   = useState<string[]>([]);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModal | null>(null);
  const [planningData, setPlanningData]   = useState<PlanningData>(() => {
    try { return JSON.parse(localStorage.getItem('fus_planning') || '{}'); }
    catch { return {}; }
  });
  const [modalForms, setModalForms] = useState<Record<string, PlanningEntry>>({});

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const toggleDay = (day: string) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const openScheduleModal = (player: Player, adjPlayer: Player | undefined, days: string[]) => {
    const players = [player, adjPlayer].filter(Boolean) as Player[];
    const initForms: Record<string, PlanningEntry> = {};
    players.forEach(p => {
      initForms[p.id] = planningData[p.id]?.[days[0]] || { attendance: 'present', rating: 0, notes: '' };
    });
    setModalForms(initForms);
    setScheduleModal({ players, days });
  };

  const handleSavePlanning = () => {
    if (!scheduleModal) return;
    const updated = { ...planningData };
    scheduleModal.players.forEach(p => {
      if (!updated[p.id]) updated[p.id] = {};
      scheduleModal.days.forEach(day => {
        updated[p.id][day] = modalForms[p.id] || { attendance: 'present', rating: 0, notes: '' };
      });
    });
    setPlanningData(updated);
    localStorage.setItem('fus_planning', JSON.stringify(updated));
    setScheduleModal(null);
    setSelectedDays([]);
    toast.success('Planning enregistré !');
  };

  const updateModalForm = (playerId: string, field: keyof PlanningEntry, value: any) =>
    setModalForms(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));

  // Navigation functions for player details
  const goToNextPlayer = () => {
    if (!selectedPlayer || filteredPlayers.length <= 1) return;
    const currentIndex = filteredPlayers.findIndex(p => p.id === selectedPlayer.id);
    const nextIndex = (currentIndex + 1) % filteredPlayers.length;
    const nextPlayer = filteredPlayers[nextIndex];
    if (viewState === 'VIEW') {
      handleViewPlayer(nextPlayer);
    } else if (viewState === 'STATS') {
      handleViewStats(nextPlayer);
    }
  };

  const goToPreviousPlayer = () => {
    if (!selectedPlayer || filteredPlayers.length <= 1) return;
    const currentIndex = filteredPlayers.findIndex(p => p.id === selectedPlayer.id);
    const prevIndex = currentIndex === 0 ? filteredPlayers.length - 1 : currentIndex - 1;
    const prevPlayer = filteredPlayers[prevIndex];
    if (viewState === 'VIEW') {
      handleViewPlayer(prevPlayer);
    } else if (viewState === 'STATS') {
      handleViewStats(prevPlayer);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Player>>({
    full_name: '',
    jersey_number: 1,
    position: 'FW',
    birth_date: '2010-01-01',
    nationality: 'Maroc',
    height: 160,
    weight: 50,
    preferred_foot: 'right',
    photo_url: '',
    category: 'U13',
    team_id: ''
  });

  const calculateAge = (dob: string | null) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    return Math.abs(new Date(difference).getUTCFullYear() - 1970);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.jersey_number?.toString().includes(searchQuery);
      const matchesPosition = positionFilter === 'ALL' || p.position?.toUpperCase() === positionFilter.toUpperCase();
      const playerCategory = teams.find(t => t.id === p.team_id)?.category;
      const matchesCategory = categoryFilter === 'ALL' || playerCategory?.toUpperCase() === categoryFilter.toUpperCase();
      return matchesSearch && matchesPosition && matchesCategory;
    });
  }, [players, searchQuery, positionFilter, categoryFilter, teams]);

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlayers.slice(start, start + pageSize);
  }, [filteredPlayers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPlayers.length / pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, positionFilter, categoryFilter, pageSize]);

  // Auto-select team when category changes if there's only one team for that category
  React.useEffect(() => {
    if (viewState === 'FORM' && formData.category) {
      const matchingTeams = teams.filter(t => t.category === formData.category);
      if (matchingTeams.length === 1 && !formData.team_id) {
        setFormData(prev => ({ ...prev, team_id: matchingTeams[0].id }));
      }
    }
  }, [formData.category, teams, viewState]);

  const handleOpenEdit = (player: Player) => {
    setSelectedPlayer(player);
    setFormData(player);
    setViewState('FORM');
  };

  const handleOpenAdd = () => {
    setSelectedPlayer(null);
    setFormData({
      full_name: '',
      jersey_number: players.length + 1,
      position: 'FW',
      birth_date: '2012-01-01',
      nationality: 'Maroc',
      height: 155,
      weight: 45,
      preferred_foot: 'right',
      photo_url: '',
      category: 'U13',
      team_id: ''
    });
    setViewState('FORM');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedFileUrl(url);
      setCropModalOpen(true);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    setIsUploading(true);
    try {
      const fileName = `player-${Date.now()}.png`;
      const file = new File([croppedBlob], fileName, { type: 'image/png' });
      const publicUrl = await storageService.uploadFile(file, 'players');
      setFormData({ ...formData, photo_url: publicUrl });
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsUploading(false);
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
        setSelectedFileUrl(null);
      }
    }
  };

  const handleViewPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setViewState('VIEW');
    setLoadingStats(true);
    
    // Fetch player stats from match_events and matches
    try {
      const { data: events } = await supabase
        .from('match_events')
        .select('*')
        .eq('player_id', player.id);
      
      const { data: playerMatches } = await supabase
        .from('matches')
        .select('lineup, status, half_duration_minutes')
        .eq('status', 'finished');
      
      // Calculate matches played from lineup data
      let matchesPlayed = 0;
      let minutesPlayed = 0;
      
      playerMatches?.forEach(match => {
        const lineup = match.lineup as { startingXI?: string[]; substitutes?: string[] } | null;
        if (lineup?.startingXI?.includes(player.id) || lineup?.substitutes?.includes(player.id)) {
          matchesPlayed++;
          // Estimate minutes: if starter, assume full match (or use half_duration_minutes * 2)
          const isStarter = lineup.startingXI?.includes(player.id);
          const matchDuration = (match.half_duration_minutes || 45) * 2;
          if (isStarter) {
            minutesPlayed += matchDuration;
          } else {
            // Substitute: estimate 30 minutes
            minutesPlayed += 30;
          }
        }
      });
      
      // Check for substitution events to adjust minutes
      events?.forEach((e: any) => {
        if (e.type === 'substitution') {
          if (e.player_id === player.id) {
            // Player was substituted out
            minutesPlayed -= 15; // Rough estimate
          } else if (e.related_player_id === player.id) {
            // Player came in as substitute
            minutesPlayed += 15;
          }
        }
      });
      
      const stats = {
        matches: matchesPlayed,
        minutes: Math.max(0, minutesPlayed),
        goals: events?.filter((e: any) => e.type === 'goal').length || 0,
        assists: events?.filter((e: any) => e.type === 'assist').length || 0,
        yellowCards: events?.filter((e: any) => e.type === 'yellow_card').length || 0,
        redCards: events?.filter((e: any) => e.type === 'red_card').length || 0,
      };
      
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setPlayerStats({ matches: 0, minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleViewStats = async (player: Player) => {
    setSelectedPlayer(player);
    setLoadingStats(true);
    setViewState('STATS');
    
    // Fetch player stats from match_events
    try {
      const { data: events } = await supabase
        .from('match_events')
        .select('*')
        .eq('player_id', player.id);
      
      const stats = {
        matches: events?.length || 0,
        goals: events?.filter((e: any) => e.type === 'goal').length || 0,
        assists: events?.filter((e: any) => e.type === 'goal' && e.related_player_id === player.id).length || 0,
        yellowCards: events?.filter((e: any) => e.type === 'yellow_card').length || 0,
        redCards: events?.filter((e: any) => e.type === 'red_card').length || 0,
        substitutions: events?.filter((e: any) => e.type === 'substitution').length || 0,
      };
      
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setPlayerStats({ matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutions: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSave = async () => {
    try {
      const sanitizedData = {
        ...formData,
        team_id: formData.team_id === '' ? null : formData.team_id,
        birth_date: formData.birth_date === '' ? null : formData.birth_date,
        preferred_foot: (formData.preferred_foot as string)?.toLowerCase() as any, // DB expects lowercase 'left', 'right', 'both'
        category: formData.category === 'PRO' ? ('SENIOR' as any) : formData.category
      };

      if (selectedPlayer) {
        const { id, created_at, ...updateData } = sanitizedData as any;
        await updatePlayer({ id: selectedPlayer.id, data: updateData });
      } else {
        await addPlayer(sanitizedData as Omit<Player, 'id'>);
      }
      setViewState('LIST');
    } catch (err: any) {
      toast.error(`Erreur lors de la sauvegarde : ${err.message}`);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="h-16 w-full rounded-2xl bg-secondary/20 border border-secondary/50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
             <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <ErrorEmptyState 
           title="Accès au Roster Impossible"
           message="Nous n'avons pas pu charger la liste des joueurs. Vérifiez la table 'players' dans votre base."
           onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence mode="wait">
        {viewState === 'LIST' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Effectif Joueurs</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">Gérez vos athlètes et leurs données physiques</p>
                </div>
                
                {/* Main Action Buttons - Wrap on mobile */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Toggle */}
                  <div className="flex bg-secondary/30 p-1 rounded-2xl border">
                    <Button
                      variant={displayMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setDisplayMode('list')}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
                    >
                      <ListIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={displayMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setDisplayMode('grid')}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button onClick={handleOpenAdd} className="gap-2 shadow-lg shadow-primary/20 h-10 sm:h-11 px-4 sm:px-6 font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all active:scale-95 bg-primary">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Ajouter un Joueur</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </div>
              </div>

              {/* Secondary Actions - Scrollable on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                {/* Planning Button */}
                <Button
                  variant={viewState === 'PLANNING' ? 'default' : 'outline'}
                  onClick={() => setViewState(viewState === 'PLANNING' ? 'LIST' : 'PLANNING')}
                  className={`h-9 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs gap-2 transition-all shrink-0 ${viewState === 'PLANNING' ? 'bg-primary shadow-lg shadow-primary/20' : 'border-primary/30 text-primary hover:bg-primary/5'}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Planning</span>
                  <span className="sm:hidden">Plan</span>
                </Button>

                {/* Bouton mode sélection */}
                <Button
                  variant={selectionMode ? 'default' : 'outline'}
                  onClick={() => { setSelectionMode(s => !s); setSelectedIds(new Set()); }}
                  className={`h-9 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs gap-2 transition-all shrink-0 ${selectionMode ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white shadow-lg' : 'border-slate-200 text-slate-500'}`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? `${selectedIds.size}` : <span className="hidden sm:inline">Sélectionner</span>}
                </Button>

                {selectionMode && selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    disabled={isBulkDeleting}
                    onClick={async () => {
                      if (!confirm(`Supprimer ${selectedIds.size} joueur${selectedIds.size > 1 ? 's' : ''} et leurs photos définitivement ?`)) return;
                      await bulkDeletePlayers([...selectedIds]);
                      setSelectedIds(new Set());
                      setSelectionMode(false);
                    }}
                    className="h-9 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs gap-2 bg-red-600 hover:bg-red-700 shadow-lg shrink-0"
                  >
                    {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">Supprimer {selectedIds.size}</span>
                    <span className="sm:hidden">{selectedIds.size}</span>
                  </Button>
                )}

                {selectionMode && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const allIds = paginatedPlayers.map(p => p.id);
                      const allSelected = allIds.every(id => selectedIds.has(id));
                      setSelectedIds(allSelected ? new Set() : new Set(allIds));
                    }}
                    className="h-9 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs gap-2 border-slate-200 shrink-0"
                  >
                    {paginatedPlayers.every(p => selectedIds.has(p.id)) ? 'Tout désélect.' : 'Tout sélect.'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => { setGenCategory(''); setGenTeamId(''); setGenModal(true); }}
                  className="gap-2 h-9 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-violet-300 text-violet-600 hover:bg-violet-50 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Générer 22</span>
                  <span className="sm:hidden">Générer</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => { setBulkRows([newBulkRow(0)]); setViewState('BULK_ADD'); }}
                  className="gap-2 h-9 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-primary/30 text-primary hover:bg-primary/5 shrink-0"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajout multiple</span>
                  <span className="sm:hidden">Multiple</span>
                </Button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border shadow-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par nom ou numéro..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 sm:h-11 bg-secondary/30 border-transparent focus:bg-white transition-all rounded-xl font-medium text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex bg-secondary/30 p-1 rounded-xl w-full overflow-x-auto no-scrollbar">
                  {(['ALL', ...PLAYER_CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        categoryFilter === cat ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <div className="flex bg-secondary/30 p-1 rounded-xl w-full sm:w-auto">
                  {(['ALL', 'GK', 'DF', 'MF', 'FW'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                        positionFilter === pos ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Area */}
            {displayMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {paginatedPlayers.map((player) => (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="group relative overflow-hidden border-secondary hover:border-primary/20 hover:shadow-2xl transition-all duration-500 bg-white rounded-[2rem]">
                        <CardContent className="p-0">
                          {/* Card Header Illustration */}
                          <div className="h-24 bg-gradient-to-br from-secondary to-secondary/50 relative overflow-hidden">
                             {/* Club Logo + Category Badge stacked */}
                             {mainClub?.logo_url && (
                               <div className="absolute top-3 left-3 flex flex-col items-center gap-2">
                                 <div className="w-16 h-16 rounded-full bg-white shadow-lg p-2">
                                   <img src={mainClub.logo_url} alt="Club" className="w-full h-full object-contain rounded-full" />
                                 </div>
                                 <Badge className="bg-white/90 backdrop-blur-sm text-primary font-black text-[10px] uppercase tracking-widest border-none shadow-md px-3 py-1">
                                   {teams.find(t => t.id === player.team_id)?.category || 'N/A'}
                                 </Badge>
                               </div>
                             )}
                             <div className="absolute top-3 right-4 text-3xl font-black italic text-black/5 select-none transition-all group-hover:text-primary/10">
                                {player.jersey_number}
                             </div>
                          </div>
                          
                          <div className="px-6 pb-6 -mt-8 relative z-10 text-center">
                             <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden mx-auto mb-4 group-hover:scale-105 transition-transform duration-500">
                                <img src={(player.photo_url && player.photo_url !== 'null') ? player.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`} alt={player.full_name} className="w-full h-full object-cover" />
                             </div>
                             
                             <h3 className="font-black text-lg tracking-tight uppercase group-hover:text-primary transition-colors truncate">{player.full_name}</h3>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 mb-6">{player.position}</p>

                             {/* Badge surclassement actif */}
                             {activeByPlayerId[player.id] && (
                               <div className="mb-3 flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                                 <ArrowUpCircle className="w-3 h-3 text-orange-500" />
                                 <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                   SURCLASSÉ → {activeByPlayerId[player.id].target_category}
                                 </span>
                               </div>
                             )}

                             <div className="flex items-center justify-between pt-4 border-t border-secondary">
                                <div className="flex gap-2">
                                  <Button variant="secondary" size="icon" onClick={() => handleViewPlayer(player)} className="h-9 w-9 rounded-xl bg-secondary/50 hover:bg-primary hover:text-white transition-all">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="secondary" size="icon" onClick={() => handleViewStats(player)} className="h-9 w-9 rounded-xl bg-secondary/50 hover:bg-emerald-500 hover:text-white transition-all" title="Statistiques">
                                    <BarChart3 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="secondary" size="icon" onClick={() => handleOpenEdit(player)} className="h-9 w-9 rounded-xl bg-secondary/50 hover:bg-primary hover:text-white transition-all">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => handleOpenSurclassement(player)}
                                    title={activeByPlayerId[player.id] ? 'Réintégrer' : 'Surclasser'}
                                    className={`h-9 w-9 rounded-xl transition-all ${
                                      activeByPlayerId[player.id]
                                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                        : 'bg-secondary/50 hover:bg-orange-500 hover:text-white'
                                    }`}
                                  >
                                    {activeByPlayerId[player.id]
                                      ? <RotateCcw className="w-4 h-4" />
                                      : <ArrowUpCircle className="w-4 h-4" />
                                    }
                                  </Button>
                                </div>
                                                {selectionMode ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(player.id) ? n.delete(player.id) : n.add(player.id); return n; }); }}
                                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${selectedIds.has(player.id) ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                                  >
                                    {selectedIds.has(player.id) ? <CheckSquare className="w-4 h-4" /> : <div className="w-4 h-4 rounded border-2 border-current" />}
                                  </button>
                                ) : (
                                <Button variant="ghost" size="icon" onClick={() => deletePlayer(player.id)} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                )}
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/10 border-b">
                    <tr>
                      <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center gap-2">
                          Joueur
                          {mainClub?.logo_url && categoryFilter !== 'ALL' && (
                            <img src={mainClub.logo_url} alt="Club" className="w-6 h-6 object-contain" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nationalité</th>
                      <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position</th>
                      <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catégorie</th>
                      <th className="text-right px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary/30">
                    {paginatedPlayers.map((player) => (
                      <tr key={player.id} className="group hover:bg-secondary/5 transition-colors">
                        <td className="px-8 py-3">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-secondary/30 overflow-hidden border-2 border-white shadow-md">
                                <img src={(player.photo_url && player.photo_url !== 'null') ? player.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="font-black text-sm uppercase italic tracking-tighter leading-none">{player.full_name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">#{player.jersey_number}</p>
                             </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs font-bold">{player.nationality}</td>
                        <td className="py-3">
                           <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase">{player.position}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase">
                              {teams.find(t => t.id === player.team_id)?.category || 'N/A'}
                            </Badge>
                            {activeByPlayerId[player.id] && (
                              <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-[9px] font-black uppercase gap-1 border">
                                <ArrowUpCircle className="w-2.5 h-2.5" />
                                {activeByPlayerId[player.id].target_category}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-3 text-right">
                           <div className="flex items-center justify-end gap-1.5">
                              {selectionMode ? (
                                <button
                                  onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.has(player.id) ? n.delete(player.id) : n.add(player.id); return n; })}
                                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${selectedIds.has(player.id) ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                                >
                                  {selectedIds.has(player.id) ? <CheckSquare className="w-4 h-4" /> : <div className="w-4 h-4 rounded border-2 border-current" />}
                                </button>
                              ) : (
                              <>
                              <Button variant="ghost" size="icon" onClick={() => handleViewPlayer(player)} className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all">
                                 <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleViewStats(player)} className="h-9 w-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md transition-all" title="Statistiques">
                                 <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(player)} className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all">
                                 <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenSurclassement(player)}
                                title={activeByPlayerId[player.id] ? 'Réintégrer' : 'Surclasser'}
                                className={`h-9 w-9 rounded-xl transition-all ${
                                  activeByPlayerId[player.id]
                                    ? 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                                    : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-50'
                                }`}
                              >
                                {activeByPlayerId[player.id]
                                  ? <RotateCcw className="w-4 h-4" />
                                  : <ArrowUpCircle className="w-4 h-4" />
                                }
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePlayer(player.id)} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all">
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                              </>
                              )}
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
                    Affichage {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredPlayers.length)} sur {filteredPlayers.length}
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl bg-white border-secondary"><ChevronLeft className="w-4 h-4" /></Button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button key={i} variant={currentPage === i + 1 ? 'default' : 'ghost'} size="sm" onClick={() => setCurrentPage(i + 1)} className={`w-9 h-9 rounded-xl font-black text-[11px] ${currentPage === i + 1 ? 'shadow-lg shadow-primary/20 bg-primary' : 'bg-white border-secondary border'}`}>{i + 1}</Button>
                    ))}
                    <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="w-9 h-9 rounded-xl bg-white border-secondary"><ChevronRight className="w-4 h-4" /></Button>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Par page:</span>
                    <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="h-9 w-16 rounded-xl bg-white border border-secondary font-black text-xs px-2 appearance-none cursor-pointer text-center">
                       {[10, 15, 20, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                 </div>
              </div>
            )}
          </motion.div>
        ) : viewState === 'FORM' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
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
                <h3 className="text-4xl font-black tracking-tight uppercase italic">
                   {selectedPlayer ? 'Modifier le Profil' : 'Nouvelle Signature'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Enregistrement Passeport Joueur</p>
              </div>
            </div>

            <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden">
               <CardContent className="p-10 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
                    {/* Photo Upload Area */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Photo Officielle</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          id="player-photo" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                        <label 
                          htmlFor="player-photo" 
                          className="block aspect-square w-full rounded-[2.5rem] bg-secondary/30 border-2 border-dashed border-secondary hover:border-primary/50 transition-all cursor-pointer overflow-hidden group shadow-inner"
                        >
                          {(formData.photo_url && formData.photo_url !== 'null') ? (
                            <img src={formData.photo_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                               <Camera className={`w-10 h-10 ${isUploading ? 'animate-bounce text-primary' : 'text-muted-foreground opacity-30'}`} />
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{isUploading ? 'Transfert...' : 'Choisir une photo'}</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nom Complet de l'Athlète</label>
                         <Input 
                            value={formData.full_name}
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            placeholder="ex. Cristiano Ronaldo"
                            className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Numéro de Dossard</label>
                            <Input 
                               type="number"
                               value={formData.jersey_number}
                               onChange={e => setFormData({...formData, jersey_number: parseInt(e.target.value) || 0})}
                               className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20"
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Catégorie d'Âge</label>
                             <select 
                               value={formData.category}
                               onChange={e => setFormData({...formData, category: e.target.value as any, team_id: ''})}
                               className="w-full h-16 rounded-2xl bg-secondary/30 border-none font-bold px-8 text-lg outline-none appearance-none cursor-pointer focus:ring-2 ring-primary/20"
                             >
                                {PLAYER_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="PRO">PRO</option>
                             </select>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Affectation Équipe</label>
                      <select 
                        value={(formData as any).team_id || ''}
                        onChange={e => setFormData({...formData, team_id: e.target.value})}
                        className="w-full h-16 rounded-2xl bg-primary/5 border-primary/20 text-primary font-bold px-8 outline-none appearance-none cursor-pointer focus:ring-2 ring-primary/20"
                      >
                         <option value="">-- Sans Équipe (Agent Libre) --</option>
                         {teams.filter(t => t.category === formData.category).map(t => (
                           <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nationalité</label>
                      <Input 
                         value={formData.nationality}
                         onChange={e => setFormData({...formData, nationality: e.target.value})}
                         placeholder="ex. Maroc"
                         className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Date de Naissance</label>
                      <Input 
                         type="date"
                         value={formData.birth_date}
                         onChange={e => setFormData({...formData, birth_date: e.target.value})}
                         className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Poste Tactique</label>
                       <select 
                         value={formData.position}
                         onChange={e => setFormData({...formData, position: e.target.value as any})}
                         className="w-full h-16 rounded-2xl bg-secondary/30 border-none font-bold px-8 outline-none appearance-none cursor-pointer focus:ring-2 ring-primary/20"
                       >
                          <option value="GK">GK - Gardien</option>
                          <option value="DF">DF - Défenseur</option>
                          <option value="MF">MF - Milieu</option>
                          <option value="FW">FW - Attaquant</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Taille (cm)</label>
                      <Input 
                         type="number"
                         value={formData.height}
                         onChange={e => setFormData({...formData, height: parseFloat(e.target.value) || 0})}
                         className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Poids (kg)</label>
                      <Input 
                         type="number"
                         value={formData.weight}
                         onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                         className="h-16 px-8 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus:ring-2 ring-primary/20"
                      />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Pied de Prédilection</label>
                       <select 
                         value={formData.preferred_foot}
                         onChange={e => setFormData({...formData, preferred_foot: e.target.value as any})}
                         className="w-full h-16 rounded-2xl bg-secondary/30 border-none font-bold px-8 outline-none appearance-none cursor-pointer focus:ring-2 ring-primary/20"
                       >
                          <option value="Right">Droitier</option>
                          <option value="Left">Gaucher</option>
                          <option value="Both">Ambidextre</option>
                       </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-secondary/50">
                    <Button variant="ghost" onClick={() => setViewState('LIST')} className="flex-1 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-secondary">Annuler</Button>
                    <Button onClick={handleSave} className="flex-1 h-16 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">
                       {selectedPlayer ? 'Enregistrer les Modifications' : 'Confirmer la Signature'}
                    </Button>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        ) : viewState === 'VIEW' ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-5xl mx-auto"
          >
            {selectedPlayer && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setViewState('LIST')} 
                    className="w-14 h-14 rounded-2xl bg-white border shadow-sm hover:bg-secondary transition-all"
                  >
                    <X className="w-6 h-6 rotate-90" />
                  </Button>
                  
                  {/* Navigation buttons */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={goToPreviousPlayer}
                      disabled={filteredPlayers.length <= 1}
                      className="w-12 h-12 rounded-xl bg-white border shadow-sm hover:bg-secondary transition-all disabled:opacity-40"
                      title="Joueur précédent"
                    >
                      <PrevIcon className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={goToNextPlayer}
                      disabled={filteredPlayers.length <= 1}
                      className="w-12 h-12 rounded-xl bg-white border shadow-sm hover:bg-secondary transition-all disabled:opacity-40"
                      title="Joueur suivant"
                    >
                      <NextIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-4xl font-black tracking-tight uppercase italic">{selectedPlayer.full_name}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Détails du Profil Joueur</p>
                  </div>
                  
                  <Badge variant="outline" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {filteredPlayers.findIndex(p => p.id === selectedPlayer.id) + 1} / {filteredPlayers.length}
                  </Badge>
                </div>

                <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12">
                     {/* Left Side: Photo & Hero */}
                     <div className="md:col-span-5 bg-slate-950 p-16 text-white relative flex flex-col justify-between min-h-[600px]">
                        <div className="absolute top-0 right-0 w-80 h-80 -mr-40 -mt-40 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                        
                        {/* Club Logo + Category Badge stacked */}
                        {mainClub?.logo_url && (
                          <div className="absolute top-6 left-6 z-20 flex flex-col items-center gap-2">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-xl">
                              <img src={mainClub.logo_url} alt="Club" className="w-full h-full object-contain rounded-full" />
                            </div>
                            <Badge className="bg-white/10 backdrop-blur-md text-white font-black uppercase px-3 py-1 border border-white/20 text-xs">
                              {teams.find(t => t.id === selectedPlayer.team_id)?.category || 'N/A'}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="relative z-10 mt-20">
                           <span className="text-9xl font-black italic opacity-20 select-none">#{selectedPlayer.jersey_number}</span>
                           <div className="mt-6">
                              <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">
                                 {selectedPlayer.full_name.split(' ').map((n, i) => (
                                   <span key={i} className="block">{n}</span>
                                 ))}
                              </h2>
                              <Badge className="mt-8 bg-primary text-white font-black uppercase px-6 py-2 border-none text-sm">{selectedPlayer.position}</Badge>
                           </div>
                        </div>

                        <div className="relative z-10 w-full aspect-square rounded-[3.5rem] bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl mt-12">
                           <img src={(selectedPlayer.photo_url && selectedPlayer.photo_url !== 'null') ? selectedPlayer.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPlayer.full_name)}&background=random&color=fff&size=256`} alt={selectedPlayer.full_name} className="w-full h-full object-cover" />
                        </div>
                     </div>

                     {/* Right Side: Attributes */}
                     <div className="md:col-span-7 p-16 space-y-12 bg-white flex flex-col justify-center">
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-3">
                               <div className="w-8 h-px bg-primary/30" /> Passeport Technique
                           </h4>
                           
                           <div className="grid grid-cols-2 gap-12">
                              <div className="space-y-2">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nationalité</p>
                                 <div className="flex items-center gap-3 text-2xl font-black italic uppercase">
                                    <Globe className="w-6 h-6 text-primary" /> {selectedPlayer.nationality}
                                  </div>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Âge / Date de Naissance</p>
                                 <div className="flex items-center gap-3 text-2xl font-black italic uppercase">
                                    <Calendar className="w-6 h-6 text-primary" /> {calculateAge(selectedPlayer.birth_date)} ans
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                           <div className="p-8 rounded-[2.5rem] bg-secondary/20 space-y-3 border border-secondary/50">
                              <Ruler className="w-6 h-6 text-primary/40" />
                              <div>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase">Taille</p>
                                 <p className="text-2xl font-black">{selectedPlayer.height} <span className="text-xs uppercase ml-1 opacity-50">cm</span></p>
                              </div>
                           </div>
                           <div className="p-8 rounded-[2.5rem] bg-secondary/20 space-y-3 border border-secondary/50">
                              <Weight className="w-6 h-6 text-primary/40" />
                              <div>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase">Poids</p>
                                 <p className="text-2xl font-black">{selectedPlayer.weight} <span className="text-xs uppercase ml-1 opacity-50">kg</span></p>
                              </div>
                           </div>
                           <div className="p-8 rounded-[2.5rem] bg-secondary/20 space-y-3 border border-secondary/50">
                              <Footprints className="w-6 h-6 text-primary/40" />
                              <div>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase">Pied</p>
                                 <p className="text-2xl font-black uppercase italic">{selectedPlayer.preferred_foot}</p>
                              </div>
                           </div>
                        </div>

                        {/* Player Stats Section */}
                        <div className="pt-8 border-t border-secondary/50">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
                               <BarChart3 className="w-4 h-4 text-primary" />
                               <div className="w-8 h-px bg-primary/30" /> Statistiques Performance
                           </h4>
                           
                           {loadingStats ? (
                              <div className="flex items-center justify-center h-24">
                                 <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                              </div>
                           ) : (
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                 <div className="p-5 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 text-center">
                                    <Trophy className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Matchs</p>
                                    <p className="text-2xl font-black text-emerald-700">{playerStats?.matches || 0}</p>
                                 </div>
                                 <div className="p-5 rounded-[1.5rem] bg-blue-50 border border-blue-100 text-center">
                                    <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Minutes</p>
                                    <p className="text-2xl font-black text-blue-700">{playerStats?.minutes || 0}</p>
                                 </div>
                                 <div className="p-5 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 text-center">
                                    <Target className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Buts</p>
                                    <p className="text-2xl font-black text-indigo-700">{playerStats?.goals || 0}</p>
                                 </div>
                                 <div className="p-5 rounded-[1.5rem] bg-amber-50 border border-amber-100 text-center">
                                    <div className="w-5 h-5 rounded bg-amber-400 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Jaunes</p>
                                    <p className="text-2xl font-black text-amber-700">{playerStats?.yellowCards || 0}</p>
                                 </div>
                                 <div className="p-5 rounded-[1.5rem] bg-red-50 border border-red-100 text-center">
                                    <div className="w-5 h-5 rounded bg-red-500 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Rouges</p>
                                    <p className="text-2xl font-black text-red-700">{playerStats?.redCards || 0}</p>
                                 </div>
                              </div>
                           )}
                        </div>

                        <div className="pt-12 border-t border-secondary/50 flex gap-4">
                           <Button onClick={() => handleOpenEdit(selectedPlayer)} className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs gap-3 shadow-xl transition-all active:scale-95 bg-primary">
                              <Edit2 className="w-5 h-5" /> Modifier le Profil
                           </Button>
                           <Button variant="outline" onClick={() => setViewState('LIST')} className="h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs px-12 hover:bg-secondary transition-all">
                              Fermer
                           </Button>
                        </div>
                     </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        ) : viewState === 'STATS' ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            {selectedPlayer && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setViewState('LIST')} 
                    className="w-14 h-14 rounded-2xl bg-white border shadow-sm hover:bg-secondary transition-all"
                  >
                    <X className="w-6 h-6 rotate-90" />
                  </Button>
                  
                  {/* Navigation buttons */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={goToPreviousPlayer}
                      disabled={filteredPlayers.length <= 1}
                      className="w-12 h-12 rounded-xl bg-white border shadow-sm hover:bg-secondary transition-all disabled:opacity-40"
                      title="Joueur précédent"
                    >
                      <PrevIcon className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={goToNextPlayer}
                      disabled={filteredPlayers.length <= 1}
                      className="w-12 h-12 rounded-xl bg-white border shadow-sm hover:bg-secondary transition-all disabled:opacity-40"
                      title="Joueur suivant"
                    >
                      <NextIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-3xl font-black tracking-tight uppercase italic">Statistiques</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">{selectedPlayer.full_name}</p>
                  </div>
                  
                  <Badge variant="outline" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {filteredPlayers.findIndex(p => p.id === selectedPlayer.id) + 1} / {filteredPlayers.length}
                  </Badge>
                </div>

                <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
                  <CardContent className="p-10">
                    {loadingStats ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 text-center">
                          <Trophy className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Matchs Joués</p>
                          <p className="text-4xl font-black text-emerald-700">{playerStats?.matches || 0}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-blue-50 border border-blue-100 text-center">
                          <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Buts Marqués</p>
                          <p className="text-4xl font-black text-blue-700">{playerStats?.goals || 0}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 text-center">
                          <Users className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Passes Décisives</p>
                          <p className="text-4xl font-black text-indigo-700">{playerStats?.assists || 0}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 text-center">
                          <div className="w-8 h-8 rounded bg-amber-400 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Cartons Jaunes</p>
                          <p className="text-4xl font-black text-amber-700">{playerStats?.yellowCards || 0}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 text-center">
                          <div className="w-8 h-8 rounded bg-red-500 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Cartons Rouges</p>
                          <p className="text-4xl font-black text-red-700">{playerStats?.redCards || 0}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 text-center">
                          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Minutes Jouées</p>
                          <p className="text-4xl font-black text-slate-700">{playerStats?.minutes || 0}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center mt-8">
                      <Button 
                        variant="outline" 
                        onClick={() => setViewState('LIST')} 
                        className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs"
                      >
                        Fermer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        ) : viewState === 'PLANNING' ? (
          <motion.div
            key="planning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* ── Week Navigator ── */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-secondary/40 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Planning Entraînement</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                    Glisse des jours sur chaque joueur pour saisir leur fiche
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => { setWeekOffset(w => w - 1); setSelectedDays([]); }}
                    className="w-10 h-10 rounded-xl border-secondary"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground min-w-[130px] text-center">
                    {fmtShort(weekDays[0])} — {fmtShort(weekDays[6])}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => { setWeekOffset(w => w + 1); setSelectedDays([]); }}
                    className="w-10 h-10 rounded-xl border-secondary"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day Chips */}
              <div className="flex gap-3 flex-wrap">
                {weekDays.map(day => {
                  const isSelected = selectedDays.includes(day);
                  const isToday = day === new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={day}
                      draggable
                      onDragStart={(e) => {
                        const toDrag = isSelected && selectedDays.length > 0 ? selectedDays : [day];
                        e.dataTransfer.setData('planning-days', JSON.stringify(toDrag));
                      }}
                      onClick={() => toggleDay(day)}
                      className={`
                        relative flex flex-col items-center px-5 py-4 rounded-2xl border-2 cursor-grab active:cursor-grabbing
                        select-none transition-all duration-200 group
                        ${isSelected
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                          : isToday
                            ? 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
                            : 'bg-secondary/20 border-secondary hover:border-primary/30 hover:bg-secondary/40'
                        }
                      `}
                    >
                      <GripHorizontal className={`w-3 h-3 mb-1 opacity-40 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                      <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                        {FR_DAYS_SHORT[new Date(day + 'T00:00:00').getDay()]}
                      </span>
                      <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {new Date(day + 'T00:00:00').getDate()}
                      </span>
                      {isToday && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />
                      )}
                      {isSelected && (
                        <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-white drop-shadow" />
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedDays.length > 0 && (
                <div className="flex items-center gap-3 text-[11px] text-primary font-black uppercase tracking-widest">
                  <CheckSquare className="w-4 h-4" />
                  {selectedDays.length} jour{selectedDays.length > 1 ? 's' : ''} sélectionné{selectedDays.length > 1 ? 's' : ''}
                  &nbsp;—&nbsp; glisse-les sur un joueur ci-dessous
                  <button
                    onClick={() => setSelectedDays([])}
                    className="ml-4 text-muted-foreground hover:text-red-500 transition-colors font-bold normal-case tracking-normal"
                  >
                    Tout désélectionner
                  </button>
                </div>
              )}
            </div>

            {/* ── Player Grid with Drop Zones ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredPlayers.map((player, idx) => {
                const playerDays = planningData[player.id] || {};
                const weekAssigned = weekDays.filter(d => playerDays[d]);
                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.querySelector('[data-dropzone]')?.classList.add('border-primary', 'bg-primary/5', 'scale-[1.02]');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.querySelector('[data-dropzone]')?.classList.remove('border-primary', 'bg-primary/5', 'scale-[1.02]');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.querySelector('[data-dropzone]')?.classList.remove('border-primary', 'bg-primary/5', 'scale-[1.02]');
                      const raw = e.dataTransfer.getData('planning-days');
                      if (!raw) return;
                      const days: string[] = JSON.parse(raw);
                      const adjIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
                      const adjPlayer = filteredPlayers[adjIdx];
                      openScheduleModal(player, adjPlayer, days);
                    }}
                  >
                    <div className="bg-white rounded-[2.5rem] border-2 border-secondary/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:border-primary/20">
                      {/* Player Info */}
                      <div className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg shrink-0">
                          <img
                            src={(player.photo_url && player.photo_url !== 'null')
                              ? player.photo_url
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm uppercase truncate tracking-tight">{player.full_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                            #{player.jersey_number} • {player.position}
                          </p>
                        </div>
                        {weekAssigned.length > 0 && (
                          <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 shrink-0">
                            {weekAssigned.length}j planifié{weekAssigned.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Assigned days pills */}
                      {weekAssigned.length > 0 && (
                        <div className="px-6 pb-3 flex flex-wrap gap-2">
                          {weekAssigned.map(d => {
                            const entry = playerDays[d];
                            return (
                              <span
                                key={d}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase text-white ${ATTENDANCE_BG[entry?.attendance || 'present']}`}
                              >
                                {fmtShort(d)}
                                {entry?.rating > 0 && <span className="opacity-80">• {entry.rating}/10</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Drop Zone */}
                      <div
                        data-dropzone
                        className="mx-4 mb-4 border-2 border-dashed border-secondary/50 rounded-2xl px-4 py-5 flex flex-col items-center justify-center gap-2 transition-all duration-200"
                      >
                        <CalendarDays className="w-5 h-5 text-muted-foreground/30" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                          Dépose des jours ici
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredPlayers.length === 0 && (
              <div className="py-32 text-center border-2 border-dashed border-secondary/30 rounded-[3rem]">
                <p className="text-xl font-black uppercase text-muted-foreground/20">Aucun joueur trouvé</p>
              </div>
            )}
          </motion.div>

        ) : viewState === 'BULK_ADD' ? (
          <motion.div key="bulk" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Ajout Multiple</h2>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  {bulkRows.filter(r => r.full_name.trim()).length} / {bulkRows.length} joueur{bulkRows.length > 1 ? 's' : ''} à importer
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setViewState('LIST')} className="h-11 px-6 rounded-2xl font-black uppercase text-xs">
                  Annuler
                </Button>
                <Button
                  onClick={handleBulkSave}
                  disabled={isBulkAdding || bulkRows.filter(r => r.full_name.trim()).length === 0}
                  className="h-11 px-8 rounded-2xl font-black uppercase text-xs bg-primary shadow-lg shadow-primary/20 gap-2"
                >
                  {isBulkAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Importer {bulkRows.filter(r => r.full_name.trim()).length} joueur{bulkRows.filter(r => r.full_name.trim()).length > 1 ? 's' : ''}
                </Button>
              </div>
            </div>

            {/* Sélecteurs communs */}
            <div className="flex items-center gap-4 p-5 bg-white border rounded-[2rem] shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">Appliquer à tous :</p>
              <div className="flex items-center gap-3 flex-wrap">
                {(['U7','U9','U11','U13','U15','U16','U17','U19','U21','U23','SENIOR'] as const).map(cat => (
                  <button key={cat} onClick={() => setBulkRows(prev => prev.map(r => ({ ...r, category: cat })))}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-secondary/30 hover:bg-primary hover:text-white transition-all">
                    {cat}
                  </button>
                ))}
                <div className="h-6 w-px bg-slate-200" />
                <select
                  onChange={e => setBulkRows(prev => prev.map(r => ({ ...r, team_id: e.target.value })))}
                  className="h-8 px-3 rounded-xl text-[11px] font-bold bg-secondary/30 border-transparent outline-none"
                >
                  <option value="">Équipe…</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-secondary/10 border-b">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-10">#</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-16">Photo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-left">Nom Complet *</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-20">Maillot</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-28">Poste</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-32">Catégorie</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-36">Équipe</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-36">Date Naiss.</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/30">
                  {bulkRows.map((row, idx) => (
                    <tr key={row.id} className={`transition-colors ${row.full_name.trim() ? 'bg-emerald-50/30' : 'hover:bg-secondary/5'}`}>
                      <td className="px-4 py-2 text-center text-[11px] font-bold text-muted-foreground">{idx + 1}</td>

                      {/* Photo */}
                      <td className="px-4 py-2">
                        <label className="cursor-pointer block w-11 h-11 mx-auto">
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleBulkPhotoUpload(row.id, f); e.target.value = ''; }}
                          />
                          <div className={`w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center transition-all border-2 ${row.photo_url ? 'border-emerald-300' : 'border-dashed border-slate-200 hover:border-primary'}`}>
                            {row.uploading ? (
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            ) : row.photo_url ? (
                              <img src={row.photo_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <Camera className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        </label>
                      </td>

                      <td className="px-4 py-2">
                        <Input
                          value={row.full_name}
                          onChange={e => updateBulkRow(row.id, 'full_name', e.target.value)}
                          placeholder="Prénom Nom..."
                          className="h-9 text-sm font-semibold border-transparent bg-secondary/20 focus:bg-white rounded-xl"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number" min={1} max={99}
                          value={row.jersey_number}
                          onChange={e => updateBulkRow(row.id, 'jersey_number', Number(e.target.value))}
                          className="h-9 text-sm font-black text-center border-transparent bg-secondary/20 focus:bg-white rounded-xl"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={row.position}
                          onChange={e => updateBulkRow(row.id, 'position', e.target.value)}
                          className="h-9 w-full px-2 rounded-xl text-[11px] font-bold bg-secondary/20 border-transparent outline-none focus:bg-white"
                        >
                          {['GK','CB','LB','RB','DM','CM','AM','LW','RW','SS','FW'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={row.category}
                          onChange={e => updateBulkRow(row.id, 'category', e.target.value)}
                          className="h-9 w-full px-2 rounded-xl text-[11px] font-bold bg-secondary/20 border-transparent outline-none focus:bg-white"
                        >
                          {['U7','U9','U11','U13','U15','U16','U17','U19','U21','U23','SENIOR'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={row.team_id}
                          onChange={e => updateBulkRow(row.id, 'team_id', e.target.value)}
                          className="h-9 w-full px-2 rounded-xl text-[11px] font-bold bg-secondary/20 border-transparent outline-none focus:bg-white"
                        >
                          <option value="">—</option>
                          {teams.filter(t => !row.category || t.category === row.category).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="date" value={row.birth_date}
                          onChange={e => updateBulkRow(row.id, 'birth_date', e.target.value)}
                          className="h-9 text-xs border-transparent bg-secondary/20 focus:bg-white rounded-xl"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {bulkRows.length > 1 && (
                          <button onClick={() => removeBulkRow(row.id)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bouton ajouter une ligne */}
              <div className="p-4 border-t border-secondary/30">
                <button
                  onClick={() => setBulkRows(prev => [...prev, newBulkRow(prev.length)])}
                  className="w-full h-11 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-all text-[11px] font-black uppercase tracking-widest"
                >
                  <UserPlus className="w-4 h-4" /> Ajouter une ligne
                </button>
              </div>
            </div>
          </motion.div>

        ) : null}
      </AnimatePresence>

      {/* ── Schedule Modal (2 joueurs côte à côte) ── */}
      <AnimatePresence>
        {scheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 md:p-8"
            onClick={(e) => { if (e.target === e.currentTarget) setScheduleModal(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-secondary/30 px-10 py-7 flex items-center justify-between rounded-t-[3rem] z-10">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Fiche Planning</h3>
                  <p className="text-[11px] text-muted-foreground font-bold mt-1 flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                    {scheduleModal.days.map(d => fmtFull(d)).join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScheduleModal(null)}
                  className="w-12 h-12 rounded-2xl bg-secondary/30 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body — 2 joueurs côte à côte */}
              <div className={`p-10 grid gap-8 ${scheduleModal.players.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
                {scheduleModal.players.map(player => {
                  const form = modalForms[player.id] || { attendance: 'present', rating: 0, notes: '' };
                  return (
                    <div key={player.id} className="space-y-6 bg-secondary/10 rounded-[2.5rem] p-8">
                      {/* Player header */}
                      <div className="flex items-center gap-4 pb-5 border-b border-secondary/30">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-xl shrink-0">
                          <img
                            src={(player.photo_url && player.photo_url !== 'null')
                              ? player.photo_url
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-black text-lg uppercase italic tracking-tighter leading-none">{player.full_name}</h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">#{player.jersey_number} · {player.position}</p>
                        </div>
                      </div>

                      {/* Présence */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Présence</label>
                        <div className="grid grid-cols-2 gap-2">
                          {ATTENDANCE_OPTS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => updateModalForm(player.id, 'attendance', opt.value)}
                              className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border-2 ${
                                form.attendance === opt.value
                                  ? `${ATTENDANCE_BG[opt.value]} text-white border-transparent shadow-lg scale-[1.03]`
                                  : 'bg-white border-secondary hover:border-primary/20 text-muted-foreground'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note de performance */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-primary" /> Note de performance
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button
                              key={n}
                              onClick={() => updateModalForm(player.id, 'rating', n === form.rating ? 0 : n)}
                              className={`flex-1 h-10 rounded-xl text-[11px] font-black transition-all border-2 ${
                                n <= form.rating
                                  ? 'bg-primary text-white border-primary shadow-md'
                                  : 'bg-white border-secondary text-muted-foreground hover:border-primary/30'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        {form.rating > 0 && (
                          <p className="text-[10px] font-black text-primary text-right">{form.rating}/10</p>
                        )}
                      </div>

                      {/* Observations */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <NotebookPen className="w-3.5 h-3.5 text-primary" /> Observations
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => updateModalForm(player.id, 'notes', e.target.value)}
                          placeholder="Notes du coach pour cette session..."
                          rows={3}
                          className="w-full rounded-2xl bg-white border-2 border-secondary focus:border-primary px-5 py-4 text-sm font-medium resize-none outline-none transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-secondary/30 px-10 py-7 flex items-center justify-between rounded-b-[3rem]">
                <Button
                  variant="ghost"
                  onClick={() => setScheduleModal(null)}
                  className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSavePlanning}
                  className="h-14 px-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Save className="w-5 h-5" /> Enregistrer le Planning
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={selectedFileUrl}
        onCropComplete={handleCropComplete}
      />

      {/* Generate 22 Fake Players Modal */}
      <AnimatePresence>
        {genModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !genRunning) setGenModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg uppercase tracking-widest">Générer 22 Joueurs</h3>
                    <p className="text-white/70 text-xs font-medium">Données fictives réalistes (noms marocains)</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 space-y-5">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    1. Choisir la catégorie
                  </label>
                  <select
                    value={genCategory}
                    disabled={genRunning}
                    onChange={(e) => { setGenCategory(e.target.value); setGenTeamId(''); }}
                    className="w-full h-12 rounded-2xl border-2 border-secondary bg-secondary/20 px-4 text-sm font-semibold focus:outline-none focus:border-violet-400 transition-all"
                  >
                    <option value="">— Choisir une catégorie —</option>
                    {PLAYER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Team (conditionally shown) */}
                {genCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      2. Choisir l'équipe
                    </label>
                    {genTeams.length === 0 ? (
                      <div className="h-12 flex items-center justify-center rounded-2xl bg-orange-50 border-2 border-orange-200 text-orange-600 text-xs font-semibold">
                        Aucune équipe trouvée pour la catégorie {genCategory}
                      </div>
                    ) : (
                      <select
                        value={genTeamId}
                        disabled={genRunning}
                        onChange={(e) => setGenTeamId(e.target.value)}
                        className="w-full h-12 rounded-2xl border-2 border-secondary bg-secondary/20 px-4 text-sm font-semibold focus:outline-none focus:border-violet-400 transition-all"
                      >
                        <option value="">— Choisir une équipe —</option>
                        {genTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </motion.div>
                )}

                {/* Progress Bar */}
                {genRunning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Création en cours...</span>
                      <span className="text-violet-600 font-black text-sm">{genProgress} / 22</span>
                    </div>
                    <div className="h-3 bg-secondary/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                        animate={{ width: `${(genProgress / 22) * 100}%` }}
                        transition={{ ease: 'easeOut', duration: 0.25 }}
                      />
                    </div>
                    <p className="text-center text-[11px] text-muted-foreground font-medium">
                      {genProgress < 22
                        ? `Joueur ${genProgress + 1} en cours d'ajout...`
                        : 'Finalisation...'}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 border-t border-secondary/30 flex items-center justify-between">
                <Button
                  variant="ghost"
                  disabled={genRunning}
                  onClick={() => setGenModal(false)}
                  className="h-11 px-6 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleGenerateFakePlayers}
                  disabled={!genTeamId || genRunning}
                  className="h-11 px-8 rounded-2xl bg-violet-600 hover:bg-violet-700 font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {genRunning
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                    : <><Sparkles className="w-4 h-4" /> Générer 22 Joueurs</>
                  }
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surclassement Modal */}
      <AnimatePresence>
        {surclassementPlayer && (
          <SurclassementModalWrapper
            player={surclassementPlayer}
            teams={teams}
            activeByPlayerId={activeByPlayerId}
            createSurclassement={createSurclassement}
            isSurclassing={isSurclassing}
            revertSurclassement={revertSurclassement}
            isReverting={isReverting}
            onClose={handleCloseSurclassement}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Wrapper : charge l'historique du joueur sélectionné ────────────────────
interface WrapperProps {
  player: Player;
  teams: Team[];
  activeByPlayerId: Record<string, any>;
  createSurclassement: (p: any) => Promise<any>;
  isSurclassing: boolean;
  revertSurclassement: (id: string) => Promise<void>;
  isReverting: boolean;
  onClose: () => void;
}

function SurclassementModalWrapper({
  player, teams, activeByPlayerId,
  createSurclassement, isSurclassing,
  revertSurclassement, isReverting,
  onClose,
}: WrapperProps) {
  const activeSurclassement = activeByPlayerId[player.id] ?? null;
  const { data: history = [], isLoading: historyLoading } = usePlayerSurclassements(player.id);

  // Si le joueur est déjà surclassé, son team_id pointe vers l'équipe cible.
  // On utilise original_team_id du surclassement actif comme équipe réelle d'origine.
  const currentTeam = activeSurclassement
    ? teams.find(t => t.id === activeSurclassement.original_team_id)
    : teams.find(t => t.id === player.team_id);

  const handleConfirmSurclasser = async (targetTeamId: string, notes: string, targetJerseyNumber: number | null) => {
    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam || !currentTeam) return;
    await createSurclassement({
      player_id: player.id,
      original_team_id: currentTeam.id,
      target_team_id: targetTeamId,
      original_category: currentTeam.category,
      target_category: targetTeam.category,
      notes: notes || null,
      original_jersey_number: player.jersey_number ?? null,
      target_jersey_number: targetJerseyNumber,
    });
    onClose();
  };

  const handleConfirmRevert = async (surclassementId: string) => {
    await revertSurclassement(surclassementId);
    onClose();
  };

  return (
    <SurclassementModal
      player={player}
      teams={teams}
      originalTeam={currentTeam}
      activeSurclassement={activeSurclassement}
      history={history}
      historyLoading={historyLoading}
      isCreating={isSurclassing}
      isReverting={isReverting}
      onConfirmSurclasser={handleConfirmSurclasser}
      onConfirmRevert={handleConfirmRevert}
      onClose={onClose}
    />
  );
}

export default PlayerManagement;
