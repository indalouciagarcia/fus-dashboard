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
  HeartHandshake, Clock, MapPin, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { recruitmentService } from '../services/recruitmentService';
import { toast } from 'sonner';

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: TrialCandidate;
  evaluations: CandidateEvaluation[];
  observations: ScoutObservation[];
  tests: PlayerTest[];
  timeline: RecruitmentTimelineEvent[];
  onOpenEvaluation: () => void;
  onOpenObservation: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  isOpen,
  onClose,
  candidate,
  evaluations,
  observations,
  tests,
  timeline,
  onOpenEvaluation,
  onOpenObservation,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'sport' | 'observations' | 'tests' | 'timeline'>('overview');

  if (!isOpen) return null;

  const candidateEvals = evaluations.filter(e => e.candidate_id === candidate.id);
  const latestEval = candidateEvals[0];
  const candidateObs = observations.filter(o => o.candidate_id === candidate.id);
  const candidateTests = tests.filter(t => t.candidate_id === candidate.id);
  const candidateTimeline = timeline.filter(t => t.candidate_id === candidate.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Profil */}
        <div className="p-6 border-b bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center text-xl font-black border border-white/20">
              {candidate.first_name[0]}{candidate.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{candidate.first_name} {candidate.last_name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-white">
                  {candidate.primary_position}
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/20 text-white">
                  {candidate.pipeline_stage.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Club : {candidate.current_club || 'Sans club'} • Nationalité : {candidate.nationality} • Âge : {candidate.age_category || 'U19'}
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
                    {latestEval && (
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Score Pondéré : {latestEval.overall_score}/10
                      </span>
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
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Aucune évaluation 4 piliers enregistrée pour ce joueur.</p>
                      <button
                        onClick={onOpenEvaluation}
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
                        <span className="text-muted-foreground">Scout Découvreur</span>
                        <span className="font-bold text-slate-900">{candidate.discovering_scout_name || 'Cellule FUS'}</span>
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
                    <span className="text-amber-800/80 block">Statut Consentement</span>
                    <span className="font-bold text-emerald-700">
                      {candidate.guardian_consent_status === 'granted' ? '✅ Accord Accordé' : '⏳ En attente'}
                    </span>
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
                    <span className="font-bold">{candidate.current_club || '-'}</span>
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
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground">Sessions & Tests de Détection ({candidateTests.length})</h4>
              {candidateTests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground bg-slate-50 rounded-2xl border border-dashed">
                  Aucun test planifié pour le moment.
                </div>
              ) : (
                candidateTests.map(t => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{t.test_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground">Date : {t.test_date} à {t.location}</p>
                  </div>
                ))
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
    </div>
  );
};
export default CandidateDetailModal;
