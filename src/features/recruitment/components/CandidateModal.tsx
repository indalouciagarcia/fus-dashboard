import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Footprints, Shield, FileText, HeartHandshake, AlertCircle, Sparkles } from 'lucide-react';
import type { TrialCandidate, CandidateStatus, FootType, RecommendationPriority, Scout } from '../types/recruitment';
import { cn } from '../../../lib/utils';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: TrialCandidate | null;
  scouts: Scout[];
  onSave: (candidate: Omit<TrialCandidate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const POSITIONS = [
  'Gardien de But (GB)',
  'Défenseur Central (DC)',
  'Latéral Droit (DD)',
  'Latéral Gauche (DG)',
  'Milieu Défensif (MDC)',
  'Milieu Central (MC)',
  'Milieu Offensif (MOC)',
  'Ailier Droit (AD)',
  'Ailier Gauche (AG)',
  'Avant-Centre (BU)',
  'Second Attaquant (AT)',
];

export const CandidateModal: React.FC<CandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  scouts,
  onSave,
}) => {
  const [activeSection, setActiveSection] = useState<'civil' | 'guardian' | 'sport' | 'scout'>('civil');

  // Identité
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [nationality, setNationality] = useState('Marocaine');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Rabat');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Tuteur / Mineurs
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Père');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianPhoneAlt, setGuardianPhoneAlt] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [consentStatus, setConsentStatus] = useState<'pending' | 'granted' | 'refused'>('granted');

  // Sportif
  const [primaryPosition, setPrimaryPosition] = useState(POSITIONS[7]);
  const [secondaryPosition, setSecondaryPosition] = useState('');
  const [preferredFoot, setPreferredFoot] = useState<FootType>('Droitier');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [ageCategory, setAgeCategory] = useState('U19');
  const [currentClub, setCurrentClub] = useState('');
  const [previousClubs, setPreviousClubs] = useState('');
  const [matchesPlayed, setMatchesPlayed] = useState<number | ''>('');
  const [minutesPlayed, setMinutesPlayed] = useState<number | ''>('');
  const [goals, setGoals] = useState<number | ''>('');
  const [assists, setAssists] = useState<number | ''>('');
  const [nationalSelections, setNationalSelections] = useState('');
  const [injuryHistory, setInjuryHistory] = useState('');

  // Découverte Scout
  const [discoveringScoutId, setDiscoveringScoutId] = useState(scouts[0]?.id || '');
  const [discoveryLocation, setDiscoveryLocation] = useState('');
  const [discoveryMatch, setDiscoveryMatch] = useState('');
  const [priority, setPriority] = useState<RecommendationPriority>('high');
  const [initialScore, setInitialScore] = useState<number>(8.0);
  const [scoutNotes, setScoutNotes] = useState('');

  const [status, setStatus] = useState<CandidateStatus>('registered');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcul automatique de l'âge
  const calculateAge = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };
  const age = calculateAge(birthDate);
  const isMinor = age !== null && age < 18;

  useEffect(() => {
    if (candidate) {
      setFirstName(candidate.first_name || '');
      setLastName(candidate.last_name || '');
      setBirthDate(candidate.birth_date || '');
      setBirthPlace(candidate.birth_place || '');
      setNationality(candidate.nationality || 'Marocaine');
      setAddress(candidate.address || '');
      setCity(candidate.city || 'Rabat');
      setPhone(candidate.phone || '');
      setEmail(candidate.email || '');

      setGuardianName(candidate.guardian_name || '');
      setGuardianRelationship(candidate.guardian_relationship || 'Père');
      setGuardianPhone(candidate.guardian_phone || '');
      setGuardianPhoneAlt(candidate.guardian_phone_alt || '');
      setGuardianEmail(candidate.guardian_email || '');
      setEmergencyContact(candidate.emergency_contact || '');
      setConsentStatus(candidate.guardian_consent_status || 'granted');

      setPrimaryPosition(candidate.primary_position || POSITIONS[7]);
      setSecondaryPosition(candidate.secondary_position || '');
      setPreferredFoot(candidate.preferred_foot || 'Droitier');
      setHeightCm(candidate.height_cm ?? '');
      setWeightKg(candidate.weight_kg ?? '');
      setAgeCategory(candidate.age_category || 'U19');
      setCurrentClub(candidate.current_club || '');
      setPreviousClubs(candidate.previous_clubs || '');
      setMatchesPlayed(candidate.matches_played ?? '');
      setMinutesPlayed(candidate.minutes_played ?? '');
      setGoals(candidate.goals ?? '');
      setAssists(candidate.assists ?? '');
      setNationalSelections(candidate.national_selections || '');
      setInjuryHistory(candidate.injury_history || '');

      setDiscoveringScoutId(candidate.discovering_scout_id || scouts[0]?.id || '');
      setDiscoveryLocation(candidate.discovery_location || '');
      setDiscoveryMatch(candidate.discovery_match || '');
      setPriority(candidate.recommendation_priority || 'high');
      setInitialScore(candidate.initial_scout_score || 8.0);
      setScoutNotes(candidate.scout_recommendation_notes || '');
      setStatus(candidate.status || 'registered');
    }
  }, [candidate, isOpen, scouts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const selectedScout = scouts.find(s => s.id === discoveringScoutId);

    setIsSubmitting(true);
    try {
      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate || undefined,
        birth_place: birthPlace || undefined,
        nationality,
        address: address || undefined,
        city: city || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,

        guardian_name: guardianName || undefined,
        guardian_relationship: guardianRelationship || undefined,
        guardian_phone: guardianPhone || undefined,
        guardian_phone_alt: guardianPhoneAlt || undefined,
        guardian_email: guardianEmail || undefined,
        emergency_contact: emergencyContact || undefined,
        guardian_consent_status: consentStatus,

        primary_position: primaryPosition,
        secondary_position: secondaryPosition || undefined,
        preferred_foot: preferredFoot,
        height_cm: heightCm ? Number(heightCm) : undefined,
        weight_kg: weightKg ? Number(weightKg) : undefined,
        age_category: ageCategory,
        current_club: currentClub.trim() || undefined,
        previous_clubs: previousClubs.trim() || undefined,
        matches_played: matchesPlayed !== '' ? Number(matchesPlayed) : 0,
        minutes_played: minutesPlayed !== '' ? Number(minutesPlayed) : 0,
        goals: goals !== '' ? Number(goals) : 0,
        assists: assists !== '' ? Number(assists) : 0,
        national_selections: nationalSelections || undefined,
        injury_history: injuryHistory || undefined,

        discovering_scout_id: discoveringScoutId || undefined,
        discovering_scout_name: selectedScout?.full_name || 'Scout FUS',
        discovery_location: discoveryLocation || undefined,
        discovery_match: discoveryMatch || undefined,
        recommendation_priority: priority,
        initial_scout_score: Number(initialScore),
        scout_recommendation_notes: scoutNotes || undefined,

        pipeline_stage: candidate?.pipeline_stage || 'prospect',
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {candidate ? `Fiche Candidat : ${candidate.first_name} ${candidate.last_name}` : 'Nouveau Dossier Joueur Détecté'}
                </h3>
                {isMinor && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                    Mineur ({age} ans)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Saisie complète des informations civiles, tuteurs légaux, profil sportif et scout découvreur.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation des 4 sous-onglets du formulaire */}
        <div className="flex border-b bg-white px-6 overflow-x-auto gap-2 py-2.5">
          {[
            { id: 'civil', label: '1. État Civil & Contact', icon: User },
            { id: 'guardian', label: `2. Tuteur & Représentant ${isMinor ? '⚠️ (Obligatoire)' : ''}`, icon: HeartHandshake },
            { id: 'sport', label: '3. Profil Sportif & Stats', icon: Shield },
            { id: 'scout', label: '4. Découverte & Recommandation', icon: Sparkles },
          ].map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id as any)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
                  activeSection === sec.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* SECTION 1 : ÉTAT CIVIL */}
          {activeSection === 'civil' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Amine"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: El Idrissi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lieu de Naissance</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Ex: Salé"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone Joueur</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Joueur</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joueur@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Adresse de Résidence</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier, Ville, Code Postal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          {/* SECTION 2 : TUTEUR & REPRÉSENTANT LÉGAL */}
          {activeSection === 'guardian' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">Protection et Cadre Légal des Joueurs Mineurs (-18 ans)</p>
                  <p className="mt-0.5">
                    Pour tout joueur mineur, les coordonnées du tuteur légal et le consentement parental formel sont obligatoires avant toute convocation ou engagement officiel.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom du Parent / Tuteur Légal *</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Ex: Mohamed El Idrissi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lien de Parenté</label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Père">Père</option>
                    <option value="Mère">Mère</option>
                    <option value="Tuteur Légal">Tuteur Légal / Famille</option>
                    <option value="Représentant Agréé">Représentant Agréé / Agent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone Principal Tuteur *</label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone Alternatif / Urgence</label>
                  <input
                    type="tel"
                    value={guardianPhoneAlt}
                    onChange={(e) => setGuardianPhoneAlt(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email du Tuteur</label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="tuteur@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Statut du Consentement Parental</label>
                  <select
                    value={consentStatus}
                    onChange={(e) => setConsentStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-emerald-800"
                  >
                    <option value="granted">✅ Accord & Consentement Accordé</option>
                    <option value="pending">⏳ En attente de signature</option>
                    <option value="refused">❌ Consentement Refusé</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3 : PROFIL SPORTIF & STATS */}
          {activeSection === 'sport' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Poste Principal *</label>
                  <select
                    value={primaryPosition}
                    onChange={(e) => setPrimaryPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pied Fort *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Droitier', 'Gaucher', 'Ambidextre'] as FootType[]).map(foot => (
                      <button
                        key={foot}
                        type="button"
                        onClick={() => setPreferredFoot(foot)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl border transition-all",
                          preferredFoot === foot ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-700"
                        )}
                      >
                        {foot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="180"
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    placeholder="73"
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Catégorie d'Âge</label>
                  <select
                    value={ageCategory}
                    onChange={(e) => setAgeCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-white"
                  >
                    <option value="U15">U15</option>
                    <option value="U17">U17</option>
                    <option value="U19">U19</option>
                    <option value="U21 / Espoirs">U21 / Espoirs</option>
                    <option value="Senior">Senior / Pro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Club Actuel</label>
                  <input
                    type="text"
                    value={currentClub}
                    onChange={(e) => setCurrentClub(e.target.value)}
                    placeholder="Ex: Académie Mohammed VI, KAC..."
                    className="w-full px-3.5 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Clubs Précédents / Formation</label>
                  <input
                    type="text"
                    value={previousClubs}
                    onChange={(e) => setPreviousClubs(e.target.value)}
                    placeholder="Ex: AS FAR (2020-2023)"
                    className="w-full px-3.5 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Matchs</label>
                  <input
                    type="number"
                    value={matchesPlayed}
                    onChange={(e) => setMatchesPlayed(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Minutes</label>
                  <input
                    type="number"
                    value={minutesPlayed}
                    onChange={(e) => setMinutesPlayed(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Buts</label>
                  <input
                    type="number"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Passes D.</label>
                  <input
                    type="number"
                    value={assists}
                    onChange={(e) => setAssists(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sélections Nationales & Distinctions</label>
                <input
                  type="text"
                  value={nationalSelections}
                  onChange={(e) => setNationalSelections(e.target.value)}
                  placeholder="Ex: Maroc U17 (4 sélections, 1 but)"
                  className="w-full px-3.5 py-2 rounded-xl border text-xs"
                />
              </div>
            </div>
          )}

          {/* SECTION 4 : DÉCOUVERTE & SCOUT */}
          {activeSection === 'scout' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scout Découvreur *</label>
                  <select
                    value={discoveringScoutId}
                    onChange={(e) => setDiscoveringScoutId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {scouts.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.recruitment_region})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priorité de Recommandation *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                  >
                    <option value="very_high">🔥 Très Haute (Priorité 1)</option>
                    <option value="high">⭐ Haute (Priorité 2)</option>
                    <option value="medium">🟡 Moyenne</option>
                    <option value="low">⚪ Faible</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lieu de Découverte</label>
                  <input
                    type="text"
                    value={discoveryLocation}
                    onChange={(e) => setDiscoveryLocation(e.target.value)}
                    placeholder="Ex: Stade Municipal de Kénitra"
                    className="w-full px-3.5 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Match Observé</label>
                  <input
                    type="text"
                    value={discoveryMatch}
                    onChange={(e) => setDiscoveryMatch(e.target.value)}
                    placeholder="Ex: AMF U17 vs KAC U17"
                    className="w-full px-3.5 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Note Initiale du Scout (1 à 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={initialScore}
                  onChange={(e) => setInitialScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Commentaires & Recommandation du Recruteur</label>
                <textarea
                  rows={3}
                  value={scoutNotes}
                  onChange={(e) => setScoutNotes(e.target.value)}
                  placeholder="Arguments clés de recrutement, qualités distinctives, potentiel..."
                  className="w-full px-3.5 py-2 rounded-xl border text-xs"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : candidate ? 'Mettre à jour la Fiche' : 'Enregistrer le Joueur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CandidateModal;
