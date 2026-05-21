import React, { useState, useMemo, useEffect } from 'react';
import { useClubData } from '../../hooks/useClubData';
import { useCompetitions } from '../../hooks/useCompetitions';
import { usePlayers } from '../../hooks/usePlayers';
import { useStaff } from '../../hooks/useStaff';
import { useMatches } from '../../hooks/useMatches';
import { useTeams } from '../../hooks/useTeams';
import { PLAYER_CATEGORIES } from '../../constants';
import { Skeleton } from '../../components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
  ChevronRight, ChevronLeft, Check,
  Calendar, MapPin, Trophy, Users, Briefcase,
  Shield, Layout, Gamepad2, CheckCircle2,
  Globe, Target, Save, Search, Filter, Loader2,
  Trash2, X
} from 'lucide-react';
import type { Match, Player, MatchPhase } from '../../types';

interface ScheduleMatchWizardProps {
  onBack: () => void;
  onSuccess?: () => void;
}

type WizardStep = 'setup' | 'staff' | 'lineup' | 'opponent' | 'validate';

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'setup',    label: 'Setup',   icon: Calendar },
  { key: 'staff',    label: 'Staff',   icon: Briefcase },
  { key: 'lineup',   label: 'Compo',   icon: Users },
  { key: 'opponent', label: 'Adversaire', icon: Target },
  { key: 'validate', label: 'Valider', icon: CheckCircle2 },
];

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '4-1-4-1', '3-5-2', '3-4-3', '5-3-2', '3-4-2-1', '4-3-2-1', '4-5-1', '5-4-1', '4-4-1-1'];
const CATEGORIES = PLAYER_CATEGORIES; // PRO est déjà inclus dans PLAYER_CATEGORIES

const POSITION_GROUPS = [
  { label: 'Gardiens',   roles: ['GK', 'G', 'GARDIEN', 'GKP'], color: 'from-amber-400 to-amber-600' },
  { label: 'Défenseurs', roles: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'D', 'DC', 'DG', 'DD', 'DF', 'DEF', 'DEFENDER'], color: 'from-blue-500 to-blue-700' },
  { label: 'Milieux',    roles: ['CDM', 'CM', 'CAM', 'LM', 'RM', 'M', 'MDC', 'MC', 'MO', 'MD', 'MG', 'MF', 'MID', 'MILIEU'], color: 'from-emerald-500 to-emerald-700' },
  { label: 'Attaquants', roles: ['ST', 'LW', 'RW', 'CF', 'F', 'BU', 'A', 'WG', 'FW', 'ATT', 'FOR', 'FORWARD'], color: 'from-rose-500 to-rose-700' }
];

const getPositionColor = (position: string) => {
  const upperPos = position?.toUpperCase() || '';
  if (POSITION_GROUPS[0].roles.includes(upperPos)) return POSITION_GROUPS[0].color;
  if (POSITION_GROUPS[1].roles.includes(upperPos)) return POSITION_GROUPS[1].color;
  if (POSITION_GROUPS[2].roles.includes(upperPos)) return POSITION_GROUPS[2].color;
  if (POSITION_GROUPS[3].roles.includes(upperPos)) return POSITION_GROUPS[3].color;
  return 'from-slate-500 to-slate-700';
};

const getPositionPriority = (position: string) => {
  const upperPos = position?.toUpperCase() || '';
  if (['GK', 'G', 'GARDIEN', 'GKP'].includes(upperPos)) return 0;
  if (['CB', 'DC', 'DEF', 'DF', 'DEFENDER'].includes(upperPos)) return 1;
  if (['LB', 'RB', 'DG', 'DD', 'LWB', 'RWB'].includes(upperPos)) return 2;
  if (['CDM', 'MDC'].includes(upperPos)) return 3;
  if (['CM', 'MC', 'MID', 'MF', 'MILIEU'].includes(upperPos)) return 4;
  if (['CAM', 'MO'].includes(upperPos)) return 5;
  if (['LM', 'RM', 'MG', 'MD'].includes(upperPos)) return 6;
  if (['ST', 'BU', 'CF', 'F', 'FOR', 'FORWARD'].includes(upperPos)) return 7;
  if (['LW', 'RW', 'WG', 'ATT'].includes(upperPos)) return 8;
  return 9;
};

const getFormationPositions = (formation: string) => {
  const roles: { [key: string]: { top: string; left: string; label: string }[] } = {
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
      { top: '40%', left: '20%', label: 'LAM' }, { top: '34%', left: '50%', label: 'CAM' }, { top: '40%', left: '80%', label: 'RAM' },
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

const ScheduleMatchWizard: React.FC<ScheduleMatchWizardProps> = ({ onBack, onSuccess }) => {
  const { mainClub, opponentClubs: allOpponentClubs, isLoading: clubLoading } = useClubData();
  // Exclude any club with the same name as mainClub to prevent "FUS vs FUS"
  const opponentClubs = allOpponentClubs.filter(
    c => c.name?.toLowerCase().trim() !== mainClub?.name?.toLowerCase().trim()
  );
  const { leagues, stadiums, isLoading: compLoading } = useCompetitions();
  const { players, isLoading: playersLoading } = usePlayers();
  const { staff, isLoading: staffLoading } = useStaff();
  const { teams } = useTeams();
  const { addMatch } = useMatches();

  const isLoading = clubLoading || compLoading || playersLoading || staffLoading;

  const [currentStep, setCurrentStep] = useState<WizardStep>('setup');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 1
  const [setup, setSetup] = useState({
    opponent_id: '',
    league_id: '',
    stadium_id: '',
    team_id: '',
    match_date: new Date().toISOString().split('T')[0],
    match_time: '18:00',
    category: 'SENIOR',
    is_home: true,
    match_phase: '' as MatchPhase | '',
    qualif_status: '' as 'won' | 'lost' | '',
  });

  // Match timing configuration
  const [halfDuration, setHalfDuration] = useState<30 | 35 | 40 | 45>(45);
  const [enableExtraTime, setEnableExtraTime] = useState(false);
  const [enablePenalties, setEnablePenalties] = useState(false);

  // Step 2
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Step 3
  const [formation, setFormation] = useState('4-3-3');
  const [startingXI, setStartingXI] = useState<string[]>(Array(11).fill(''));
  const [substitutes, setSubstitutes] = useState<string[]>([]);

  // Step 4 (Opponent)
  const [opponentFormation, setOpponentFormation] = useState('4-4-2');
  const [opponentLineup, setOpponentLineup] = useState<string[]>(Array(11).fill(''));
  const [opponentSubs, setOpponentSubs] = useState<string[]>([]);

  // Auto-select team when category changes in wizard setup
  useEffect(() => {
    if (currentStep === 'setup' && setup.category) {
      const matchingTeams = teams.filter(t => t.category === setup.category);
      if (matchingTeams.length === 1 && setup.team_id !== matchingTeams[0].id) {
        setSetup(prev => ({ ...prev, team_id: matchingTeams[0].id }));
      } else if (matchingTeams.length === 0 && setup.team_id !== '') {
        setSetup(prev => ({ ...prev, team_id: '' }));
      }
    }
  }, [setup.category, teams, currentStep]);

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  const goNext = () => {
    if (currentStep === 'setup') {
      if (!setup.team_id || !setup.opponent_id) {
        alert("Veuillez sélectionner l'équipe et l'adversaire.");
        return;
      }
    }
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
    else onBack();
  };

  const toggleStaff = (id: string) =>
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleLineupPlayer = (player: Player) => {
    const isStarter = startingXI.includes(player.id);
    const isSub = substitutes.includes(player.id);

    if (isStarter || isSub) {
      setStartingXI(prev => prev.map(id => id === player.id ? '' : id));
      setSubstitutes(prev => prev.filter(id => id !== player.id));
    } else {
      const isGK = ['GK', 'G', 'GARDIEN'].includes(player.position?.toUpperCase() || '');
      
      if (isGK && startingXI[0] === '') {
        const nextXI = [...startingXI];
        nextXI[0] = player.id;
        setStartingXI(nextXI);
      } else {
        const roles = getFormationPositions(formation);
        let placed = false;
        const nextXI = [...startingXI];
        
        const matchingSlot = roles.findIndex((r, idx) => 
          idx > 0 && r.label === player.position?.toUpperCase() && nextXI[idx] === ''
        );

        if (matchingSlot !== -1) {
           nextXI[matchingSlot] = player.id;
           setStartingXI(nextXI);
           placed = true;
        } else {
           const emptySlot = nextXI.findIndex((id, idx) => idx > 0 && id === '');
           if (emptySlot !== -1) {
             nextXI[emptySlot] = player.id;
             setStartingXI(nextXI);
             placed = true;
           }
        }

        if (!placed) {
          const filledStartersCount = startingXI.filter(id => id !== '').length;
          if (filledStartersCount >= 11) {
            setSubstitutes(prev => [...prev, player.id]);
          } else {
             const firstFree = nextXI.indexOf('');
             if (firstFree !== -1) {
                nextXI[firstFree] = player.id;
                setStartingXI(nextXI);
             }
          }
        }
      }
    }
  };

  const handleSwap = (draggedPlayerId: string, slotIndex: number) => {
    const nextXI = [...startingXI];
    const oldIndex = nextXI.indexOf(draggedPlayerId);
    
    if (oldIndex !== -1) {
      const playerAtTarget = nextXI[slotIndex];
      nextXI[slotIndex] = draggedPlayerId;
      nextXI[oldIndex] = playerAtTarget;
    } else if (substitutes.includes(draggedPlayerId)) {
      const playerAtTarget = nextXI[slotIndex];
      nextXI[slotIndex] = draggedPlayerId;
      
      let nextSubs = substitutes.filter(id => id !== draggedPlayerId);
      if (playerAtTarget) nextSubs.push(playerAtTarget);
      
      setSubstitutes(nextSubs);
    }
    setStartingXI(nextXI);
  };

  const updateOpponentJersey = (idx: number, jersey: string) => {
    const next = [...opponentLineup];
    next[idx] = jersey;
    setOpponentLineup(next);
  };

  const handleOpponentSwap = (draggedId: string, targetIdx: number) => {
    const nextLineup = [...opponentLineup];
    const sourceIdx = parseInt(draggedId);
    
    // Swap jersey numbers
    const targetJersey = nextLineup[targetIdx];
    nextLineup[targetIdx] = nextLineup[sourceIdx];
    nextLineup[sourceIdx] = targetJersey;
    
    setOpponentLineup(nextLineup);
  };

  const handleOpponentClear = (idx: number) => {
    const nextLineup = [...opponentLineup];
    nextLineup[idx] = '';
    setOpponentLineup(nextLineup);
  };

  const addOpponentSub = () => setOpponentSubs(prev => [...prev, '']);
  const updateOpponentSub = (idx: number, jersey: string) => {
     const next = [...opponentSubs];
     next[idx] = jersey;
     setOpponentSubs(next);
  };
  const removeOpponentSub = (idx: number) => setOpponentSubs(prev => prev.filter((_, i) => i !== idx));

  // Auto-position players for home team
  const autoPositionPlayers = () => {
    const availablePlayers = [...matchPlayers].sort((a, b) => {
      const priorityA = getPositionPriority(a.position);
      const priorityB = getPositionPriority(b.position);
      return priorityA - priorityB;
    });
    
    const newXI = Array(11).fill('');
    const newSubs: string[] = [];
    
    // First, place the goalkeeper
    const gk = availablePlayers.find(p => ['GK', 'G', 'GARDIEN', 'GKP'].includes(p.position?.toUpperCase() || ''));
    if (gk) {
      newXI[0] = gk.id;
    }
    
    // Get formation positions
    const roles = getFormationPositions(formation);
    
    // Place remaining players by matching position
    const remainingPlayers = availablePlayers.filter(p => p.id !== gk?.id);
    
    for (let i = 1; i < 11; i++) {
      if (newXI[i]) continue;
      
      const positionLabel = roles[i]?.label;
      const matchingPlayer = remainingPlayers.find(p => 
        !newXI.includes(p.id) && 
        !newSubs.includes(p.id) &&
        p.position?.toUpperCase() === positionLabel
      );
      
      if (matchingPlayer) {
        newXI[i] = matchingPlayer.id;
      }
    }
    
    // Fill remaining slots with any available player
    for (let i = 1; i < 11; i++) {
      if (!newXI[i]) {
        const anyPlayer = remainingPlayers.find(p => !newXI.includes(p.id) && !newSubs.includes(p.id));
        if (anyPlayer) {
          newXI[i] = anyPlayer.id;
        }
      }
    }
    
    // Remaining players go to subs
    remainingPlayers.forEach(p => {
      if (!newXI.includes(p.id) && !newSubs.includes(p.id)) {
        newSubs.push(p.id);
      }
    });
    
    setStartingXI(newXI);
    setSubstitutes(newSubs);
  };

  // Auto-position opponent players (1-22)
  const autoPositionOpponent = () => {
    const newLineup = Array(11).fill('');
    const newSubs: string[] = [];
    
    // GK is #1
    newLineup[0] = '1';
    
    // Defenders: 2-5
    const defenders = ['2', '3', '4', '5'];
    const defPositions = [1, 2, 3, 4];
    defenders.forEach((num, idx) => {
      if (defPositions[idx] < 11) newLineup[defPositions[idx]] = num;
    });
    
    // Midfielders: 6-10
    const midfielders = ['6', '7', '8', '10'];
    const midPositions = [5, 6, 7, 8];
    midfielders.forEach((num, idx) => {
      if (midPositions[idx] < 11) newLineup[midPositions[idx]] = num;
    });
    
    // Attackers: 9, 11
    const attackers = ['9', '11'];
    const attPositions = [9, 10];
    attackers.forEach((num, idx) => {
      if (attPositions[idx] < 11) newLineup[attPositions[idx]] = num;
    });
    
    // Subs: 12-22
    for (let i = 12; i <= 22; i++) {
      newSubs.push(i.toString());
    }
    
    setOpponentLineup(newLineup);
    setOpponentSubs(newSubs);
  };

  const handleSave = async () => {
    if (!setup.team_id && !teams.find(t => t.category === setup.category)) {
      alert("Veuillez sélectionner une équipe. Si aucune n'apparaît, créez d'abord l'équipe dans la gestion des effectifs.");
      return;
    }
    setSaving(true);
    try {
      const { qualif_status, match_phase: _mp, ...setupBase } = setup;
      const matchPayload: any = {
        ...setupBase,
        league_id: setup.league_id === '' ? null : setup.league_id,
        stadium_id: setup.stadium_id === '' ? null : setup.stadium_id,
        match_time: setup.match_time,
        category: setup.category,
        is_home: setup.is_home,
        formation: formation,
        score_home: 0,
        score_away: 0,
        status: 'scheduled',
        lineup: { startingXI, substitutes, formation },
        opponent_formation: opponentFormation,
        opponent_lineup: opponentLineup,
        opponent_subs: opponentSubs,
        staff_ids: selectedStaffIds,
        team_id: setup.team_id || teams.find(t => t.category === setup.category)?.id || null,
        match_phase: qualif_status !== '' ? qualif_status : (_mp === '' ? null : _mp),
        // Match timing configuration
        half_duration_minutes: halfDuration,
        enable_extra_time: enableExtraTime,
        enable_penalties: enablePenalties,
        current_half: 1,
        time_elapsed_seconds: 0,
        added_time_first_half: 0,
        added_time_second_half: 0,
        penalty_score_home: 0,
        penalty_score_away: 0
      };
      await addMatch(matchPayload);
      onSuccess?.();
      onBack();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getOpponentName = (id: string) => opponentClubs.find(c => c.id === id)?.name || '—';
  const getLeagueName = (id: string) => leagues.find(l => l.id === id)?.name || '—';
  const getStadiumName = (id: string) => stadiums.find(s => s.id === id)?.name || '—';
  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const positions = useMemo(() => getFormationPositions(formation), [formation]);
  const opponentPositions = useMemo(() => getFormationPositions(opponentFormation), [opponentFormation]);
  
  const matchPlayers = useMemo(() => {
    // 1. Try to filter by the specific team selected
    let filtered = players;
    
    if (setup.team_id) {
      const teamPlayers = players.filter(p => p.team_id === setup.team_id);
      // If we found players for this specific team, use them
      if (teamPlayers.length > 0) {
        filtered = teamPlayers;
      } else if (setup.category) {
        // Fallback to category if team is empty
        filtered = players.filter(p => p.category?.toUpperCase() === setup.category?.toUpperCase());
      }
    } else if (setup.category) {
      // If no team is selected, filter by category
      filtered = players.filter(p => p.category?.toUpperCase() === setup.category?.toUpperCase());
    }

    return filtered
      .filter(p => p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.jersey_number || 0) - (b.jersey_number || 0));
  }, [players, setup.category, setup.team_id, searchQuery]);

  const groupedPlayers = useMemo(() => {
    return POSITION_GROUPS.map(group => ({
      ...group,
      players: matchPlayers.filter(p => group.roles.includes(p.position?.toUpperCase() || ''))
    })).filter(g => g.players.length > 0);
  }, [matchPlayers]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-24">
        <Skeleton className="h-64 rounded-[3rem] w-full" />
        <Skeleton className="h-[500px] rounded-[3.5rem] w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto space-y-8 pb-24"
    >
      {/* Premium Gradient Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-primary to-blue-900 rounded-[3rem] px-10 pt-10 pb-14 text-white overflow-hidden shadow-2xl border-b-[8px] border-primary/20">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

        <div className="relative z-10 flex items-center justify-between mb-10">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="w-16 h-16 rounded-[2rem] bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">Planning Orchestration</p>
              <h2 className="text-4xl font-black uppercase italic tracking-tight leading-none">
                Planifier un Match
              </h2>
            </div>
          </div>

          <Badge className="bg-white/10 text-white border-white/20 font-black text-xs px-6 py-3 backdrop-blur-md rounded-2xl">
            Étape {stepIndex + 1} / {STEPS.length}
          </Badge>
        </div>

        <div className="relative z-10 flex items-center justify-center">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isDone = idx < stepIndex;
            return (
              <React.Fragment key={step.key}>
                <button
                  onClick={() => idx <= stepIndex && setCurrentStep(step.key)}
                  className={`flex flex-col items-center gap-3 transition-all ${idx <= stepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'} group`}
                >
                  <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black transition-all duration-500 shadow-lg
                    ${isDone ? 'bg-emerald-400 text-white scale-90 translate-y-1'
                      : isActive ? 'bg-white text-primary scale-125 shadow-2xl shadow-primary/40 -translate-y-1'
                      : 'bg-white/10 text-white/60 group-hover:bg-white/20'}`}>
                    {isDone ? <Check className="w-7 h-7 stroke-[3]" /> : <Icon className="w-7 h-7" />}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-white' : 'text-white/30'}`}>
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-6 mb-8 rounded-full transition-all duration-700 ${idx < stepIndex ? 'bg-emerald-400' : 'bg-white/20'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-secondary/60 overflow-hidden min-h-[750px] flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-12 space-y-12 flex-1">
               <SectionTitle icon={<Calendar className="w-5 h-5 text-primary" />} title="Logistique du Match" subtitle="Initialisez les informations logistiques de la rencontre" />
               <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 bg-secondary/10 p-12 rounded-[3.5rem] border-2 border-dashed border-secondary">
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3"><Globe className="inline w-3.5 h-3.5 mr-2 text-primary" /> Catégorie Sportive</label>
                        <select className="w-full h-16 rounded-2xl bg-white border border-transparent px-8 font-black text-lg outline-none focus:ring-4 ring-primary/20 appearance-none shadow-sm transition-all"
                           value={setup.category} onChange={e => setSetup({ ...setup, category: e.target.value, team_id: '' })}>
                           {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3"><Layout className="inline w-3.5 h-3.5 mr-2 text-primary" /> Notre Équipe</label>
                        <select 
                           className="w-full h-16 rounded-2xl bg-white border border-transparent px-8 font-black text-lg outline-none focus:ring-4 ring-primary/20 appearance-none shadow-sm transition-all"
                           value={setup.team_id} 
                           onChange={e => setSetup({ ...setup, team_id: e.target.value })}
                        >
                           <option value="">Sélectionner l'équipe...</option>
                           {teams.filter(t => t.category === setup.category).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3"><Shield className="inline w-3.5 h-3.5 mr-2 text-primary" /> Club Adversaire</label>
                        <select className="w-full h-16 rounded-2xl bg-white border border-transparent px-8 font-black text-lg outline-none focus:ring-4 ring-primary/20 appearance-none shadow-sm transition-all"
                           value={setup.opponent_id} onChange={e => setSetup({ ...setup, opponent_id: e.target.value })}>
                           <option value="">Sélectionner...</option>
                           {opponentClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3"><Trophy className="inline w-3.5 h-3.5 mr-2 text-primary" /> Compétition</label>
                        <select className="w-full h-16 rounded-2xl bg-white border border-transparent px-8 font-black text-lg outline-none focus:ring-4 ring-primary/20 appearance-none shadow-sm transition-all"
                           value={setup.league_id} onChange={e => setSetup({ ...setup, league_id: e.target.value })}>
                           <option value="">Sélectionner...</option>
                           {leagues.map(l => <option key={l.id} value={l.id}>{l.name} — {l.season}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3"><Gamepad2 className="inline w-3.5 h-3.5 mr-2 text-primary" /> Phase / Tour de Compétition</label>
                        <select className="w-full h-16 rounded-2xl bg-white border border-transparent px-8 font-black text-lg outline-none focus:ring-4 ring-primary/20 appearance-none shadow-sm transition-all"
                           value={setup.match_phase} onChange={e => setSetup({ ...setup, match_phase: e.target.value as MatchPhase | '', qualif_status: '' })}>
                           <option value="">— Sélectionner la phase —</option>
                           <option value="league">Phase de Ligue / Championnat</option>
                           <option value="round_of_32">32èmes de Finale</option>
                           <option value="round_of_16">16èmes de Finale</option>
                           <option value="quarter_final">Quart de Finale (1/4)</option>
                           <option value="semi_final">Demi-Finale (1/2)</option>
                           <option value="third_place">Match pour la 3ème Place</option>
                           <option value="final">Finale</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3"><MapPin className="inline w-3.5 h-3.5 mr-2 text-primary" /> Lieu du Match</label>
                        <select className="w-full h-16 rounded-2xl bg-white border border-transparent px-8 font-black text-lg outline-none focus:ring-4 ring-primary/20 appearance-none shadow-sm transition-all"
                           value={setup.stadium_id} onChange={e => setSetup({ ...setup, stadium_id: e.target.value })}>
                           <option value="">Sélectionner stade...</option>
                           {stadiums.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Date Prévue</label>
                           <Input type="date" value={setup.match_date} onChange={e => setSetup({ ...setup, match_date: e.target.value })} className="h-16 rounded-2xl bg-white border-transparent font-black shadow-sm text-lg focus:ring-4 ring-primary/20" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Coup d'envoi</label>
                           <Input type="time" value={setup.match_time} onChange={e => setSetup({ ...setup, match_time: e.target.value })} className="h-16 rounded-2xl bg-white border-transparent font-black shadow-sm text-lg focus:ring-4 ring-primary/20" />
                        </div>
                     </div>
                     <div className="pt-6">
                        <div className="bg-white/50 rounded-[2.5rem] p-3 flex border-2 border-secondary shadow-inner">
                           <button type="button" onClick={() => setSetup({ ...setup, is_home: true })} className={`flex-1 h-16 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${setup.is_home ? 'bg-primary text-white shadow-2xl scale-105' : 'text-muted-foreground hover:bg-white'}`}>Domicile</button>
                           <button type="button" onClick={() => setSetup({ ...setup, is_home: false })} className={`flex-1 h-16 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${!setup.is_home ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-muted-foreground hover:bg-white'}`}>Extérieur</button>
                        </div>
                     </div>

                  </div>
               </div>
            </motion.div>
          )}

          {currentStep === 'staff' && (
            <motion.div key="staff" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-12 space-y-10 flex-1">
              <SectionTitle icon={<Briefcase className="w-5 h-5 text-primary" />} title="Membres du Staff" subtitle="Désignez les membres techniques présents pour cette rencontre" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {staff.map(member => {
                  const isSelected = selectedStaffIds.includes(member.id);
                  return (
                    <motion.button key={member.id} onClick={() => toggleStaff(member.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                      className={`relative p-8 rounded-[3.5rem] border-2 text-center transition-all duration-500 overflow-hidden group
                        ${isSelected ? 'border-primary bg-primary/5 shadow-2xl' : 'border-secondary hover:border-primary/40 bg-white'}`}>
                      <div className={`w-20 h-20 rounded-[1.5rem] mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl transition-all duration-700
                        ${isSelected ? 'bg-primary scale-110' : 'bg-secondary group-hover:scale-105'}`}>
                        <img src={(member.photo_url && member.photo_url !== 'null') ? member.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random&color=fff&size=200`} className="w-full h-full object-cover" />
                      </div>
                      <p className="font-black text-sm uppercase tracking-tighter truncate leading-none">{member.full_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-bold opacity-60">{member.role}</p>
                      {isSelected && (
                        <div className="absolute top-5 right-5 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white"><Check className="w-4 h-4 text-white stroke-[3]" /></div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {currentStep === 'lineup' && (
            <motion.div key="lineup" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-8 space-y-8 flex-1">
               <SectionTitle icon={<Users className="w-5 h-5 text-primary" />} title="Organisation Tactique" subtitle="Définissez votre système et convoquez l'équipe type" />
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-8 flex flex-col">
                     <div className="bg-secondary/20 p-6 rounded-[2.5rem] border border-secondary/50 shadow-inner">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-primary mb-4 flex items-center justify-between">
                           <span>Système Tactique</span>
                           <Badge variant="outline" className="text-[8px] bg-white border-primary/20">{formation}</Badge>
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                           {FORMATIONS.map(f => (
                              <button key={f} onClick={() => setFormation(f)} className={`h-11 rounded-xl text-[10px] font-black border-2 transition-all ${formation === f ? 'border-primary bg-primary text-white shadow-lg' : 'border-secondary text-muted-foreground bg-white hover:border-primary/10'}`}>{f}</button>
                           ))}
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col min-h-0 bg-white border-2 border-secondary/20 rounded-[3rem] p-6 shadow-sm overflow-hidden">
                        {/* Auto-position button */}
                        <button
                          onClick={autoPositionPlayers}
                          className="mb-4 w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Positionnement Auto
                        </button>

                        <div className="relative mb-4">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                           <input 
                             type="text" 
                             placeholder="Chercher joueur..." 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full h-11 pl-12 pr-4 rounded-2xl bg-secondary/10 border-none font-bold text-xs"
                           />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 max-h-[450px]">
                           {groupedPlayers.map(group => (
                              <div key={group.label} className="space-y-3">
                                 <div className="flex items-center gap-3 px-3">
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${group.color}`} />
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{group.label}</h5>
                                    <div className="flex-1 h-px bg-secondary" />
                                 </div>
                                 <div className="space-y-2">
                                   {group.players.map(p => {
                                      const isStarter = startingXI.includes(p.id);
                                      const isSub = substitutes.includes(p.id);
                                      const positionColor = getPositionColor(p.position);
                                      return (
                                         <motion.div 
                                           key={p.id} 
                                           layout
                                           draggable 
                                           onDragStart={(e) => { e.dataTransfer.setData('playerId', p.id); }}
                                           className={`p-3 rounded-[1.8rem] border-2 transition-all flex items-center gap-4 cursor-grab active:cursor-grabbing hover:bg-black/5 ${isStarter ? `border-transparent bg-gradient-to-r ${positionColor} text-white shadow-md` : isSub ? 'border-emerald-400 bg-emerald-50/20' : 'border-secondary bg-white'}`}
                                         >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs overflow-hidden border-2 border-white ${isStarter ? 'bg-white/20' : 'bg-secondary'}`}>
                                              <img src={(p.photo_url && p.photo_url !== 'null') ? p.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=random&color=fff&size=200`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                               <p className={`font-black text-[11px] uppercase ${isStarter ? 'text-white' : ''} truncate`}>{p.full_name}</p>
                                               <p className={`text-[8px] font-bold opacity-60 ${isStarter ? 'text-white/80' : 'text-muted-foreground'}`}>#{p.jersey_number} • {p.position}</p>
                                            </div>
                                            <button onClick={() => toggleLineupPlayer(p)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${ (isStarter || isSub) ? 'bg-white text-primary shadow-lg' : 'bg-secondary text-muted-foreground hover:bg-primary/20'}`}>
                                               {(isStarter || isSub) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                                            </button>
                                         </motion.div>
                                      );
                                   })}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="lg:col-span-8 flex flex-col items-center">
                     <div className="w-full flex justify-between items-center mb-6 px-10">
                        <div className="flex items-center gap-4">
                           <Badge className="bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-[10px]">XI: {startingXI.filter(id => id !== '').length}/11</Badge>
                           <Badge className="bg-blue-500 text-white font-black px-4 py-2 rounded-xl text-[10px]">Subs: {substitutes.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2 opacity-50 italic text-[10px] font-bold uppercase">
                           <Filter className="w-3.5 h-3.5" /> Glisser pour permuter • 2× clic pour retirer
                        </div>
                     </div>
                     <Pitch positions={positions} startingXI={startingXI} getPlayerById={getPlayerById} onDropPlayer={handleSwap} onClearSlot={(idx) => {
                       const playerId = startingXI[idx];
                       if (playerId) {
                         setStartingXI(prev => prev.map((id, i) => i === idx ? '' : id));
                         setSubstitutes(prev => [...prev, playerId]);
                       }
                     }} />
                     
                     <div className="w-full mt-8 bg-secondary/10 p-6 rounded-[3rem] border-2 border-dashed border-secondary/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 px-4 flex items-center gap-2"><Layout className="w-3.5 h-3.5" /> Remplaçants convoqués</p>
                        <div className="flex flex-wrap gap-3">
                           {substitutes.map(sid => {
                              const p = getPlayerById(sid);
                              if (!p) return null;
                              return (
                                 <motion.div 
                                   key={sid}
                                   draggable
                                   onDragStart={(e) => { e.dataTransfer.setData('playerId', sid); }}
                                   className="flex items-center gap-3 bg-white p-2 pr-5 rounded-2xl border-2 border-emerald-400 shadow-sm cursor-grab active:cursor-grabbing hover:scale-105"
                                 >
                                    <div className="w-8 h-8 rounded-lg bg-secondary overflow-hidden border border-secondary shadow-inner">
                                       <img src={(p.photo_url && p.photo_url !== 'null') ? p.photo_url : `https://i.pravatar.cc/300?u=${p.id}`} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase truncate max-w-[100px]">{p.full_name.split(' ').pop()}</span>
                                 </motion.div>
                              );
                           })}
                           {substitutes.length === 0 && <p className="text-[10px] italic text-muted-foreground/40 px-4">Aucun remplaçant sélectionné</p>}
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {currentStep === 'opponent' && (
            <motion.div key="opponent" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-8 space-y-8 flex-1">
               <SectionTitle icon={<Target className="w-5 h-5 text-primary" />} title="Scouting Tactique Adverse" subtitle="Configurez le système et les forces de l'opposition" />
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
                  <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                    <Card className="rounded-[3rem] border-secondary/50 shadow-xl overflow-hidden bg-white">
                       <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-6 border-b pb-4">
                             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-3 border-2 border-white shadow-inner">
                                {opponentClubs.find(c => c.id === setup.opponent_id)?.logo_url ? <img src={opponentClubs.find(c => c.id === setup.opponent_id)?.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-7 h-7 text-muted-foreground opacity-10" />}
                             </div>
                             <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">{getOpponentName(setup.opponent_id)}</h3>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Scouting Adverse</p>
                             </div>
                          </div>
                          
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex justify-between items-center">
                             SYSTÈME ADVERSE <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase">{opponentFormation}</Badge>
                          </h4>
                          <div className="grid grid-cols-4 gap-2">
                             {FORMATIONS.map(f => (
                               <button key={f} onClick={() => setOpponentFormation(f)} className={`h-9 rounded-lg text-[9px] font-black border-2 transition-all ${opponentFormation === f ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-transparent text-muted-foreground hover:border-primary/20'}`}>{f}</button>
                             ))}
                          </div>
                       </CardContent>
                    </Card>

                    {/* Auto-position opponent button */}
                    <button
                      onClick={autoPositionOpponent}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-4"
                    >
                      <Users className="w-4 h-4" />
                      Positionnement Auto (1-22)
                    </button>

                    {/* Banque de numéros 1-22 avec couleurs par position */}
                    <Card className="rounded-[2.5rem] border-primary/20 shadow-lg overflow-hidden bg-gradient-to-br from-primary/5 to-white">
                       <CardContent className="p-5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                             <Users className="w-3.5 h-3.5" /> Banque de Numéros (1-22)
                          </h4>
                          <p className="text-[9px] text-muted-foreground mb-3">Défense • Milieu • Attaque</p>
                          <div className="grid grid-cols-7 gap-2">
                             {Array.from({ length: 22 }, (_, i) => i + 1).map(num => {
                                const isUsed = opponentLineup.includes(num.toString()) || opponentSubs.includes(num.toString());
                                // Color by position: GK(1)=amber, Def(2-5)=blue, Mid(6-10)=green, Att(9,11)=red
                                let colorClass = 'bg-white border-2 border-primary/30 text-primary hover:bg-primary hover:text-white';
                                if (num === 1) colorClass = 'bg-gradient-to-br from-amber-400 to-amber-600 text-white border-transparent';
                                else if (num >= 2 && num <= 5) colorClass = 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-transparent';
                                else if (num >= 6 && num <= 10) colorClass = 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-transparent';
                                else if (num === 9 || num === 11) colorClass = 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-transparent';
                                else colorClass = 'bg-gradient-to-br from-slate-500 to-slate-700 text-white border-transparent';
                                
                                return (
                                   <button
                                      key={num}
                                      onClick={() => {
                                         if (isUsed) return;
                                         const emptySlot = opponentLineup.findIndex(slot => slot === '');
                                         if (emptySlot !== -1) {
                                            updateOpponentJersey(emptySlot, num.toString());
                                         } else {
                                            addOpponentSub();
                                            updateOpponentSub(opponentSubs.length, num.toString());
                                         }
                                      }}
                                      disabled={isUsed}
                                      className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                                         isUsed 
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                            : `${colorClass} hover:shadow-lg hover:scale-110`
                                      }`}
                                   >
                                      {num}
                                   </button>
                                );
                             })}
                          </div>
                       </CardContent>
                    </Card>

                    <Card className="rounded-[3rem] border-secondary/50 shadow-xl flex-1 flex flex-col overflow-hidden bg-white">
                       <div className="p-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Composition (11 titulaires)</h4>
                             <button 
                                onClick={() => setOpponentLineup(Array(11).fill(''))}
                                className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase"
                             >
                                Tout effacer
                             </button>
                          </div>
                          <div className="space-y-2 overflow-y-auto max-h-[280px] custom-scrollbar pr-2">
                             {opponentPositions.map((pos, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-secondary/20 hover:bg-white hover:shadow-md transition-all group">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black ${opponentLineup[idx] ? 'bg-primary' : 'bg-slate-400'}`}>
                                         {pos.label}
                                      </div>
                                      <span className="text-[10px] font-bold uppercase text-slate-500">{opponentLineup[idx] ? `Joueur #${opponentLineup[idx]}` : 'Vide'}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      {opponentLineup[idx] && (
                                         <button
                                            onClick={() => updateOpponentJersey(idx, '')}
                                            className="w-6 h-6 rounded-lg bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                         >
                                            <X className="w-3 h-3" />
                                         </button>
                                      )}
                                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${opponentLineup[idx] ? 'bg-primary text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                                         {opponentLineup[idx] || '-'}
                                      </span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </Card>
                  </div>

                  <div className="lg:col-span-8 flex flex-col items-center">
                     <div className="w-full flex justify-center mb-4">
                        <Badge className="bg-slate-950 text-white font-black px-8 py-3 rounded-2xl shadow-2xl text-[10px] uppercase tracking-widest">Visualisation Tactique Scouting</Badge>
                     </div>
                     <p className="text-[10px] text-muted-foreground mb-4 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        Glissez-déposez les numéros sur le terrain pour les permuter
                     </p>
                     <Pitch 
                        positions={opponentPositions} 
                        isOpponent 
                        opponentJerseyNumbers={opponentLineup} 
                        onDropPlayer={handleOpponentSwap}
                        onClearSlot={handleOpponentClear}
                     />
                     
                     <div className="w-full mt-8 bg-secondary/10 p-6 rounded-[3rem] border-2 border-dashed border-secondary/50">
                        <div className="flex items-center justify-between mb-4 px-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Banc de l'Adversaire</p>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={addOpponentSub}
                             className="h-8 bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-black uppercase px-4 rounded-xl"
                           >
                              Ajouter Remplaçant
                           </Button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           {opponentSubs.map((jersey, idx) => (
                              <motion.div 
                                key={idx}
                                layout
                                className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border-2 border-slate-100 shadow-md group"
                              >
                                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Shield className="w-4 h-4 opacity-30" />
                                 </div>
                                 <input 
                                   type="text" 
                                   placeholder="#" 
                                   value={jersey}
                                   onChange={(e) => updateOpponentSub(idx, e.target.value)}
                                   className="w-10 h-10 text-center rounded-xl bg-slate-50 border-none font-black text-[10px]"
                                 />
                                 <button 
                                   onClick={() => removeOpponentSub(idx)}
                                   className="w-6 h-6 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                 >
                                    <X className="w-3.5 h-3.5 mx-auto" />
                                 </button>
                              </motion.div>
                           ))}
                           {opponentSubs.length === 0 && <p className="text-[10px] italic text-muted-foreground/40 px-4">Aucun remplaçant répertorié</p>}
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {currentStep === 'validate' && (
            <motion.div key="validate" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-12 space-y-12 flex-1">
               <SectionTitle icon={<CheckCircle2 className="w-5 h-5 text-primary" />} title="Validation de la Planification" subtitle="Veuillez confirmer les détails avant la synchronisation finale" />
               <div className="flex items-center justify-between bg-primary/5 rounded-[4rem] p-16 border-2 border-primary/10 relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 1px,transparent 0,transparent 50%)', backgroundSize: '15px 15px' }} />
                  
                  <div className="flex flex-col items-center gap-8 relative z-10 flex-1">
                     <div className="w-40 h-40 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center p-8 border-4 border-white transition-all hover:scale-105">
                        {setup.is_home ? (
                           mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-16 h-16 text-primary opacity-20" />
                        ) : (
                           opponentClubs.find(c => c.id === setup.opponent_id)?.logo_url ? <img src={opponentClubs.find(c => c.id === setup.opponent_id)?.logo_url} className="w-full h-full object-contain" /> : <Target className="w-16 h-16 text-muted-foreground opacity-20" />
                        )}
                     </div>
                     <div className="text-center">
                        <p className="font-black text-2xl uppercase tracking-tighter italic">{setup.is_home ? (mainClub?.club_name || 'My Club') : getOpponentName(setup.opponent_id)}</p>
                        <Badge className="mt-4 bg-primary text-white border-white/20 font-black uppercase text-[10px] px-6 py-2 rounded-xl">DOMICILE</Badge>
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 px-16 relative z-10">
                     <div className="text-6xl font-black italic text-primary/10 leading-none select-none tracking-tighter">VS</div>
                  </div>

                  <div className="flex flex-col items-center gap-8 relative z-10 flex-1">
                     <div className="w-40 h-40 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center p-8 border-4 border-white transition-all hover:scale-105">
                        {!setup.is_home ? (
                           mainClub?.logo_url ? <img src={mainClub.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-16 h-16 text-primary opacity-20" />
                        ) : (
                           opponentClubs.find(c => c.id === setup.opponent_id)?.logo_url ? <img src={opponentClubs.find(c => c.id === setup.opponent_id)?.logo_url} className="w-full h-full object-contain" /> : <Target className="w-16 h-16 text-muted-foreground opacity-20" />
                        )}
                     </div>
                     <div className="text-center">
                        <p className="font-black text-2xl uppercase tracking-tighter italic">{!setup.is_home ? (mainClub?.club_name || 'My Club') : getOpponentName(setup.opponent_id)}</p>
                        <Badge className="mt-4 bg-slate-900 text-white border-white/20 font-black uppercase text-[10px] px-6 py-2 rounded-xl">EXTÉRIEUR</Badge>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-secondary/20 rounded-[3rem] p-10 space-y-8 border border-secondary/50 shadow-inner">
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-4"><Calendar className="w-5 h-5" /> Fiche Logistique</h4>
                     <div className="space-y-4">
                        <InfoRow label="Compétition Officielle" value={getLeagueName(setup.league_id)} />
                        <InfoRow label="Phase du Match" value={
                           setup.qualif_status === 'won' ? '✅ Gagné' :
                           setup.qualif_status === 'lost' ? '❌ Perdu' :
                           setup.match_phase ? ({
                              league: 'Phase de Ligue',
                              round_of_32: '32èmes de Finale',
                              round_of_16: '16èmes de Finale',
                              quarter_final: 'Quart de Finale',
                              semi_final: 'Demi-Finale',
                              third_place: '3ème Place',
                              final: 'Finale',
                           } as Record<string, string>)[setup.match_phase] || '—' : '—'
                        } />
                        <InfoRow label="Terrain de Jeu" value={getStadiumName(setup.stadium_id)} />
                        <InfoRow label="Rendez-vous" value={`${setup.match_date} @ ${setup.match_time}`} />
                        <InfoRow label="Catégorie Squad" value={setup.category} />
                     </div>
                  </div>
                  <div className="bg-secondary/20 rounded-[3rem] p-10 space-y-8 border border-secondary/50 shadow-inner">
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-4"><Users className="w-5 h-5" /> Fiche Sportive</h4>
                     <div className="space-y-4">
                        <InfoRow label="Système Tactique" value={formation} />
                        <InfoRow label="Effectif Convoqué" value={`${startingXI.filter(id => id !== '').length + substitutes.length} joueurs`} />
                        <InfoRow label="Encadrement Staff" value={`${selectedStaffIds.length} membres`} />
                        <InfoRow label="Terrain" value={setup.is_home ? 'Domicile' : 'Extérieur'} />
                        <InfoRow label="Système Adverse" value={opponentFormation} />
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-12 py-10 border-t bg-secondary/10 flex items-center justify-between mt-auto">
           <Button variant="ghost" onClick={goPrev} className="h-16 px-10 rounded-[2rem] font-black uppercase tracking-widest text-[11px] gap-3 hover:bg-white transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" /> {stepIndex === 0 ? 'Tableau de Bord' : 'Étape Précédente'}
           </Button>
           <div className="flex items-center gap-4">
              {STEPS.map((s, idx) => (
                 <div key={s.key} className={`rounded-full transition-all duration-700 ${s.key === currentStep ? 'w-12 h-3 bg-primary shadow-xl shadow-primary/20' : idx < stepIndex ? 'w-3 h-3 bg-primary/40' : 'w-3 h-3 bg-secondary'}`} />
              ))}
           </div>
           {currentStep === 'validate' ? (
              <Button onClick={handleSave} disabled={saving} className="h-16 px-14 rounded-[2.2rem] bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] gap-5 shadow-2xl transition-all active:scale-95 group">
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />}
                 {saving ? 'Synchronisation...' : 'Confirmer le Planning'}
              </Button>
           ) : (
              <Button onClick={goNext} className="h-16 px-14 rounded-[2.2rem] bg-primary hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] gap-5 shadow-2xl group transition-all hover:scale-105 active:scale-95">
                 Suivant <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const Pitch: React.FC<{ 
  positions: { top: string; left: string; label: string }[]; 
  startingXI?: string[]; 
  getPlayerById?: (id: string) => any; 
  isOpponent?: boolean; 
  opponentJerseyNumbers?: string[];
  onDropPlayer?: (playerId: string, posIndex: number) => void;
  onClearSlot?: (posIndex: number) => void;
}> = ({ positions, startingXI = [], getPlayerById, isOpponent, opponentJerseyNumbers, onDropPlayer, onClearSlot }) => (
  <div className="w-full max-w-[500px] bg-[#3fa375] aspect-[0.66] rounded-[4rem] shadow-2xl relative overflow-hidden ring-[16px] ring-white/5 border-[12px] border-[#52b788] group/pitch">
    <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #52b788 0, #52b788 40px, #40916c 40px, #40916c 80px)' }} />
    <div className="absolute inset-6 border-[3px] border-white/50 rounded-[3rem] pointer-events-none" />
    <div className="absolute inset-x-6 top-1/2 -translate-y-px border-t-[3px] border-white/50 pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-[3px] border-white/50 rounded-full pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/50 rounded-full" />
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[55%] h-[18%] border-b-[3px] border-x-[3px] border-white/50 pointer-events-none" />
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[55%] h-[18%] border-t-[3px] border-x-[3px] border-white/50 pointer-events-none" />
    
    <AnimatePresence>
    {positions.map((pos, idx) => {
      const p = getPlayerById ? (startingXI[idx] ? getPlayerById(startingXI[idx]) : null) : null;
      const displayTop = isOpponent ? (100 - parseFloat(pos.top)) + '%' : pos.top;
      const displayLeft = isOpponent ? (100 - parseFloat(pos.left)) + '%' : pos.left;
      const oppJersey = opponentJerseyNumbers?.[idx] || '';

      return (
        <motion.div 
          key={idx} 
          initial={{ scale: 0, x: "-50%", y: "-50%" }} 
          animate={{ scale: 1, x: "-50%", y: "-50%" }} 
          layout
          className="absolute flex flex-col items-center gap-2 z-30" 
          style={{ top: displayTop, left: displayLeft }}
          onDragOver={(e) => { 
            if (onDropPlayer) {
              e.preventDefault(); 
              e.currentTarget.classList.add('scale-110'); 
            }
          }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('scale-110'); }}
          onDrop={(e) => {
             if (onDropPlayer) {
               e.preventDefault();
               e.currentTarget.classList.remove('scale-110');
               const droppedId = e.dataTransfer.getData(isOpponent ? 'oppIdx' : 'playerId');
               if (droppedId) onDropPlayer(droppedId, idx);
             }
          }}
        >
          <div className="relative group">
            <motion.div 
              draggable={(!!p && !isOpponent) || (isOpponent && !!oppJersey)}
              onDragStart={(e) => { 
                if(!isOpponent && p) e.dataTransfer.setData('playerId', p.id); 
                if(isOpponent && oppJersey) e.dataTransfer.setData('oppIdx', idx.toString());
              }}
              whileHover={(p || isOpponent) ? { scale: 1.1, rotate: 5, y: -5 } : { scale: 1.05 }}
              className={`w-16 h-16 rounded-full border-[4px] flex items-center justify-center shadow-2xl transition-all duration-300 relative
                ${p ? `bg-gradient-to-br ${getPositionColor(p.position)} border-white ring-4 ring-white/30` : (isOpponent && oppJersey) ? 'bg-slate-950 border-white/60' : 'bg-white/10 border-white/20 hover:bg-white/30 hover:border-white/50 cursor-crosshair'}`}
            >
               {p ? (
                 <>
                  <img 
                    src={(p.photo_url && p.photo_url !== 'null') ? p.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=random&color=fff&size=200`} 
                    className="w-full h-full rounded-full object-cover p-0.5" 
                  />
                  <Badge className="absolute -top-1 -right-1 bg-black text-white h-6 w-6 rounded-full flex items-center justify-center p-0 border-2 border-white text-[10px] font-black">{p.jersey_number}</Badge>
                 </>
               ) : (isOpponent && oppJersey) ? (
                  <span className="text-xl font-black text-white">{oppJersey}</span>
               ) : (
                  <span className="text-[10px] font-black text-white/40">{pos.label}</span>
               )}
            </motion.div>
            
            {/* Delete button for both home team and opponent */}
            {(p || (isOpponent && oppJersey)) && (
              <button 
                onClick={() => onClearSlot?.(idx)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-red-600 active:scale-90"
                title="Retirer du terrain (double clic)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase backdrop-blur-md border shadow-lg transition-all
            ${p ? 'bg-black/80 text-white border-white/20 scale-105 max-w-[120px]' : (isOpponent && oppJersey) ? 'bg-slate-900/80 text-white border-white/10 shadow-xl max-w-[120px]' : 'bg-white/10 text-white/30 border-white/10 max-w-[90px]'}`}
            title={p ? p.full_name : (isOpponent && oppJersey) ? `Adversaire #${oppJersey}` : pos.label}>
            {p ? (p.full_name.length > 12 ? p.full_name.substring(0, 12) + '...' : p.full_name) : (isOpponent && oppJersey) ? `#${oppJersey}` : pos.label}
          </div>
        </motion.div>
      );
    })}
    </AnimatePresence>
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-8">
    <div className="w-18 h-18 rounded-[2rem] bg-primary/10 flex items-center justify-center shadow-inner shrink-0 border border-primary/5">{icon}</div>
    <div>
      <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{title}</h3>
      <p className="text-sm text-muted-foreground mt-3 font-medium opacity-60">{subtitle}</p>
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-secondary/50 pb-3">
    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</span>
    <span className="text-sm font-black truncate max-w-[200px] italic">{value}</span>
  </div>
);

export default ScheduleMatchWizard;
