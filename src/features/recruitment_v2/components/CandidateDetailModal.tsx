import React, { useState } from 'react';
import type {
  TrialCandidate,
  CandidateEvaluation,
  ScoutObservation,
  PlayerTest,
  RecruitmentTimelineEvent
} from '../types/recruitment';
import PlayerRadarChart from './PlayerRadarChart';
import {
  X, User, Shield, Calendar, Award, Sparkles, Phone, Mail,
  HeartHandshake, Clock, MapPin, CheckCircle2, AlertCircle, FileText, Briefcase, Building2,
  ShieldCheck, ShieldAlert, UserCheck, Zap, Star, XCircle, RotateCcw, TrendingUp, TrendingDown, Edit3,
  Video, Play, ExternalLink, Lock
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { recruitmentService } from '../services/recruitmentService';
import { toast } from 'sonner';
import { useClubData } from '../../../hooks/useClubData';
import type { Club } from '../../../types';
import { OpponentClubFormModal } from '../../club-management/components/OpponentClubFormModal';

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: TrialCandidate;
  evaluations: CandidateEvaluation[];
  observations: ScoutObservation[];
  tests: PlayerTest[];
  timeline: RecruitmentTimelineEvent[];
  onUpdateStatus: (id: string, status: TrialCandidate['status']) => void;
  onOpenEvaluation: (options?: { mode?: 'create' | 'reevaluate' | 'edit'; testId?: string }) => void;
  onOpenObservation: () => void;
  onScheduleTest?: (candidate: TrialCandidate) => void;
  onRefresh?: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  isOpen,
  onClose,
  candidate,
  evaluations,
  observations,
  tests,
  timeline,
  onUpdateStatus,
  onOpenEvaluation,
  onOpenObservation,
  onScheduleTest,
  onRefresh,
}) => {
  const { opponentClubs = [] } = useClubData();
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'sport' | 'observations' | 'tests' | 'timeline'>('overview');
  const [isOpponentModalOpen, setIsOpponentModalOpen] = useState(false);
  const [selectedOpponentClub, setSelectedOpponentClub] = useState<Club | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('en-CA');
  const candidateEvals = evaluations.filter(e => e.candidate_id === candidate.id);
  const latestEval = candidateEvals[0];
  const candidateObs = observations.filter(o => o.candidate_id === candidate.id);
  const candidateTests = tests.filter(t => t.candidate_id === candidate.id);
  const candidateTimeline = timeline.filter(t => t.candidate_id === candidate.id);

  // Filtrage des tests selon la date pour verrouillage d'évaluation
  const eligibleTests = candidateTests.filter(t => t.test_date <= todayStr);
  const futureTests = candidateTests.filter(t => t.test_date > todayStr);
  const firstEligibleTest = eligibleTests[0];
  const nextFutureTest = futureTests[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 opacity-100">
        {/* Header Profil */}
        <div className="p-6 border-b bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center text-xl font-black border border-white/20 overflow-hidden shrink-0 shadow-sm">
              {candidate.photo_url ? (
                <img
                  src={candidate.photo_url}
                  alt={`${candidate.first_name} ${candidate.last_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                `${candidate.first_name[0]}${candidate.last_name[0]}`
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{candidate.first_name} {candidate.last_name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-white">
                  {candidate.primary_position}
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {candidate.age_category || 'U19'}
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/20 text-white">
                  {candidate.pipeline_stage.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Club : {candidate.current_club || 'Sans club'} • Nationalité : {candidate.nationality} • Catégorie : {candidate.age_category || 'U19'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-white px-6 overflow-x-auto gap-2 py-2.5">
          {[
            { id: 'overview', label: 'Vue d\'Ensemble & Radar', icon: Sparkles },
            { id: 'evaluations', label: `Évaluations & Suivi (${candidateEvals.length})`, icon: Award },
            { id: 'personal', label: 'État Civil & Tuteur', icon: User },
            { id: 'sport', label: 'Profil Sportif & Stats', icon: Shield },
            { id: 'observations', label: `Observations Scout (${candidateObs.length})`, icon: FileText },
            { id: 'tests', label: `Tests & Essais (${candidateTests.length})`, icon: Calendar },
            { id: 'timeline', label: `Timeline (${candidateTimeline.length})`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* TAB 1 : OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Radar Chart */}
                <div className="md:col-span-7 bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Profil Radar des 4 Piliers (1–10)</h4>
                    {latestEval ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Score : {latestEval.overall_score}/10
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenEvaluation({ mode: 'create' })}
                          className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Nouvelle session d'évaluation scout"
                        >
                          <Award className="w-3 h-3" />
                          Évaluer
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEvaluation({ mode: 'edit', testId: latestEval.test_id })}
                          className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier l'évaluation existante"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenEvaluation({ mode: 'create' })}
                        className="px-3 py-1 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Évaluer ce Joueur</span>
                      </button>
                    )}
                  </div>

                  {latestEval ? (
                    <div className="w-full">
                      <PlayerRadarChart
                        evaluations={[{
                          name: `${candidate.first_name} ${candidate.last_name}`,
                          color: '#ef4444',
                          eval: latestEval,
                        }]}
                        detailed={false}
                        height={280}
                      />

                      {candidateEvals.length > 1 && (() => {
                        const first = candidateEvals[candidateEvals.length - 1];
                        const diff = Math.round((latestEval.overall_score - first.overall_score) * 10) / 10;
                        return (
                          <div className="w-full mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] flex items-center justify-between">
                            <span className="text-slate-600 font-medium">
                              {candidateEvals.length} évaluations enregistrées
                            </span>
                            <span className={cn(
                              "font-black px-2 py-0.5 rounded-md flex items-center gap-1",
                              diff > 0 ? "bg-emerald-100 text-emerald-800" : diff < 0 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                            )}>
                              {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                              Évolution globale : {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} pt
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Aucune évaluation 4 piliers enregistrée pour ce joueur.</p>
                      <button
                        onClick={() => onOpenEvaluation({ mode: 'create' })}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90"
                      >
                        Créer une Évaluation
                      </button>
                    </div>
                  )}
                </div>

                {/* KPI Summary Card */}
                <div className="md:col-span-5 space-y-3">
                  <div className="p-4 rounded-2xl bg-white border shadow-sm space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Données Clés</h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Pied Fort</span>
                        <span className="font-bold text-slate-900">{candidate.preferred_foot}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Morphologie</span>
                        <span className="font-bold text-slate-900">
                          {candidate.height_cm ? `${candidate.height_cm} cm` : '-'} / {candidate.weight_kg ? `${candidate.weight_kg} kg` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-500" /> Scout Découvreur
                        </span>
                        <span className="font-bold text-slate-900">{latestEval?.evaluator_name || candidate.discovering_scout_name || 'Cellule FUS'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-amber-600" /> Recruteur Référent
                        </span>
                        <span className="font-bold text-amber-700">{candidate.recruiter_name || 'Direction Recrutement'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Priorité Recommandation</span>
                        <span className="font-bold text-primary uppercase text-[10px]">{candidate.recommendation_priority || 'Normale'}</span>
                      </div>
                    </div>
                  </div>

                  {latestEval && (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-700" /> Verdict Recruteur : {latestEval.verdict.replace('_', ' ').toUpperCase()}
                      </p>
                      {latestEval.strengths && (
                        <p className="text-[11px] text-emerald-800">« {latestEval.strengths} »</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Piliers Cards */}
              {latestEval && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border text-center">
                    <span className="text-[10px] text-muted-foreground font-bold block">⚽ Technique (30%)</span>
                    <span className="text-xl font-black text-slate-900">{latestEval.technical_score}/10</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border text-center">
                    <span className="text-[10px] text-muted-foreground font-bold block">🏃 Physique (25%)</span>
                    <span className="text-xl font-black text-slate-900">{latestEval.physical_score}/10</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border text-center">
                    <span className="text-[10px] text-muted-foreground font-bold block">🧭 Tactique (25%)</span>
                    <span className="text-xl font-black text-slate-900">{latestEval.tactical_score}/10</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border text-center">
                    <span className="text-[10px] text-muted-foreground font-bold block">🧠 Mental (20%)</span>
                    <span className="text-xl font-black text-slate-900">{latestEval.mental_score}/10</span>
                  </div>
                </div>
              )}

              {/* Vidéo de Détection (YouTube ou Google Drive) */}
              {candidate.video_url && (() => {
                const isYouTube = candidate.video_type === 'youtube' || candidate.video_url.includes('youtu');
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = candidate.video_url.match(regExp);
                const ytId = (match && match[2].length === 11) ? match[2] : null;

                return (
                  <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md",
                          isYouTube ? "bg-red-600" : "bg-emerald-600"
                        )}>
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Vidéo Highlights & Détection
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {isYouTube ? 'Lecteur Vidéo YouTube' : 'Document Google Drive'}
                          </span>
                        </div>
                      </div>

                      <a
                        href={candidate.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ouvrir le lien
                      </a>
                    </div>

                    {isYouTube && ytId ? (
                      <div className="rounded-2xl overflow-hidden aspect-video w-full bg-black border border-white/10 shadow-2xl">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title="Vidéo Highlights du Joueur"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200">Fichier Vidéo sur Google Drive</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-md font-mono">{candidate.video_url}</p>
                        </div>
                        <a
                          href={candidate.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Visionner sur Google Drive
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB : ÉVALUATIONS & SUIVI DANS LE TEMPS */}
          {activeTab === 'evaluations' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-primary" /> Historique des Évaluations & Suivi ({candidateEvals.length})
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Historique chronologique de toutes les sessions d'évaluation et de réévaluation du joueur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenEvaluation({ mode: 'create' })}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Nouvelle Évaluation (Scout)</span>
                </button>
              </div>

              {candidateEvals.length === 0 ? (
                <div className="py-12 px-6 text-center bg-white rounded-2xl border space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">Aucune évaluation enregistrée</h5>
                    <p className="text-muted-foreground text-xs mt-1 max-w-md mx-auto">
                      Saisissez l'évaluation approfondie du joueur selon les 4 piliers adaptés à son poste ({candidate.primary_position}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenEvaluation({ mode: 'create' })}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-bold inline-flex items-center gap-2 text-xs hover:bg-primary/90 shadow-sm cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Saisir l'Évaluation Approfondie</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidateEvals.map((ev, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={ev.id} className="p-4 rounded-2xl bg-white border shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                              isLatest ? "bg-primary text-white" : "bg-slate-200 text-slate-700"
                            )}>
                              {isLatest ? 'Dernière Réévaluation' : `Session #${candidateEvals.length - idx}`}
                            </span>
                            <span className="font-bold text-slate-800">{ev.evaluation_date}</span>
                            <span className="text-muted-foreground">• Par {ev.evaluator_name} ({ev.evaluator_role || 'Scout'})</span>
                            {ev.test_id && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                                <Calendar className="w-3 h-3" />
                                Test lié : {ev.test_name || tests.find(t => t.id === ev.test_id)?.test_name || 'Session Planifiée'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primary">{ev.overall_score}/10</span>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border">
                              {ev.verdict.replace('_', ' ')}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenEvaluation({ mode: 'edit' })}
                              className="p-1 rounded-lg border hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors ml-1"
                              title="Modifier cette évaluation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-slate-50 border">
                            <span className="text-[10px] text-muted-foreground block font-semibold">⚽ Technique</span>
                            <span className="font-black text-slate-800">{ev.technical_score}/10</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border">
                            <span className="text-[10px] text-muted-foreground block font-semibold">🏃 Physique</span>
                            <span className="font-black text-slate-800">{ev.physical_score}/10</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border">
                            <span className="text-[10px] text-muted-foreground block font-semibold">🧭 Tactique</span>
                            <span className="font-black text-slate-800">{ev.tactical_score}/10</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border">
                            <span className="text-[10px] text-muted-foreground block font-semibold">🧠 Mental</span>
                            <span className="font-black text-slate-800">{ev.mental_score}/10</span>
                          </div>
                        </div>

                        {ev.strengths && (
                          <p className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border">
                            <strong>Points Forts :</strong> {ev.strengths}
                          </p>
                        )}
                        {ev.weaknesses && (
                          <p className="text-[11px] text-rose-800 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                            <strong>Axes d'Amélioration :</strong> {ev.weaknesses}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2 : ÉTAT CIVIL & TUTEUR */}
          {activeTab === 'personal' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> État Civil & Contact Joueur
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block">Nom & Prénom</span>
                    <span className="font-bold">{candidate.first_name} {candidate.last_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Date & Lieu de Naissance</span>
                    <span className="font-bold">{candidate.birth_date || '-'} {candidate.birth_place ? `(${candidate.birth_place})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Nationalité</span>
                    <span className="font-bold">{candidate.nationality}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Téléphone</span>
                    <span className="font-bold">{candidate.phone || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Email</span>
                    <span className="font-bold">{candidate.email || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              {/* Section Tuteur */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <h4 className="font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-700" /> Tuteur / Représentant Légal (Mineurs)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-amber-800/80 block">Nom du Tuteur</span>
                    <span className="font-bold text-amber-950">{candidate.guardian_name || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-amber-800/80 block">Lien de Parenté</span>
                    <span className="font-bold text-amber-950">{candidate.guardian_relationship || 'Père'}</span>
                  </div>
                  <div>
                    <span className="text-amber-800/80 block text-[11px] mb-1">Statut Consentement</span>
                    {candidate.guardian_consent_status === 'granted' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Accord Accordé
                      </span>
                    ) : candidate.guardian_consent_status === 'refused' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-black text-xs border border-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Refusé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-black text-xs border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> En attente
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-amber-800/80 block">Téléphone Principal</span>
                    <span className="font-bold text-amber-950">{candidate.guardian_phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-amber-800/80 block">Email Tuteur</span>
                    <span className="font-bold text-amber-950">{candidate.guardian_email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-amber-800/80 block">Contact Urgence</span>
                    <span className="font-bold text-amber-950">{candidate.emergency_contact || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 : SPORTIF */}
          {activeTab === 'sport' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" /> Caractéristiques Sportives & Stats en Club
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-muted-foreground block">Club Actuel</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold">{candidate.current_club || '-'}</span>
                      {candidate.current_club && (
                        <button
                          type="button"
                          onClick={() => {
                            const found = opponentClubs.find(c => c.name.toLowerCase() === candidate.current_club?.toLowerCase().trim());
                            setSelectedOpponentClub(found || null);
                            setIsOpponentModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all flex items-center gap-1 shadow-xs"
                          title="Afficher la fiche du club adversaire"
                        >
                          <Building2 className="w-3 h-3" /> Fiche Club
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Clubs Précédents</span>
                    <span className="font-bold">{candidate.previous_clubs || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Matchs / Minutes</span>
                    <span className="font-bold">{candidate.matches_played || 0} matchs ({candidate.minutes_played || 0} min)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Buts & Passes</span>
                    <span className="font-bold">{candidate.goals || 0} buts / {candidate.assists || 0} passes</span>
                  </div>
                </div>

                {candidate.national_selections && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block">Sélections Nationales</span>
                    <span className="font-bold text-slate-900">{candidate.national_selections}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4 : OBSERVATIONS */}
          {activeTab === 'observations' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rapports d'Observation ({candidateObs.length})</h4>
                <button
                  onClick={onOpenObservation}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90"
                >
                  Ajouter un Rapport
                </button>
              </div>

              {candidateObs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground bg-slate-50 rounded-2xl border border-dashed">
                  Aucun rapport d'observation pour ce joueur.
                </div>
              ) : (
                candidateObs.map(obs => (
                  <div key={obs.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{obs.match_name || 'Observation'} • {obs.competition_name}</span>
                      <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Potentiel : {obs.potential_rating}/10
                      </span>
                    </div>
                    <p className="text-muted-foreground">Scout : {obs.scout_name} • Date : {obs.observation_date}</p>
                    {obs.general_impression && <p className="italic text-slate-700">« {obs.general_impression} »</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5 : TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-1">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground">Sessions & Tests de Détection ({candidateTests.length})</h4>
                {onScheduleTest && (
                  <button
                    type="button"
                    onClick={() => onScheduleTest(candidate)}
                    className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Planifier un Test</span>
                  </button>
                )}
              </div>
              {candidateTests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground bg-slate-50 rounded-2xl border border-dashed space-y-3">
                  <p>Aucun test planifié pour le moment pour ce joueur.</p>
                  {onScheduleTest && (
                    <button
                      type="button"
                      onClick={() => onScheduleTest(candidate)}
                      className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Planifier le 1er Test dans l'Agenda
                    </button>
                  )}
                </div>
              ) : (
                candidateTests.map(t => {
                  const linkedEval = candidateEvals.find(e => e.test_id === t.id);
                  return (
                    <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{t.test_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          {t.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground">Date : {t.test_date} à {t.location} ({t.target_team || 'Académie'})</p>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                        {linkedEval ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-850 font-bold text-[11px] flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Évaluation liée : <strong>{linkedEval.overall_score}/10</strong> ({linkedEval.verdict.replace('_', ' ').toUpperCase()})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Non encore évalué pour cette session
                          </span>
                        )}

                        {t.test_date > todayStr ? (
                          <div
                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                            title={`Évaluation impossible avant la date du test (${t.test_date})`}
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Verrouillé ({t.test_date})</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenEvaluation({ mode: linkedEval ? 'edit' : 'create', testId: t.id })}
                            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Award className="w-3 h-3" />
                            {linkedEval ? 'Modifier l\'Évaluation' : 'Évaluer pour ce test'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 6 : TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground">Historique Chronologique de Détection</h4>
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-200">
                {candidateTimeline.map(evt => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
                    <div className="bg-slate-50 p-3 rounded-xl border space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{evt.event_title}</span>
                        <span className="text-[10px] text-muted-foreground">{evt.event_date}</span>
                      </div>
                      <p className="text-muted-foreground">{evt.event_description}</p>
                      {evt.performed_by && <span className="text-[10px] text-primary font-semibold">Par : {evt.performed_by}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Squad Integration Action */}
        <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Statut Pipeline :
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {candidate.pipeline_stage}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await recruitmentService.integrateCandidateToSquad(candidate.id);
                if (res.success) {
                  toast.success(res.message);
                } else {
                  toast.error(res.message);
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>🎓 Intégrer à l'Effectif Officiel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>

      {/* Modal Officiel de Consultation / Modification de Club Adversaire */}
      {isOpponentModalOpen && (
        <OpponentClubFormModal
          isOpen={isOpponentModalOpen}
          onClose={() => {
            setIsOpponentModalOpen(false);
            setSelectedOpponentClub(null);
          }}
          club={selectedOpponentClub}
          initialName={candidate.current_club || ''}
        />
      )}
    </div>
  );
};
export default CandidateDetailModal;
