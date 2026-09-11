import React, { useState } from 'react';
import type { TrialCandidate, CandidateEvaluation, PipelineStage, PlayerTest } from '../types/recruitment';
import {
  Sparkles, Award, User, ChevronRight, ChevronLeft,
  Calendar, Shield, AlertCircle, CheckCircle2, Clock, Swords, Briefcase,
  Loader2, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

interface RecruitmentPipelineKanbanProps {
  candidates: TrialCandidate[];
  evaluations: CandidateEvaluation[];
  tests?: PlayerTest[];
  onUpdateStage: (id: string, stage: PipelineStage) => Promise<any>;
  onOpenCandidateDetail: (candidate: TrialCandidate) => void;
  onOpenEvaluation: (candidate: TrialCandidate) => void;
}

interface ColumnDef {
  id: PipelineStage;
  label: string;
  badgeColor: string;
  headerColor: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'prospect', label: '1. Prospects', badgeColor: 'bg-slate-100 text-slate-700', headerColor: 'border-slate-400' },
  { id: 'scouted', label: '2. Observés', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200', headerColor: 'border-cyan-500' },
  { id: 'recommended', label: '3. Recommandés', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', headerColor: 'border-indigo-500' },
  { id: 'screening', label: '4. Présélection', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', headerColor: 'border-purple-500' },
  { id: 'shortlisted', label: '5. Shortlistés', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', headerColor: 'border-emerald-500' },
  { id: 'test_scheduled', label: '6. Test Planifié', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', headerColor: 'border-amber-500' },
  { id: 'test_completed', label: '7. Test Réalisé', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', headerColor: 'border-blue-500' },
  { id: 'under_evaluation', label: '8. Évaluation Club', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', headerColor: 'border-orange-500' },
  { id: 'signed', label: '9. Décision & Signés', badgeColor: 'bg-green-50 text-green-800 border-green-200', headerColor: 'border-green-600' },
  { id: 'rejected', label: '10. Archives & Sorties', badgeColor: 'bg-amber-50 text-amber-900 border-amber-300', headerColor: 'border-amber-600' },
];

export const RecruitmentPipelineKanban: React.FC<RecruitmentPipelineKanbanProps> = ({
  candidates,
  evaluations,
  tests = [],
  onUpdateStage,
  onOpenCandidateDetail,
  onOpenEvaluation,
}) => {
  const [movingCandidateId, setMovingCandidateId] = useState<string | null>(null);
  const todayStr = new Date().toLocaleDateString('en-CA');

  const getCandidatesForColumn = (columnId: PipelineStage) => {
    return candidates.filter(c => {
      if (columnId === 'signed') {
        return ['signed', 'final_decision', 'academy'].includes(c.pipeline_stage);
      } else if (columnId === 'rejected') {
        return ['rejected', 'archived'].includes(c.pipeline_stage) || c.status === 'rejected';
      }
      return c.pipeline_stage === columnId;
    });
  };

  const handleDirectStageChange = async (candidate: TrialCandidate, newStage: PipelineStage) => {
    if (candidate.pipeline_stage === newStage) return;
    setMovingCandidateId(candidate.id);
    try {
      await onUpdateStage(candidate.id, newStage);
      if (newStage === 'shortlisted') {
        toast.success(`⭐ ${candidate.first_name} ${candidate.last_name} ajouté à la Shortlist & au Onze Idéal !`, { icon: '🏆' });
      } else {
        const stageName = COLUMNS.find(c => c.id === newStage)?.label || newStage;
        toast.success(`${candidate.first_name} ${candidate.last_name} déplacé vers ${stageName}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du changement d'étape");
    } finally {
      setMovingCandidateId(null);
    }
  };

  const moveCandidate = async (candidate: TrialCandidate, direction: 'next' | 'prev') => {
    const stageOrder: PipelineStage[] = [
      'prospect', 'scouted', 'recommended', 'screening',
      'shortlisted',
      'test_scheduled', 'test_completed', 'under_evaluation',
      'signed'
    ];

    const currentIndex = stageOrder.indexOf(candidate.pipeline_stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < stageOrder.length) {
      const targetStage = stageOrder[nextIndex];
      setMovingCandidateId(candidate.id);
      try {
        await onUpdateStage(candidate.id, targetStage);
        if (targetStage === 'shortlisted') {
          toast.success(`⭐ ${candidate.first_name} ${candidate.last_name} ajouté à la Shortlist & au Onze Idéal !`, { icon: '🏆' });
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du déplacement");
      } finally {
        setMovingCandidateId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête synthétique du Kanban */}
      <div className="bg-white rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline de Détection :</span>
          <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {candidates.length} Talents affichés
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Glissez ou transférez les profils directement d'une étape à l'autre.
        </p>
      </div>

      {/* Kanban Horizontal Scrollable Track */}
      <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar min-h-[600px]">
        {COLUMNS.map((col, colIdx) => {
          const colCandidates = getCandidatesForColumn(col.id);

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col max-h-[750px] shadow-sm"
            >
              {/* Column Header */}
              <div className={cn("p-3 border-t-4 border-b bg-white rounded-t-2xl flex items-center justify-between", col.headerColor)}>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">{col.label}</h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", col.badgeColor)}>
                    {colCandidates.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                {colCandidates.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground/60 border border-dashed rounded-xl">
                    Aucun joueur
                  </div>
                ) : (
                  colCandidates.map((c) => {
                    const evalData = evaluations.find(e => e.candidate_id === c.id);

                    return (
                      <div
                        key={c.id}
                        className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-2.5 group"
                      >
                        {/* Player Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => onOpenCandidateDetail(c)}
                            className="cursor-pointer flex-1 flex items-center gap-2 min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden border border-slate-200 shadow-2xs">
                              {c.photo_url ? (
                                <img
                                  src={c.photo_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                `${c.first_name[0]}${c.last_name[0]}`
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                {c.first_name} {c.last_name}
                              </h4>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                  {c.primary_position}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                  {c.age_category || 'U19'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {evalData?.overall_score && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary font-black text-xs shrink-0">
                              {evalData.overall_score}/10
                            </span>
                          )}
                        </div>

                        {/* Club & Scout / Recruiter Info */}
                        <div className="text-[10px] text-slate-600 space-y-0.5">
                          <p className="truncate flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-400 shrink-0" />
                            Club : <span className="font-semibold">{c.current_club || 'Sans club'}</span>
                          </p>
                          {c.discovering_scout_name && (
                            <p className="truncate flex items-center gap-1 text-slate-500">
                              <User className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="font-medium">Scout :</span> {c.discovering_scout_name}
                            </p>
                          )}
                          {c.recruiter_name && (
                            <p className="truncate flex items-center gap-1 text-amber-700">
                              <Briefcase className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-medium">Recruteur :</span> {c.recruiter_name}
                            </p>
                          )}
                        </div>

                        {/* Quick Action Buttons & Direct Stage Mover */}
                        <div className="pt-2 border-t flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={colIdx === 0 || movingCandidateId === c.id}
                                onClick={() => moveCandidate(c, 'prev')}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                                title="Étape précédente"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Sélecteur direct d'étape pour éviter 7 clics successifs */}
                              <div className="relative flex items-center">
                                {movingCandidateId === c.id ? (
                                  <div className="flex items-center gap-1 text-[10px] text-primary font-bold px-2 py-0.5">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Déplacement...</span>
                                  </div>
                                ) : (
                                  <select
                                    value={c.pipeline_stage}
                                    disabled={movingCandidateId === c.id}
                                    onChange={(e) => handleDirectStageChange(c, e.target.value as PipelineStage)}
                                    className="text-[9px] font-black uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer max-w-[110px] truncate transition-colors"
                                    title="Changer directement d'étape"
                                  >
                                    {COLUMNS.map(column => (
                                      <option key={column.id} value={column.id}>
                                        {column.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={colIdx === COLUMNS.length - 1 || movingCandidateId === c.id}
                                onClick={() => moveCandidate(c, 'next')}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                                title="Étape suivante"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenEvaluation(c)}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                                  evalData
                                    ? "bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20"
                                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                )}
                                title={evalData ? `Note globale : ${evalData.overall_score}/10 (Modifier)` : "Saisir l'évaluation approfondie du joueur"}
                              >
                                <Award className="w-3 h-3" />
                                <span>{evalData ? `${evalData.overall_score}/10` : 'Évaluer'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenCandidateDetail(c)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                              >
                                Fiche
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RecruitmentPipelineKanban;
