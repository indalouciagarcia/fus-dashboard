import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  Users,
  BarChart3,
  ChevronRight,
  Play,
  Shield,
  Star,
  Activity,
  Zap,
  LayoutPanelLeft,
  TrendingUp,
  ArrowUpDown,
  Swords,
  Flag,
  MapPin,
  Video,
  UserCheck,
  Search,
  RefreshCw,
  ChevronDown,
  Crosshair,
  Footprints,
  Maximize2,
  Sparkles,
  Radio,
  Timer
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { PlayerPitchHoverCard, type PlayerPitchStats } from './components/PlayerPitchHoverCard';
import { useMatchEvents } from '../../hooks/useMatchEvents';
import { usePlayers } from '../../hooks/usePlayers';
import { useArbitres } from '../../hooks/useArbitres';
import { useCompetitions } from '../../hooks/useCompetitions';
import { useStaff } from '../../hooks/useStaff';
import { matchService } from '../../services/matchService';
import type { Match } from '../../types';

interface MatchOverviewPanelProps {
  match: Match;
  allMatches?: Match[];
  onSelectMatch?: (match: Match) => void;
  mainClub?: any;
  opponentClubs?: any[];
  getOpponentName?: (id: string) => string;
  onOrchestrate?: () => void;
  onStats?: () => void;
  onBack: () => void;
}

// Tactical Formation Coordinates
const getFormationPositions = (formation: string) => {
  const roles: Record<string, { top: string; left: string; label: string }[]> = {
    '4-3-3': [
      { top: '92%', left: '50%', label: 'GK' },
      { top: '75%', left: '16%', label: 'LB' }, { top: '78%', left: '38%', label: 'CB' }, { top: '78%', left: '62%', label: 'CB' }, { top: '75%', left: '84%', label: 'RB' },
      { top: '54%', left: '30%', label: 'CM' }, { top: '62%', left: '50%', label: 'CDM' }, { top: '54%', left: '70%', label: 'CM' },
      { top: '24%', left: '20%', label: 'LW' }, { top: '15%', left: '50%', label: 'ST' }, { top: '24%', left: '80%', label: 'RW' },
    ],
    '4-4-2': [
      { top: '92%', left: '50%', label: 'GK' },
      { top: '75%', left: '16%', label: 'LB' }, { top: '78%', left: '38%', label: 'CB' }, { top: '78%', left: '62%', label: 'CB' }, { top: '75%', left: '84%', label: 'RB' },
      { top: '50%', left: '16%', label: 'LM' }, { top: '54%', left: '38%', label: 'CM' }, { top: '54%', left: '62%', label: 'CM' }, { top: '50%', left: '84%', label: 'RM' },
      { top: '18%', left: '36%', label: 'ST' }, { top: '18%', left: '64%', label: 'ST' },
    ],
    '4-2-3-1': [
      { top: '92%', left: '50%', label: 'GK' },
      { top: '75%', left: '16%', label: 'LB' }, { top: '78%', left: '38%', label: 'CB' }, { top: '78%', left: '62%', label: 'CB' }, { top: '75%', left: '84%', label: 'RB' },
      { top: '62%', left: '36%', label: 'CDM' }, { top: '62%', left: '64%', label: 'CDM' },
      { top: '42%', left: '20%', label: 'LAM' }, { top: '35%', left: '50%', label: 'CAM' }, { top: '42%', left: '80%', label: 'RAM' },
      { top: '15%', left: '50%', label: 'ST' },
    ],
    '3-5-2': [
      { top: '92%', left: '50%', label: 'GK' },
      { top: '76%', left: '26%', label: 'CB' }, { top: '80%', left: '50%', label: 'CB' }, { top: '76%', left: '74%', label: 'CB' },
      { top: '52%', left: '14%', label: 'LWB' }, { top: '56%', left: '36%', label: 'CM' }, { top: '62%', left: '50%', label: 'CDM' }, { top: '56%', left: '64%', label: 'CM' }, { top: '52%', left: '86%', label: 'RWB' },
      { top: '18%', left: '36%', label: 'ST' }, { top: '18%', left: '64%', label: 'ST' },
    ],
    '5-3-2': [
      { top: '92%', left: '50%', label: 'GK' },
      { top: '74%', left: '12%', label: 'LWB' }, { top: '78%', left: '30%', label: 'CB' }, { top: '80%', left: '50%', label: 'CB' }, { top: '78%', left: '70%', label: 'CB' }, { top: '74%', left: '88%', label: 'RWB' },
      { top: '52%', left: '32%', label: 'CM' }, { top: '58%', left: '50%', label: 'CM' }, { top: '52%', left: '68%', label: 'CM' },
      { top: '18%', left: '36%', label: 'ST' }, { top: '18%', left: '64%', label: 'ST' },
    ],
  };
  return roles[formation] || roles['4-3-3'];
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const StatBar: React.FC<{ label: string; home: number; away: number; icon?: string; unit?: string }> = ({
  label, home, away, icon, unit = ''
}) => {
  const total = (home + away) || 0;
  const homePercent = total === 0 ? 50 : Math.round((home / total) * 100);
  const awayPercent = total === 0 ? 50 : 100 - homePercent;

  return (
    <div className="space-y-1.5 py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-900 font-black tabular-nums w-8 text-left text-sm">{home}{unit}</span>
        <span className="text-slate-600 text-[10.5px] tracking-wider text-center flex-1 font-black flex items-center justify-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          {label}
        </span>
        <span className="text-slate-900 font-black tabular-nums w-8 text-right text-sm">{away}{unit}</span>
      </div>
      <div className="flex items-center gap-2 h-2.5">
        <div className="flex-1 bg-slate-100 rounded-full h-full flex justify-end overflow-hidden">
          <div
            className="bg-[#4d94ff] rounded-full h-full transition-all duration-700"
            style={{ width: `${total === 0 ? (home > 0 ? 100 : 0) : homePercent}%` }}
          />
        </div>
        <div className="flex-1 bg-slate-100 rounded-full h-full flex justify-start overflow-hidden">
          <div
            className="bg-[#e94e77] rounded-full h-full transition-all duration-700"
            style={{ width: `${total === 0 ? (away > 0 ? 100 : 0) : awayPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const MatchOverviewPanel: React.FC<MatchOverviewPanelProps> = ({
  match,
  allMatches = [],
  onSelectMatch,
  mainClub,
  opponentClubs = [],
  getOpponentName,
  onOrchestrate,
  onStats,
  onBack,
}) => {
  const { events } = useMatchEvents(match?.id);
  const { players } = usePlayers();
  const { arbitres } = useArbitres();
  const { leagues, stadiums } = useCompetitions();
  const { staff } = useStaff();

  const [matchStats, setMatchStats] = useState<any>(null);
  const [playerMatchStats, setPlayerMatchStats] = useState<any[]>([]);
  const [matchLineupPlayers, setMatchLineupPlayers] = useState<any[]>([]);
  const [hoveredPlayerKey, setHoveredPlayerKey] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<'play' | 'narration'>('play');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch DB Match Stats & Lineup details
  useEffect(() => {
    if (match?.id) {
      matchService.getMatchStats(match.id).then(setMatchStats).catch(() => setMatchStats(null));
      matchService.getPlayerMatchStats(match.id).then(setPlayerMatchStats).catch(() => setPlayerMatchStats([]));
      matchService.getMatchLineup(match.id).then(setMatchLineupPlayers).catch(() => setMatchLineupPlayers([]));
    }
  }, [match?.id]);

  if (!match) {
    return (
      <div className="py-20 text-center space-y-3 bg-[#131d27] rounded-3xl text-white">
        <p className="text-slate-400 font-bold text-sm">Sélectionnez un match pour voir les détails</p>
        <Button onClick={onBack} size="sm" variant="outline">Retour</Button>
      </div>
    );
  }

  // Real Database Metadata
  const mainClubName = mainClub?.name || mainClub?.club_name || 'FUS Rabat';
  const mainClubLogo = mainClub?.logo_url && mainClub.logo_url !== 'null' ? mainClub.logo_url : null;
  const opponent = opponentClubs.find(c => c.id === match.opponent_id);
  const opponentName = (getOpponentName && match.opponent_id ? getOpponentName(match.opponent_id) : '') || opponent?.name || (match as any).opponent_name || 'Adversaire';
  const opponentLogo = opponent?.logo_url && opponent.logo_url !== 'null' ? opponent.logo_url : null;

  const homeScore = match.is_home ? (match.score_home ?? 0) : (match.score_away ?? 0);
  const awayScore = match.is_home ? (match.score_away ?? 0) : (match.score_home ?? 0);
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const league = leagues.find(l => l.id === match.league_id);
  const isFriendly = !match.league_id || league?.name?.toLowerCase().includes('amical') || match.category?.toLowerCase().includes('amical') || match.notes?.toLowerCase().includes('amical');
  const leagueName = isFriendly ? 'Match Amical' : (league?.name || 'Compétition Officielle');
  const stadium = stadiums.find(s => s.id === match.stadium_id);
  const stadiumName = stadium?.name || match.stadium || mainClub?.stadium || 'Stade Prince Moulay El Hassan';

  const startingXI: string[] = Array.isArray(match.lineup?.startingXI) ? match.lineup.startingXI : [];
  const subs: string[] = Array.isArray(match.lineup?.substitutes) ? match.lineup.substitutes : [];
  const formationKey = match.formation || match.lineup?.formation || '4-3-3';
  const opponentStartingXI: string[] = Array.isArray(match.opponent_lineup) ? match.opponent_lineup : [];
  const opponentSubs: string[] = Array.isArray(match.opponent_subs) ? match.opponent_subs : [];
  const opponentFormationKey = match.opponent_formation || '4-3-3';

  // Helper for real player info (handles both string ID and raw object)
  const getPlayer = (rawPid?: any) => {
    if (!rawPid) return null;
    const pid = typeof rawPid === 'object' ? (rawPid.id || rawPid.player_id) : rawPid;
    if (!pid) return null;
    return (players || []).find(pl => String(pl.id) === String(pid)) || null;
  };

  const getPlayerShortName = (rawPid?: any) => {
    if (!rawPid) return 'Joueur';
    if (typeof rawPid === 'object') {
      const nm = rawPid.last_name || rawPid.full_name || rawPid.name || rawPid.first_name || '';
      if (nm) {
        const parts = String(nm).trim().split(' ');
        return parts[parts.length - 1]?.substring(0, 12) || 'Joueur';
      }
    }
    const p = getPlayer(rawPid);
    if (!p) return 'Joueur';
    const name = p.last_name || p.name || p.first_name || '';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.substring(0, 12) || 'Joueur';
  };

  // Whether FUS plays at home (from DB)
  const isHome = match.is_home ?? true;

  // Real event stats directly from Supabase match_events & match
  const ourPlayerIds = new Set(
    [...startingXI, ...subs].map(item => (typeof item === 'object' ? (item.id || item.player_id) : item)).filter(Boolean)
  );

  // 1. Buts
  const ourGoalEvents = (events || []).filter(e => (e.type === 'goal' || e.type === 'penalty') && ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;
  const advGoalEvents = (events || []).filter(e => (e.type === 'goal' || e.type === 'penalty') && !ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;
  const ourGoals = Math.max(isHome ? homeScore : awayScore, ourGoalEvents);
  const advGoals = Math.max(isHome ? awayScore : homeScore, advGoalEvents);

  // 2. Assists (Passes décisives)
  const ourAssists = (events || []).filter(e => e.type === 'assist' && ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;
  const advAssists = (events || []).filter(e => e.type === 'assist' && !ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;

  // 3. Changements (Remplacements)
  const ourSubsCount = (events || []).filter(e => e.type === 'substitution' && ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;
  const advSubsCount = (events || []).filter(e => e.type === 'substitution' && !ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;

  // 4. Cartons Jaunes
  const ourYellows = (events || []).filter(e => e.type === 'yellow_card' && ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;
  const advYellows = (events || []).filter(e => e.type === 'yellow_card' && !ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;

  // 5. Cartons Rouges
  const ourReds = (events || []).filter(e => e.type === 'red_card' && ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;
  const advReds = (events || []).filter(e => e.type === 'red_card' && !ourPlayerIds.has(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId || '')).length;

  // Real Head Coach from Staff
  const headCoach = (staff || []).find(s => (s.role || '').toLowerCase().includes('entraîneur') || (s.role || '').toLowerCase().includes('coach')) || staff[0];
  const headCoachName = headCoach ? (headCoach.full_name || headCoach.name || 'Staff Technique') : 'Staff Technique FUS';

  // Real Timeline Events Feed
  const timelineEvents = useMemo(() => {
    if (events && events.length > 0) {
      return [...events].sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0)).map(e => {
        const rawPid = typeof e.playerId === 'object' ? (e.playerId?.id || e.playerId) : e.playerId;
        const isOur = rawPid ? ourPlayerIds.has(rawPid) : true;
        const playerObj = getPlayer(rawPid);
        const pName = playerObj ? (playerObj.last_name || playerObj.name || playerObj.first_name) : (typeof e.player === 'string' ? e.player : 'Joueur');

        let title = 'Événement';
        let desc = `Action enregistrée à la ${e.minute || 0}'`;
        if (e.type === 'goal') {
          title = '⚽ BUT !';
          desc = `Superbe but inscrit par ${pName} à la ${e.minute}'`;
        } else if (e.type === 'yellow_card') {
          title = '🟨 Carton Jaune';
          desc = `Avertissement arbitral adressé à ${pName}`;
        } else if (e.type === 'red_card') {
          title = '🟥 Carton Rouge';
          desc = `Expulsion directe de ${pName} à la ${e.minute}'`;
        } else if (e.type === 'substitution') {
          const inPlayer = getPlayerShortName(e.relatedPlayerId);
          title = '🔁 Changement';
          desc = `Entrée de ${inPlayer} à la place de ${pName}`;
        } else if (e.type === 'assist') {
          title = '⭐ Passe Décisive';
          desc = `Passe décisive délivrée par ${pName}`;
        } else if (e.type === 'penalty') {
          title = '🎯 Penalty';
          desc = `Tir au but converti par ${pName}`;
        }

        return {
          id: e.id,
          minute: e.minute || 0,
          type: e.type,
          player: String(pName),
          photo: playerObj?.photo_url && playerObj.photo_url !== 'null' ? playerObj.photo_url : null,
          title,
          desc: typeof e.commentary === 'string' ? e.commentary : desc,
          isLeft: isOur,
        };
      });
    }
    return [];
  }, [events, players, ourPlayerIds]);

  // Real Event dots along the 0' - 90' timeline bar
  const timelineBarDots = useMemo(() => {
    return (events || []).slice(0, 10).map((e: any) => {
      const min = Math.min(90, Math.max(0, e.minute || 0));
      const leftPercent = `${(min / 90) * 100}%`;
      let colorClass = 'bg-[#4d94ff]';
      if (e.type === 'goal') colorClass = 'bg-[#2ecc71] ring-2 ring-emerald-300';
      else if (e.type === 'yellow_card') colorClass = 'bg-[#f1c40f]';
      else if (e.type === 'red_card') colorClass = 'bg-[#e74c3c]';
      else if (e.type === 'substitution') colorClass = 'bg-[#9b59b6]';
      return { minute: min, left: leftPercent, color: colorClass };
    });
  }, [events]);

  // Real Upcoming Matches List from DB
  const upcomingMatches = useMemo(() => {
    const list = (allMatches || []).filter(m => m.id !== match.id);
    return list.slice(0, 4);
  }, [allMatches, match.id]);




  // Current match minute
  const currentMatchMinute = isFinished ? 90 : isLive ? 70 : 0;

  const getHorizontalAlign = (leftStr: string): 'left' | 'center' | 'right' => {
    const leftNum = parseFloat(leftStr);
    if (leftNum < 45) return 'left';
    if (leftNum > 55) return 'right';
    return 'center';
  };

  const getPlayerHoverStats = (
    rawPid: any,
    roleLabel: string,
    isHomeTeam: boolean,
    isStarting: boolean,
    idx: number,
    fallbackJersey?: string | number
  ): PlayerPitchStats => {
    const pid = typeof rawPid === 'object' ? (rawPid?.player_id || rawPid?.id) : rawPid;
    const p = getPlayer(pid);
    const teamName = isHomeTeam ? mainClubName : opponentName;

    // Display Name
    let displayName = 'Joueur';
    if (isHomeTeam) {
      if (p) {
        displayName = `${p.first_name || ''} ${p.last_name || p.name || ''}`.trim() || 'Joueur FUS';
      } else if (typeof rawPid === 'object') {
        displayName = rawPid.full_name || rawPid.name || `Joueur FUS #${idx + 1}`;
      } else {
        displayName = `Joueur FUS #${idx + 1}`;
      }
    } else {
      if (typeof rawPid === 'object') {
        displayName = rawPid.name || rawPid.full_name || `Adversaire #${fallbackJersey ?? (idx + 1)}`;
      } else {
        displayName = `Adversaire #${fallbackJersey ?? (idx + 1)}`;
      }
    }

    const jerseyNumber = p?.jersey_number 
      ?? (typeof rawPid === 'object' ? (rawPid.jersey_number || rawPid.number) : null) 
      ?? (fallbackJersey ?? (idx + 1));

    const photoUrl = p?.photo_url && p.photo_url !== 'null' 
      ? p.photo_url 
      : (typeof rawPid === 'object' ? rawPid.photo_url : null);

    // DB stats fallback
    const dbStat = (playerMatchStats || []).find(s => String(s.player_id) === String(pid));
    const explicitMinutes = dbStat?.minutes_played;

    // Goals for this player
    const playerGoals = (events || []).filter(e => 
      (e.type === 'goal' || e.type === 'penalty') &&
      String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid)
    );
    const goalsCount = playerGoals.length;
    const goalsMinutes = playerGoals.map(g => g.minute || 0).sort((a, b) => a - b);

    // Assists
    const assistsCount = (events || []).filter(e => 
      e.type === 'assist' &&
      String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid)
    ).length;

    // Cards
    const yellowEvents = (events || []).filter(e => 
      e.type === 'yellow_card' &&
      String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid)
    );
    const redEvents = (events || []).filter(e => 
      e.type === 'red_card' &&
      String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid)
    );
    const yellowCardsCount = yellowEvents.length || (dbStat?.yellow_cards ?? 0);
    const redCardsCount = redEvents.length || (dbStat?.red_cards ?? 0);
    const yellowCardMinute = yellowEvents.length > 0 ? (yellowEvents[0].minute || null) : null;
    const redCardMinute = redEvents.length > 0 ? (redEvents[0].minute || null) : null;

    // Substitutions
    const subOutEvent = (events || []).find(e => 
      e.type === 'substitution' &&
      String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid)
    );
    const subInEvent = (events || []).find(e => 
      e.type === 'substitution' &&
      String(typeof e.relatedPlayerId === 'object' ? e.relatedPlayerId?.id : e.relatedPlayerId) === String(pid)
    );

    let minutesPlayed = 0;
    let minutesStatus = 'Non renseigné';
    let subDetails: string | null = null;

    if (isStarting) {
      if (subOutEvent) {
        minutesPlayed = explicitMinutes ?? (subOutEvent.minute || 0);
        const inPlayerName = getPlayerShortName(subOutEvent.relatedPlayerId);
        minutesStatus = `Titulaire · Sorti à la ${subOutEvent.minute}'`;
        subDetails = `Remplacé à la ${subOutEvent.minute}' par ${inPlayerName}`;
      } else {
        minutesPlayed = explicitMinutes ?? currentMatchMinute;
        minutesStatus = isFinished 
          ? 'Titulaire · Match complet (90\')' 
          : isLive 
          ? `Titulaire · En jeu (${currentMatchMinute}')` 
          : 'Titulaire';
      }
    } else {
      if (subInEvent) {
        const subMin = subInEvent.minute || 0;
        const played = Math.max(0, currentMatchMinute - subMin);
        minutesPlayed = explicitMinutes ?? played;
        const outPlayerName = getPlayerShortName(subInEvent.playerId);
        minutesStatus = `Entré à la ${subMin}' (${minutesPlayed}' jouées)`;
        subDetails = `Entré à la ${subMin}' à la place de ${outPlayerName}`;
      } else {
        minutesPlayed = explicitMinutes ?? 0;
        minutesStatus = 'Remplaçant (Non entré)';
      }
    }

    const lineupEntry = (matchLineupPlayers || []).find(lp => String(lp.player_id) === String(pid));
    const rating = dbStat?.rating ?? lineupEntry?.rating ?? null;

    return {
      id: String(pid || ''),
      name: displayName,
      jerseyNumber,
      positionLabel: roleLabel,
      teamName,
      isHome: isHomeTeam,
      photoUrl,
      minutesPlayed,
      minutesStatus,
      goalsCount,
      goalsMinutes,
      assistsCount,
      yellowCardsCount,
      yellowCardMinute,
      redCardsCount,
      redCardMinute,
      rating: typeof rating === 'number' ? rating : null,
      subDetails,
    };
  };

  // Real Tactical Positions
  const topTeamPositions = getFormationPositions(formationKey);
  const bottomTeamPositions = getFormationPositions(opponentFormationKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4 max-w-[1750px] mx-auto pb-10 font-sans select-none"
    >
      {/* ════ TOP DARK CONTEXT BAR (Real DB metadata) ════ */}
      <div className="bg-[#121e28] border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg h-8 px-3 gap-1"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Retour
          </Button>

          {/* Country */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Pays:</span>
            <div className="flex items-center gap-1.5 bg-[#1a2836] px-3 py-1 rounded-lg text-white font-bold border border-slate-700/60 text-[11px]">
              <span>🇲🇦</span>
              <span>Maroc</span>
            </div>
          </div>

          {/* Competition / Type de match */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">{isFriendly ? 'Type:' : 'Compétition:'}</span>
            {isFriendly ? (
              <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1 rounded-lg text-amber-300 font-black border border-amber-500/40 text-[11px] shadow-sm">
                <span>🤝</span>
                <span>Match Amical</span>
                {match.category && <span className="opacity-75 font-bold">({match.category})</span>}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#1a2836] px-3 py-1 rounded-lg text-white font-bold border border-slate-700/60 text-[11px] truncate max-w-[220px]">
                <span className="text-amber-400">🏆</span>
                <span>{leagueName}</span>
                {match.category && <span className="text-slate-400 text-[10px]">({match.category})</span>}
              </div>
            )}
          </div>

          {/* Match Date */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Date:</span>
            <div className="flex items-center gap-1.5 bg-[#1a2836] px-3 py-1 rounded-lg text-slate-300 font-medium border border-slate-700/60 text-[11px]">
              <span>{match.match_date || 'Aujourd’hui'}</span>
              <Calendar className="w-3.5 h-3.5 text-emerald-400 ml-2" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onOrchestrate && (
            <Button
              onClick={onOrchestrate}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase tracking-wider text-[10px] h-8 px-3 rounded-lg gap-1.5 shadow-md"
            >
              <LayoutPanelLeft className="w-3.5 h-3.5" /> Orchestrer
            </Button>
          )}
          {onStats && (
            <Button
              onClick={onStats}
              className="bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-wider text-[10px] h-8 px-3 rounded-lg gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Saisir Stats
            </Button>
          )}
        </div>
      </div>

      {/* ════ 3-COLUMN MAIN LAYOUT GRID (REAL DB DATA) ════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ────────────────────────────────────────────────────────── */}
        {/* 1. COLUMN 1: LIVE SCOREBOARD + CARD MATCHS À VENIR + FEED  */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Scoreboard Card */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-[#121e28]">
            {/* Top Status Header */}
            <div className={`px-4 py-2 flex items-center justify-between font-black text-[10px] uppercase ${isLive ? 'bg-red-500 text-white animate-pulse' : isFinished ? 'bg-[#2ecc71] text-[#0b141d]' : 'bg-blue-600 text-white'}`}>
              <span className="tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {isLive ? 'EN DIRECT' : isFinished ? 'MATCH TERMINÉ' : 'À VENIR'}
              </span>
              <span className="text-[9px] font-bold opacity-90 truncate max-w-[220px]">
                {stadiumName}
              </span>
            </div>

            {/* Scoreboard Body */}
            <div className="p-5 text-center text-white space-y-4 relative bg-gradient-to-b from-[#182635] to-[#121e28]">
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold tracking-wider uppercase flex-wrap">
                {isFriendly ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-black">
                    🤝 Match Amical
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-black">
                    🏆 {leagueName}
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{stadiumName}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{match.match_date}</span>
                {match.match_time && <span className="text-slate-500">· {match.match_time.slice(0, 5)}</span>}
              </div>

              {/* Clubs and Real Score */}
              <div className="flex items-center justify-between px-2">
                {/* Home Club */}
                <div className="flex-1 text-center min-w-0">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 border border-white/20 p-2 shadow-lg flex items-center justify-center mb-1.5">
                    {mainClubLogo ? (
                      <img src={mainClubLogo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Shield className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <h4 className="font-black text-xs md:text-sm tracking-wider uppercase text-white truncate max-w-full px-1">
                    {mainClubName}
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase">{match.category || 'Équipe Première'}</p>
                  <div className="text-4xl md:text-5xl font-black mt-2 text-white tabular-nums">
                    {homeScore}
                  </div>
                </div>

                {/* Score separator & minute */}
                <div className="px-3 flex flex-col items-center">
                  <span className="text-slate-500 font-bold text-lg mb-1">—</span>
                  <div className="w-11 h-11 rounded-full border-2 border-slate-600 bg-slate-800/80 flex items-center justify-center text-xs font-black text-emerald-400 shadow-inner">
                    {isFinished ? '90\'' : isLive ? '70\'' : '00\''}
                  </div>
                </div>

                {/* Away Club */}
                <div className="flex-1 text-center min-w-0">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 border border-white/20 p-2 shadow-lg flex items-center justify-center mb-1.5">
                    {opponentLogo ? (
                      <img src={opponentLogo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Target className="w-6 h-6 text-rose-400" />
                    )}
                  </div>
                  <h4 className="font-black text-xs md:text-sm tracking-wider uppercase text-white truncate max-w-full px-1">
                    {opponentName}
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase">{match.category || 'Adversaire'}</p>
                  <div className="text-4xl md:text-5xl font-black mt-2 text-white tabular-nums">
                    {awayScore}
                  </div>
                </div>
              </div>

              {/* 0' - 90' Timeline Slider Bar with real DB events */}
              <div className="pt-2 space-y-1">
                <div className="relative w-full h-2 bg-slate-700/80 rounded-full flex items-center">
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-500" />
                  {timelineBarDots.map((dot, idx) => (
                    <div
                      key={idx}
                      className={`absolute w-3 h-3 rounded-full ${dot.color} border border-slate-900 -translate-x-1/2 cursor-pointer shadow-md`}
                      style={{ left: dot.left }}
                      title={`${dot.minute}'`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[8px] text-slate-500 font-bold px-0.5">
                  <span>0'</span>
                  <span>45'</span>
                  <span>90'</span>
                </div>
              </div>
            </div>
          </div>

          {/* Play to Play & Narration Tabs + Real Vertical Timeline Feed */}
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200 space-y-4">
            
            {/* Tab Switcher Pills */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFeedTab('play')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  feedTab === 'play'
                    ? 'bg-[#2ecc71] text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> PLAY TO PLAY ({timelineEvents.length})
              </button>
              <button
                onClick={() => setFeedTab('narration')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  feedTab === 'narration'
                    ? 'bg-[#2ecc71] text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" /> NARRATION
              </button>
            </div>

            {/* Vertical Timeline Stream with Real Events */}
            {timelineEvents.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Activity className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Aucun événement enregistré
                </p>
                <p className="text-[10px] text-slate-400 max-w-xs">
                  Les buts, cartons, changements et tirs apparaîtront ici dès leur saisie.
                </p>
                {onOrchestrate && (
                  <Button onClick={onOrchestrate} size="sm" className="bg-[#2ecc71] hover:bg-emerald-600 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl">
                    <LayoutPanelLeft className="w-3.5 h-3.5 mr-1" /> Saisir les actions
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative pt-2 pb-4 space-y-4 max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
                {/* Central vertical line */}
                <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-emerald-300 -translate-x-1/2 pointer-events-none" />

                {timelineEvents.map((item: any, idx: number) => {
                  const isLeft = item.isLeft;
                  return (
                    <div key={item.id || idx} className="relative flex items-center justify-between gap-3 text-xs">
                      {/* Left text / block (FUS events) */}
                      <div className={`w-[42%] flex items-center justify-end gap-2 text-right ${isLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">
                            <span className="font-black">{item.player}</span> · {item.title}
                          </p>
                          {item.desc && (
                            <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                              {item.desc}
                            </p>
                          )}
                        </div>
                        {item.photo ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-sm shrink-0">
                            <img src={item.photo} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black text-[9px] flex items-center justify-center shrink-0 border border-emerald-300">
                            {item.player.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Center Minute Icon Pin */}
                      <div className="z-10 w-7 h-7 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center shadow-sm shrink-0">
                        <span className="text-[9px] font-black text-emerald-600">{item.minute}'</span>
                      </div>

                      {/* Right text / block (Opponent events) */}
                      <div className={`w-[42%] flex items-center justify-start gap-2 text-left ${!isLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-black text-[9px] flex items-center justify-center shrink-0 border border-rose-300">
                          ADV
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">
                            <span className="font-black">{item.player}</span> · {item.title}
                          </p>
                          {item.desc && (
                            <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                              {item.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 2. COLUMN 2: STATS & MATCHS À VENIR                        */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* STATS Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATS MATCH</h3>
              {onStats && (
                <button onClick={onStats} className="text-slate-400 hover:text-emerald-500 transition-colors">
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Team Badges */}
            <div className="flex items-center justify-between text-center px-2">
              <div className="w-[110px] min-w-0">
                <div className="w-11 h-11 mx-auto rounded-full bg-slate-100 p-1 flex items-center justify-center shadow-sm">
                  {mainClubLogo ? <img src={mainClubLogo} className="w-full h-full object-contain" /> : <Shield className="w-6 h-6 text-[#4d94ff]" />}
                </div>
                <p className="text-[10px] font-black text-slate-800 mt-1 truncate">{mainClubName}</p>
              </div>

              <div className="text-slate-300 font-bold text-xs">VS</div>

              <div className="w-[110px] min-w-0">
                <div className="w-11 h-11 mx-auto rounded-full bg-slate-100 p-1 flex items-center justify-center shadow-sm">
                  {opponentLogo ? <img src={opponentLogo} className="w-full h-full object-contain" /> : <Target className="w-6 h-6 text-[#e94e77]" />}
                </div>
                <p className="text-[10px] font-black text-slate-800 mt-1 truncate">{opponentName}</p>
              </div>
            </div>

            {/* Real Stats Bars for the 5 Metrics */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <StatBar label="Buts" icon="⚽" home={ourGoals} away={advGoals} />
              <StatBar label="Assists" icon="⭐" home={ourAssists} away={advAssists} />
              <StatBar label="Changements" icon="🔁" home={ourSubsCount} away={advSubsCount} />
              <StatBar label="Cartons Jaunes" icon="🟨" home={ourYellows} away={advYellows} />
              <StatBar label="Cartons Rouges" icon="🟥" home={ourReds} away={advReds} />
            </div>
          </div>

          {/* ── CARD MATCHS À VENIR (Real DB Fixtures) ── */}
          <div className="bg-[#121e28] border border-slate-800 rounded-2xl p-4 shadow-xl text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Matchs à venir
                </h3>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {upcomingMatches.length} Matchs
              </span>
            </div>

            {/* Upcoming List */}
            {upcomingMatches.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-[10px] font-medium">
                Aucun autre match programmé pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMatches.map((m: Match) => {
                  const opp = opponentClubs.find(c => c.id === m.opponent_id);
                  const oppNm = (getOpponentName && m.opponent_id ? getOpponentName(m.opponent_id) : '') || opp?.name || 'Adversaire';
                  const dateText = m.match_date || 'À venir';
                  const timeText = m.match_time ? m.match_time.slice(0, 5) : '18:00';

                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMatch?.(m)}
                      className="bg-[#182635] hover:bg-[#1f3144] border border-slate-700/60 hover:border-emerald-500/50 rounded-xl p-3 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                    >
                      {(() => {
                        const otherLeague = leagues.find(l => l.id === m.league_id);
                        const otherIsFriendly = !m.league_id || otherLeague?.name?.toLowerCase().includes('amical') || m.category?.toLowerCase().includes('amical') || m.notes?.toLowerCase().includes('amical');
                        return (
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-400" /> {timeText} · {dateText}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${m.status === 'live' ? 'bg-red-500 text-white animate-pulse' : otherIsFriendly ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
                              {m.status === 'live' ? 'LIVE' : otherIsFriendly ? '🤝 Amical' : (otherLeague?.name || m.category || 'PRO')}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between gap-2 py-1">
                        <span className="text-[11px] font-black text-white group-hover:text-emerald-300 transition-colors truncate">
                          {mainClubName}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded">
                          VS
                        </span>
                        <span className="text-[11px] font-black text-slate-300 group-hover:text-white transition-colors truncate text-right">
                          {oppNm}
                        </span>
                      </div>

                      <p className="text-[8px] text-slate-500 truncate mt-1 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {m.stadium || stadiumName}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 3. COLUMN 3: LINE UP REAL TACTICAL PITCH & BENCHES         */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#28963c] text-white flex flex-col">
            
            {/* Header: LINE UP & Half selector */}
            <div className="bg-[#2ecc71] px-4 py-2.5 flex items-center justify-between text-[#0b141d] font-black text-[11px] uppercase">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> COMPOSITIONS ({formationKey} vs {opponentFormationKey})
              </span>
              <div className="flex items-center gap-1 text-[9px] font-bold bg-[#1d7e32]/40 px-2 py-0.5 rounded text-white cursor-pointer">
                <span>TITULAIRES</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Tactical Football Pitch with Real Players */}
            <div className="relative w-full h-[620px] bg-gradient-to-b from-[#28963c] via-[#248936] to-[#207c31] p-3">
              {/* Grass vertical stripes */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(180deg, #000 0px, #000 35px, transparent 35px, transparent 70px)'
                }}
              />

              {/* Pitch Markings */}
              <div className="absolute inset-2 border-2 border-white/50 rounded pointer-events-none" />
              <div className="absolute top-1/2 inset-x-2 h-0.5 bg-white/50 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/50 pointer-events-none" />
              <div className="absolute top-2 inset-x-[25%] h-[12%] border-2 border-white/50 border-t-0 pointer-events-none" />
              <div className="absolute bottom-2 inset-x-[25%] h-[12%] border-2 border-white/50 border-b-0 pointer-events-none" />

              {/* Formations Labels */}
              <span className="absolute top-3 left-3 text-[9px] font-black text-white/90 bg-black/40 px-2 py-0.5 rounded">
                {mainClubName.substring(0, 6)} ({formationKey})
              </span>
              <span className="absolute bottom-3 left-3 text-[9px] font-black text-white/90 bg-black/40 px-2 py-0.5 rounded">
                {opponentName.substring(0, 6)} ({opponentFormationKey})
              </span>

              {/* Top Team Nodes (Real FUS Players - Blue/White Jerseys) */}
              {topTeamPositions.map((pos, idx) => {
                const rawPid = startingXI[idx];
                const pid = typeof rawPid === 'object' ? (rawPid?.player_id || rawPid?.id) : rawPid;
                const p = getPlayer(pid);
                const name = p ? (p.last_name || p.name || 'FUS') : (typeof rawPid === 'object' ? (rawPid.full_name || rawPid.name || 'FUS') : `J.${idx + 1}`);
                const jerseyVal = p?.jersey_number ?? (typeof rawPid === 'object' ? (rawPid.jersey_number || rawPid.number) : null) ?? (idx + 1);
                const jerseyText = String(jerseyVal);
                const hasGoal = (events || []).some(e => (e.type === 'goal' || e.type === 'penalty') && String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid));
                const hasYellowCard = (events || []).some(e => e.type === 'yellow_card' && String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid));
                const hasRedCard = (events || []).some(e => e.type === 'red_card' && String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(pid));

                // GK at top goal (~7.5%), Strikers near halfway line (~40%)
                const topPct = 48 - (parseFloat(pos.top) * 0.44);

                const isHovered = hoveredPlayerKey === `home-${idx}`;
                const hoverStats = isHovered ? getPlayerHoverStats(rawPid, pos.label, true, true, idx, jerseyVal) : null;
                const hAlign = getHorizontalAlign(pos.left);

                return (
                  <div
                    key={`home-${idx}`}
                    onMouseEnter={() => setHoveredPlayerKey(`home-${idx}`)}
                    onMouseLeave={() => setHoveredPlayerKey(null)}
                    className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${
                      isHovered ? 'scale-125 z-40' : 'hover:scale-125 z-20'
                    }`}
                    style={{ top: `${topPct}%`, left: pos.left }}
                  >
                    <div className="relative w-11 h-11 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-xl">
                      {p?.photo_url && p.photo_url !== 'null' ? (
                        <img src={p.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-black">{jerseyText}</span>
                      )}
                      {/* Jersey badge */}
                      <span className="absolute -top-1 -right-1 bg-slate-950 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow">
                        {jerseyText}
                      </span>
                      {hasGoal && <span className="absolute -bottom-1 -left-1 text-[10px]">⚽</span>}
                      {hasRedCard ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-3 bg-red-600 rounded-xs shadow border border-white/40" title="Carton Rouge" />
                      ) : hasYellowCard ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-3 bg-yellow-400 rounded-xs shadow border border-white/40" title="Carton Jaune" />
                      ) : null}
                    </div>
                    <span className="text-[8px] font-black text-white uppercase mt-0.5 tracking-tight drop-shadow bg-black/60 px-1.5 py-0.5 rounded-md truncate max-w-[65px]">
                      {String(name).split(' ').pop()}
                    </span>

                    {/* Popover Card */}
                    <AnimatePresence>
                      {isHovered && hoverStats && (
                        <PlayerPitchHoverCard
                          stats={hoverStats}
                          placement="bottom"
                          horizontalAlign={hAlign}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Bottom Team Nodes (Opponent Players - Red Jerseys) - Rotated 180° so GK is in the bottom goal */}
              {bottomTeamPositions.map((pos, idx) => {
                const rawOpp = opponentStartingXI[idx];
                const oppPid = typeof rawOpp === 'object' ? (rawOpp.id || rawOpp.player_id) : rawOpp;
                const jerseyVal = typeof rawOpp === 'object' ? (rawOpp.jersey_number || rawOpp.number || (idx + 1)) : (rawOpp || (idx + 1));
                const jerseyText = String(jerseyVal);

                const hasOppGoal = (events || []).some(e => (e.type === 'goal' || e.type === 'penalty') && String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(oppPid));
                const hasOppYellowCard = (events || []).some(e => e.type === 'yellow_card' && String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(oppPid));
                const hasOppRedCard = (events || []).some(e => e.type === 'red_card' && String(typeof e.playerId === 'object' ? e.playerId?.id : e.playerId) === String(oppPid));
                
                // Rotated 180°: GK occupies bottom goal (~92.5%), defenders (~85%), midfielders (~75%), strikers near center line (~60%)
                const topPct = 52 + (parseFloat(pos.top) * 0.44);
                const leftPct = parseFloat(pos.left);

                const isHovered = hoveredPlayerKey === `away-${idx}`;
                const hoverStats = isHovered ? getPlayerHoverStats(rawOpp, pos.label, false, true, idx, jerseyVal) : null;
                const hAlign = getHorizontalAlign(pos.left);

                return (
                  <div
                    key={`away-${idx}`}
                    onMouseEnter={() => setHoveredPlayerKey(`away-${idx}`)}
                    onMouseLeave={() => setHoveredPlayerKey(null)}
                    className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${
                      isHovered ? 'scale-125 z-40' : 'hover:scale-125 z-20'
                    }`}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                  >
                    <div className="relative w-11 h-11 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-xl">
                      {jerseyText}
                      {hasOppGoal && <span className="absolute -bottom-1 -left-1 text-[10px]">⚽</span>}
                      {hasOppRedCard ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-3 bg-red-600 rounded-xs shadow border border-white/40" title="Carton Rouge" />
                      ) : hasOppYellowCard ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-3 bg-yellow-400 rounded-xs shadow border border-white/40" title="Carton Jaune" />
                      ) : null}
                    </div>
                    <span className="text-[8px] font-black text-rose-200 uppercase mt-0.5 tracking-tight drop-shadow bg-black/60 px-1.5 py-0.5 rounded-md truncate max-w-[65px]">
                      Adv #{jerseyText}
                    </span>

                    {/* Popover Card */}
                    <AnimatePresence>
                      {isHovered && hoverStats && (
                        <PlayerPitchHoverCard
                          stats={hoverStats}
                          placement="top"
                          horizontalAlign={hAlign}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Benches Section (Real DB Substitutes & Coaches) */}
            <div className="bg-[#182635] p-3.5 border-t border-slate-700 text-white space-y-2.5">
              <div className="flex items-center justify-center">
                <span className="bg-slate-800 text-slate-300 text-[8px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border border-slate-700">
                  STAFF & REMPLAÇANTS
                </span>
              </div>

              {/* Coaches Portraits */}
              <div className="grid grid-cols-2 gap-2 text-center text-[8px] pb-2 border-b border-slate-700/60">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-xs">
                    👨‍💼
                  </div>
                  <p className="font-bold text-white uppercase mt-1 truncate max-w-full px-1">{headCoachName}</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-xs">
                    👨‍💼
                  </div>
                  <p className="font-bold text-slate-300 uppercase mt-1 truncate max-w-full px-1">Staff {opponentName}</p>
                </div>
              </div>

              {/* Substitutes List Columns with Photos */}
              <div className="grid grid-cols-2 gap-2 text-[8px]">
                {/* Home Subs from Supabase */}
                <div className="space-y-1.5">
                  {subs.length === 0 ? (
                    <span className="text-slate-500 italic text-[7.5px]">Aucun remplaçant</span>
                  ) : (
                    subs.slice(0, 5).map((rawSub, i) => {
                      const pid = typeof rawSub === 'object' ? (rawSub?.player_id || rawSub?.id) : rawSub;
                      const p = getPlayer(pid);
                      const subJersey = p?.jersey_number ?? (typeof rawSub === 'object' ? (rawSub.jersey_number || rawSub.number) : null) ?? (12 + i);
                      const subName = p ? getPlayerShortName(pid) : (typeof rawSub === 'object' ? (rawSub.full_name || rawSub.name) : 'Remplaçant');
                      const isSubHovered = hoveredPlayerKey === `sub-home-${i}`;
                      const subStats = isSubHovered ? getPlayerHoverStats(rawSub, 'SUB', true, false, i, subJersey) : null;

                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setHoveredPlayerKey(`sub-home-${i}`)}
                          onMouseLeave={() => setHoveredPlayerKey(null)}
                          className="relative flex items-center gap-1.5 truncate text-slate-300 hover:text-white cursor-pointer transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden border border-slate-600 shrink-0 flex items-center justify-center">
                            {p?.photo_url && p.photo_url !== 'null' ? (
                              <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-bold text-slate-400">{String(subJersey)}</span>
                            )}
                          </div>
                          <span className="text-emerald-400 font-bold">{String(subJersey)}.</span>
                          <span className="truncate uppercase text-[8px]">{String(subName)}</span>

                          <AnimatePresence>
                            {isSubHovered && subStats && (
                              <PlayerPitchHoverCard
                                stats={subStats}
                                placement="top"
                                horizontalAlign="left"
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Away Subs */}
                <div className="space-y-1.5">
                  {(opponentSubs.length > 0 ? opponentSubs : ['12', '14', '18', '21', '24']).slice(0, 5).map((rawOppSub, i) => {
                    const num = typeof rawOppSub === 'object' ? (rawOppSub.jersey_number || rawOppSub.number || (12 + i)) : String(rawOppSub);
                    const isOppSubHovered = hoveredPlayerKey === `sub-away-${i}`;
                    const oppSubStats = isOppSubHovered ? getPlayerHoverStats(rawOppSub, 'SUB', false, false, i, num) : null;

                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHoveredPlayerKey(`sub-away-${i}`)}
                        onMouseLeave={() => setHoveredPlayerKey(null)}
                        className="relative flex items-center gap-1.5 truncate text-slate-400 hover:text-white cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-rose-400">{String(num)}</span>
                        </div>
                        <span className="text-rose-400 font-bold">{String(num)}.</span>
                        <span className="truncate uppercase text-[8px]">Adv #{String(num)}</span>

                        <AnimatePresence>
                          {isOppSubHovered && oppSubStats && (
                            <PlayerPitchHoverCard
                              stats={oppSubStats}
                              placement="top"
                              horizontalAlign="right"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default MatchOverviewPanel;
