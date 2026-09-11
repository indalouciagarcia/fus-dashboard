import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, MapPin, Users, Clock, Shield, Sparkles, CheckCircle2, AlertCircle, Swords } from 'lucide-react';
import type { PlayerTest, SessionStatus, TrialCandidate, Scout } from '../types/recruitment';
import { RECRUITMENT_AGE_CATEGORIES } from '../types/recruitment';
import { normalizeAgeCategory } from '../../../constants';
import { useMatches } from '../../../hooks/useMatches';
import { useClubData } from '../../../hooks/useClubData';

interface TrialSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: TrialCandidate[];
  scouts: Scout[];
  initialTest?: PlayerTest | null;
  defaultDate?: string;
  defaultCandidateId?: string;
  onSave: (test: Omit<PlayerTest, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<PlayerTest>) => Promise<void>;
}

const TIME_PRESETS = [
  { label: 'Matinée (09:00 - 11:30)', start: '09:00', end: '11:30' },
  { label: 'Fin de matinée (10:30 - 12:30)', start: '10:30', end: '12:30' },
  { label: 'Après-midi (15:00 - 17:00)', start: '15:00', end: '17:00' },
  { label: 'Fin d\'après-midi (17:30 - 19:30)', start: '17:30', end: '19:30' },
];

export const TrialSessionModal: React.FC<TrialSessionModalProps> = ({
  isOpen,
  onClose,
  candidates,
  scouts,
  initialTest,
  defaultDate,
  defaultCandidateId,
  onSave,
  onUpdate,
}) => {
  const { matches = [] } = useMatches();
  const { opponentClubs = [] } = useClubData();

  const [candidateId, setCandidateId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('Complexe Sportif FUS - Académie');
  const [trainingGround, setTrainingGround] = useState('Terrain Synthétique 1');
  const [targetTeam, setTargetTeam] = useState('Académie FUS');
  const [ageCategory, setAgeCategory] = useState('U19');
  const [testType, setTestType] = useState<'trial_match' | 'physical_test' | 'technical_session' | 'medical_test' | 'comprehensive'>('comprehensive');
  const [status, setStatus] = useState<SessionStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper pour trouver le nom de l'adversaire
  const getOpponentName = (oppId?: string) => {
    if (!oppId) return 'Adversaire';
    const found = opponentClubs.find(c => c.id === oppId);
    return found?.name || 'MAS Fès';
  };

  // Filtrer les matchs strictement selon la catégorie du joueur / de la session
  const categoryMatches = useMemo(() => {
    return matches.filter(m => {
      return normalizeAgeCategory(m.category) === normalizeAgeCategory(ageCategory);
    });
  }, [matches, ageCategory]);

  useEffect(() => {
    if (initialTest) {
      setCandidateId(initialTest.candidate_id || '');
      setMatchId(initialTest.match_id || '');
      setTestName(initialTest.test_name);
      setTestDate(initialTest.test_date);
      setStartTime(initialTest.start_time || '09:30');
      setEndTime(initialTest.end_time || '12:00');
      setLocation(initialTest.location || 'Complexe Sportif FUS - Académie');
      setTrainingGround(initialTest.training_ground || 'Terrain Synthétique 1');
      setTargetTeam(initialTest.target_team || 'Académie FUS');
      setAgeCategory(normalizeAgeCategory(initialTest.age_category || 'U19'));
      setTestType(initialTest.test_type || 'comprehensive');
      setStatus(initialTest.status || 'scheduled');
      setNotes(initialTest.notes || '');
    } else {
      const activeCandId = defaultCandidateId || '';
      setCandidateId(activeCandId);
      setMatchId('');

      const targetCand = candidates.find(c => c.id === activeCandId);
      if (targetCand) {
        const normCat = normalizeAgeCategory(targetCand.age_category || 'U19');
        setTestName(`Session Test & Évaluation : ${targetCand.first_name} ${targetCand.last_name}`);
        setAgeCategory(normCat);
        setTargetTeam(`Académie FUS ${normCat}`);
      } else {
        setTestName('Session de Détection & Test Technique');
        setAgeCategory('U19');
        setTargetTeam('Académie FUS U19');
      }

      setTestDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:30');
      setEndTime('12:00');
      setLocation('Complexe Sportif FUS - Académie');
      setTrainingGround('Terrain Synthétique 1');
      setTestType('comprehensive');
      setStatus('scheduled');
      setNotes('');
    }
  }, [initialTest, defaultDate, defaultCandidateId, isOpen, candidates]);

  if (!isOpen) return null;

  // Gestion du choix d'un match : synchronisation automatique des détails du match
  const handleSelectMatch = (selectedId: string) => {
    setMatchId(selectedId);
    if (!selectedId) return;

    const foundMatch = matches.find(m => m.id === selectedId);
    if (foundMatch) {
      if (foundMatch.match_date) {
        setTestDate(foundMatch.match_date);
      }
      if (foundMatch.match_time) {
        const timeClean = foundMatch.match_time.slice(0, 5);
        setStartTime(timeClean);
        const [h, m] = timeClean.split(':').map(Number);
        if (!isNaN(h)) {
          const endH = String((h + 2) % 24).padStart(2, '0');
          setEndTime(`${endH}:${String(m || 0).padStart(2, '0')}`);
        }
      }
      setTestType('trial_match');

      const stadium = (foundMatch as any).venue || (foundMatch as any).stadium_name || 'Complexe Sportif FUS - Académie';
      setLocation(stadium);

      const oppName = getOpponentName(foundMatch.opponent_id);
      const targetCand = candidates.find(c => c.id === candidateId);
      if (targetCand) {
        setTestName(`Match d'Essai vs ${oppName} (${foundMatch.category}) : ${targetCand.first_name} ${targetCand.last_name}`);
      } else {
        setTestName(`Match d'Essai & Évaluation vs ${oppName} (${foundMatch.category})`);
      }
    }
  };

  // Changement de la catégorie : réinitialise le match si non compatible
  const handleCategoryChange = (newCat: string) => {
    const norm = normalizeAgeCategory(newCat);
    setAgeCategory(norm);
    setTargetTeam(`Académie FUS ${norm}`);
    
    // Si le match actuellement sélectionné ne correspond plus à la catégorie, on le retire
    const currentMatch = matches.find(m => m.id === matchId);
    if (currentMatch && normalizeAgeCategory(currentMatch.category) !== norm) {
      setMatchId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !testDate) return;

    setIsSubmitting(true);
    try {
      const selectedMatch = matches.find(m => m.id === matchId);
      const selectedMatchOppName = selectedMatch ? getOpponentName(selectedMatch.opponent_id) : undefined;
      const matchDisplayName = selectedMatch
        ? `FUS vs ${selectedMatchOppName} (${selectedMatch.category}) [${selectedMatch.match_date}]`
        : undefined;

      const payload: Omit<PlayerTest, 'id' | 'created_at' | 'updated_at'> = {
        candidate_id: candidateId || undefined,
        match_id: matchId || undefined,
        match_name: matchDisplayName,
        test_name: testName.trim(),
        test_date: testDate,
        start_time: startTime,
        end_time: endTime,
        location: location.trim(),
        training_ground: trainingGround.trim(),
        target_team: targetTeam.trim(),
        age_category: ageCategory,
        assigned_coaches: ['Staff Technique Académie FUS'],
        assigned_scouts: scouts.slice(0, 2).map(s => s.full_name),
        test_type: testType,
        status,
        notes: notes.trim() || undefined,
      };

      if (initialTest && onUpdate) {
        await onUpdate(initialTest.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight">
                {initialTest ? 'Modifier la Session de Test' : 'Planifier une Session de Test'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {initialTest ? `Édition de "${initialTest.test_name}"` : 'Convocation, horaires et terrain d\'évaluation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Joueur convoqué */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Joueur Convoqué (Optionnel)
            </label>
            <select
              value={candidateId}
              onChange={(e) => {
                const newId = e.target.value;
                setCandidateId(newId);
                if (!initialTest && newId) {
                  const targetCand = candidates.find(c => c.id === newId);
                  if (targetCand) {
                    const normCat = normalizeAgeCategory(targetCand.age_category || 'U19');
                    setTestName(`Session Test & Évaluation : ${targetCand.first_name} ${targetCand.last_name}`);
                    setAgeCategory(normCat);
                    setTargetTeam(`Académie FUS ${normCat}`);
                    const currentMatch = matches.find(m => m.id === matchId);
                    if (currentMatch && normalizeAgeCategory(currentMatch.category) !== normCat) {
                      setMatchId('');
                    }
                  }
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:ring-2 ring-primary/20"
            >
              <option value="">Séance Collective / Plusieurs Joueurs</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.primary_position} • {c.current_club || 'Sans club'}) [{c.pipeline_stage}]
                </option>
              ))}
            </select>
            {candidateId && (
              <div className="mt-1.5 p-2 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ce joueur sera automatiquement basculé dans la colonne <strong>« 5. Test Planifié »</strong> du Kanban.</span>
              </div>
            )}
          </div>

          {/* Choix du Match d'Évaluation (strictement filtré par la Catégorie Ciblée) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-slate-50 border border-indigo-200/80 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-indigo-600" />
                Dans quel Match le Joueur sera-t-il testé ?
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Catégorie : {ageCategory}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {categoryMatches.length} match{categoryMatches.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <select
              value={matchId}
              onChange={(e) => handleSelectMatch(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/30 text-xs transition-shadow"
            >
              <option value="">Séance d'entraînement / Test autonome (Hors match)</option>
              {categoryMatches.map(m => {
                const oppName = getOpponentName(m.opponent_id);
                const statusFr = m.status === 'completed' ? 'Terminé' : m.status === 'live' ? 'En Direct' : 'Planifié';
                return (
                  <option key={m.id} value={m.id}>
                    ⚽ Match {m.category} du {m.match_date} {m.match_time ? `à ${m.match_time.slice(0, 5)}` : ''} — vs {oppName} ({statusFr})
                  </option>
                );
              })}
            </select>

            {matchId ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Testé en conditions réelles lors du match <strong>{matches.find(m => m.id === matchId)?.category}</strong> contre <strong>{getOpponentName(matches.find(m => m.id === matchId)?.opponent_id)}</strong>.
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 shrink-0 ml-2">
                  Date & Heure synchronisées
                </span>
              </div>
            ) : categoryMatches.length === 0 ? (
              <p className="text-[10px] text-amber-800 bg-amber-50/90 border border-amber-200 p-2 rounded-xl">
                ℹ️ Aucun match actuellement planifié pour la catégorie <strong>{ageCategory}</strong>. Le test sera planifié comme séance d'entraînement ou vous pouvez créer un match dans la rubrique Compétition.
              </p>
            ) : (
              <p className="text-[10px] text-indigo-700/80 italic">
                💡 Sélectionnez un match <strong>{ageCategory}</strong> pour synchroniser automatiquement la date, l'horaire et le stade d'évaluation.
              </p>
            )}
          </div>

          {/* Intitulé de la session */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Intitulé de la Session *
            </label>
            <input
              type="text"
              required
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Ex: Évaluation Spécifique Vitesse & Match d'Essai U19"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20"
            />
          </div>

          {/* Date & Horaires */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Date & Créneau Horaire
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Date Prévue *</label>
                <input
                  type="date"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Heure de Début</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Heure de Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold outline-none focus:ring-2 ring-primary/20"
                />
              </div>
            </div>

            {/* Raccourcis Créneaux */}
            <div>
              <span className="block text-[9px] font-bold text-slate-400 mb-1.5">Créneaux Rapides :</span>
              <div className="flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStartTime(p.start);
                      setEndTime(p.end);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      startTime === p.start && endTime === p.end
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Type de test & Catégorie & Statut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Type de Test
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none focus:ring-2 ring-primary/20"
              >
                <option value="comprehensive">Batterie Complète (Physique + Match)</option>
                <option value="trial_match">Match d'Essai & Opposition</option>
                <option value="physical_test">Tests Physiques & VMA</option>
                <option value="technical_session">Ateliers Techniques Spécifiques</option>
                <option value="medical_test">Bilan Médical & Visite</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Catégorie Ciblée
              </label>
              <select
                value={ageCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none focus:ring-2 ring-primary/20"
              >
                {RECRUITMENT_AGE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SessionStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none focus:ring-2 ring-primary/20"
              >
                <option value="scheduled">Planifié</option>
                <option value="in_progress">En Cours</option>
                <option value="completed">Réalisé</option>
                <option value="postponed">Reporté</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          {/* Lieu & Terrain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Complexe / Lieu
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Complexe Sportif FUS"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold outline-none focus:ring-2 ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Terrain d'Évaluation
              </label>
              <input
                type="text"
                value={trainingGround}
                onChange={(e) => setTrainingGround(e.target.value)}
                placeholder="Terrain Synthétique 1"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold outline-none focus:ring-2 ring-primary/20"
              />
            </div>
          </div>

          {/* Consignes / Notes */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Consignes & Programme de Détection
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Échauffement 20 min, tests navettes, match 2x30 min, présence du scout..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium outline-none focus:ring-2 ring-primary/20"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Enregistrement...' : initialTest ? 'Mettre à Jour' : 'Créer la Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrialSessionModal;
