import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, FileText } from 'lucide-react';
import type { PlayerTest, SessionStatus, TrialCandidate, Scout } from '../types/recruitment';

interface TrialSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: TrialCandidate[];
  scouts: Scout[];
  onSave: (test: Omit<PlayerTest, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const TrialSessionModal: React.FC<TrialSessionModalProps> = ({
  isOpen,
  onClose,
  candidates,
  scouts,
  onSave,
}) => {
  const [candidateId, setCandidateId] = useState(candidates[0]?.id || '');
  const [testName, setTestName] = useState('Évaluation Spécifique Vitesse & Match d\'Essai U19');
  const [testDate, setTestDate] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('Complexe Sportif FUS - Terrain Annexe 1');
  const [trainingGround, setTrainingGround] = useState('Terrain Synthétique 1');
  const [targetTeam, setTargetTeam] = useState('Académie FUS U19');
  const [ageCategory, setAgeCategory] = useState('U19');
  const [testType, setTestType] = useState<'trial_match' | 'physical_test' | 'technical_session' | 'medical_test' | 'comprehensive'>('comprehensive');
  const [status, setStatus] = useState<SessionStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !testDate) return;

    setIsSubmitting(true);
    try {
      await onSave({
        candidate_id: candidateId || undefined,
        test_name: testName.trim(),
        test_date: testDate,
        start_time: startTime,
        end_time: endTime,
        location,
        training_ground: trainingGround,
        target_team: targetTeam,
        age_category: ageCategory,
        assigned_coaches: ['Staff Technique Académie FUS'],
        assigned_scouts: scouts.slice(0, 2).map(s => s.full_name),
        test_type: testType,
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Planifier une Session de Test / Essai</h3>
              <p className="text-xs text-muted-foreground">Convocation et calendrier d'évaluation technique.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Joueur Convoqué (Optionnel)</label>
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            >
              <option value="">Sélectionner un joueur ou session ouverte...</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.primary_position} - {c.current_club || 'Sans club'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Intitulé de la Session *</label>
            <input
              type="text"
              required
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Ex: Évaluation Spécifique Vitesse & Match d'Essai U19"
              className="w-full px-3.5 py-2 rounded-xl border text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type de Test</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border text-xs bg-white"
              >
                <option value="comprehensive">Batterie Complète (Physique + Match)</option>
                <option value="trial_match">Match d'Essai & Opposition</option>
                <option value="physical_test">Tests Physiques & VMA</option>
                <option value="technical_session">Ateliers Techniques Spécifiques</option>
                <option value="medical_test">Visite Médicale & Bilan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Catégorie</label>
              <select
                value={ageCategory}
                onChange={(e) => setAgeCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border text-xs bg-white"
              >
                <option value="U15">U15</option>
                <option value="U17">U17</option>
                <option value="U19">U19</option>
                <option value="U21 / Espoirs">U21 / Espoirs</option>
                <option value="Senior">Senior / Pro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lieu</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Terrain</label>
              <input
                type="text"
                value={trainingGround}
                onChange={(e) => setTrainingGround(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Consignes & Programme</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Échauffement 20 min, tests navettes, match 2x30 min..."
              className="w-full px-3.5 py-2 rounded-xl border text-xs"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
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
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Planification...' : 'Créer la Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TrialSessionModal;
