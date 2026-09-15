import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Users, 
  Filter, 
  CheckCircle2, 
  X, 
  Eye, 
  Shield, 
  Footprints,
  BarChart3,
  Activity,
  Compass,
  Brain,
  Target,
  SlidersHorizontal,
  ChevronRight,
  Award,
  Search,
  UserCheck,
  ArrowUpDown,
  Crown
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { TrialCandidate, CandidateEvaluation } from '../types/recruitment';
import { RECRUITMENT_AGE_CATEGORIES } from '../types/recruitment';
import PlayerRadarChart from './PlayerRadarChart';
import ScoutasticDenseSlotCard from '../../../components/ScoutasticDenseSlotCard';

interface FormationSlot {
  roleCode: string;
  label: string;
  category: 'GK' | 'DEF' | 'MID' | 'ATT';
  top: string;
  left: string;
}

interface FormationConfig {
  id: string;
  name: string;
  slots: FormationSlot[];
}

const FORMATIONS: Record<string, FormationConfig> = {
  '4-3-3': {
    id: '4-3-3',
    name: '4-3-3 Offensif Classique',
    slots: [
      { roleCode: 'GK', label: 'GB', category: 'GK', top: '88%', left: '50%' },
      { roleCode: 'LB', label: 'DG', category: 'DEF', top: '72%', left: '16%' },
      { roleCode: 'CB', label: 'DCG', category: 'DEF', top: '74%', left: '38%' },
      { roleCode: 'CB', label: 'DCD', category: 'DEF', top: '74%', left: '62%' },
      { roleCode: 'RB', label: 'DD', category: 'DEF', top: '72%', left: '84%' },
      { roleCode: 'CDM', label: 'MDC', category: 'MID', top: '56%', left: '50%' },
      { roleCode: 'CM', label: 'MCG', category: 'MID', top: '44%', left: '32%' },
      { roleCode: 'CM', label: 'MCD', category: 'MID', top: '44%', left: '68%' },
      { roleCode: 'LW', label: 'AG', category: 'ATT', top: '24%', left: '20%' },
      { roleCode: 'ST', label: 'BU', category: 'ATT', top: '16%', left: '50%' },
      { roleCode: 'RW', label: 'AD', category: 'ATT', top: '24%', left: '80%' },
    ]
  },
  '4-4-2': {
    id: '4-4-2',
    name: '4-4-2 Plat Équilibré',
    slots: [
      { roleCode: 'GK', label: 'GB', category: 'GK', top: '88%', left: '50%' },
      { roleCode: 'LB', label: 'DG', category: 'DEF', top: '72%', left: '16%' },
      { roleCode: 'CB', label: 'DCG', category: 'DEF', top: '74%', left: '38%' },
      { roleCode: 'CB', label: 'DCD', category: 'DEF', top: '74%', left: '62%' },
      { roleCode: 'RB', label: 'DD', category: 'DEF', top: '72%', left: '84%' },
      { roleCode: 'LM', label: 'MG', category: 'MID', top: '48%', left: '18%' },
      { roleCode: 'CM', label: 'MCG', category: 'MID', top: '52%', left: '39%' },
      { roleCode: 'CM', label: 'MCD', category: 'MID', top: '52%', left: '61%' },
      { roleCode: 'RM', label: 'MD', category: 'MID', top: '48%', left: '82%' },
      { roleCode: 'ST', label: 'BUG', category: 'ATT', top: '20%', left: '38%' },
      { roleCode: 'ST', label: 'BUD', category: 'ATT', top: '20%', left: '62%' },
    ]
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    name: '4-2-3-1 Moderne',
    slots: [
      { roleCode: 'GK', label: 'GB', category: 'GK', top: '88%', left: '50%' },
      { roleCode: 'LB', label: 'DG', category: 'DEF', top: '72%', left: '16%' },
      { roleCode: 'CB', label: 'DCG', category: 'DEF', top: '74%', left: '38%' },
      { roleCode: 'CB', label: 'DCD', category: 'DEF', top: '74%', left: '62%' },
      { roleCode: 'RB', label: 'DD', category: 'DEF', top: '72%', left: '84%' },
      { roleCode: 'CDM', label: 'MDCG', category: 'MID', top: '56%', left: '36%' },
      { roleCode: 'CDM', label: 'MDCD', category: 'MID', top: '56%', left: '64%' },
      { roleCode: 'CAM', label: 'MOC', category: 'MID', top: '38%', left: '50%' },
      { roleCode: 'LW', label: 'AG', category: 'ATT', top: '34%', left: '20%' },
      { roleCode: 'RW', label: 'AD', category: 'ATT', top: '34%', left: '80%' },
      { roleCode: 'ST', label: 'BU', category: 'ATT', top: '16%', left: '50%' },
    ]
  },
  '3-5-2': {
    id: '3-5-2',
    name: '3-5-2 Pistons Dynamiques',
    slots: [
      { roleCode: 'GK', label: 'GB', category: 'GK', top: '88%', left: '50%' },
      { roleCode: 'CB', label: 'DCG', category: 'DEF', top: '74%', left: '26%' },
      { roleCode: 'CB', label: 'DC', category: 'DEF', top: '76%', left: '50%' },
      { roleCode: 'CB', label: 'DCD', category: 'DEF', top: '74%', left: '74%' },
      { roleCode: 'LWB', label: 'Piston G', category: 'MID', top: '50%', left: '14%' },
      { roleCode: 'CDM', label: 'MDC', category: 'MID', top: '58%', left: '50%' },
      { roleCode: 'CM', label: 'MCG', category: 'MID', top: '44%', left: '36%' },
      { roleCode: 'CM', label: 'MCD', category: 'MID', top: '44%', left: '64%' },
      { roleCode: 'RWB', label: 'Piston D', category: 'MID', top: '50%', left: '86%' },
      { roleCode: 'ST', label: 'BUG', category: 'ATT', top: '20%', left: '38%' },
      { roleCode: 'ST', label: 'BUD', category: 'ATT', top: '20%', left: '62%' },
    ]
  },
  '3-4-3': {
    id: '3-4-3',
    name: '3-4-3 Pression Haute',
    slots: [
      { roleCode: 'GK', label: 'GB', category: 'GK', top: '88%', left: '50%' },
      { roleCode: 'CB', label: 'DCG', category: 'DEF', top: '74%', left: '26%' },
      { roleCode: 'CB', label: 'DC', category: 'DEF', top: '76%', left: '50%' },
      { roleCode: 'CB', label: 'DCD', category: 'DEF', top: '74%', left: '74%' },
      { roleCode: 'LM', label: 'MG', category: 'MID', top: '50%', left: '18%' },
      { roleCode: 'CM', label: 'MCG', category: 'MID', top: '52%', left: '39%' },
      { roleCode: 'CM', label: 'MCD', category: 'MID', top: '52%', left: '61%' },
      { roleCode: 'RM', label: 'MD', category: 'MID', top: '50%', left: '82%' },
      { roleCode: 'LW', label: 'AG', category: 'ATT', top: '24%', left: '22%' },
      { roleCode: 'ST', label: 'BU', category: 'ATT', top: '16%', left: '50%' },
      { roleCode: 'RW', label: 'AD', category: 'ATT', top: '24%', left: '78%' },
    ]
  }
};

interface ShortlistPitchViewProps {
  candidates: TrialCandidate[];
  evaluations: CandidateEvaluation[];
  onOpenCandidateDetail: (candidate: TrialCandidate) => void;
  onOpenEvaluationForCandidate?: (candidate: TrialCandidate) => void;
}

export const ShortlistPitchView: React.FC<ShortlistPitchViewProps> = ({
  candidates,
  evaluations,
  onOpenCandidateDetail,
  onOpenEvaluationForCandidate,
}) => {
  const [selectedFormationKey, setSelectedFormationKey] = useState<string>('4-3-3');
  const [pitchHeight, setPitchHeight] = useState<'standard' | 'tall' | 'extra'>('tall');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyBestScorePerPosition, setOnlyBestScorePerPosition] = useState<boolean>(false);
  const [shortlistOnly, setShortlistOnly] = useState<boolean>(true);

  const pitchHeightClass = {
    standard: 'min-h-[1050px] lg:min-h-[1180px]',
    tall: 'min-h-[1280px] lg:min-h-[1420px]',
    extra: 'min-h-[1500px] lg:min-h-[1680px]',
  }[pitchHeight];

  // Joueur survolé (infobulle) et joueur inspecté (panneau modal complet)
  const [hoveredCandidate, setHoveredCandidate] = useState<TrialCandidate | null>(null);
  const [inspectedCandidate, setInspectedCandidate] = useState<TrialCandidate | null>(null);

  const activeFormation = FORMATIONS[selectedFormationKey] || FORMATIONS['4-3-3'];

  // Map des évaluations les plus récentes par joueur
  const playerEvaluationsMap = useMemo(() => {
    const map = new Map<string, CandidateEvaluation>();
    evaluations.forEach(ev => {
      const existing = map.get(ev.candidate_id);
      if (!existing || new Date(ev.evaluation_date).getTime() > new Date(existing.evaluation_date).getTime()) {
        map.set(ev.candidate_id, ev);
      }
    });
    return map;
  }, [evaluations]);

  // Vérifie si un candidat est formellement shortlisté (pipeline stage Kanban ou verdict d'évaluation)
  const isCandidateShortlisted = (cand: TrialCandidate): boolean => {
    const hasEval = playerEvaluationsMap.get(cand.id);
    const hasShortlistVerdict = hasEval && (['shortlist', 'recommend_academy', 'contract_proposal'].includes(hasEval.verdict) || hasEval.overall_score >= 7.0);
    return ['shortlisted', 'shortlist', 'under_evaluation', 'trial', 'club_trial', 'academy', 'selected', 'signed'].includes(cand.pipeline_stage) || !!hasShortlistVerdict;
  };

  // Décompte total des joueurs de la shortlist
  const shortlistedTotalCount = useMemo(() => {
    return candidates.filter(isCandidateShortlisted).length;
  }, [candidates, playerEvaluationsMap]);

  // Tous les candidats de la catégorie sélectionnée (filtrés par Shortlist si actif)
  const categoryCandidates = useMemo(() => {
    return candidates.filter(cand => {
      // Filtre Shortlist (activé par défaut)
      if (shortlistOnly && !isCandidateShortlisted(cand)) {
        return false;
      }

      // Filtre catégorie
      if (categoryFilter !== 'ALL' && cand.age_category !== categoryFilter) {
        return false;
      }

      // Filtre score global
      if (minScoreFilter > 0) {
        const score = playerEvaluationsMap.get(cand.id)?.overall_score || 0;
        if (score < minScoreFilter) return false;
      }

      // Filtre recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${cand.first_name} ${cand.last_name}`.toLowerCase();
        const club = (cand.current_club || '').toLowerCase();
        const pos = (cand.primary_position || '').toLowerCase();
        if (!fullName.includes(q) && !club.includes(q) && !pos.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const evalA = playerEvaluationsMap.get(a.id);
      const evalB = playerEvaluationsMap.get(b.id);
      const scoreA = evalA?.overall_score;
      const scoreB = evalB?.overall_score;

      // 1. Joueur avec évaluation passe avant joueur sans évaluation
      if (scoreA !== undefined && scoreB === undefined) return -1;
      if (scoreA === undefined && scoreB !== undefined) return 1;

      // 2. Meilleur score d'évaluation décroissant
      if (scoreA !== undefined && scoreB !== undefined) {
        if (scoreB !== scoreA) return scoreB - scoreA;
        // 3. En cas d'égalité, évaluation la plus récente
        const dateA = new Date(evalA.evaluation_date).getTime() || 0;
        const dateB = new Date(evalB.evaluation_date).getTime() || 0;
        return dateB - dateA;
      }

      return 0;
    });
  }, [candidates, shortlistOnly, categoryFilter, minScoreFilter, searchQuery, playerEvaluationsMap]);

  // Fonction de placement automatique d'un candidat sur le slot tactique le plus adapté
  const mapCandidateToSlotIndex = (cand: TrialCandidate, slots: FormationSlot[]): number => {
    const pos = (cand.primary_position || '').toUpperCase();

    // 1. Gardien
    if (pos.includes('GK') || pos.includes('GARDIEN')) {
      const idx = slots.findIndex(s => s.roleCode === 'GK');
      if (idx !== -1) return idx;
    }

    // 2. Ailier Gauche
    if (pos.includes('LW') || pos.includes('AILIER G') || pos.includes('AG')) {
      const idx = slots.findIndex(s => s.roleCode === 'LW' || s.label === 'AG' || s.label === 'MG');
      if (idx !== -1) return idx;
    }

    // 3. Ailier Droit
    if (pos.includes('RW') || pos.includes('AILIER D') || pos.includes('AD')) {
      const idx = slots.findIndex(s => s.roleCode === 'RW' || s.label === 'AD' || s.label === 'MD');
      if (idx !== -1) return idx;
    }

    // 4. Avant-Centre / Buteur
    if (pos.includes('ST') || pos.includes('CF') || pos.includes('BU') || pos.includes('BUTEUR') || pos.includes('ATT')) {
      const idx = slots.findIndex(s => s.roleCode === 'ST' || s.label.includes('BU'));
      if (idx !== -1) return idx;
    }

    // 5. Latéral Gauche
    if (pos.includes('LB') || pos.includes('DG') || pos.includes('LATÉRAL G') || pos.includes('PISTON G')) {
      const idx = slots.findIndex(s => s.roleCode === 'LB' || s.label === 'DG' || s.label.includes('Piston G'));
      if (idx !== -1) return idx;
    }

    // 6. Latéral Droit
    if (pos.includes('RB') || pos.includes('DD') || pos.includes('LATÉRAL D') || pos.includes('PISTON D')) {
      const idx = slots.findIndex(s => s.roleCode === 'RB' || s.label === 'DD' || s.label.includes('Piston D'));
      if (idx !== -1) return idx;
    }

    // 7. Défenseur Central
    if (pos.includes('CB') || pos.includes('DC') || pos.includes('DÉF')) {
      const idx = slots.findIndex(s => s.roleCode === 'CB' || s.label.includes('DC'));
      if (idx !== -1) return idx;
    }

    // 8. Milieu Défensif
    if (pos.includes('CDM') || pos.includes('MDC')) {
      const idx = slots.findIndex(s => s.roleCode === 'CDM' || s.label.includes('MDC'));
      if (idx !== -1) return idx;
    }

    // 9. Milieu Offensif
    if (pos.includes('CAM') || pos.includes('MOC') || pos.includes('10')) {
      const idx = slots.findIndex(s => s.roleCode === 'CAM' || s.label === 'MOC');
      if (idx !== -1) return idx;
    }

    // 10. Milieu Central
    if (pos.includes('CM') || pos.includes('MC') || pos.includes('MILIEU')) {
      const idx = slots.findIndex(s => s.roleCode === 'CM' || s.label.includes('MC') || s.category === 'MID');
      if (idx !== -1) return idx;
    }

    // Fallbacks par catégorie générique
    if (pos.includes('ATT')) {
      const idx = slots.findIndex(s => s.category === 'ATT');
      if (idx !== -1) return idx;
    }
    if (pos.includes('MID') || pos.includes('MIL')) {
      const idx = slots.findIndex(s => s.category === 'MID');
      if (idx !== -1) return idx;
    }
    if (pos.includes('DEF')) {
      const idx = slots.findIndex(s => s.category === 'DEF');
      if (idx !== -1) return idx;
    }

    // Slot par défaut : milieu
    return Math.floor(slots.length / 2);
  };

  // Regroupement automatique des joueurs par slot tactique
  const playersBySlot = useMemo(() => {
    const map: Record<number, TrialCandidate[]> = {};
    activeFormation.slots.forEach((_, idx) => {
      map[idx] = [];
    });

    categoryCandidates.forEach(cand => {
      const slotIdx = mapCandidateToSlotIndex(cand, activeFormation.slots);
      if (map[slotIdx]) {
        map[slotIdx].push(cand);
      } else {
        map[0]?.push(cand);
      }
    });

    // Si l'option "Meilleur Score par Poste" est active : ne garder que le 1er joueur du slot (celui avec la meilleure dernière note)
    if (onlyBestScorePerPosition) {
      Object.keys(map).forEach(key => {
        const slotIdx = Number(key);
        if (map[slotIdx].length > 1) {
          map[slotIdx] = [map[slotIdx][0]];
        }
      });
    }

    return map;
  }, [categoryCandidates, activeFormation, onlyBestScorePerPosition]);

  // Nombre total de joueurs effectivement affichés sur le terrain
  const positionedPlayersCount = useMemo(() => {
    return Object.values(playersBySlot).reduce((sum, list) => sum + list.length, 0);
  }, [playersBySlot]);

  // Décompte des candidats par catégorie d'âge pour les badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach(c => {
      const cat = c.age_category || 'Inconnue';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [candidates]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── BANDEAU EN-TÊTE FUS ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            Shortlist & Onze Idéal — Placement Automatique par Poste
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 flex-wrap">
            <span>Terrain Tactique Pleine Largeur</span>
            <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              {positionedPlayersCount} joueurs positionnés
            </span>
            {onlyBestScorePerPosition && (
              <span className="text-xs font-black px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                Meilleur Score par Poste (Onze Idéal)
              </span>
            )}
          </h2>
          <p className="text-slate-300 text-xs max-w-3xl">
            {onlyBestScorePerPosition
              ? "Mode Onze Idéal actif : seul le joueur ayant obtenu la meilleure note à sa dernière évaluation est sélectionné pour chaque poste."
              : "Tous les joueurs de la catégorie choisie sont positionnés automatiquement selon leur poste naturel. Les joueurs d'un même poste sont juxtaposés côte à côte. Survolez ou cliquez sur n'importe quel joueur pour afficher son panneau de performance complet."}
          </p>
        </div>

        {/* Sélecteurs de Formation Tactique & Hauteur du Terrain */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Hauteur du Terrain */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
            <span className="text-xs font-bold text-emerald-200 px-2 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Hauteur :
            </span>
            <button
              type="button"
              onClick={() => setPitchHeight('standard')}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-black transition-all",
                pitchHeight === 'standard'
                  ? "bg-white text-slate-900 shadow-md scale-105"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              1180px
            </button>
            <button
              type="button"
              onClick={() => setPitchHeight('tall')}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-black transition-all",
                pitchHeight === 'tall'
                  ? "bg-emerald-400 text-slate-950 shadow-md scale-105"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              ⭐ 1420px (Grande)
            </button>
            <button
              type="button"
              onClick={() => setPitchHeight('extra')}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-black transition-all",
                pitchHeight === 'extra'
                  ? "bg-white text-slate-900 shadow-md scale-105"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              1680px (XXL)
            </button>
          </div>

          {/* Sélecteur de Formation Tactique */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
            <span className="text-xs font-bold text-emerald-300 px-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Système :
            </span>
            {Object.keys(FORMATIONS).map(fmtKey => (
              <button
                key={fmtKey}
                type="button"
                onClick={() => setSelectedFormationKey(fmtKey)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                  selectedFormationKey === fmtKey
                    ? "bg-white text-slate-900 shadow-md scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {fmtKey}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BARRE DE SÉLECTION RAPIDE DE CATÉGORIE & RECHERCHE ──────────── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Sélecteur de Catégories d'Âge */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider mr-1 shrink-0">
            Catégorie :
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              categoryFilter === 'ALL'
                ? "bg-slate-900 text-white shadow-xs font-black"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            )}
          >
            Toutes ({candidates.length})
          </button>
          {RECRUITMENT_AGE_CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                  categoryFilter === cat
                    ? "bg-primary text-white shadow-xs font-black scale-105"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                )}
              >
                <span>{cat}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  categoryFilter === cat ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtre Note Min, Shortlist, Meilleur Score par Poste & Recherche */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end flex-wrap">
          {/* Bouton Filtre : Shortlist Uniquement */}
          <button
            type="button"
            onClick={() => setShortlistOnly(!shortlistOnly)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-xs",
              shortlistOnly
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-emerald-600/25 scale-105"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            )}
            title="Basculer entre l'affichage des talents shortlistés uniquement ou de l'ensemble des candidats"
          >
            <Trophy className={cn("w-3.5 h-3.5", shortlistOnly ? "text-amber-300 fill-amber-300" : "text-slate-500")} />
            <span>Shortlist Uniquement</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              shortlistOnly ? "bg-white/20 text-white font-black" : "bg-slate-200 text-slate-700"
            )}>
              {shortlistedTotalCount}
            </span>
          </button>

          {/* Bouton Filtre : Meilleur Score par Poste (Onze Idéal) */}
          <button
            type="button"
            onClick={() => setOnlyBestScorePerPosition(!onlyBestScorePerPosition)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-xs",
              onlyBestScorePerPosition
                ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/25 scale-105"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80"
            )}
            title="Afficher pour chaque poste tactique le joueur ayant obtenu la meilleure note à sa dernière évaluation"
          >
            <Crown className={cn("w-3.5 h-3.5", onlyBestScorePerPosition ? "text-slate-950 fill-slate-950" : "text-amber-600")} />
            <span>Meilleur Score par Poste (Onze Idéal)</span>
          </button>

          <select
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white"
          >
            <option value={0}>Toutes les notes</option>
            <option value={6.5}>Note ≥ 6.5</option>
            <option value={7.0}>Note ≥ 7.0</option>
            <option value={7.5}>Note ≥ 7.5</option>
            <option value={8.0}>Note ≥ 8.0</option>
          </select>

          <div className="relative w-full md:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher joueur / club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* ── TERRAIN DE FOOTBALL VERTICAL OFFICIEL PLEINE LARGEUR ──────────── */}
      <div className="w-full relative bg-white p-2.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <div 
          className={cn(
            "w-full min-w-[620px] sm:min-w-0 rounded-2xl sm:rounded-3xl relative overflow-hidden bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900 border-4 border-emerald-950 shadow-2xl select-none transition-all duration-300",
            pitchHeightClass
          )}
        >
          {/* Pelouse Réaliste : Bandes de tonte alternées */}
          <div className="absolute inset-0 flex flex-col pointer-events-none opacity-25">
            {[...Array(18)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 w-full",
                  i % 2 === 0 ? "bg-black/15" : "bg-white/10"
                )} 
              />
            ))}
          </div>

          {/* Lignes Blanches Officielles FUS */}
          <div className="absolute inset-3 sm:inset-5 border-2 border-white/75 rounded-2xl pointer-events-none">
            {/* Ligne médiane & Rond Central */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/75 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-52 sm:h-52 border-2 border-white/75 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-xs" />

            {/* Surface de réparation NORD (Adversaire / Attaque) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-36 sm:h-48 border-2 border-t-0 border-white/75 rounded-b-xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-40 h-14 sm:h-20 border-2 border-t-0 border-white/75 rounded-b-lg" />
            <div className="absolute top-26 sm:top-36 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full" />
            {/* Arc de cercle surface Nord */}
            <div className="absolute top-36 sm:top-48 left-1/2 -translate-x-1/2 w-28 h-14 border-2 border-t-0 border-white/75 rounded-b-full" />

            {/* Surface de réparation SUD (FUS / Gardien) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-36 sm:h-48 border-2 border-b-0 border-white/75 rounded-t-xl" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 sm:w-40 h-14 sm:h-20 border-2 border-b-0 border-white/75 rounded-t-lg" />
            <div className="absolute bottom-26 sm:bottom-36 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full" />
            {/* Arc de cercle surface Sud */}
            <div className="absolute bottom-36 sm:bottom-48 left-1/2 -translate-x-1/2 w-28 h-14 border-2 border-b-0 border-white/75 rounded-t-full" />
          </div>

          {/* ── EMPLACEMENTS TACTIQUES AVEC JUXTAPOSITION DES JOUEURS ── */}
          {activeFormation.slots.map((slot, slotIdx) => {
            const slotPlayers = playersBySlot[slotIdx] || [];

            return (
              <div
                key={slotIdx}
                style={{ top: slot.top, left: slot.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
              >
                {/* Badge du rôle / poste tactique */}
                <div className="mb-1.5 flex items-center gap-1">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-white px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs border border-white/30 shadow-md">
                    {slot.label}
                  </span>
                  {slotPlayers.length > 0 && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 shadow-xs">
                      {slotPlayers.length}
                    </span>
                  )}
                </div>

                {/* S'il n'y a pas de joueur à ce poste dans la catégorie */}
                {slotPlayers.length === 0 ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-white/40 bg-black/25 flex items-center justify-center text-white/50 backdrop-blur-xs">
                    <span className="text-[9px] font-bold uppercase">{slot.roleCode}</span>
                  </div>
                ) : slotPlayers.length > 3 ? (
                  /* Carte Compacte Scoutastic (Shadow Squad) dès que le poste compte plus de 3 joueurs */
                  <ScoutasticDenseSlotCard
                    slotLabel={slot.label}
                    roleCode={slot.roleCode}
                    players={slotPlayers.map(cand => {
                      const ev = playerEvaluationsMap.get(cand.id);
                      return {
                        raw: cand,
                        id: cand.id,
                        shortName: `${cand.first_name[0]}. ${cand.last_name}`,
                        fullName: `${cand.first_name} ${cand.last_name}`,
                        photoUrl: cand.photo_url,
                        initials: `${cand.first_name[0]}${cand.last_name[0]}`.toUpperCase(),
                        rating: ev?.overall_score ?? null,
                        hasEvaluation: !!ev,
                        isTrial: cand.pipeline_stage === 'trial',
                        clubOrTeam: cand.current_club || 'Sans club',
                      };
                    })}
                    onSelectPlayer={(cand) => setInspectedCandidate(cand)}
                  />
                ) : (
                  /* JUXTAPOSITION DES PHOTOS DES JOUEURS CÔTE À CÔTE */
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap max-w-[280px] p-1 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/10">
                    {slotPlayers.map((cand, candIndex) => {
                      const ev = playerEvaluationsMap.get(cand.id);
                      const score = ev?.overall_score;
                      const isTopScoreInSlot = candIndex === 0 && score !== undefined;

                      return (
                        <div
                          key={cand.id}
                          onMouseEnter={() => setHoveredCandidate(cand)}
                          onMouseLeave={() => setHoveredCandidate(null)}
                          onClick={() => setInspectedCandidate(cand)}
                          className="relative flex flex-col items-center group cursor-pointer transition-all hover:scale-110 hover:z-40"
                          title={`Cliquer pour ouvrir le panneau complet de ${cand.first_name} ${cand.last_name}`}
                        >
                          {/* Pastille Joueur Agrandie (Conteneur externe avec badge non cropé) */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                            {/* Couronne dorée pour le meilleur score du poste */}
                            {isTopScoreInSlot && (
                              <span 
                                className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 border-2 border-slate-900 flex items-center justify-center shadow-lg z-20 animate-in zoom-in-75 duration-200"
                                title={`Meilleur score de dernière évaluation à ce poste : ${score}/10`}
                              >
                                <Crown className="w-3 h-3 fill-slate-950 text-slate-950" />
                              </span>
                            )}

                            {/* Cercle Avatar Joueur avec overflow-hidden */}
                            <div className={cn(
                              "w-full h-full rounded-full border-[3px] bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center ring-2 transition-all group-hover:ring-4 group-hover:ring-amber-400/80",
                              isTopScoreInSlot
                                ? "border-amber-400 ring-amber-400/70"
                                : score && score >= 8.0 
                                ? "border-amber-400 ring-amber-400/60" 
                                : "border-white ring-white/30"
                            )}>
                              {cand.photo_url ? (
                                <img src={cand.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-black text-sm sm:text-base text-white uppercase select-none">
                                  {cand.first_name[0]}{cand.last_name[0]}
                                </span>
                              )}
                            </div>

                            {/* Badge Score Global (extérieur à l'overflow-hidden pour être 100% visible et non cropé) */}
                            {score !== undefined && (
                              <span className={cn(
                                "absolute -bottom-1 -right-1 min-w-[26px] h-6 px-1.5 rounded-full text-[10px] sm:text-[11px] font-black shadow-xl border-2 border-slate-950 flex items-center justify-center z-10 select-none whitespace-nowrap",
                                score >= 8.0 
                                  ? "bg-amber-400 text-slate-950" 
                                  : score >= 7.0 
                                  ? "bg-emerald-400 text-slate-950" 
                                  : "bg-slate-700 text-white"
                              )}>
                                {score}
                              </span>
                            )}
                          </div>

                          {/* Nom court du joueur */}
                          <span className="mt-1 text-[10px] sm:text-[11px] font-black text-white px-2 py-0.5 rounded-md bg-black/85 whitespace-nowrap shadow-md border border-white/20 max-w-[100px] truncate">
                            {cand.first_name[0]}. {cand.last_name}
                          </span>

                          {/* ── PETIT PANNEAU FLOTTANT ANCRÉ PRÈS DU JOUEUR SURVOLÉ ── */}
                          {hoveredCandidate?.id === cand.id && !inspectedCandidate && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedCandidate(cand);
                              }}
                              className={cn(
                                "absolute left-1/2 -translate-x-1/2 z-50 w-76 sm:w-84 bg-white p-4 rounded-3xl border-2 border-slate-300 shadow-2xl animate-in zoom-in-95 fade-in duration-150 cursor-pointer pointer-events-auto text-left opacity-100",
                                parseFloat(slot.top) < 45 ? "top-full mt-3" : "bottom-full mb-3"
                              )}
                            >
                              {/* Flèche indicatrice vers le joueur */}
                              <div className={cn(
                                "absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-slate-300 rotate-45",
                                parseFloat(slot.top) < 45 ? "-top-2 border-t-2 border-l-2" : "-bottom-2 border-b-2 border-r-2"
                              )} />

                              {/* En-tête miniature du joueur avec photo */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-slate-200 overflow-hidden flex items-center justify-center font-black text-white shrink-0 shadow-xs">
                                    {cand.photo_url ? (
                                      <img src={cand.photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs">{cand.first_name[0]}{cand.last_name[0]}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-black text-slate-900 truncate">
                                      {cand.first_name} {cand.last_name}
                                    </h5>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                      <span className="font-bold text-primary">{cand.primary_position}</span>
                                      <span>•</span>
                                      <span>{cand.age_category}</span>
                                      <span>•</span>
                                      <span className="truncate">{cand.current_club || 'Sans club'}</span>
                                    </div>
                                  </div>
                                </div>

                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border",
                                  ['shortlisted', 'shortlist'].includes(cand.pipeline_stage)
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-black shadow-2xs"
                                    : ['under_evaluation', 'trial', 'club_trial'].includes(cand.pipeline_stage)
                                      ? "bg-amber-50 text-amber-800 border-amber-300 font-black shadow-2xs"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                )}>
                                  {['shortlisted', 'shortlist'].includes(cand.pipeline_stage)
                                    ? '⭐ SHORTLIST'
                                    : ['under_evaluation', 'trial', 'club_trial'].includes(cand.pipeline_stage)
                                      ? '🟡 TEST CLUB'
                                      : (cand.pipeline_stage?.replace('_', ' ').toUpperCase() || 'PROSPECT')}
                                </span>
                              </div>

                              {ev ? (
                                <div className="pt-2.5 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                                      ⭐ Score : {ev.overall_score}/10
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
                                      {ev.verdict?.replace('_', ' ') || 'SHORTLIST'}
                                    </span>
                                  </div>

                                  {/* 4 Piliers condensés */}
                                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                                    <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                      <span className="text-[8px] text-slate-400 block font-bold">Tech</span>
                                      <strong className="text-blue-600 text-xs font-black">{ev.technical_score}</strong>
                                    </div>
                                    <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                      <span className="text-[8px] text-slate-400 block font-bold">Phys</span>
                                      <strong className="text-amber-600 text-xs font-black">{ev.physical_score}</strong>
                                    </div>
                                    <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                      <span className="text-[8px] text-slate-400 block font-bold">Tact</span>
                                      <strong className="text-emerald-600 text-xs font-black">{ev.tactical_score}</strong>
                                    </div>
                                    <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                      <span className="text-[8px] text-slate-400 block font-bold">Ment</span>
                                      <strong className="text-purple-600 text-xs font-black">{ev.mental_score}</strong>
                                    </div>
                                  </div>

                                  {/* Données clés rapides */}
                                  <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
                                    <span>Pied : <strong className="text-slate-800 font-bold">{cand.preferred_foot}</strong></span>
                                    <span>Scout : <strong className="text-amber-600 font-bold">{cand.discovering_scout_name || 'Cellule FUS'}</strong></span>
                                  </div>

                                  <div className="pt-0.5 text-center">
                                    <span className="text-[10px] font-black text-primary hover:underline block">
                                      👉 Cliquez pour ouvrir le profil Radar & Détails
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic pt-2 text-center">
                                  Évaluation en attente pour ce joueur
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GRAND PANNEAU MODAL DE PERFORMANCE (REPRODUISANT LA PHOTO UTILISATEUR) ── */}
      {inspectedCandidate && (() => {
        const ev = playerEvaluationsMap.get(inspectedCandidate.id);

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 animate-in fade-in duration-200"
            onClick={() => setInspectedCandidate(null)}
          >
            <div 
              className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border-2 border-slate-300 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* EN-TÊTE DU PANNEAU (STYLE PHOTO FOURNIE) */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b-2 border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                  {/* Photo / Avatar avec initiales */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center font-black text-xl text-white shrink-0 shadow-md">
                    {inspectedCandidate.photo_url ? (
                      <img src={inspectedCandidate.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{inspectedCandidate.first_name[0]}{inspectedCandidate.last_name[0]}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {inspectedCandidate.first_name} {inspectedCandidate.last_name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white border border-rose-500">
                        {inspectedCandidate.primary_position}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white border border-blue-500">
                        {inspectedCandidate.age_category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-200 border border-slate-700">
                        {inspectedCandidate.pipeline_stage?.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Club : <strong>{inspectedCandidate.current_club || 'Sans club'}</strong></span>
                      <span>•</span>
                      <span>Nationalité : <strong>Marocaine</strong></span>
                      <span>•</span>
                      <span>Catégorie : <strong>{inspectedCandidate.age_category}</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedCandidate(null)}
                  className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CORPS DU PANNEAU (RADAR & DONNÉES CLÉS) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6 bg-slate-100">
                {!ev ? (
                  <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-dashed p-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold text-slate-800">Aucune évaluation enregistrée pour ce joueur</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Ce joueur n'a pas encore fait l'objet d'une notation détaillée sur les 4 piliers fondamentaux.
                    </p>
                    {onOpenEvaluationForCandidate && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenEvaluationForCandidate(inspectedCandidate);
                          setInspectedCandidate(null);
                        }}
                        className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Créer l'évaluation maintenant</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* COLONNE GAUCHE : RADAR DES 4 PILIERS AVEC ONGLETS */}
                      <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b mb-1">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Profil Radar des 4 Piliers (1–10)
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                              Score : {ev.overall_score}/10
                            </span>
                            {onOpenEvaluationForCandidate && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenEvaluationForCandidate(inspectedCandidate);
                                  setInspectedCandidate(null);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-primary hover:bg-primary/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                              >
                                Évaluer Test
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Composant Radar à 4 Onglets Piliers Dédiés */}
                        <div className="w-full flex items-center justify-center pt-2">
                          <PlayerRadarChart
                            evaluations={[{
                              name: `${inspectedCandidate.first_name} ${inspectedCandidate.last_name}`,
                              color: '#ef4444',
                              eval: ev,
                            }]}
                            height={310}
                            showTabs={true}
                            defaultTab="summary"
                          />
                        </div>
                      </div>

                      {/* COLONNE DROITE : DONNÉES CLÉS & VERDICT */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2 border-b">
                            Données Clés
                          </h4>

                          <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Pied Fort</span>
                              <strong className="text-slate-800">{inspectedCandidate.preferred_foot || 'Droitier'}</strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Morphologie</span>
                              <strong className="text-slate-800">
                                {inspectedCandidate.height_cm ? `${inspectedCandidate.height_cm} cm` : '-'} / {inspectedCandidate.weight_kg ? `${inspectedCandidate.weight_kg} kg` : '-'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Scout Découvreur</span>
                              <strong className="text-amber-600">
                                {inspectedCandidate.discovering_scout_name || 'Cellule FUS'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Recruteur Référent</span>
                              <strong className="text-amber-600">
                                {inspectedCandidate.recruiter_name || 'Staff Technique'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Priorité Recommandation</span>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                {inspectedCandidate.recommendation_priority || 'HIGH'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badge Verdict Recruteur (Exactement comme sur la photo) */}
                        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 shadow-2xs">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">
                              Verdict Recruteur
                            </span>
                            <span className="text-sm font-black uppercase tracking-tight">
                              {ev.verdict?.replace('_', ' ') || 'SHORTLIST'}
                            </span>
                          </div>
                        </div>

                        {/* Synthèse Scout si disponible */}
                        {ev.strengths && (
                          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs space-y-1">
                            <span className="font-bold text-slate-700 block">Points Forts Remarqués :</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">{ev.strengths}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION BASSE : LES 4 SCORES PILIERS (STYLE EXACT PHOTO UTILISATEUR) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">⚽ Technique (30%)</span>
                        <span className="text-xl font-black text-slate-900">{ev.technical_score}/10</span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">🏃 Physique (25%)</span>
                        <span className="text-xl font-black text-slate-900">{ev.physical_score}/10</span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">🧭 Tactique (25%)</span>
                        <span className="text-xl font-black text-slate-900">{ev.tactical_score}/10</span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">🧠 Mental (20%)</span>
                        <span className="text-xl font-black text-slate-900">{ev.mental_score}/10</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* PIED DE PAGE DU MODAL */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCandidateDetail(inspectedCandidate);
                    setInspectedCandidate(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ouvrir Fiche Complète du Joueur</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectedCandidate(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ShortlistPitchView;
