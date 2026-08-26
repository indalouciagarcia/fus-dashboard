import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Calendar, Swords, Plus, Search, Filter,
  Sparkles, Award, Shield, Footprints, ChevronRight,
  TrendingUp, Trash2, Edit3, CheckCircle2, Clock, AlertCircle,
  Eye, FileText, UserCheck, LayoutList, Kanban, HeartHandshake
} from 'lucide-react';
import { useRecruitment } from './hooks/useRecruitment';
import type {
  TrialCandidate,
  CandidateEvaluation,
  PlayerTest,
  Scout,
  ScoutObservation
} from './types/recruitment';

// Subcomponents
import CandidateModal from './components/CandidateModal';
import EvaluationModal from './components/EvaluationModal';
import TrialSessionModal from './components/TrialSessionModal';
import ObservationModal from './components/ObservationModal';
import CandidateDetailModal from './components/CandidateDetailModal';
import RecruitmentPipelineKanban from './components/RecruitmentPipelineKanban';
import ScoutManagementView from './components/ScoutManagementView';
import RadarComparisonView from './components/RadarComparisonView';
import PlayerRadarChart from './components/PlayerRadarChart';
import { cn } from '../../lib/utils';

export const RecruitmentPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kanban';

  const {
    scouts,
    candidates,
    isLoadingCandidates,
    tests,
    isLoadingTests,
    evaluations,
    isLoadingEvaluations,
    observations,
    timeline,
    createScout,
    updateScout,
    deleteScout,
    createCandidate,
    updateCandidate,
    updatePipelineStage,
    deleteCandidate,
    createTest,
    saveEvaluation,
    createObservation,
  } = useRecruitment();

  // Modals state
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<TrialCandidate | null>(null);

  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluatingCandidate, setEvaluatingCandidate] = useState<TrialCandidate | null>(null);

  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observingCandidate, setObservingCandidate] = useState<TrialCandidate | null>(null);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const [detailCandidate, setDetailCandidate] = useState<TrialCandidate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // KPIs
  const totalProspects = candidates.length;
  const inEvaluationCount = candidates.filter(c => ['test_scheduled', 'test_completed', 'under_evaluation'].includes(c.pipeline_stage)).length;
  const signedCount = candidates.filter(c => ['signed', 'academy', 'shortlisted'].includes(c.pipeline_stage)).length;
  const activeScoutsCount = scouts.filter(s => s.status === 'active').length;

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.current_club && c.current_club.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.primary_position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPosition = positionFilter === 'ALL' || c.primary_position.includes(positionFilter);
    const matchesStatus = statusFilter === 'ALL' || c.pipeline_stage === statusFilter;

    return matchesSearch && matchesPosition && matchesStatus;
  });

  const openCandidateDetail = (candidate: TrialCandidate) => {
    setDetailCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Cellule Détection & Recrutement Professionnel
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Scouting, Pipeline & Évaluations 4 Piliers
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Plateforme complète de prospection : gestion des scouts, pipeline Kanban 9 étapes, grille d'évaluation 1–10 par poste et comparateur radar.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setEditingCandidate(null);
              setIsCandidateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau Joueur
          </button>

          <button
            onClick={() => setIsSessionModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all border border-white/10 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Planifier Test
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Talents Prospectés</p>
            <p className="text-2xl font-black text-foreground">{totalProspects}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">En Évaluation / Tests</p>
            <p className="text-2xl font-black text-foreground">{inEvaluationCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Signés / Académie</p>
            <p className="text-2xl font-black text-foreground">{signedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Scouts Actifs</p>
            <p className="text-2xl font-black text-foreground">{activeScoutsCount}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 border shadow-sm flex flex-wrap gap-2">
        {[
          { id: 'kanban', label: 'Pipeline Kanban (9 Étapes)', icon: Kanban, count: candidates.length },
          { id: 'candidates', label: 'Fiches Joueurs & Tuteurs', icon: Users, count: candidates.length },
          { id: 'scouts', label: 'Cellule Scouts & Dashboards', icon: UserCheck, count: scouts.length },
          { id: 'observations', label: 'Rapports d\'Observation', icon: FileText, count: observations.length },
          { id: 'sessions', label: 'Planning des Tests', icon: Calendar, count: tests.length },
          { id: 'evaluations', label: 'Évaluations (1–10) & Radars', icon: Award, count: evaluations.length },
          { id: 'compare', label: 'Comparateur Radar', icon: Swords, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px]",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1 : PIPELINE KANBAN */}
      {activeTab === 'kanban' && (
        <RecruitmentPipelineKanban
          candidates={candidates}
          evaluations={evaluations}
          onUpdateStage={async (id, stage) => {
            await updatePipelineStage({ id, stage });
          }}
          onOpenCandidateDetail={(c) => openCandidateDetail(c)}
          onOpenEvaluation={(c) => {
            setEvaluatingCandidate(c);
            setIsEvaluationModalOpen(true);
          }}
        />
      )}

      {/* TAB 2 : CANDIDATS & TUTEURS (LISTE) */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher joueur, club, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="ALL">Toutes les Étapes Pipeline</option>
                <option value="prospect">Prospect</option>
                <option value="scouted">Observé</option>
                <option value="recommended">Recommandé</option>
                <option value="screening">Présélection</option>
                <option value="test_scheduled">Test Planifié</option>
                <option value="under_evaluation">En Évaluation</option>
                <option value="shortlisted">Shortlisté</option>
                <option value="signed">Signé / Académie</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCandidates.map((c) => {
              const evalData = evaluations.find(e => e.candidate_id === c.id);

              return (
                <div key={c.id} className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-base shrink-0">
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <div>
                          <h3
                            onClick={() => openCandidateDetail(c)}
                            className="font-bold text-sm text-foreground hover:text-primary cursor-pointer transition-colors"
                          >
                            {c.first_name} {c.last_name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {c.primary_position} • {c.age_category || 'U19'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border">
                        {c.pipeline_stage.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Morphologie & Club */}
                    <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-slate-50 border text-center text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Pied</span>
                        <span className="font-bold">{c.preferred_foot}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Taille / Poids</span>
                        <span className="font-bold">{c.height_cm ? `${c.height_cm}cm` : '-'} / {c.weight_kg ? `${c.weight_kg}kg` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Nationalité</span>
                        <span className="font-bold">{c.nationality}</span>
                      </div>
                    </div>

                    {c.current_club && (
                      <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 font-medium">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        Club : <span className="font-bold text-slate-800">{c.current_club}</span>
                      </p>
                    )}

                    {/* Tuteur info if available */}
                    {c.guardian_name && (
                      <p className="text-[11px] text-amber-800 mt-1 flex items-center gap-1.5 font-medium">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                        Tuteur : {c.guardian_name} ({c.guardian_relationship || 'Père'})
                      </p>
                    )}
                  </div>

                  {/* Score Evaluation */}
                  {evalData ? (
                    <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-red-950 block">Score 4 Piliers</span>
                        <span className="text-lg font-black text-primary">{evalData.overall_score}/10</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Verdict</span>
                        <span className="text-xs font-bold text-slate-800 uppercase">{evalData.verdict.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                      Non encore évalué sur 4 piliers
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <button
                      onClick={() => openCandidateDetail(c)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      Dossier Complet
                    </button>

                    <button
                      onClick={() => {
                        setObservingCandidate(c);
                        setIsObservationModalOpen(true);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Ajouter Rapport d'Observation"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingCandidate(c);
                        setIsCandidateModalOpen(true);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Modifier la fiche"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la fiche de ${c.first_name} ${c.last_name} ?`)) {
                          deleteCandidate(c.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3 : GESTION DES SCOUTS */}
      {activeTab === 'scouts' && (
        <ScoutManagementView
          scouts={scouts}
          candidates={candidates}
          evaluations={evaluations}
          onCreateScout={createScout}
          onUpdateScout={updateScout}
          onDeleteScout={deleteScout}
        />
      )}

      {/* TAB 4 : RAPPORTS D'OBSERVATION */}
      {activeTab === 'observations' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Rapports d'Observation Match de Terrain</h2>
              <p className="text-xs text-muted-foreground">Comptes-rendus de détection enregistrés par les scouts.</p>
            </div>
            <button
              onClick={() => {
                setObservingCandidate(candidates[0] || null);
                setIsObservationModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau Rapport
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {observations.map((obs) => {
              const candidate = candidates.find(c => c.id === obs.candidate_id);

              return (
                <div key={obs.id} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {obs.competition_name || 'Match Observé'}
                      </span>
                      <h3 className="text-base font-bold text-foreground mt-1">
                        {candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Joueur'}
                      </h3>
                      <p className="text-xs text-muted-foreground">{obs.match_name || 'Observation de jeu'} • {obs.location || 'Stade'}</p>
                    </div>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                      Potentiel : {obs.potential_rating}/10
                    </span>
                  </div>

                  {obs.general_impression && (
                    <p className="text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 italic">
                      « {obs.general_impression} »
                    </p>
                  )}

                  <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
                    <span>Scout : <strong className="text-slate-800">{obs.scout_name}</strong></span>
                    <span>{obs.observation_date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5 : PLANNING DES TESTS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-foreground">Calendrier & Sessions de Tests / Détection</h2>
              <p className="text-xs text-muted-foreground">Planifiez les essais et convocations de joueurs.</p>
            </div>
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Planifier une Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {test.age_category} • {test.test_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-1">{test.test_name}</h3>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold",
                    test.status === 'scheduled' ? "bg-blue-50 text-blue-700" :
                    test.status === 'completed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {test.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {test.test_date} {test.start_time && `(${test.start_time} - ${test.end_time || ''})`}
                  </p>
                  <p className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Lieu : {test.location} • {test.training_ground || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6 : ÉVALUATIONS (1–10) */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                Joueurs Évalués ({evaluations.length})
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {evaluations.map((ev) => {
                  const candidate = candidates.find(c => c.id === ev.candidate_id);
                  const isSelected = detailCandidate?.id === ev.candidate_id;

                  return (
                    <button
                      key={ev.id}
                      onClick={() => setDetailCandidate(candidate || null)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-slate-50/50 hover:bg-slate-100 border-slate-200 text-slate-800"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold">{candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Joueur'}</p>
                        <p className="text-[10px] text-muted-foreground">{candidate?.primary_position} • {candidate?.current_club || 'Sans club'}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-primary block">{ev.overall_score}/10</span>
                        <span className="text-[9px] uppercase font-bold text-slate-500">{ev.verdict.replace('_', ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border shadow-sm">
              {(() => {
                const targetCandidate = detailCandidate || (candidates.find(c => evaluations.some(e => e.candidate_id === c.id)) || candidates[0]);
                const targetEval = evaluations.find(e => e.candidate_id === targetCandidate?.id);

                if (!targetCandidate || !targetEval) {
                  return (
                    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                      Sélectionnez un joueur évalué pour afficher sa fiche radar.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {targetCandidate.first_name} {targetCandidate.last_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Poste : {targetCandidate.primary_position} • Évaluateur : {targetEval.evaluator_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Score Pondéré</span>
                        <span className="text-3xl font-black text-primary">{targetEval.overall_score}/10</span>
                      </div>
                    </div>

                    <PlayerRadarChart
                      evaluations={[{
                        name: `${targetCandidate.first_name} ${targetCandidate.last_name}`,
                        color: '#ef4444',
                        eval: targetEval,
                      }]}
                      detailed={false}
                      height={300}
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t">
                      <div className="p-2.5 bg-slate-50 rounded-xl border text-center">
                        <span className="text-[10px] text-muted-foreground block font-bold">⚽ Technique (30%)</span>
                        <span className="text-sm font-black text-slate-800">{targetEval.technical_score}/10</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border text-center">
                        <span className="text-[10px] text-muted-foreground block font-bold">🏃 Physique (25%)</span>
                        <span className="text-sm font-black text-slate-800">{targetEval.physical_score}/10</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border text-center">
                        <span className="text-[10px] text-muted-foreground block font-bold">🧭 Tactique (25%)</span>
                        <span className="text-sm font-black text-slate-800">{targetEval.tactical_score}/10</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border text-center">
                        <span className="text-[10px] text-muted-foreground block font-bold">🧠 Mental (20%)</span>
                        <span className="text-sm font-black text-slate-800">{targetEval.mental_score}/10</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7 : COMPARATEUR RADAR */}
      {activeTab === 'compare' && (
        <RadarComparisonView
          candidates={candidates}
          evaluations={evaluations}
        />
      )}

      {/* MODALS */}
      {isCandidateModalOpen && (
        <CandidateModal
          isOpen={isCandidateModalOpen}
          onClose={() => {
            setIsCandidateModalOpen(false);
            setEditingCandidate(null);
          }}
          candidate={editingCandidate}
          scouts={scouts}
          onSave={async (data) => {
            if (editingCandidate) {
              await updateCandidate({ id: editingCandidate.id, updates: data });
            } else {
              await createCandidate(data);
            }
          }}
        />
      )}

      {isEvaluationModalOpen && evaluatingCandidate && (
        <EvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={() => {
            setIsEvaluationModalOpen(false);
            setEvaluatingCandidate(null);
          }}
          candidate={evaluatingCandidate}
          existingEvaluation={evaluations.find(e => e.candidate_id === evaluatingCandidate.id)}
          onSave={async (evalData) => {
            await saveEvaluation(evalData);
          }}
        />
      )}

      {isObservationModalOpen && observingCandidate && (
        <ObservationModal
          isOpen={isObservationModalOpen}
          onClose={() => {
            setIsObservationModalOpen(false);
            setObservingCandidate(null);
          }}
          candidate={observingCandidate}
          scouts={scouts}
          onSave={async (obsData) => {
            await createObservation(obsData);
          }}
        />
      )}

      {isSessionModalOpen && (
        <TrialSessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          candidates={candidates}
          scouts={scouts}
          onSave={async (testData) => {
            await createTest(testData);
          }}
        />
      )}

      {isDetailModalOpen && detailCandidate && (
        <CandidateDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailCandidate(null);
          }}
          candidate={detailCandidate}
          evaluations={evaluations}
          observations={observations}
          tests={tests}
          timeline={timeline}
          onOpenEvaluation={() => {
            setIsDetailModalOpen(false);
            setEvaluatingCandidate(detailCandidate);
            setIsEvaluationModalOpen(true);
          }}
          onOpenObservation={() => {
            setIsDetailModalOpen(false);
            setObservingCandidate(detailCandidate);
            setIsObservationModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
export default RecruitmentPage;
