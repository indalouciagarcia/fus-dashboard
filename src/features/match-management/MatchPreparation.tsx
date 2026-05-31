import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useMatches } from '../../hooks/useMatches';
import { usePlayers } from '../../hooks/usePlayers';
import { useStaff } from '../../hooks/useStaff';
import { useClubData } from '../../hooks/useClubData';
import { useCompetitions } from '../../hooks/useCompetitions';
import { usePermissions } from '../../context/PermissionsContext';
import { useSurclassements } from '../../hooks/useSurclassements';
import { useTouchDragAndDrop } from '../../hooks/useTouchDragAndDrop';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  ChevronRight, ChevronLeft, Check,
  Briefcase, Users, Target, Shield, Star, Save, Gamepad2, Settings, Clock, MapPin,
  Calendar, Search, Filter, Loader2, UserPlus, X, Trophy, CheckCircle2, Edit2
} from 'lucide-react';
import type { Match, Player, MatchPhase } from '../../types';

interface MatchPreparationProps {
  matchId: string;
  onBack: () => void;
}

type PrepStep = 'setup' | 'staff' | 'lineup' | 'opponent';

const STEPS: { key: PrepStep; label: string; icon: React.ElementType }[] = [
  { key: 'setup',    label: 'Logistique',    icon: Settings },
  { key: 'staff',    label: 'Staff',         icon: Briefcase },
  { key: 'lineup',   label: 'Compo',         icon: Users },
  { key: 'opponent', label: 'Adversaire',    icon: Target },
];

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '4-1-4-1', '3-5-2', '3-4-3', '5-3-2', '3-4-2-1', '4-3-2-1', '4-5-1', '5-4-1', '4-4-1-1'];

const POSITION_GROUPS = [
  { label: 'Gardien', roles: ['GK', 'G'] },
  { label: 'Défenseurs', roles: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'D'] },
  { label: 'Milieux', roles: ['CDM', 'CM', 'CAM', 'LM', 'RM', 'M'] },
  { label: 'Attaquants', roles: ['ST', 'LW', 'RW', 'CF', 'F'] }
];

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

const MatchPreparation: React.FC<MatchPreparationProps> = ({ matchId, onBack }) => {
  const { matches, updateMatch, refetch } = useMatches();
  const { authState } = usePermissions();
  const { players, updatePlayer } = usePlayers();
  const { staff } = useStaff();
  const { opponentClubs } = useClubData();
  const { stadiums, leagues } = useCompetitions();
  const { surclassements } = useSurclassements();

  const match = matches.find(m => m.id === matchId);

  const [currentStep, setCurrentStep] = useState<PrepStep>('setup');
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [editingJerseyId, setEditingJerseyId] = useState<string | null>(null);
  const [editingJerseyValue, setEditingJerseyValue] = useState<string>('');
  const isFirstRender = useRef(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  const buildFormData = (m: any) => {
    const formation = m?.lineup?.formation ?? m?.formation ?? '4-3-3';
    return {
      ...(m || {}),
      lineup: {
        startingXI: m?.lineup?.startingXI || Array(11).fill(''),
        substitutes: m?.lineup?.substitutes || [],
        formation,
      },
      formation,
      staff_ids: m?.staff_ids || [],
      opponent_formation: m?.opponent_formation || '4-4-2',
      opponent_lineup: m?.opponent_lineup || Array(11).fill(''),
      opponent_subs: m?.opponent_subs || [],
      is_home: m?.is_home ?? true
    };
  };

  const [formData, setFormDataRaw] = useState<any>(() => buildFormData(match));
  const setFormData = useCallback((value: any) => {
    isDirty.current = true;
    setFormDataRaw(value);
  }, []);

  // Re-sync formData when navigating back to this match (matchId change or fresh server data)
  const prevMatchId = useRef(matchId);
  useEffect(() => {
    if (prevMatchId.current !== matchId) {
      prevMatchId.current = matchId;
      isFirstRender.current = true;
      isDirty.current = false;
      setFormDataRaw(buildFormData(match));
    }
  }, [matchId]);

  // Sync from server when match data refreshes and user has no pending unsaved changes
  const prevMatchJson = useRef('');
  useEffect(() => {
    if (!match) return;
    const json = JSON.stringify(match);
    if (json === prevMatchJson.current) return;
    prevMatchJson.current = json;
    if (!isDirty.current) {
      setFormDataRaw(buildFormData(match));
    }
  }, [match]);

  // Normalize XI length
  useEffect(() => {
    if (formData.lineup) {
      const sxi = [...(formData.lineup.startingXI || [])];
      while (sxi.length < 11) sxi.push('');
      if (sxi.length > 11) sxi.length = 11;
      const lineupMatch = JSON.stringify(sxi) === JSON.stringify(formData.lineup.startingXI);
      if (!lineupMatch) {
         setFormData(prev => ({ ...prev, lineup: { ...prev.lineup!, startingXI: sxi } }));
      }
    }
  }, [formData.lineup]);

  // Auto-save : chaque modification de formData → sauvegarde après 600ms
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!authState.isAuthenticated) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await updateMatch({ id: matchId, data: formData });
        isDirty.current = false;
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      } catch (e) { console.error('Auto-save failed', e); }
    }, 600);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [authState.isAuthenticated, formData, matchId, updateMatch]);

  if (!match) return <div className="p-20 text-center font-black opacity-20 uppercase tracking-widest text-4xl">Match Not Found</div>;

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
    else onBack();
  };

  const updateField = (field: keyof Match | any, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateVenue = async (isHome: boolean) => {
    setFormData(prev => ({ ...prev, is_home: isHome }));
    try {
      await updateMatch({ id: matchId, data: { is_home: isHome } });
      await refetch?.();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde domicile/extérieur:', error);
    }
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const toggleLineup = (player: Player) => {
    const isStarting = formData.lineup?.startingXI?.includes(player.id);
    const isSub = formData.lineup?.substitutes?.includes(player.id);

    if (isStarting) {
      // Move to subs
      const newXI = [...(formData.lineup?.startingXI || [])];
      const idx = newXI.indexOf(player.id);
      if (idx !== -1) newXI[idx] = '';
      setFormData({
        ...formData,
        lineup: {
          ...formData.lineup!,
          startingXI: newXI,
          substitutes: Array.from(new Set([...(formData.lineup?.substitutes || []), player.id]))
        }
      });
    } else if (isSub) {
      // Remove from subs, and if there's space on pitch, maybe add?
      // For toggle, let's just move to pitch if there is an empty spot
      const emptyIdx = formData.lineup?.startingXI?.indexOf('');
      if (typeof emptyIdx === 'number' && emptyIdx !== -1) {
        const newXI = [...(formData.lineup?.startingXI || [])];
        newXI[emptyIdx] = player.id;
        setFormData({
          ...formData,
          lineup: {
            ...formData.lineup!,
            startingXI: newXI,
            substitutes: (formData.lineup?.substitutes || []).filter(id => id !== player.id)
          }
        });
      } else {
        // Just remove from subs? No, toggle usually means remove if there
        setFormData({
          ...formData,
          lineup: {
            ...formData.lineup!,
            substitutes: (formData.lineup?.substitutes || []).filter(id => id !== player.id)
          }
        });
      }
    } else {
      // Add to subs by default
      setFormData({
        ...formData,
        lineup: {
          ...formData.lineup!,
          substitutes: Array.from(new Set([...(formData.lineup?.substitutes || []), player.id]))
        }
      });
    }
  };

  const removeFromPitch = (idx: number) => {
    const pid = formData.lineup?.startingXI?.[idx];
    if (!pid) return;
    const newXI = [...(formData.lineup?.startingXI || [])];
    newXI[idx] = '';
    setFormData({
      ...formData,
      lineup: {
        ...formData.lineup!,
        startingXI: newXI,
        substitutes: Array.from(new Set([...(formData.lineup?.substitutes || []), pid]))
      }
    });
  };

  const handleSwap = (playerId: string, toIdx: number) => {
    const newXI = [...(formData.lineup?.startingXI || [])];
    const fromIdx = newXI.indexOf(playerId);

    if (fromIdx !== -1) {
      // Internal swap
      const temp = newXI[toIdx];
      newXI[toIdx] = newXI[fromIdx];
      newXI[fromIdx] = temp;
      
      setFormData({
        ...formData,
        lineup: { ...formData.lineup!, startingXI: newXI }
      });
    } else {
      // From subs to pitch
      const replacedPlayerId = newXI[toIdx];
      newXI[toIdx] = playerId;
      
      const newSubs = (formData.lineup?.substitutes || []).filter(id => id !== playerId);
      if (replacedPlayerId) {
        newSubs.push(replacedPlayerId);
      }
      
      setFormData({
        ...formData,
        lineup: {
          ...formData.lineup!,
          startingXI: newXI,
          substitutes: Array.from(new Set(newSubs))
        }
      });
    }
  };

  const updateOpponentJersey = (idx: number, jersey: string) => {
    const newLinup = [...(formData.opponent_lineup || Array(11).fill(''))];
    newLinup[idx] = jersey;
    setFormData({ ...formData, opponent_lineup: newLinup });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMatch({ id: match.id, data: formData });
      onBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const currentLineup = formData.lineup!;
  const startingXI = currentLineup.startingXI || [];
  const substitutes = currentLineup.substitutes || [];
  const addOpponentSubstitute = () => {
    const subs = formData.opponent_subs || [];
    setFormData({ ...formData, opponent_subs: [...subs, ''] });
  };

  const updateOpponentSubstitute = (idx: number, jersey: string) => {
    const subs = [...(formData.opponent_subs || [])];
    subs[idx] = jersey;
    setFormData({ ...formData, opponent_subs: subs });
  };

  const removeOpponentSubstitute = (idx: number) => {
    const subs = (formData.opponent_subs || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, opponent_subs: subs });
  };

  const opponent = opponentClubs.find(c => c.id === formData.opponent_id);
  const positions = getFormationPositions(currentLineup.formation);
  const opponentPositions = getFormationPositions(formData.opponent_formation || '4-4-2');
  
  // IDs des joueurs surclassés ACTIFS vers l'équipe de ce match
  const surclassedIdsForTeam = useMemo(() => new Set(
    surclassements
      .filter(s => s.status === 'active' && s.target_team_id === match.team_id)
      .map(s => s.player_id)
  ), [surclassements, match.team_id]);

  // Map playerId → numéro de maillot effectif (target si surclassé, sinon jersey_number)
  const jerseyOverrides = useMemo(() => {
    const map: Record<string, number> = {};
    surclassements
      .filter(s => s.status === 'active' && s.target_team_id === match.team_id && s.target_jersey_number != null)
      .forEach(s => { map[s.player_id] = s.target_jersey_number!; });
    return map;
  }, [surclassements, match.team_id]);

  const categoryPlayers = useMemo(() => {
    return players
      .filter(p =>
        // Joueurs de la catégorie du match
        (p as any).category === match.category || !match.category ||
        // Joueurs surclassés vers l'équipe de ce match
        surclassedIdsForTeam.has(p.id)
      )
      .filter(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(p => {
        if (activeFilter === 'ALL') return true;
        const group = POSITION_GROUPS.find(g => g.label === activeFilter);
        return group ? group.roles.includes(p.position?.toUpperCase() || '') : true;
      })
      .sort((a, b) => (a.jersey_number || 0) - (b.jersey_number || 0));
  }, [players, match.category, match.team_id, searchQuery, activeFilter, surclassedIdsForTeam]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="max-w-7xl mx-auto space-y-8 pb-24"
    >
      <div className="relative bg-gradient-to-r from-slate-900 via-primary to-blue-900 rounded-[3.5rem] px-10 pt-10 pb-14 text-white overflow-hidden shadow-2xl text-center border-b-[10px] border-primary/20">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

        <div className="relative z-10 flex items-center justify-between mb-10 text-left">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={onBack} className="w-14 h-14 rounded-[1.8rem] bg-white/10 hover:bg-white/20 text-white transition-all shadow-xl backdrop-blur-md">
              <ChevronLeft className="w-7 h-7" />
            </Button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">Configuration Stratégique</p>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none flex items-center gap-4">
                {opponent?.name || 'Match Preview'} <Badge className="bg-white/20 text-white border-white/20 px-4 py-1.5 rounded-xl scale-90 backdrop-blur-md">{match.category}</Badge>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[10px] font-black opacity-40 uppercase tracking-widest leading-none">Status actuel</span>
               <span className="text-sm font-black uppercase italic mt-1 text-emerald-400">{match.status}</span>
            </div>
            <Badge className="bg-white/10 text-white border-white/20 font-black text-xs px-8 py-3 backdrop-blur-md rounded-2xl shadow-2xl">
              Mode Préparation • {stepIndex + 1} / {STEPS.length}
            </Badge>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isDone = idx < stepIndex;
            return (
              <React.Fragment key={step.key}>
                <button onClick={() => setCurrentStep(step.key)} className="flex flex-col items-center gap-3 transition-all cursor-pointer group">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center font-black transition-all duration-700 shadow-2xl group-hover:scale-110 active:scale-95
                    ${isDone ? 'bg-emerald-400 text-white translate-y-1' : isActive ? 'bg-white text-primary scale-125 shadow-white/20 -translate-y-2' : 'bg-white/10 text-white/60'}`}>
                    {isDone ? <Check className="w-8 h-8 stroke-[4]" /> : <Icon className="w-7 h-7" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all mt-2 ${isActive ? 'text-white' : 'text-white/30'}`}>{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && <div className={`w-16 h-1 rounded-full mx-6 mb-10 transition-all duration-1000 ${idx < stepIndex ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl border border-secondary/40 overflow-hidden min-h-[850px] flex flex-col relative">
        <AnimatePresence mode="wait">
          {currentStep === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-16 space-y-16 flex-1">
               <SectionTitle icon={<Settings className="w-6 h-6 text-primary" />} title="Logistique du Match" subtitle="Initialisation des paramètres temporels et géographiques" />
               <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 bg-slate-50 p-16 rounded-[4rem] border-2 border-dashed border-secondary shadow-inner">
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Calendar className="w-4 h-4 text-primary" /> Calendrier</label>
                        <input type="date" value={formData.match_date} onChange={(e) => updateField('match_date', e.target.value)} className="w-full h-18 px-10 rounded-2xl bg-white border-none shadow-xl shadow-secondary/20 focus:ring-4 ring-primary/10 transition-all font-black text-xl" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Clock className="w-4 h-4 text-primary" /> Temps Effectif</label>
                        <input type="time" value={formData.match_time} onChange={(e) => updateField('match_time', e.target.value)} className="w-full h-18 px-10 rounded-2xl bg-white border-none shadow-xl shadow-secondary/20 focus:ring-4 ring-primary/10 transition-all font-black text-xl" />
                     </div>
                  </div>
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Shield className="w-4 h-4 text-primary" /> Club Adverse</label>
                        <select value={formData.opponent_id || ''} onChange={(e) => updateField('opponent_id', e.target.value)} className="w-full h-18 px-10 rounded-2xl bg-white border-none shadow-xl shadow-secondary/20 focus:ring-4 ring-primary/10 transition-all font-black text-xl appearance-none cursor-pointer">
                           <option value="" disabled>Sélectionner...</option>
                           {opponentClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /> Infrastructure</label>
                        <select value={formData.stadium_id || ''} onChange={(e) => updateField('stadium_id', e.target.value)} className="w-full h-18 px-10 rounded-2xl bg-white border-none shadow-xl shadow-secondary/20 focus:ring-4 ring-primary/10 transition-all font-black text-xl appearance-none cursor-pointer">
                           <option value="">Sélectionner...</option>
                           {stadiums.map(v => <option key={v.id} value={v.id}>{v.name} ({v.city})</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="md:col-span-2 pt-10">
                     <div className="flex bg-white p-3 rounded-[2.5rem] shadow-2xl border-2 border-secondary/20">
                        <button type="button" onClick={() => updateVenue(true)} className={`flex-1 h-18 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${formData.is_home === true ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'text-muted-foreground hover:bg-slate-50'}`}>Domicile</button>
                        <button type="button" onClick={() => updateVenue(false)} className={`flex-1 h-18 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${formData.is_home === false ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-muted-foreground hover:bg-slate-50'}`}>Extérieur</button>
                     </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                     <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Trophy className="w-4 h-4 text-primary" /> Compétition</label>
                     <select
                        value={formData.league_id || ''}
                        onChange={(e) => updateField('league_id', e.target.value === '' ? null : e.target.value)}
                        className="w-full h-16 px-10 rounded-2xl bg-white border-none shadow-xl shadow-secondary/20 focus:ring-4 ring-primary/10 transition-all font-black text-lg appearance-none cursor-pointer"
                     >
                        <option value="">Sélectionner...</option>
                        {leagues.map(l => <option key={l.id} value={l.id}>{l.name} — {l.season}</option>)}
                     </select>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                     <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Gamepad2 className="w-4 h-4 text-primary" /> Phase / Tour de Compétition</label>
                     <select
                        value={(['won', 'lost'].includes(formData.match_phase || '')) ? '' : (formData.match_phase || '')}
                        onChange={(e) => updateField('match_phase', e.target.value === '' ? null : e.target.value as MatchPhase)}
                        className="w-full h-16 px-10 rounded-2xl bg-white border-none shadow-xl shadow-secondary/20 focus:ring-4 ring-primary/10 transition-all font-black text-lg appearance-none cursor-pointer"
                     >
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
                  <div className="md:col-span-2 space-y-4">
                     <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Star className="w-4 h-4 text-primary" /> Résultat</label>
                     <div className="bg-white/50 rounded-[2rem] p-2 flex border-2 border-secondary shadow-inner">
                        <button type="button"
                           onClick={() => updateField('match_phase', formData.match_phase === 'won' ? null : 'won')}
                           className={`flex-1 h-14 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                              formData.match_phase === 'won' ? 'bg-emerald-500 text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-white'
                           }`}>
                           ✅ Gagné
                        </button>
                        <button type="button"
                           onClick={() => updateField('match_phase', formData.match_phase === 'lost' ? null : 'lost')}
                           className={`flex-1 h-14 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                              formData.match_phase === 'lost' ? 'bg-red-500 text-white shadow-xl scale-105' : 'text-muted-foreground hover:bg-white'
                           }`}>
                           ❌ Perdu
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {currentStep === 'lineup' && (
            <motion.div key="lineup" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-10 space-y-10 flex-1">
              <SectionTitle icon={<Users className="w-6 h-6 text-primary" />} title="Gestion de l'Effectif" subtitle="Onze majeur, banc de touche et déploiement tactique" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
                <div className="lg:col-span-4 flex flex-col gap-8 h-full">
                  <Card className="rounded-[3rem] border-secondary/50 shadow-xl overflow-hidden bg-white">
                    <CardContent className="p-8">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex justify-between items-center">
                          SYSTÈME TACTIQUE <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase">{currentLineup.formation}</Badge>
                       </h4>
                       <div className="grid grid-cols-4 gap-2">
                          {FORMATIONS.map(f => (
                            <button key={f} onClick={() => setFormData({...formData, formation: f, lineup: {...currentLineup, formation: f}})} className={`h-10 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${currentLineup.formation === f ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-transparent text-muted-foreground hover:border-primary/20'}`}>{f}</button>
                          ))}
                       </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[3.5rem] border-secondary/50 shadow-2xl flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="p-8 pb-4 space-y-6">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                          <input 
                            type="text" 
                            placeholder="Rechercher par nom..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none font-bold text-xs focus:ring-2 ring-primary/20"
                          />
                       </div>
                       <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar gap-1">
                          {['ALL', ...POSITION_GROUPS.map(g => g.label)].map(cat => (
                            <button 
                              key={cat} 
                              onClick={() => setActiveFilter(cat)}
                              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeFilter === cat ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              {cat}
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 custom-scrollbar max-h-[480px]">
                       <AnimatePresence mode="popLayout">
                          {categoryPlayers.length > 0 ? (
                            categoryPlayers.map(player => {
                               const isStarter = startingXI.includes(player.id);
                               const isSub = substitutes.includes(player.id);
                               const isSurclasse = surclassedIdsForTeam.has(player.id);
                               const surclassement = isSurclasse
                                 ? surclassements.find(s => s.player_id === player.id && s.status === 'active')
                                 : null;
                               const displayJersey = surclassement?.target_jersey_number ?? player.jersey_number;
                               return (
                                 <motion.div
                                    key={player.id}
                                    layout
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData('playerId', player.id); }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-grab active:cursor-grabbing group ${isStarter ? 'border-primary bg-primary/5 shadow-md' : isSub ? 'border-emerald-400 bg-emerald-50/20' : isSurclasse ? 'border-orange-300 bg-orange-50/30 hover:border-orange-400' : 'border-slate-100 bg-white hover:border-primary/20'}`}
                                 >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                                       <img src={(player.photo_url && player.photo_url !== 'null') ? player.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=random&color=fff&size=200`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                         <p className="font-black text-xs uppercase truncate leading-tight">{player.full_name}</p>
                                         {isSurclasse && surclassement && (
                                           <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-100 border border-orange-200 text-orange-600 text-[8px] font-black uppercase shrink-0">
                                             ↑ {surclassement.original_category}
                                           </span>
                                         )}
                                       </div>
                                       <div
                                         className="flex items-center gap-2 mt-1"
                                         draggable={false}
                                         onMouseDown={e => e.stopPropagation()}
                                         onClick={e => e.stopPropagation()}
                                       >
                                         {editingJerseyId === player.id ? (
                                           <input
                                             type="number"
                                             min={1} max={99}
                                             autoFocus
                                             draggable={false}
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
                                             className="w-14 px-1.5 py-0.5 text-[10px] font-black text-center rounded-lg border-2 border-primary bg-primary/5 focus:outline-none"
                                           />
                                         ) : (
                                           <button
                                             draggable={false}
                                             onMouseDown={e => e.stopPropagation()}
                                             onClick={e => {
                                               e.stopPropagation();
                                               e.preventDefault();
                                               setEditingJerseyId(player.id);
                                               setEditingJerseyValue(String(player.jersey_number ?? ''));
                                             }}
                                             className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:border-primary hover:text-primary text-muted-foreground transition-all text-[9px] font-black uppercase cursor-pointer"
                                             title="Modifier le numéro de maillot"
                                           >
                                             <Edit2 className="w-2.5 h-2.5 shrink-0" />
                                             #{displayJersey ?? '—'}
                                           </button>
                                         )}
                                         <span className="text-[9px] font-bold text-muted-foreground uppercase">• {player.position}</span>
                                         {surclassement?.target_jersey_number != null && surclassement.target_jersey_number !== player.jersey_number && (
                                           <span className="text-[8px] text-orange-400 font-black">(#{player.jersey_number} orig.)</span>
                                         )}
                                       </div>
                                    </div>
                                    <button
                                       onClick={() => toggleLineup(player)}
                                       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ (isStarter || isSub) ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}
                                    >
                                       {(isStarter || isSub) ? <Check className="w-5 h-5 stroke-[3]" /> : <UserPlus className="w-5 h-5" />}
                                    </button>
                                 </motion.div>
                               );
                            })
                          ) : (
                            <div className="py-20 text-center opacity-20 italic">
                               <Search className="w-10 h-10 mx-auto mb-4" />
                               <p className="text-[10px] font-black uppercase">Aucun résultat</p>
                            </div>
                          )}
                       </AnimatePresence>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-8 flex flex-col items-center gap-10">
                   <div className="w-full max-w-[550px] space-y-8">
                      <div className="flex items-center justify-between px-6">
                         <div className="flex items-center gap-4">
                            <Badge className="bg-emerald-500 text-white font-black px-6 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/20 text-xs">XI: {startingXI.filter(id => id !== '').length}/11</Badge>
                            <Badge className="bg-blue-500 text-white font-black px-6 py-2.5 rounded-2xl shadow-xl shadow-blue-500/20 text-xs">Subs: {substitutes.length}</Badge>
                            <button
                               type="button"
                               onClick={() => updateField('lineup_published', !formData.lineup_published)}
                               className={`px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border-2 ${
                                  formData.lineup_published
                                     ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg'
                                     : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-500'
                               }`}
                            >
                               {formData.lineup_published ? '📢 COMPO OFFICIELLE PUBLIÉE' : '📤 PUBLIER COMPO OFFICIELLE'}
                            </button>
                         </div>
                         <div className="flex items-center gap-2 opacity-30 italic text-[10px] font-bold uppercase tracking-widest">
                            <Filter className="w-4 h-4" /> Drag-and-drop to swap positions
                         </div>
                      </div>

                      <Pitch
                        positions={positions}
                        startingXI={startingXI}
                        getPlayerById={getPlayerById}
                        onSwap={handleSwap}
                        onRemove={removeFromPitch}
                        jerseyOverrides={jerseyOverrides}
                      />
                   </div>

                   <Card className="w-full rounded-[3.5rem] border-secondary/50 shadow-2xl bg-white overflow-hidden p-10">
                      <div className="flex items-center justify-between mb-8 px-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banc de Touche des Remplaçants</h4>
                         <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">EFFECTIF DISPONIBLE</span>
                      </div>
                      <div className="flex flex-wrap gap-4 min-h-[80px]">
                         {substitutes.map(sid => {
                            const p = getPlayerById(sid);
                            if (!p) return null;
                            const pSurc = surclassements.find(s => s.player_id === p.id && s.status === 'active');
                            const pJersey = pSurc?.target_jersey_number ?? p.jersey_number;
                            return (
                               <motion.div
                                 key={sid}
                                 draggable
                                 onDragStart={(e) => { e.dataTransfer.setData('playerId', sid); }}
                                 className="flex items-center gap-4 bg-white p-3 pr-6 rounded-[1.8rem] border-2 border-emerald-400 shadow-xl shadow-emerald-500/5 cursor-grab active:cursor-grabbing hover:scale-105 transition-all group"
                               >
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                                     <img src={(p.photo_url && p.photo_url !== 'null') ? p.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=random&color=fff&size=128`} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-[11px] font-black uppercase truncate leading-none">{p.full_name.split(' ').pop()}</p>
                                     <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase">#{pJersey ?? '—'} • {p.position}</p>
                                  </div>
                                  <button onClick={() => toggleLineup(p)} className="ml-2 w-6 h-6 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                     <X className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                               </motion.div>
                            );
                         })}
                         {substitutes.length === 0 && (
                            <div className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-secondary rounded-[2.5rem] opacity-20">
                               <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucune sélection secondaire</p>
                            </div>
                         )}
                      </div>
                   </Card>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'opponent' && (
            <motion.div key="opponent" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-10 space-y-10 flex-1">
              <SectionTitle icon={<Target className="w-6 h-6 text-primary" />} title="Planification Tactique Adverse" subtitle="Configuration stratégique de la formation opposante" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
                 <div className="lg:col-span-4 flex flex-col gap-8 h-full">
                    <Card className="rounded-[3rem] border-secondary/50 shadow-xl overflow-hidden bg-white">
                       <CardContent className="p-8">
                          <div className="flex items-center gap-6 mb-8 border-b pb-6">
                             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center p-3 border-2 border-white shadow-inner">
                                {opponent?.logo_url ? <img src={opponent.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-8 h-8 text-muted-foreground opacity-10" />}
                             </div>
                             <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">{opponent?.name || 'Visiteur'}</h3>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Poste par poste</p>
                             </div>
                          </div>
                          
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex justify-between items-center">
                             CONFIGURATION SYSTÈME <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase">{formData.opponent_formation}</Badge>
                          </h4>
                          <div className="grid grid-cols-4 gap-2">
                             {FORMATIONS.map(f => (
                               <button key={f} onClick={() => setFormData({...formData, opponent_formation: f})} className={`h-10 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${formData.opponent_formation === f ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-transparent text-muted-foreground hover:border-primary/20'}`}>{f}</button>
                             ))}
                          </div>
                       </CardContent>
                    </Card>

                    {/* Banque de numéros 1-22 */}
                    <Card className="rounded-[2.5rem] border-primary/20 shadow-lg overflow-hidden bg-gradient-to-br from-primary/5 to-white">
                       <CardContent className="p-5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                             <Users className="w-3.5 h-3.5" /> Banque de Numéros (1-22)
                          </h4>
                          <p className="text-[9px] text-muted-foreground mb-3">Cliquez pour placer sur le terrain</p>
                          <div className="grid grid-cols-7 gap-2">
                             {Array.from({ length: 22 }, (_, i) => i + 1).map(num => {
                                const isUsed = (formData.opponent_lineup || []).includes(num.toString()) || (formData.opponent_subs || []).includes(num.toString());
                                return (
                                   <button
                                      key={num}
                                      onClick={() => {
                                         if (isUsed) return;
                                         // Find first empty slot
                                         const emptySlot = (formData.opponent_lineup || []).findIndex((slot: string) => slot === '');
                                         if (emptySlot !== -1) {
                                            updateOpponentJersey(emptySlot, num.toString());
                                         } else {
                                            // If no empty slot in lineup, add to subs
                                            addOpponentSubstitute();
                                            updateOpponentSubstitute((formData.opponent_subs || []).length, num.toString());
                                         }
                                      }}
                                      disabled={isUsed}
                                      className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                                         isUsed 
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                            : 'bg-white border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:scale-110'
                                      }`}
                                   >
                                      {num}
                                   </button>
                                );
                             })}
                          </div>
                       </CardContent>
                    </Card>

                    <Card className="rounded-[3.5rem] border-secondary/50 shadow-2xl flex-1 flex flex-col overflow-hidden bg-white">
                       <div className="p-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Composition (11 titulaires)</h4>
                             <button 
                                onClick={() => setFormData({...formData, opponent_lineup: Array(11).fill('')})}
                                className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase"
                             >
                                Tout effacer
                             </button>
                          </div>
                          <div className="space-y-2 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                             {opponentPositions.map((pos, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-secondary/20 hover:bg-white hover:shadow-md transition-all group">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black ${formData.opponent_lineup?.[idx] ? 'bg-primary' : 'bg-slate-400'}`}>
                                         {pos.label}
                                      </div>
                                      <span className="text-[10px] font-bold uppercase text-slate-500">{formData.opponent_lineup?.[idx] ? `Joueur #${formData.opponent_lineup[idx]}` : 'Vide'}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      {formData.opponent_lineup?.[idx] && (
                                         <button
                                            onClick={() => updateOpponentJersey(idx, '')}
                                            className="w-6 h-6 rounded-lg bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                         >
                                            <X className="w-3 h-3" />
                                         </button>
                                      )}
                                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${formData.opponent_lineup?.[idx] ? 'bg-primary text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                                         {formData.opponent_lineup?.[idx] || '-'}
                                      </span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </Card>
                 </div>

                 <div className="lg:col-span-8 flex flex-col items-center gap-10">
                    <div className="w-full max-w-[550px] space-y-8">
                       <div className="flex justify-between items-center px-6">
                          <Badge className="bg-slate-950 text-white font-black px-8 py-3 rounded-2xl shadow-2xl text-xs uppercase tracking-widest">Tactique en temps réel</Badge>
                          <button
                             type="button"
                             onClick={() => updateField('opponent_lineup_published', !formData.opponent_lineup_published)}
                             className={`px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border-2 ${
                                formData.opponent_lineup_published
                                   ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg'
                                   : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-500'
                             }`}
                          >
                             {formData.opponent_lineup_published ? '📢 COMPO ADVERSE PUBLIÉE' : '📤 PUBLIER COMPO ADVERSE'}
                          </button>
                       </div>
                       <Pitch 
                         positions={opponentPositions} 
                         isOpponent 
                         opponentJerseyNumbers={formData.opponent_lineup}
                         onUpdateOpponentJersey={updateOpponentJersey}
                       />
                    </div>

                    <Card className="w-full rounded-[3.5rem] border-secondary/50 shadow-2xl bg-white overflow-hidden p-10">
                       <div className="flex items-center justify-between mb-8 px-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Le Banc de l'Adversaire</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={addOpponentSubstitute}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-black uppercase px-4 py-1 h-8 rounded-xl gap-2"
                          >
                             <UserPlus className="w-3 h-3" /> Ajouter Remplaçant
                          </Button>
                       </div>
                       <div className="flex flex-wrap gap-4 min-h-[80px]">
                          {(formData.opponent_subs || []).map((jersey, idx) => (
                             <motion.div 
                               key={idx}
                               layout
                               className="flex items-center gap-3 bg-white p-3 pr-4 rounded-2xl border-2 border-slate-100 shadow-md group hover:border-primary/20 transition-all"
                             >
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                   <Shield className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="#" 
                                  value={jersey}
                                  onChange={(e) => updateOpponentSubstitute(idx, e.target.value)}
                                  className="w-10 h-10 text-center rounded-xl bg-slate-50 border-none font-black text-xs"
                                />
                                <button 
                                  onClick={() => removeOpponentSubstitute(idx)}
                                  className="w-6 h-6 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                >
                                   <X className="w-3.5 h-3.5 mx-auto" />
                                </button>
                             </motion.div>
                          ))}
                          {(formData.opponent_subs || []).length === 0 && (
                             <div className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-secondary rounded-[2.5rem] opacity-20">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucun remplaçant répertorié</p>
                             </div>
                          )}
                       </div>
                    </Card>
                 </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'staff' && (
            <motion.div key="staff" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-16 space-y-16 flex-1">
               <SectionTitle icon={<Briefcase className="w-6 h-6 text-primary" />} title="Corps Technique & Médical" subtitle="Sélectionnez les membres du staff présents pour cette rencontre" />
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {staff.length > 0 ? (
                    staff.map(member => {
                       const isSelected = formData.staff_ids?.includes(member.id);
                       return (
                          <motion.div 
                             key={member.id} 
                             whileHover={{ scale: 1.02 }}
                             onClick={() => {
                                const currentIds = formData.staff_ids || [];
                                const newIds = isSelected 
                                   ? currentIds.filter(id => id !== member.id)
                                   : [...currentIds, member.id];
                                updateField('staff_ids', newIds);
                             }}
                             className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group shadow-lg ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-primary/20'}`}
                          >
                             <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 overflow-hidden border-2 border-white shadow-xl">
                                   <img src={(member.photo_url && member.photo_url !== 'null') ? member.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random&color=fff&size=200`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                   <h4 className="text-xl font-black uppercase italic tracking-tighter leading-none">{member.full_name}</h4>
                                   <Badge className="mt-3 bg-secondary text-muted-foreground border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
                                      {member.role || 'Staff Member'}
                                   </Badge>
                                </div>
                             </div>
                             
                             <div className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white shadow-xl scale-110' : 'bg-slate-50 text-slate-200 group-hover:bg-slate-100 group-hover:text-slate-400'}`}>
                                <Check className={`w-5 h-5 ${isSelected ? 'stroke-[4]' : 'stroke-[2]'}`} />
                             </div>

                             {isSelected && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                             )}
                          </motion.div>
                       );
                    })
                  ) : (
                    <div className="md:col-span-2 lg:col-span-3 py-32 text-center bg-slate-50 border-2 border-dashed border-secondary rounded-[4rem]">
                       <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground/30 mx-auto mb-6">
                          <Users className="w-10 h-10" />
                       </div>
                       <p className="text-xl font-black uppercase tracking-tighter italic text-muted-foreground">Aucun membre du staff enregistré</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 mt-2">Veuillez d'abord enregistrer du staff dans la section "People"</p>
                    </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-16 py-12 border-t bg-slate-50 flex items-center justify-between mt-auto">
          <Button variant="ghost" onClick={goPrev} className="h-16 px-12 rounded-[2rem] font-black uppercase tracking-widest text-xs gap-4 hover:bg-white transition-all">
            <ChevronLeft className="w-6 h-6" /> {stepIndex === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          <div className="flex items-center gap-5">
            {/* Indicateur auto-save */}
            {autoSaved && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sauvegardé
              </span>
            )}
            {STEPS.map((s, idx) => (
              <div key={s.key} className={`rounded-full transition-all duration-1000 ${s.key === currentStep ? 'w-16 h-2.5 bg-primary shadow-lg shadow-primary/30' : idx < stepIndex ? 'w-2.5 h-2.5 bg-primary/40' : 'w-2.5 h-2.5 bg-secondary'}`} />
            ))}
          </div>
          {currentStep === 'opponent' ? (
            <Button onClick={onBack} className="h-16 px-16 rounded-[2.2rem] bg-slate-950 hover:bg-black text-white transition-all font-black uppercase tracking-widest text-xs gap-6 shadow-2xl active:scale-95 group">
              <CheckCircle2 className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
              Terminer
            </Button>
          ) : (
            <Button onClick={goNext} className="h-16 px-16 rounded-[2.2rem] bg-primary hover:bg-slate-900 text-white transition-all font-black uppercase tracking-widest text-xs gap-6 shadow-xl hover:scale-105 active:scale-95 group">
              Étape Suivante <ChevronRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-8">
    <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center shadow-inner shrink-0 border border-primary/5 text-primary">{icon}</div>
    <div><h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{title}</h3><p className="text-base text-muted-foreground mt-2 font-medium italic opacity-70">{subtitle}</p></div>
  </div>
);

const Pitch: React.FC<{
  positions: { top: string; left: string; label: string }[];
  startingXI?: string[];
  getPlayerById?: (id: string) => any;
  isOpponent?: boolean;
  opponentJerseyNumbers?: string[];
  onUpdateOpponentJersey?: (slotIndex: number, jersey: string) => void;
  onSwap?: (playerId: string, slotIndex: number) => void;
  onRemove?: (slotIndex: number) => void;
  jerseyOverrides?: Record<string, number>;
}> = ({ positions, startingXI = [], getPlayerById, isOpponent, opponentJerseyNumbers, onUpdateOpponentJersey, onSwap, onRemove, jerseyOverrides = {} }) => {
  const {
    isDragging,
    draggedItem,
    dragPosition,
    longPressProgress,
    pitchRef,
    isTouchDevice,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTouchDragAndDrop({
    onDrop: (draggedId, targetIndex) => {
      if (onSwap) onSwap(draggedId, targetIndex);
    },
    longPressDuration: 600,
  });

  return (
    <div 
      ref={pitchRef}
      className="w-full bg-[#3fa375] aspect-[0.7] rounded-[5rem] shadow-2xl relative overflow-hidden ring-[20px] ring-slate-100 border-[14px] border-[#52b788] group/pitch touch-none select-none"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #52b788 0, #52b788 45px, #40916c 45px, #40916c 90px)' }} />
      <div className="absolute inset-8 border-[4px] border-white/50 rounded-[4rem] pointer-events-none" />
      <div className="absolute inset-x-8 top-1/2 -translate-y-px border-t-[4px] border-white/50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[4px] border-white/50 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/50 rounded-full shadow-inner" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[60%] h-[20%] border-b-[4px] border-x-[4px] border-white/50 pointer-events-none" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-[20%] border-t-[4px] border-x-[4px] border-white/50 pointer-events-none" />
      
      {/* Touch instruction hint */}
      {isTouchDevice && !isDragging && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase backdrop-blur-sm z-40 pointer-events-none animate-pulse">
          👆 Maintenez pour déplacer
        </div>
      )}
      
      {/* Drag preview following finger */}
      {isDragging && draggedItem && dragPosition && getPlayerById && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: dragPosition.x - 40,
            top: dragPosition.y - 40,
          }}
        >
          <div className="w-20 h-20 rounded-full border-[6px] border-white bg-primary ring-8 ring-primary/30 shadow-2xl flex items-center justify-center">
            {(() => {
              const p = getPlayerById(draggedItem.id);
              return p ? (
                <img 
                  src={(p.photo_url && p.photo_url !== 'null') ? p.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=random&color=fff&size=200`} 
                  className="w-full h-full rounded-full object-cover p-1" 
                />
              ) : null;
            })()}
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase whitespace-nowrap">
            Déplacez vers une position
          </div>
        </motion.div>
      )}
      
      <AnimatePresence>
      {positions.map((pos, idx) => {
        const p = getPlayerById ? (startingXI[idx] ? getPlayerById(startingXI[idx]) : null) : null;
        const pFieldJersey = p ? (jerseyOverrides[p.id] ?? p.jersey_number) : null;
        const displayTop = isOpponent ? (100 - parseFloat(pos.top)) + '%' : pos.top;
        const displayLeft = isOpponent ? (100 - parseFloat(pos.left)) + '%' : pos.left;
        const opponentJersey = opponentJerseyNumbers?.[idx] || '';
        const isBeingDragged = draggedItem?.id === (p?.id || '');
        
        return (
          <motion.div 
            key={idx} 
            data-pitch-slot={idx}
            initial={{ scale: 0, x: "-50%", y: "-50%" }} 
            animate={{ 
              scale: isBeingDragged ? 0.3 : 1, 
              x: "-50%", 
              y: "-50%",
              opacity: isBeingDragged ? 0.3 : 1
            }} 
            layout
            className="absolute flex flex-col items-center gap-3 z-30" 
            style={{ top: displayTop, left: displayLeft }}
            onDragOver={(e) => { e.preventDefault(); !isOpponent && e.currentTarget.classList.add('scale-125'); }}
            onDragLeave={(e) => { !isOpponent && e.currentTarget.classList.remove('scale-125'); }}
            onDrop={(e) => {
               if (isOpponent) return;
               e.preventDefault();
               e.currentTarget.classList.remove('scale-125');
               const playerId = (e as any).dataTransfer?.getData('playerId');
               if (playerId && onSwap) onSwap(playerId, idx);
            }}
          >
            {/* Long press progress ring */}
            {isTouchDevice && p && !isOpponent && longPressProgress > 0 && !isDragging && (
              <div className="absolute inset-0 -m-2 pointer-events-none">
                <svg className="w-[calc(100%+16px)] h-[calc(100%+16px)] -m-2 rotate-[-90deg]">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="46%"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeDasharray={`${longPressProgress * 283} 283`}
                    className="transition-all duration-75"
                  />
                </svg>
              </div>
            )}
            
            <motion.div 
              draggable={!!p && !isOpponent}
              onDragStart={(e) => { 
                if(p && !isOpponent) {
                  (e as any).dataTransfer?.setData('playerId', p.id);
                }
              }}
              onTouchStart={(e) => {
                if (p && !isOpponent && isTouchDevice) {
                  handleTouchStart(e, { id: p.id, type: 'player' }, idx);
                }
              }}
              whileHover={(p || isOpponent) ? { scale: 1.15, rotate: 8, y: -8 } : { scale: 1.1 }}
              className={`w-20 h-20 rounded-full border-[6px] flex items-center justify-center shadow-2xl transition-all duration-500 relative group/player touch-manipulation
                ${p ? 'bg-primary border-white ring-8 ring-primary/20' : isOpponent ? 'bg-slate-950 border-white/30 hover:bg-slate-900 border-white cursor-pointer' : 'bg-white/10 border-white/20 hover:bg-white/40 hover:border-white shadow-inner cursor-crosshair'}
                ${isBeingDragged ? 'scale-50 opacity-30' : ''}
                ${longPressProgress > 0 ? 'scale-110' : ''}`}
              onClick={() => {
                if (isOpponent && onUpdateOpponentJersey) {
                  const j = prompt('Numéro de maillot adverse?', opponentJersey || (idx + 1).toString());
                  if (j !== null) onUpdateOpponentJersey(idx, j);
                }
              }}
            >
               {p ? (
                 <>
                  <img 
                    src={(p.photo_url && p.photo_url !== 'null') ? p.photo_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=random&color=fff&size=200`} 
                    className="w-full h-full rounded-full object-cover p-1" 
                  />
                  <Badge className="absolute -top-1 -right-1 bg-black text-white h-7 w-7 rounded-full flex items-center justify-center p-0 border-2 border-white text-[11px] font-black shadow-xl">{pFieldJersey ?? '—'}</Badge>
                  {!isOpponent && onRemove && (
                     <button
                       onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                       className="absolute -top-1 -left-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-all hover:scale-110 shadow-lg"
                     >
                        <X className="w-3.5 h-3.5" />
                     </button>
                  )}
                 </>
               ) : isOpponent ? (
                 <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white leading-none">{opponentJersey || idx + 1}</span>
                    <span className="text-[8px] font-bold text-white/40 uppercase mt-1">POS: {pos.label}</span>
                 </div>
               ) : (
                 <span className="text-[11px] font-black text-white/50 tracking-tighter uppercase">{pos.label}</span>
               )}
            </motion.div>
            <div className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase backdrop-blur-md truncate max-w-[110px] border shadow-2xl transition-all duration-500
              ${p ? 'bg-black/90 text-white border-white/20 scale-105' : isOpponent ? 'bg-slate-900/80 text-white border-white/10' : 'bg-white/10 text-white/40 border-white/10'}
              ${isBeingDragged ? 'opacity-50' : ''}`}>
              {p ? p.full_name.split(' ').pop() : isOpponent ? `Adversaire #${opponentJersey || idx + 1}` : pos.label}
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
};

export default MatchPreparation;
