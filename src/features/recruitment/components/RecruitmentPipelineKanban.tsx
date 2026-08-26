import React, { useState } from 'react';
import type { TrialCandidate, CandidateEvaluation, PipelineStage } from '../types/recruitment';
import {
  Sparkles, Award, User, ChevronRight, ChevronLeft,
  Calendar, Shield, AlertCircle, CheckCircle2, Clock, Swords
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RecruitmentPipelineKanbanProps {
  candidates: TrialCandidate[];
  evaluations: CandidateEvaluation[];
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
  { id: 'test_scheduled', label: '5. Test Planifié', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', headerColor: 'border-amber-500' },
  { id: 'test_completed', label: '6. Test Réalisé', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', headerColor: 'border-blue-500' },
  { id: 'under_evaluation', label: '7. En Évaluation', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', headerColor: 'border-orange-500' },
  { id: 'shortlisted', label: '8. Shortlistés', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', headerColor: 'border-emerald-500' },
  { id: 'signed', label: '9. Décision & Signés', badgeColor: 'bg-red-50 text-primary border-red-200', headerColor: 'border-primary' },
];

export const RecruitmentPipelineKanban: React.FC<RecruitmentPipelineKanbanProps> = ({
  candidates,
  evaluations,
  onUpdateStage,
  onOpenCandidateDetail,
  onOpenEvaluation,
}) => {
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const getCandidatesForColumn = (columnId: PipelineStage) => {
    return candidates.filter(c => {
      // Map signed / academy / rejected / final_decision to column 9 if selected
      let stageMatch = c.pipeline_stage === columnId;
      if (columnId === 'signed') {
        stageMatch = ['signed', 'final_decision', 'academy', 'rejected'].includes(c.pipeline_stage);
      }

      const matchesSearch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.origin_club && c.origin_club.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPosition = filterPosition === 'ALL' || c.primary_position.includes(filterPosition);

      return stageMatch && matchesSearch && matchesPosition;
    });
  };

  const moveCandidate = async (candidate: TrialCandidate, direction: 'next' | 'prev') => {
    const stageOrder: PipelineStage[] = [
      'prospect', 'scouted', 'recommended', 'screening',
      'test_scheduled', 'test_completed', 'under_evaluation',
      'shortlisted', 'signed'
    ];

    const currentIndex = stageOrder.indexOf(candidate.pipeline_stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < stageOrder.length) {
      await onUpdateStage(candidate.id, stageOrder[nextIndex]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline de Détection :</span>
          <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {candidates.length} Talents en cours de suivi
          </span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Filtrer joueur ou club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-48"
          />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tous Postes</option>
            <option value="Gardien">Gardiens</option>
            <option value="Défenseur">Défenseurs</option>
            <option value="Milieu">Milieux</option>
            <option value="Ailier">Ailiers</option>
            <option value="Attaquant">Attaquants</option>
          </select>
        </div>
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
                            className="cursor-pointer flex-1"
                          >
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {c.first_name} {c.last_name}
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {c.primary_position} • {c.age_category || 'U19'}
                            </p>
                          </div>

                          {evalData?.overall_score && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary font-black text-xs shrink-0">
                              {evalData.overall_score}/10
                            </span>
                          )}
                        </div>

                        {/* Club & Scout Info */}
                        <div className="text-[10px] text-slate-600 space-y-0.5">
                          <p className="truncate flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-400" />
                            Club : <span className="font-semibold">{c.current_club || 'Sans club'}</span>
                          </p>
                          {c.discovering_scout_name && (
                            <p className="truncate flex items-center gap-1 text-slate-500">
                              <User className="w-3 h-3 text-slate-400" />
                              Scout : {c.discovering_scout_name}
                            </p>
                          )}
                        </div>

                        {/* Quick Action Buttons & Pipeline Mover */}
                        <div className="pt-2 border-t flex items-center justify-between gap-1">
                          <button
                            type="button"
                            disabled={colIdx === 0}
                            onClick={() => moveCandidate(c, 'prev')}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Étape précédente"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEvaluation(c)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1"
                          >
                            <Award className="w-3 h-3 text-primary" />
                            {evalData ? 'Évalué' : 'Évaluer'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCandidateDetail(c)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                          >
                            Fiche
                          </button>

                          <button
                            type="button"
                            disabled={colIdx === COLUMNS.length - 1}
                            onClick={() => moveCandidate(c, 'next')}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Étape suivante"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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
