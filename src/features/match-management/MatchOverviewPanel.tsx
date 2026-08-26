import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useMatchEvents } from '../../hooks/useMatchEvents';
import { usePlayers } from '../../hooks/usePlayers';
import { useArbitres } from '../../hooks/useArbitres';
import { matchService } from '../../services/matchService';
import { supabase } from '../../lib/supabase';
import type { Match } from '../../types';

interface MatchOverviewPanelProps {
  match: Match;
  mainClub: any;
  opponentClubs: any[];
  getOpponentName: (id: string) => string;
  onOrchestrate: () => void;
  onStats: () => void;
  onBack: () => void;
}

const getFormationPositions = (formation: string) => {
  const roles: Record<string, { top: string; left: string; label: string }[]> = {
    '4-3-3': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '72%', left: '15%', label: 'LB' }, { top: '76%', left: '36%', label: 'CB' }, { top: '76%', left: '64%', label: 'CB' }, { top: '72%', left: '85%', label: 'RB' },
      { top: '50%', left: '32%', label: 'CM' }, { top: '58%', left: '50%', label: 'CDM' }, { top: '50%', left: '68%', label: 'CM' },
      { top: '22%', left: '20%', label: 'LW' }, { top: '12%', left: '50%', label: 'ST' }, { top: '22%', left: '80%', label: 'RW' },
    ],
    '4-4-2': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '72%', left: '15%', label: 'LB' }, { top: '76%', left: '36%', label: 'CB' }, { top: '76%', left: '64%', label: 'CB' }, { top: '72%', left: '85%', label: 'RB' },
      { top: '48%', left: '12%', label: 'LM' }, { top: '52%', left: '36%', label: 'CM' }, { top: '52%', left: '64%', label: 'CM' }, { top: '48%', left: '88%', label: 'RM' },
      { top: '18%', left: '38%', label: 'ST' }, { top: '18%', left: '62%', label: 'ST' },
    ],
    '3-5-2': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '74%', left: '28%', label: 'CB' }, { top: '78%', left: '50%', label: 'CB' }, { top: '74%', left: '72%', label: 'CB' },
      { top: '50%', left: '12%', label: 'LM' }, { top: '54%', left: '34%', label: 'CM' }, { top: '60%', left: '50%', label: 'CDM' }, { top: '54%', left: '66%', label: 'CM' }, { top: '50%', left: '88%', label: 'RM' },
      { top: '18%', left: '38%', label: 'ST' }, { top: '18%', left: '62%', label: 'ST' },
    ],
    '4-2-3-1': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '72%', left: '15%', label: 'LB' }, { top: '76%', left: '36%', label: 'CB' }, { top: '76%', left: '64%', label: 'CB' }, { top: '72%', left: '85%', label: 'RB' },
      { top: '60%', left: '36%', label: 'CDM' }, { top: '60%', left: '64%', label: 'CDM' },
      { top: '42%', left: '20%', label: 'LAM' }, { top: '34%', left: '50%', label: 'CAM' }, { top: '42%', left: '80%', label: 'RAM' },
      { top: '12%', left: '50%', label: 'ST' },
    ],
    '5-3-2': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '72%', left: '12%', label: 'LWB' }, { top: '75%', left: '30%', label: 'CB' }, { top: '78%', left: '50%', label: 'CB' }, { top: '75%', left: '70%', label: 'CB' }, { top: '72%', left: '88%', label: 'RWB' },
      { top: '52%', left: '32%', label: 'CM' }, { top: '56%', left: '50%', label: 'CM' }, { top: '52%', left: '68%', label: 'CM' },
      { top: '18%', left: '38%', label: 'ST' }, { top: '18%', left: '62%', label: 'ST' },
    ],
    '3-4-3': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '74%', left: '28%', label: 'CB' }, { top: '78%', left: '50%', label: 'CB' }, { top: '74%', left: '72%', label: 'CB' },
      { top: '52%', left: '12%', label: 'LM' }, { top: '56%', left: '36%', label: 'CM' }, { top: '56%', left: '64%', label: 'CM' }, { top: '52%', left: '88%', label: 'RM' },
      { top: '25%', left: '18%', label: 'LW' }, { top: '12%', left: '50%', label: 'ST' }, { top: '25%', left: '82%', label: 'RW' },
    ],
    '4-1-4-1': [
      { top: '90%', left: '50%', label: 'GK' },
      { top: '72%', left: '15%', label: 'LB' }, { top: '76%', left: '36%', label: 'CB' }, { top: '76%', left: '64%', label: 'CB' }, { top: '72%', left: '85%', label: 'RB' },
      { top: '62%', left: '50%', label: 'CDM' },
      { top: '42%', left: '12%', label: 'LM' }, { top: '45%', left: '34%', label: 'CM' }, { top: '45%', left: '66%', label: 'CM' }, { top: '42%', left: '88%', label: 'RM' },
      { top: '12%', left: '50%', label: 'ST' },
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

const getDefaultFormation = (startingXI: string[]) => {
  return startingXI.filter(Boolean).length >= 11 ? '4-4-2' : '4-3-3';
};

const EventIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'goal': return <span className="text-base">⚽</span>;
    case 'own_goal': return <span className="text-base">⚽</span>;
    case 'yellow_card': return <div className="w-3.5 h-4 rounded-sm bg-yellow-400 inline-block" />;
    case 'red_card': return <div className="w-3.5 h-4 rounded-sm bg-red-500 inline-block" />;
    case 'substitution': return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
    case 'assist': return <Star className="w-4 h-4 text-amber-500" />;
    case 'penalty': return <Target className="w-4 h-4 text-purple-500" />;
    case 'injury': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default: return <Zap className="w-4 h-4 text-slate-400" />;
  }
};

const StatBar: React.FC<{ label: string; home: number; away: number; unit?: string }> = ({ label, home, away, unit = '' }) => {
  const total = (home + away) || 1;
  const homePercent = Math.round((home / total) * 100);
  const awayPercent = 100 - homePercent;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span className="text-primary tabular-nums w-10">{home}{unit}</span>
        <span className="text-center flex-1">{label}</span>
        <span className="text-slate-400 tabular-nums w-10 text-right">{away}{unit}</span>
      </div>
      <div className="flex items-center gap-1.5 h-2">
        <div className="flex-1 bg-slate-100 rounded-full h-full flex justify-end overflow-hidden">
           <div className="bg-primary rounded-full h-full transition-all duration-700" style={{ width: `${homePercent}%` }} />
        </div>
        <div className="flex-1 bg-slate-100 rounded-full h-full flex justify-start overflow-hidden">
           <div className="bg-slate-400 rounded-full h-full transition-all duration-700" style={{ width: `${awayPercent}%` }} />
        </div>
      </div>
    </div>
  );
};


const MatchOverviewPanel: React.FC<MatchOverviewPanelProps> = ({
  match, mainClub, opponentClubs, getOpponentName, onOrchestrate, onStats, onBack,
}) => {
  const { events } = useMatchEvents(match.id);
  const { players } = usePlayers();
  const { arbitres } = useArbitres();
  const [matchStats, setMatchStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'stats' | 'lineup' | 'video'>('live');
  const [statsSubTab, setStatsSubTab] = useState<'equipe' | 'joueurs'>('equipe');
  const [lineupViewMode, setLineupViewMode] = useState<'mine' | 'opponent' | 'both'>('mine');
  const [reactionCounts, setReactionCounts] = useState<{fire: number, thumbsup: number, thumbsdown: number}>({ fire: 0, thumbsup: 0, thumbsdown: 0 });

  const getRefereeName = (id?: number | string | null) => {
    if (!id) return null;
    const found = arbitres.find(a => String(a.id) === String(id));
    return found ? `${found.prenom} ${found.nom}` : null;
  };

  const centralRefName = getRefereeName((match as any).referee_central_id || (match as any).referees_assigned?.central_id);
  const assistant1RefName = getRefereeName((match as any).referee_assistant1_id || (match as any).referees_assigned?.assistant1_id);
  const assistant2RefName = getRefereeName((match as any).referee_assistant2_id || (match as any).referees_assigned?.assistant2_id);
  const fourthRefName = getRefereeName((match as any).referee_fourth_id || (match as any).referees_assigned?.fourth_id);

  const opponent = opponentClubs.find(c => c.id === match.opponent_id);
  const opponentName = getOpponentName(match.opponent_id);
  const homeScore = match.is_home ? match.score_home : match.score_away;
  const awayScore = match.is_home ? match.score_away : match.score_home;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const startingXI: string[] = match.lineup?.startingXI || [];
  const subs: string[] = match.lineup?.substitutes || [];
  const formationKey = match.formation || match.lineup?.formation || getDefaultFormation(startingXI);
  const opponentStartingXI: string[] = match.opponent_lineup || Array(11).fill('');
  const opponentFormationKey = match.opponent_formation || '4-3-3';

  const pitchNodes: {
    id: string;
    top: string;
    left: string;
    name: string;
    photoUrl: string | null;
    jerseyNumber: string | number;
    isOpponent: boolean;
    label: string;
    sizeClass: string;
    textSizeClass: string;
  }[] = [];

  const isCompact = lineupViewMode === 'both';
  const nodeSize = isCompact ? 'w-8 h-8 md:w-9 md:h-9' : 'w-10 h-10 md:w-12 md:h-12';
  const labelSize = isCompact ? 'text-[7px] px-1 py-0.5 mt-0.5' : 'text-[8px] md:text-[9px] px-2 py-0.5 mt-1';

  if (lineupViewMode === 'mine' || lineupViewMode === 'both') {
    const minePositions = getFormationPositions(formationKey);
    minePositions.forEach((pos, idx) => {
      const pid = startingXI[idx];
      const p = pid ? players.find(pl => pl.id === pid) : null;
      
      const topPct = parseFloat(pos.top);
      const leftPct = parseFloat(pos.left);
      
      const topVal = lineupViewMode === 'both' 
        ? `${50 + (topPct / 2)}%`
        : `${topPct}%`;
      const leftVal = `${leftPct}%`;

      pitchNodes.push({
        id: `mine-${idx}-${pid || 'empty'}`,
        top: topVal,
        left: leftVal,
        name: p ? (p.full_name || p.name || '—') : pos.label,
        photoUrl: p && p.photo_url && p.photo_url !== 'null' ? p.photo_url : null,
        jerseyNumber: p ? (p.jersey_number ?? '') : '',
        isOpponent: false,
        label: pos.label,
        sizeClass: nodeSize,
        textSizeClass: labelSize
      });
    });
  }

  if (lineupViewMode === 'opponent' || lineupViewMode === 'both') {
    const opponentPositions = getFormationPositions(opponentFormationKey);
    opponentPositions.forEach((pos, idx) => {
      const jersey = opponentStartingXI[idx] || '';
      
      const topPct = parseFloat(pos.top);
      const leftPct = parseFloat(pos.left);
      
      let topVal = '';
      let leftVal = '';
      
      if (lineupViewMode === 'both') {
        topVal = `${(100 - topPct) / 2}%`;
        leftVal = `${100 - leftPct}%`;
      } else {
        topVal = `${topPct}%`;
        leftVal = `${leftPct}%`;
      }

      pitchNodes.push({
        id: `opponent-${idx}-${jersey || 'empty'}`,
        top: topVal,
        left: leftVal,
        name: jersey ? `Adversaire #${jersey}` : pos.label,
        photoUrl: opponent?.logo_url || null,
        jerseyNumber: jersey,
        isOpponent: true,
        label: pos.label,
        sizeClass: nodeSize,
        textSizeClass: labelSize
      });
    });
  }

  useEffect(() => {
    if (match.id) {
      matchService.getMatchStats(match.id).then(setMatchStats).catch(() => setMatchStats(null));
      
      // Fetch reactions
      supabase.from('match_reactions').select('reaction').eq('match_id', match.id).then(({ data }) => {
        const counts = { fire: 0, thumbsup: 0, thumbsdown: 0 };
        data?.forEach((r: any) => { if (r.reaction in counts) (counts as any)[r.reaction]++; });
        setReactionCounts(counts);
      });
      
      const ch = supabase.channel(`rx_${match.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_reactions', filter: `match_id=eq.${match.id}` }, (payload) => {
          const r = payload.new.reaction;
          if (r === 'fire' || r === 'thumbsup' || r === 'thumbsdown') {
            setReactionCounts(prev => ({ ...prev, [r]: prev[r] + 1 }));
          }
        }).subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [match.id]);

  const getPlayerShortName = (pid: string) => {
    const p = players.find(pl => pl.id === pid);
    if (!p) return '—';
    const name = p.name || p.first_name || '';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.substring(0, 7) || '—';
  };

  const getEventLabel = (type: string) => ({
    goal: 'But', own_goal: 'CSC', yellow_card: 'Carton J.', red_card: 'Carton R.',
    substitution: 'Changement', assist: 'Passe Déc.', penalty: 'Penalty', injury: 'Blessure',
    corner: 'Corner', foul: 'Faute', offside: 'Hors-Jeu', var: 'VAR',
  }[type] || type);

  const getBgGradient = () => {
    if (isLive) return 'from-red-700 via-red-800 to-red-900';
    if (isFinished) return 'from-slate-700 via-slate-800 to-slate-900';
    return 'from-blue-800 via-blue-900 to-indigo-900';
  };

  const getStatusInfo = () => {
    if (isLive) return { text: '⬤ EN DIRECT', cls: 'bg-red-500 animate-pulse' };
    if (isFinished) return { text: 'TERMINÉ', cls: 'bg-slate-500' };
    return { text: '⏱ À VENIR', cls: 'bg-emerald-500' };
  };

  const statusInfo = getStatusInfo();

  // Calculate Automatic Event-based Stats
  const ourPlayerIds = new Set([
    ...(match.lineup?.startingXI || []),
    ...(match.lineup?.substitutes || [])
  ]);

  const ourGoals = homeScore ?? 0;
  const advGoals = awayScore ?? 0;
  const ourYellows = events.filter(e => e.type === 'yellow_card' && ourPlayerIds.has(e.playerId || '')).length;
  const advYellows = events.filter(e => e.type === 'yellow_card' && !ourPlayerIds.has(e.playerId || '') && e.playerId !== null).length;
  const ourReds = events.filter(e => e.type === 'red_card' && ourPlayerIds.has(e.playerId || '')).length;
  const advReds = events.filter(e => e.type === 'red_card' && !ourPlayerIds.has(e.playerId || '') && e.playerId !== null).length;
  const ourSubs = events.filter(e => e.type === 'substitution' && ourPlayerIds.has(e.playerId || '')).length;
  const advSubs = events.filter(e => e.type === 'substitution' && !ourPlayerIds.has(e.playerId || '') && e.playerId !== null).length;
  const totalCards = ourYellows + ourReds;
  const disciplineIndex = Math.max(0, 100 - (ourYellows * 10) - (ourReds * 30));

  const goals = events.filter(e => e.type === 'goal' || e.type === 'own_goal');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary font-black uppercase tracking-widest text-[10px] -mb-2">
        <ChevronRight className="w-4 h-4 rotate-180" /> Retour
      </Button>

      {/* HERO SECTION (Always visible) */}
      <div className="w-full space-y-6">
          {/* ── HERO ── */}
          <div className={`relative bg-gradient-to-br ${getBgGradient()} rounded-[2rem] overflow-hidden shadow-2xl`}>
            {/* Grid texture */}
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Crect x='0' y='0' width='1' height='40'/%3E%3Crect x='0' y='0' width='40' height='1'/%3E%3C/g%3E%3C/svg%3E")`
            }} />
            <div className="relative z-10 p-5 md:p-6">
              {/* Top meta */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${statusInfo.cls} text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full`}>
                    {statusInfo.text}
                  </span>
                  {match.category && (
                    <span className="bg-white/10 border border-white/20 text-white/70 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {match.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-white/40 text-[10px] font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{match.match_date}</span>
                </div>
              </div>

              {/* Scoreboard */}
              <div className="flex items-center justify-between gap-3">
                {/* Home */}
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
                    {mainClub?.logo_url
                      ? <img src={mainClub.logo_url} alt="" className="w-full h-full object-contain p-1.5" />
                      : <Shield className="w-6 h-6 text-white/30" />}
                  </div>
                  <p className="text-white font-black text-[11px] uppercase tracking-tight text-center leading-tight truncate w-full px-1">
                    {mainClub?.name || 'Mon Club'}
                  </p>
                </div>

                {/* Score center */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {(isFinished || isLive) ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl md:text-5xl font-black text-white tabular-nums drop-shadow-lg">{homeScore ?? 0}</span>
                        <span className="text-white/20 text-xl font-black">—</span>
                        <span className="text-3xl md:text-5xl font-black text-white/50 tabular-nums">{awayScore ?? 0}</span>
                      </div>
                      {goals.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 max-w-[140px]">
                          {goals.slice(0, 4).map((g, i) => (
                            <span key={i} className="text-[8px] text-white/40 font-medium">
                              {getPlayerShortName(g.playerId || '')} {g.minute}'
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl md:text-4xl font-black text-white/20 tracking-widest">VS</div>
                      <span className="bg-white/10 border border-white/10 text-white/50 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1">À venir</span>
                    </div>
                  )}
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
                    {opponent?.logo_url
                      ? <img src={opponent.logo_url} alt="" className="w-full h-full object-contain p-1.5" />
                      : <Target className="w-6 h-6 text-white/30" />}
                  </div>
                  <p className="text-white/60 font-black text-[11px] uppercase tracking-tight text-center leading-tight truncate w-full px-1">
                    {opponentName}
                  </p>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                <Button onClick={onOrchestrate}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-xl gap-2 backdrop-blur-sm">
                  <LayoutPanelLeft className="w-3.5 h-3.5" />
                  {isFinished ? 'Composition' : 'Orchestrer'}
                </Button>
                {isFinished && (
                  <Button onClick={onStats}
                    className="bg-emerald-500/70 hover:bg-emerald-500/90 text-white border border-emerald-400/30 font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-xl gap-2">
                    <BarChart3 className="w-3.5 h-3.5" /> Stats
                  </Button>
                )}
                {isLive && (
                  <Button onClick={onOrchestrate}
                    className="bg-red-500/70 hover:bg-red-500 text-white border border-red-400/30 font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-xl gap-2 animate-pulse">
                    <Play className="w-3.5 h-3.5" /> Live
                  </Button>
                )}
              </div>

              {/* Referee Team Banner */}
              {(centralRefName || assistant1RefName || assistant2RefName || fourthRefName) && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-4 flex-wrap text-[10px] text-white/80 font-medium">
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Corps d'Arbitrage :
                  </span>
                  {centralRefName && <span>Central : <strong className="text-white">{centralRefName}</strong></span>}
                  {assistant1RefName && <span>A1 : <strong className="text-white">{assistant1RefName}</strong></span>}
                  {assistant2RefName && <span>A2 : <strong className="text-white">{assistant2RefName}</strong></span>}
                  {fourthRefName && <span>4ème : <strong className="text-white">{fourthRefName}</strong></span>}
                </div>
              )}
            </div>
          </div>

      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-slate-100">
        <Button variant={activeTab === 'live' ? 'default' : 'ghost'} onClick={() => setActiveTab('live')} className={`rounded-xl px-5 h-12 font-black uppercase tracking-widest text-[10px] transition-all gap-2 shrink-0 ${activeTab === 'live' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-slate-400 hover:bg-slate-100'}`}>
          <Activity className="w-4 h-4" /> Live / Résumé
        </Button>
        <Button variant={activeTab === 'stats' ? 'default' : 'ghost'} onClick={() => setActiveTab('stats')} className={`rounded-xl px-5 h-12 font-black uppercase tracking-widest text-[10px] transition-all gap-2 shrink-0 ${activeTab === 'stats' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-slate-400 hover:bg-slate-100'}`}>
          <BarChart3 className="w-4 h-4" /> Statistiques
        </Button>
        <Button variant={activeTab === 'lineup' ? 'default' : 'ghost'} onClick={() => setActiveTab('lineup')} className={`rounded-xl px-5 h-12 font-black uppercase tracking-widest text-[10px] transition-all gap-2 shrink-0 ${activeTab === 'lineup' ? 'bg-[#1a6b25] text-white shadow-xl shadow-green-900/20 scale-105' : 'text-slate-400 hover:bg-slate-100'}`}>
          <Users className="w-4 h-4" /> Composition
        </Button>
        <Button variant={activeTab === 'video' ? 'default' : 'ghost'} onClick={() => setActiveTab('video')} className={`rounded-xl px-5 h-12 font-black uppercase tracking-widest text-[10px] transition-all gap-2 shrink-0 ${activeTab === 'video' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 scale-105' : 'text-slate-400 hover:bg-slate-100'}`}>
          <Video className="w-4 h-4" /> Vidéo
        </Button>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="w-full">
        {activeTab === 'live' && (
          <div className="max-w-4xl mx-auto space-y-6">
          {/* ── TIMELINE ── */}
          <div className="bg-white border rounded-[2rem] p-5 shadow-xl flex flex-col" style={{ minHeight: '500px' }}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Play by Play
              </h3>
              <Badge className="bg-secondary text-foreground font-black text-[8px] rounded-lg">{events.length}</Badge>
            </div>

            {/* Club headers above timeline */}
            <div className="flex items-center justify-between mb-8 px-2">
              {/* Our club */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-primary/20 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                  {mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-full h-full object-contain p-2" alt="" /> : <Shield className="w-8 h-8 text-slate-300" />}
                </div>
                <span className="text-[12px] font-black uppercase tracking-widest text-primary">{mainClub?.name || 'Notre Club'}</span>
              </div>
              {/* Opponent */}
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-black uppercase tracking-widest text-slate-400">{opponentName}</span>
                <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                  {opponent?.logo_url ? <img src={opponent.logo_url} className="w-full h-full object-contain p-2" alt="" /> : <Target className="w-8 h-8 text-slate-300" />}
                </div>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-200">
                <Activity className="w-10 h-10" />
                <p className="text-xs font-black uppercase tracking-wider text-center text-slate-300">
                  {isFinished ? 'Aucun événement' : 'En attente...'}
                </p>
              </div>
            ) : (
              <div className="relative flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {/* Central timeline line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-slate-200 to-slate-100 -translate-x-1/2 pointer-events-none" />
                <div className="space-y-3 pb-6">
                  {[...events].filter(e => !['penalty', 'penalty_shot', 'missed_penalty', 'period_marker'].includes(e.type)).sort((a, b) => a.minute - b.minute).map((event) => {
                    const ourPlayerIds = [...startingXI, ...subs];
                    const isOurEvent = event.playerId ? ourPlayerIds.includes(event.playerId) : false;
                    const isLeft = isOurEvent;

                    return (
                      <div key={event.id} className={`flex items-center gap-2 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                        {/* Event card */}
                        <div className={`flex-1 flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
                          <div className={`${isLeft ? 'bg-primary/5 border-primary/15' : 'bg-slate-50 border-slate-100'} border rounded-xl px-3 py-2 max-w-[160px] w-full flex flex-col gap-0.5 shadow-sm ${isLeft ? 'items-end text-right' : 'items-start text-left'}`}>
                            <div className={`flex items-center gap-1.5 ${isLeft ? 'flex-row-reverse' : ''}`}>
                              <EventIcon type={event.type} />
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">{getEventLabel(event.type) === event.type.toUpperCase() && event.type === 'goal' ? 'BUT' : getEventLabel(event.type)}</span>
                            </div>
                            {event.playerId && (
                              <span className={`text-[10px] font-bold ${isLeft ? 'text-primary/70' : 'text-slate-400'}`}>{getPlayerShortName(event.playerId)}</span>
                            )}
                          </div>
                        </div>
                        {/* Minute bubble */}
                        <div className={`shrink-0 w-8 h-8 rounded-full ${isLeft ? 'bg-primary/10 border-primary/30' : 'bg-white border-slate-200'} border-2 shadow-sm flex items-center justify-center z-10`}>
                          <span className={`text-[9px] font-black tabular-nums ${isLeft ? 'text-primary' : 'text-slate-600'}`}>{event.minute}'</span>
                        </div>
                        {/* Spacer on the other side */}
                        <div className="flex-1" />
                      </div>
                    );
                  })}
                </div>

                {/* Séance de Penalties séparée */}
                {events.some(e => ['penalty', 'penalty_shot', 'missed_penalty'].includes(e.type)) && (
                  <div className="mt-8 relative z-10 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-center mb-6">
                      <div className="bg-white px-6 py-2 rounded-full border-2 border-slate-200 shadow-sm text-[11px] font-black uppercase tracking-widest text-slate-600">
                        Séance de Tirs au but
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...events].filter(e => ['penalty', 'penalty_shot', 'missed_penalty'].includes(e.type)).sort((a, b) => a.minute - b.minute).map((event) => {
                        const ourPlayerIds = [...startingXI, ...subs];
                        const isOurEvent = event.playerId ? ourPlayerIds.includes(event.playerId) : false;
                        const isScored = event.type === 'penalty' || event.type === 'penalty_shot';

                        return (
                          <div key={event.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isScored ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                               {isScored ? '✅' : '❌'}
                             </div>
                             <div className="flex-1">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">{isOurEvent ? mainClub?.name || 'FUS' : opponentName}</span>
                                {event.playerId && (
                                   <span className="text-[11px] font-bold text-slate-800">{getPlayerShortName(event.playerId)}</span>
                                )}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border rounded-[2rem] p-5 shadow-xl space-y-6" style={{ minHeight: '600px' }}>
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Statistiques
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setStatsSubTab('equipe')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statsSubTab === 'equipe' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Équipe
                  </button>
                  <button 
                    onClick={() => setStatsSubTab('joueurs')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statsSubTab === 'joueurs' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Joueurs
                  </button>
                </div>
              </div>

              {statsSubTab === 'equipe' && (
                <div className="space-y-8">
                  {/* Team Logos Header */}
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest px-2">
                    <div className="flex items-center gap-2 w-[140px]">
                      <div className="w-8 h-8 rounded-xl border-2 border-primary/20 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-5 h-5 object-contain" alt=""/> : <Shield className="w-4 h-4 text-slate-300" />}
                      </div>
                      <span className="text-primary truncate">{mainClub?.name || 'FUS CLUB'}</span>
                    </div>
                    <span className="text-slate-300">VS</span>
                    <div className="flex items-center gap-2 w-[140px] justify-end text-right">
                      <span className="text-slate-500 truncate">{opponentName}</span>
                      <div className="w-8 h-8 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {opponent?.logo_url ? <img src={opponent.logo_url} className="w-5 h-5 object-contain" alt=""/> : <Target className="w-4 h-4 text-slate-300" />}
                      </div>
                    </div>
                  </div>

                  {/* 3 Summary Blocks & Discipline Index */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* The 3 Blocks */}
                    <div className="col-span-1 md:col-span-3 grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 gap-1 shadow-sm">
                        <span className="text-3xl font-black text-slate-800">{ourGoals}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buts</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 gap-1 shadow-sm">
                        <span className="text-3xl font-black text-slate-800">{totalCards}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cartons</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 gap-1 shadow-sm">
                        <span className="text-3xl font-black text-slate-800">{ourSubs}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Changements</span>
                      </div>
                    </div>

                    {/* Discipline & Form */}
                    <div className="col-span-1 bg-emerald-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-emerald-100 shadow-sm relative overflow-hidden">
                      <h4 className="text-[8px] font-black text-emerald-600/70 uppercase tracking-[0.2em] mb-2 z-10">Discipline</h4>
                      <span className="text-3xl font-black text-emerald-600 z-10">{disciplineIndex}%</span>
                      <div className="flex gap-3 mt-2 z-10">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-3 bg-yellow-400 rounded-sm shadow-sm" />
                          <span className="text-[9px] font-bold text-slate-600">{ourYellows}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-3 bg-red-500 rounded-sm shadow-sm" />
                          <span className="text-[9px] font-bold text-slate-600">{ourReds}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="space-y-6 pt-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Détails du match</h4>
                    
                    {/* Automated from Events */}
                    <div className="space-y-5 px-2">
                      <StatBar label="Buts" home={ourGoals} away={advGoals} />
                      <StatBar label="Cartons Jaunes" home={ourYellows} away={advYellows} />
                      <StatBar label="Cartons Rouges" home={ourReds} away={advReds} />
                      <StatBar label="Changements" home={ourSubs} away={advSubs} />
                    </div>

                    {/* DB Fetched Stats */}
                    <div className="pt-4 border-t border-slate-100">
                      {matchStats ? (
                        <div className="space-y-5 px-2 mt-4">
                          <StatBar label="Possession" home={matchStats.possession ?? 50} away={100 - (matchStats.possession ?? 50)} unit="%" />
                          <StatBar label="Tirs" home={matchStats.shots ?? 0} away={Math.max(0, (matchStats.shots ?? 0) - 4)} />
                          <StatBar label="Cadrés" home={matchStats.shots_on_target ?? 0} away={Math.max(0, (matchStats.shots_on_target ?? 0) - 2)} />
                          <StatBar label="Corners" home={matchStats.corners ?? 0} away={Math.max(0, (matchStats.corners ?? 0) - 2)} />
                          <StatBar label="Fautes" home={matchStats.fouls ?? 0} away={matchStats.fouls ? matchStats.fouls + 2 : 0} />
                          <StatBar label="Passes" home={matchStats.passes ?? 0} away={Math.max(0, (matchStats.passes ?? 0) - 20)} />
                        </div>
                      ) : (
                        <div className="py-10 flex flex-col items-center gap-4 text-slate-300">
                          <TrendingUp className="w-8 h-8 text-slate-200" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-center text-slate-400">
                            {isFinished ? 'Stats techniques non saisies' : 'Stats techniques à venir'}
                          </p>
                          {isFinished && (
                            <Button onClick={onStats} size="sm" className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-xl gap-2 mt-2">
                              <BarChart3 className="w-3 h-3" /> Saisir stats
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {statsSubTab === 'joueurs' && (
                <div className="space-y-6">
                  <h4 className="text-center text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-6">Performances Individuelles</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from(ourPlayerIds).map(playerId => {
                      const player = players.find(p => p.id === playerId);
                      if (!player) return null;
                      
                      const pGoals = events.filter(e => e.type === 'goal' && e.playerId === playerId).length;
                      const pYellows = events.filter(e => e.type === 'yellow_card' && e.playerId === playerId).length;
                      const pReds = events.filter(e => e.type === 'red_card' && e.playerId === playerId).length;
                      const pSubs = events.filter(e => e.type === 'substitution' && (e.playerId === playerId || (e as any).playerInId === playerId || (e as any).relatedPlayerId === playerId)).length;

                      return (
                        <div key={playerId} className="bg-white rounded-[1.5rem] border border-red-100 overflow-hidden shadow-lg shadow-red-500/5 relative group hover:border-red-300 transition-all hover:-translate-y-1">
                          {/* Top Red Header */}
                          <div className="h-2 w-full bg-gradient-to-r from-red-600 to-red-500" />
                          
                          <div className="p-4 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0 -mt-2 mb-3 relative z-10">
                              {player.photo_url ? (
                                <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-6 h-6 text-red-300" />
                              )}
                              {player.number && (
                                <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[9px] font-black w-6 h-5 flex items-center justify-center rounded-tl-lg">
                                  {player.number}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center w-full mb-4">
                              <p className="text-[11px] font-black text-slate-800 truncate uppercase leading-tight">
                                {player.first_name}
                              </p>
                              <p className="text-[13px] font-black text-red-600 truncate uppercase leading-tight">
                                {player.last_name}
                              </p>
                            </div>
                            
                            {/* Small Stats Row */}
                            <div className="flex items-center justify-between w-full border-t border-red-50 pt-3 px-1">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[11px] leading-none">⚽</span>
                                <span className={`text-[12px] font-black ${pGoals > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{pGoals}</span>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm shadow-sm" />
                                <span className={`text-[12px] font-black ${pYellows > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{pYellows}</span>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-2.5 h-3.5 bg-red-500 rounded-sm shadow-sm" />
                                <span className={`text-[12px] font-black ${pReds > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{pReds}</span>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[11px] leading-none">🔄</span>
                                <span className={`text-[12px] font-black ${pSubs > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{pSubs}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {ourPlayerIds.size === 0 && (
                     <div className="py-10 flex flex-col items-center text-center text-red-300 gap-2">
                       <Users className="w-8 h-8 opacity-50" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Aucun joueur assigné</span>
                     </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#4caf50] border-4 border-white rounded-[2rem] p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] flex flex-col" style={{ minHeight: '800px', backgroundImage: 'linear-gradient(180deg, #1a6b25 0%, #22832f 10%, #1a6b25 20%, #22832f 30%, #1a6b25 40%, #22832f 50%, #1a6b25 60%, #22832f 70%, #1a6b25 80%, #22832f 90%, #1a6b25 100%)' }}>
            
            {/* Header Lineup */}
            <div className="flex items-center justify-between mb-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3">
              <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5 truncate">
                <Users className="w-4 h-4 text-white/70 shrink-0" />
                <span>
                  {lineupViewMode === 'mine' && `Compo ${formationKey}`}
                  {lineupViewMode === 'opponent' && `Compo ${opponentFormationKey} (Adv)`}
                  {lineupViewMode === 'both' && `Face-à-Face (${formationKey} vs ${opponentFormationKey})`}
                </span>
              </h3>
              <Badge className="bg-white text-[#1a6b25] border-none font-black text-[9px] rounded-lg shrink-0">
                {lineupViewMode === 'mine' && `${startingXI.filter(Boolean).length}/11 Titulaires`}
                {lineupViewMode === 'opponent' && `${opponentStartingXI.filter(Boolean).length}/11 Titulaires`}
                {lineupViewMode === 'both' && `${startingXI.filter(Boolean).length} vs ${opponentStartingXI.filter(Boolean).length}`}
              </Badge>
            </div>

            {/* View Mode Selector */}
            <div className="grid grid-cols-3 p-1 bg-black/20 backdrop-blur-sm rounded-xl mb-4 gap-1 border border-white/10">
              <button
                type="button"
                onClick={() => setLineupViewMode('mine')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${lineupViewMode === 'mine' ? 'bg-white text-[#1a6b25] shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                Notre Club
              </button>
              <button
                type="button"
                onClick={() => setLineupViewMode('both')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${lineupViewMode === 'both' ? 'bg-white text-[#1a6b25] shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                Face-à-Face
              </button>
              <button
                type="button"
                onClick={() => setLineupViewMode('opponent')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${lineupViewMode === 'opponent' ? 'bg-white text-[#1a6b25] shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                Adversaire
              </button>
            </div>

            {/* Pitch / Field */}
            <div className="relative flex-1 w-full rounded-2xl overflow-hidden border-2 border-white/20 mb-4 min-h-[450px]">
              {/* Field Grass Stripes */}
              <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(180deg, #000 0px, #000 45px, transparent 45px, transparent 90px)' }} />

              {/* Field Markings */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-[4%] border border-white/40" />
                <div className="absolute top-1/2 inset-x-[4%] h-px bg-white/40 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] h-[15%] rounded-full border border-white/40" />
                <div className="absolute top-[4%] left-[30%] right-[30%] h-[12%] border border-white/40 border-t-0" />
                <div className="absolute bottom-[4%] left-[30%] right-[30%] h-[12%] border border-white/40 border-b-0" />
                <div className="absolute top-[4%] left-[42%] right-[42%] h-[5%] bg-white/10 border border-white/40 border-t-0" />
                <div className="absolute bottom-[4%] left-[42%] right-[42%] h-[5%] bg-white/10 border border-white/40 border-b-0" />
              </div>
              
              {/* Players */}
              {pitchNodes.map((node) => {
                const initials = getInitials(node.name);
                
                return (
                  <div 
                    key={node.id} 
                    className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                    style={{ top: node.top, left: node.left }}
                  >
                    {/* Circle avatar / jersey */}
                    <div className={`relative ${node.sizeClass} rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-xl transition-all
                      ${node.isOpponent 
                        ? 'bg-slate-900 border-red-500/80 text-white' 
                        : node.photoUrl || node.jerseyNumber 
                          ? 'bg-blue-600 border-white text-white shadow-blue-900/50' 
                          : 'bg-black/30 border-white/40 text-white/50'
                      }`}
                    >
                      {node.photoUrl ? (
                        <img 
                          src={node.photoUrl} 
                          alt="" 
                          className="w-full h-full rounded-full object-cover p-0.5" 
                        />
                      ) : (
                        <span className={`font-black ${isCompact ? 'text-[9px]' : 'text-xs'} tracking-tighter uppercase`}>
                          {node.isOpponent 
                            ? (node.jerseyNumber || node.label) 
                            : node.jerseyNumber 
                              ? initials 
                              : node.label
                          }
                        </span>
                      )}

                      {/* Jersey Number Badge Overlay */}
                      {!node.isOpponent && node.photoUrl && node.jerseyNumber && (
                        <span className={`absolute -bottom-1 -right-1 bg-black text-white rounded-full flex items-center justify-center font-black border border-white shadow-md
                          ${isCompact ? 'w-4 h-4 text-[7px]' : 'w-5 h-5 text-[9px]'}`}>
                          {node.jerseyNumber}
                        </span>
                      )}

                      {node.isOpponent && node.photoUrl && node.jerseyNumber && (
                        <span className={`absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full flex items-center justify-center font-black border border-white shadow-md
                          ${isCompact ? 'w-4 h-4 text-[7px]' : 'w-5 h-5 text-[9px]'}`}>
                          {node.jerseyNumber}
                        </span>
                      )}
                    </div>

                    {/* Name Badge */}
                    <div className={`font-black rounded-md whitespace-nowrap shadow-md tracking-wider uppercase text-center
                      ${node.textSizeClass}
                      ${node.isOpponent 
                        ? 'bg-slate-950/90 text-red-200 border border-red-500/20' 
                        : node.photoUrl || node.jerseyNumber 
                          ? 'bg-black/80 text-white border border-white/20' 
                          : 'bg-black/30 text-white/40 border-white/10'
                      }`}
                    >
                      {node.isOpponent 
                        ? (node.jerseyNumber ? `ADV #${node.jerseyNumber}` : node.label) 
                        : node.photoUrl || node.jerseyNumber 
                          ? (node.name.split(' ').pop() || '—') 
                          : node.label
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benches */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3">
                {lineupViewMode === 'opponent' ? 'Remplaçants Adversaires' : 'Remplaçants'}
              </h4>
              {lineupViewMode === 'opponent' ? (
                (() => {
                  const opponentSubs: string[] = match.opponent_subs || [];
                  return opponentSubs.filter(Boolean).length === 0 ? (
                    <p className="text-xs text-white/50 text-center font-medium py-2">Aucun joueur sur le banc adverse</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {opponentSubs.filter(Boolean).map((jersey, i) => (
                        <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/10">
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black text-white">
                            {jersey}
                          </div>
                          <span className="text-[9px] font-bold text-white flex-1 truncate uppercase">Adv. #{jersey}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                subs.filter(Boolean).length === 0 ? (
                  <p className="text-xs text-white/50 text-center font-medium py-2">Aucun joueur sur le banc</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {subs.filter(Boolean).map((pid, i) => (
                      <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black text-white">{12 + i}</div>
                        <span className="text-[9px] font-bold text-white flex-1 truncate uppercase">{getPlayerShortName(pid)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            
            {/* Reactions */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 mt-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3 text-center">
                Réactions des Fans
              </h4>
              <div className="flex items-center justify-center gap-8">
                {(() => {
                  const total = reactionCounts.fire + reactionCounts.thumbsup + reactionCounts.thumbsdown;
                  const firePct = total > 0 ? Math.round((reactionCounts.fire / total) * 100) : 0;
                  const upPct = total > 0 ? Math.round((reactionCounts.thumbsup / total) * 100) : 0;
                  const downPct = total > 0 ? Math.round((reactionCounts.thumbsdown / total) * 100) : 0;
                  
                  return (
                    <>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl drop-shadow-lg">🔥</span>
                        <span className="text-white font-black text-sm">{firePct}%</span>
                        <span className="text-white/50 text-[9px] uppercase tracking-wider">{reactionCounts.fire} votes</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl drop-shadow-lg">👍</span>
                        <span className="text-white font-black text-sm">{upPct}%</span>
                        <span className="text-white/50 text-[9px] uppercase tracking-wider">{reactionCounts.thumbsup} votes</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl drop-shadow-lg">👎</span>
                        <span className="text-white font-black text-sm">{downPct}%</span>
                        <span className="text-white/50 text-[9px] uppercase tracking-wider">{reactionCounts.thumbsdown} votes</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
          </div>
        </div>
        )}

        {activeTab === 'video' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {match.video_url ? (
              <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black">
                <iframe 
                  src={match.video_url.includes('youtube.com') || match.video_url.includes('youtu.be') ? match.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') : match.video_url} 
                  className="w-full h-full" 
                  allowFullScreen 
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-10 shadow-sm flex flex-col items-center justify-center gap-4 text-slate-300 min-h-[400px]">
                <Video className="w-16 h-16 text-slate-200" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Aucune vidéo disponible pour ce match</p>
              </div>
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default MatchOverviewPanel;
