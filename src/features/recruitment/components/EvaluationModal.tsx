import React, { useState, useEffect } from 'react';
import { X, Sparkles, Award, FileText, CheckCircle2, ChevronRight, Sliders, Shield } from 'lucide-react';
import type { TrialCandidate, CandidateEvaluation, EvaluationVerdict } from '../types/recruitment';
import { cn } from '../../../lib/utils';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: TrialCandidate;
  existingEvaluation?: CandidateEvaluation | null;
  onSave: (evaluation: Omit<CandidateEvaluation, 'id' | 'created_at'>) => Promise<void>;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  candidate,
  existingEvaluation,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'phys' | 'tact' | 'ment' | 'position' | 'verdict'>('tech');
  const [evaluatorName, setEvaluatorName] = useState('Hassan Benabicha');
  const [evaluatorRole, setEvaluatorRole] = useState('Directeur du Recrutement');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);

  // Pilier 1 : Technique (1–10)
  const [techBallControl, setTechBallControl] = useState(7.5);
  const [techFirstTouch, setTechFirstTouch] = useState(7.5);
  const [techPassingShort, setTechPassingShort] = useState(7.0);
  const [techPassingLong, setTechPassingLong] = useState(7.0);
  const [techDribbling, setTechDribbling] = useState(7.5);
  const [techCrossing, setTechCrossing] = useState(6.5);
  const [techFinishing, setTechFinishing] = useState(7.0);
  const [techHeading, setTechHeading] = useState(6.5);
  const [tech1v1Attacking, setTech1v1Attacking] = useState(7.5);
  const [tech1v1Defending, setTech1v1Defending] = useState(6.5);
  const [techWeakFoot, setTechWeakFoot] = useState(6.0);

  // Pilier 2 : Physique (1–10)
  const [physAcceleration, setPhysAcceleration] = useState(8.0);
  const [physSprintSpeed, setPhysSprintSpeed] = useState(8.0);
  const [physAgility, setPhysAgility] = useState(7.5);
  const [physBalance, setPhysBalance] = useState(7.5);
  const [physStrength, setPhysStrength] = useState(7.0);
  const [physEndurance, setPhysEndurance] = useState(7.5);
  const [physExplosiveness, setPhysExplosiveness] = useState(7.5);

  // Pilier 3 : Tactique (1–10)
  const [tactPositioning, setTactPositioning] = useState(7.5);
  const [tactAwareness, setTactAwareness] = useState(7.5);
  const [tactDecisionMaking, setTactDecisionMaking] = useState(7.5);
  const [tactAnticipation, setTactAnticipation] = useState(7.5);
  const [tactSpaceAwareness, setTactSpaceAwareness] = useState(7.0);
  const [tactTransition, setTactTransition] = useState(7.5);

  // Pilier 4 : Mental (1–10)
  const [mentConcentration, setMentConcentration] = useState(7.5);
  const [mentDiscipline, setMentDiscipline] = useState(8.0);
  const [mentMotivation, setMentMotivation] = useState(8.5);
  const [mentConfidence, setMentConfidence] = useState(7.5);
  const [mentTeamwork, setMentTeamwork] = useState(8.0);
  const [mentLeadership, setMentLeadership] = useState(7.0);
  const [mentCoachability, setMentCoachability] = useState(8.5);

  // Critères Spécifiques par Poste
  const isGK = candidate.primary_position.toLowerCase().includes('gardien');
  const isDef = candidate.primary_position.toLowerCase().includes('défenseur') || candidate.primary_position.toLowerCase().includes('latéral');
  const isMid = candidate.primary_position.toLowerCase().includes('milieu');
  const isWng = candidate.primary_position.toLowerCase().includes('ailier');

  const [posTrait1Label, setPosTrait1Label] = useState(isGK ? 'Réflexes & Arrêts sur sa ligne' : isDef ? 'Duels Aériens & Tacles' : isMid ? 'Résistance au Pressing' : isWng ? 'Percussion 1v1 & Dribble' : 'Finition Clinique');
  const [posTrait1Score, setPosTrait1Score] = useState(8.0);
  const [posTrait2Label, setPosTrait2Label] = useState(isGK ? 'Sorties Aériennes & 1v1' : isDef ? 'Relance & Vision défensive' : isMid ? 'Passes Progressives & Rupture' : isWng ? 'Qualité de Centre' : 'Instinct de Buteur');
  const [posTrait2Score, setPosTrait2Score] = useState(7.5);
  const [posTrait3Label, setPosTrait3Label] = useState(isGK ? 'Jeu au pied & Relance' : isDef ? 'Couverture & Vitesse de repli' : isMid ? 'Contrôle du Tempo' : isWng ? 'Vitesse de Transition' : 'Jeu Dos au But');
  const [posTrait3Score, setPosTrait3Score] = useState(7.5);

  // Verdict & Synthèse
  const [verdict, setVerdict] = useState<EvaluationVerdict>('shortlist');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingEvaluation) {
      setEvaluatorName(existingEvaluation.evaluator_name);
      setEvaluatorRole(existingEvaluation.evaluator_role || 'Scout');
      setEvaluationDate(existingEvaluation.evaluation_date);

      setTechBallControl(existingEvaluation.tech_ball_control ?? 7.5);
      setTechFirstTouch(existingEvaluation.tech_first_touch ?? 7.5);
      setTechPassingShort(existingEvaluation.tech_passing_short ?? 7.0);
      setTechPassingLong(existingEvaluation.tech_passing_long ?? 7.0);
      setTechDribbling(existingEvaluation.tech_dribbling ?? 7.5);
      setTechCrossing(existingEvaluation.tech_crossing ?? 6.5);
      setTechFinishing(existingEvaluation.tech_finishing ?? 7.0);
      setTechHeading(existingEvaluation.tech_heading ?? 6.5);
      setTech1v1Attacking(existingEvaluation.tech_1v1_attacking ?? 7.5);
      setTech1v1Defending(existingEvaluation.tech_1v1_defending ?? 6.5);
      setTechWeakFoot(existingEvaluation.tech_weak_foot ?? 6.0);

      setPhysAcceleration(existingEvaluation.phys_acceleration ?? 8.0);
      setPhysSprintSpeed(existingEvaluation.phys_sprint_speed ?? 8.0);
      setPhysAgility(existingEvaluation.phys_agility ?? 7.5);
      setPhysBalance(existingEvaluation.phys_balance ?? 7.5);
      setPhysStrength(existingEvaluation.phys_strength ?? 7.0);
      setPhysEndurance(existingEvaluation.phys_endurance ?? 7.5);
      setPhysExplosiveness(existingEvaluation.phys_explosiveness ?? 7.5);

      setTactPositioning(existingEvaluation.tact_positioning ?? 7.5);
      setTactAwareness(existingEvaluation.tact_awareness ?? 7.5);
      setTactDecisionMaking(existingEvaluation.tact_decision_making ?? 7.5);
      setTactAnticipation(existingEvaluation.tact_anticipation ?? 7.5);
      setTactSpaceAwareness(existingEvaluation.tact_space_awareness ?? 7.0);
      setTactTransition(existingEvaluation.tact_transition ?? 7.5);

      setMentConcentration(existingEvaluation.ment_concentration ?? 7.5);
      setMentDiscipline(existingEvaluation.ment_discipline ?? 8.0);
      setMentMotivation(existingEvaluation.ment_motivation ?? 8.5);
      setMentConfidence(existingEvaluation.ment_confidence ?? 7.5);
      setMentTeamwork(existingEvaluation.ment_teamwork ?? 8.0);
      setMentLeadership(existingEvaluation.ment_leadership ?? 7.0);
      setMentCoachability(existingEvaluation.ment_coachability ?? 8.5);

      setVerdict(existingEvaluation.verdict || 'shortlist');
      setStrengths(existingEvaluation.strengths || '');
      setWeaknesses(existingEvaluation.weaknesses || '');
      setComments(existingEvaluation.comments || '');
    }
  }, [existingEvaluation, isOpen]);

  if (!isOpen) return null;

  // Calcul des scores par pilier (1–10)
  const techScore = Math.round(((techBallControl + techFirstTouch + techPassingShort + techPassingLong + techDribbling + techCrossing + techFinishing + techHeading + tech1v1Attacking + tech1v1Defending + techWeakFoot) / 11) * 10) / 10;
  const physScore = Math.round(((physAcceleration + physSprintSpeed + physAgility + physBalance + physStrength + physEndurance + physExplosiveness) / 7) * 10) / 10;
  const tactScore = Math.round(((tactPositioning + tactAwareness + tactDecisionMaking + tactAnticipation + tactSpaceAwareness + tactTransition) / 6) * 10) / 10;
  const mentScore = Math.round(((mentConcentration + mentDiscipline + mentMotivation + mentConfidence + mentTeamwork + mentLeadership + mentCoachability) / 7) * 10) / 10;

  // Formule officielle pondérée : Tech 30%, Phys 25%, Tact 25%, Ment 20%
  const overallScore = Math.round((techScore * 0.30 + physScore * 0.25 + tactScore * 0.25 + mentScore * 0.20) * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        candidate_id: candidate.id,
        evaluator_name: evaluatorName,
        evaluator_role: evaluatorRole,
        evaluation_date: evaluationDate,
        position_evaluated: candidate.primary_position,

        tech_ball_control: techBallControl,
        tech_first_touch: techFirstTouch,
        tech_passing_short: techPassingShort,
        tech_passing_long: techPassingLong,
        tech_dribbling: techDribbling,
        tech_crossing: techCrossing,
        tech_finishing: techFinishing,
        tech_heading: techHeading,
        tech_1v1_attacking: tech1v1Attacking,
        tech_1v1_defending: tech1v1Defending,
        tech_weak_foot: techWeakFoot,
        technical_score: techScore,

        phys_acceleration: physAcceleration,
        phys_sprint_speed: physSprintSpeed,
        phys_agility: physAgility,
        phys_balance: physBalance,
        phys_strength: physStrength,
        phys_endurance: physEndurance,
        phys_explosiveness: physExplosiveness,
        physical_score: physScore,

        tact_positioning: tactPositioning,
        tact_awareness: tactAwareness,
        tact_decision_making: tactDecisionMaking,
        tact_anticipation: tactAnticipation,
        tact_space_awareness: tactSpaceAwareness,
        tact_transition: tactTransition,
        tactical_score: tactScore,

        ment_concentration: mentConcentration,
        ment_discipline: mentDiscipline,
        ment_motivation: mentMotivation,
        ment_confidence: mentConfidence,
        ment_teamwork: mentTeamwork,
        ment_leadership: mentLeadership,
        ment_coachability: mentCoachability,
        mental_score: mentScore,

        pos_specific_1_label: posTrait1Label,
        pos_specific_1_score: posTrait1Score,
        pos_specific_2_label: posTrait2Label,
        pos_specific_2_score: posTrait2Score,
        pos_specific_3_label: posTrait3Label,
        pos_specific_3_score: posTrait3Score,

        overall_score: overallScore,
        verdict,
        strengths: strengths.trim() || undefined,
        weaknesses: weaknesses.trim() || undefined,
        comments: comments.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlider = (label: string, value: number, setter: (v: number) => void) => {
    let scoreBadgeColor = 'bg-slate-100 text-slate-700';
    if (value >= 9) scoreBadgeColor = 'bg-red-50 text-primary font-black';
    else if (value >= 7.5) scoreBadgeColor = 'bg-emerald-50 text-emerald-700 font-bold';
    else if (value >= 6) scoreBadgeColor = 'bg-blue-50 text-blue-700';

    return (
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 hover:border-slate-200 transition-colors">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-800">{label}</span>
          <span className={cn("px-2 py-0.5 rounded-lg text-xs", scoreBadgeColor)}>
            {value.toFixed(1)} <span className="text-[10px] opacity-70">/10</span>
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={value}
          onChange={(e) => setter(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header avec résumé joueur et Note Pondérée */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                Grille d'Évaluation 1–10 : {candidate.first_name} {candidate.last_name}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {candidate.primary_position}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pondération officielle FUS : Technique 30% • Physique 25% • Tactique 25% • Mental 20%
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Score Pondéré</span>
              <span className="text-3xl font-black text-primary">{overallScore}/10</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b bg-white px-6 overflow-x-auto gap-2 py-2.5">
          {[
            { id: 'tech', label: '⚽ Technique (30%)', score: techScore },
            { id: 'phys', label: '🏃 Physique (25%)', score: physScore },
            { id: 'tact', label: '🧭 Tactique (25%)', score: tactScore },
            { id: 'ment', label: '🧠 Mental (20%)', score: mentScore },
            { id: 'position', label: '🎯 Spécifique Poste', score: undefined },
            { id: 'verdict', label: '⚖️ Verdict Final', score: undefined },
          ].map((tab) => (
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
              <span>{tab.label}</span>
              {tab.score !== undefined && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px]",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 font-bold"
                )}>
                  {tab.score}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* TAB 1 : TECHNIQUE */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-foreground">A. Critères Techniques (Barème 1–10)</h4>
                <span className="text-xs font-bold text-primary">Moyenne Pilier : {techScore}/10</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderSlider('Contrôle du ballon', techBallControl, setTechBallControl)}
                {renderSlider('Première touche orientée', techFirstTouch, setTechFirstTouch)}
                {renderSlider('Passes courtes & précision', techPassingShort, setTechPassingShort)}
                {renderSlider('Passes longues & transversales', techPassingLong, setTechPassingLong)}
                {renderSlider('Dribble & conduite de balle', techDribbling, setTechDribbling)}
                {renderSlider('Qualité de centre', techCrossing, setTechCrossing)}
                {renderSlider('Finition & Tir au but', techFinishing, setTechFinishing)}
                {renderSlider('Jeu de tête', techHeading, setTechHeading)}
                {renderSlider('Duel 1v1 offensif', tech1v1Attacking, setTech1v1Attacking)}
                {renderSlider('Duel 1v1 défensif', tech1v1Defending, setTech1v1Defending)}
                {renderSlider('Utilisation du pied faible', techWeakFoot, setTechWeakFoot)}
              </div>
            </div>
          )}

          {/* TAB 2 : PHYSIQUE */}
          {activeTab === 'phys' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-foreground">B. Capacités Physiques & Athlétiques (Barème 1–10)</h4>
                <span className="text-xs font-bold text-primary">Moyenne Pilier : {physScore}/10</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderSlider('Accélération (0-10m)', physAcceleration, setPhysAcceleration)}
                {renderSlider('Vitesse de pointe (Sprint)', physSprintSpeed, setPhysSprintSpeed)}
                {renderSlider('Agilité & Vivacité', physAgility, setPhysAgility)}
                {renderSlider('Équilibre & Appuis', physBalance, setPhysBalance)}
                {renderSlider('Puissance musculaire & Impact', physStrength, setPhysStrength)}
                {renderSlider('Endurance & Volume (VMA)', physEndurance, setPhysEndurance)}
                {renderSlider('Explosivité & Détente', physExplosiveness, setPhysExplosiveness)}
              </div>
            </div>
          )}

          {/* TAB 3 : TACTIQUE */}
          {activeTab === 'tact' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-foreground">C. Intelligence & Rigueur Tactique (Barème 1–10)</h4>
                <span className="text-xs font-bold text-primary">Moyenne Pilier : {tactScore}/10</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderSlider('Placement sans ballon', tactPositioning, setTactPositioning)}
                {renderSlider('Vision du jeu globale', tactAwareness, setTactAwareness)}
                {renderSlider('Prise de décision sous pression', tactDecisionMaking, setTactDecisionMaking)}
                {renderSlider('Anticipation & Lecture des passes', tactAnticipation, setTactAnticipation)}
                {renderSlider('Gestion des espaces', tactSpaceAwareness, setTactSpaceAwareness)}
                {renderSlider('Comportement en transition (Off/Déf)', tactTransition, setTactTransition)}
              </div>
            </div>
          )}

          {/* TAB 4 : MENTAL */}
          {activeTab === 'ment' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-foreground">D. Profil Mental & Psychologique (Barème 1–10)</h4>
                <span className="text-xs font-bold text-primary">Moyenne Pilier : {mentScore}/10</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderSlider('Concentration & Rigueur', mentConcentration, setMentConcentration)}
                {renderSlider('Discipline & Respect des consignes', mentDiscipline, setMentDiscipline)}
                {renderSlider('Motivation & Volonté de réussir', mentMotivation, setMentMotivation)}
                {renderSlider('Confiance en soi & Sang-froid', mentConfidence, setMentConfidence)}
                {renderSlider('Esprit d\'équipe & Communication', mentTeamwork, setMentTeamwork)}
                {renderSlider('Leadership naturel', mentLeadership, setMentLeadership)}
                {renderSlider('Réceptivité au coaching (Coachability)', mentCoachability, setMentCoachability)}
              </div>
            </div>
          )}

          {/* TAB 5 : POSITION SPECIFIC */}
          {activeTab === 'position' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-foreground">Critères Additionnels Spécifiques : {candidate.primary_position}</h4>
                <span className="text-xs font-bold text-slate-500">Adaptation au poste</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderSlider(posTrait1Label, posTrait1Score, setPosTrait1Score)}
                {renderSlider(posTrait2Label, posTrait2Score, setPosTrait2Score)}
                {renderSlider(posTrait3Label, posTrait3Score, setPosTrait3Score)}
              </div>
            </div>
          )}

          {/* TAB 6 : VERDICT FINAL */}
          {activeTab === 'verdict' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Évaluateur / Scout *</label>
                  <input
                    type="text"
                    required
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date d'Évaluation</label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Décision / Recommandation Officielle *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'contract_proposal', label: '🔥 Contrat / Signature Pro', color: 'border-red-500 bg-red-50 text-red-900' },
                    { id: 'recommend_academy', label: '⭐ Intégrer Académie', color: 'border-blue-500 bg-blue-50 text-blue-900' },
                    { id: 'shortlist', label: '📋 Shortlist Prioritaire', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                    { id: 'additional_test', label: '⏱️ Test Additionnel', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                    { id: 'monitor', label: '🔍 Suivre en Matchs', color: 'border-purple-500 bg-purple-50 text-purple-900' },
                    { id: 'reject', label: '❌ Non Retenu', color: 'border-slate-500 bg-slate-50 text-slate-900' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVerdict(v.id as EvaluationVerdict)}
                      className={cn(
                        "p-3 rounded-2xl border text-xs font-bold text-left transition-all",
                        verdict === v.id ? `${v.color} shadow ring-2 ring-primary/20` : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Points Forts Majeurs</label>
                  <textarea
                    rows={3}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Qualités athlétiques, gestes techniques distinctifs..."
                    className="w-full px-3.5 py-2 rounded-xl border text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Axes d'Amélioration</label>
                  <textarea
                    rows={3}
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="Aspects tactiques ou physiques à travailler..."
                    className="w-full px-3.5 py-2 rounded-xl border text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Rapport de Synthèse pour la Direction</label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Recommandation générale..."
                  className="w-full px-3.5 py-2 rounded-xl border text-sm"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Score Global Pondéré : <span className="font-black text-primary text-sm">{overallScore}/10</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Validation...' : 'Valider l\'Évaluation 1–10'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EvaluationModal;
