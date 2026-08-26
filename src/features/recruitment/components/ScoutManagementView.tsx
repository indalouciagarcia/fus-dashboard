import React, { useState } from 'react';
import type { Scout, TrialCandidate, CandidateEvaluation } from '../types/recruitment';
import {
  User, Plus, Phone, Mail, MapPin, Award, CheckCircle2,
  Calendar, TrendingUp, Shield, Edit3, Trash2, X, Sparkles
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ScoutManagementViewProps {
  scouts: Scout[];
  candidates: TrialCandidate[];
  evaluations: CandidateEvaluation[];
  onCreateScout: (scout: Omit<Scout, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdateScout: (id: string, updates: Partial<Scout>) => Promise<any>;
  onDeleteScout: (id: string) => Promise<any>;
}

export const ScoutManagementView: React.FC<ScoutManagementViewProps> = ({
  scouts,
  candidates,
  evaluations,
  onCreateScout,
  onUpdateScout,
  onDeleteScout,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScout, setEditingScout] = useState<Scout | null>(null);
  const [selectedScoutId, setSelectedScoutId] = useState<string | null>(() => scouts[0]?.id || null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Scout Régional');
  const [region, setRegion] = useState('Rabat-Salé-Kénitra');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState('U17, U19');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');

  const activeScout = scouts.find(s => s.id === selectedScoutId) || scouts[0];

  // Scout KPI calculations
  const scoutCandidates = candidates.filter(c => c.discovering_scout_id === activeScout?.id || c.discovering_scout_name === activeScout?.full_name);
  const scoutEvals = evaluations.filter(e => scoutCandidates.some(c => c.id === e.candidate_id));
  const avgScore = scoutEvals.length > 0
    ? Math.round((scoutEvals.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / scoutEvals.length) * 10) / 10
    : 0;

  const openCreateModal = () => {
    setEditingScout(null);
    setFullName('');
    setRoleTitle('Scout Régional');
    setRegion('Rabat-Salé-Kénitra');
    setPhone('');
    setEmail('');
    setCategories('U17, U19');
    setStatus('active');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (scout: Scout) => {
    setEditingScout(scout);
    setFullName(scout.full_name);
    setRoleTitle(scout.role_title);
    setRegion(scout.recruitment_region);
    setPhone(scout.phone || '');
    setEmail(scout.email || '');
    setCategories(scout.assigned_categories.join(', '));
    setStatus(scout.status);
    setNotes(scout.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const data = {
      full_name: fullName.trim(),
      role_title: roleTitle,
      recruitment_region: region,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      assigned_categories: categories.split(',').map(s => s.trim()).filter(Boolean),
      assigned_teams: ['Académie FUS'],
      status,
      recruited_date: editingScout?.recruited_date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    if (editingScout) {
      await onUpdateScout(editingScout.id, data);
    } else {
      await onCreateScout(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Cellule Détection & Gestion des Scouts
          </h2>
          <p className="text-xs text-muted-foreground">
            Suivi des recruteurs du club, zones de prospection et tableaux de bord de performance.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Scout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des Scouts (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recruteurs Actifs ({scouts.length})
          </h3>

          <div className="space-y-2.5">
            {scouts.map((scout) => {
              const isSelected = activeScout?.id === scout.id;
              const candCount = candidates.filter(c => c.discovering_scout_id === scout.id || c.discovering_scout_name === scout.full_name).length;

              return (
                <div
                  key={scout.id}
                  onClick={() => setSelectedScoutId(scout.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                    isSelected
                      ? "bg-white border-primary shadow-md ring-2 ring-primary/10"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {scout.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{scout.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{scout.role_title}</p>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-primary" /> {scout.recruitment_region}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 block mb-1">
                      {candCount} joueurs
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                      scout.status === 'active' ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-100"
                    )}>
                      {scout.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dashboard Personnel du Scout Sélectionné (8 Cols) */}
        {activeScout && (
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border shadow-sm space-y-6">
            {/* Profil Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-xl font-black">
                  {activeScout.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{activeScout.full_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Scout Officiel
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeScout.role_title} • Région : {activeScout.recruitment_region}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                    {activeScout.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-primary" /> {activeScout.phone}</span>}
                    {activeScout.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-primary" /> {activeScout.email}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(activeScout)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Modifier le profil"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Retirer le scout ${activeScout.full_name} ?`)) {
                      onDeleteScout(activeScout.id);
                    }
                  }}
                  className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPIs Performance du Scout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Talents Découverts</span>
                <span className="text-2xl font-black text-foreground">{scoutCandidates.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">En Évaluation</span>
                <span className="text-2xl font-black text-amber-700">
                  {scoutCandidates.filter(c => ['screening', 'test_scheduled', 'under_evaluation'].includes(c.pipeline_stage)).length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Signés / Académie</span>
                <span className="text-2xl font-black text-emerald-700">
                  {scoutCandidates.filter(c => ['signed', 'academy', 'shortlisted'].includes(c.pipeline_stage)).length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 text-center">
                <span className="text-[10px] uppercase font-bold text-red-900 block">Note Moyenne Talents</span>
                <span className="text-2xl font-black text-primary">{avgScore > 0 ? `${avgScore}/10` : '-'}</span>
              </div>
            </div>

            {/* Joueurs Recommandés par le Scout */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Joueurs Découverts & Suivis ({scoutCandidates.length})
              </h4>

              {scoutCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground bg-slate-50 rounded-2xl border border-dashed">
                  Aucun joueur actuellement associé à ce scout.
                </div>
              ) : (
                <div className="space-y-2">
                  {scoutCandidates.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.first_name} {c.last_name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.primary_position} • {c.current_club || 'Sans club'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border text-slate-700 uppercase">
                          {c.pipeline_stage.replace('_', ' ')}
                        </span>
                        {c.initial_scout_score && (
                          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                            {c.initial_scout_score}/10
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajout / Édition Scout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-foreground">
                {editingScout ? 'Modifier la Fiche Scout' : 'Nouveau Scout / Recruteur'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Hassan Benabicha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Rôle / Titre</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Ex: Scout Principal U19"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Région de Détection</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Ex: Rabat-Salé-Kénitra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scout@fus.ma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Catégories Assignées (Séparées par virgules)</label>
                <input
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="U15, U17, U19"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes du Recruteur</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Réseau relationnel, diplômes d'entraîneur..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ScoutManagementView;
