import React, { useState, useEffect, useMemo } from 'react';
import {
  X, User, Phone, Mail, MapPin, Footprints, Shield, FileText,
  HeartHandshake, AlertCircle, Sparkles, Building2, Plus, Briefcase,
  Edit3, ShieldCheck, ShieldAlert, Clock, UserCheck, Zap, Star, XCircle,
  Globe, Compass, Video, ExternalLink, Camera, Upload, Trash2, Loader2, Image as ImageIcon
} from 'lucide-react';
import type { TrialCandidate, CandidateStatus, FootType, RecommendationPriority, Scout } from '../types/recruitment';
import { RECRUITMENT_AGE_CATEGORIES } from '../types/recruitment';
import { cn } from '../../../lib/utils';
import { NATIONALITIES, normalizeAgeCategory } from '../../../constants';
import { UNIFIED_POSITION_OPTIONS, formatUnifiedPosition } from '../../../constants/positions';
import { GEOGRAPHY_DATA, getContinentForCountry } from '../../../constants/geography';
import { useClubData } from '../../../hooks/useClubData';
import { uploadRecruitmentPhoto } from '../utils/uploadPhoto';
import { toast } from 'sonner';
import type { Club } from '../../../types';
import { OpponentClubFormModal } from '../../club-management/components/OpponentClubFormModal';
import { LocationPicker } from './LocationPicker';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: TrialCandidate | null;
  scouts: Scout[];
  onSave: (candidate: Omit<TrialCandidate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  scouts,
  onSave,
}) => {
  const { opponentClubs = [] } = useClubData();
  const [activeSection, setActiveSection] = useState<'civil' | 'sport'>('civil');

  // Opponent Club Modal State (Add & Edit using the exact same official form)
  const [isOpponentModalOpen, setIsOpponentModalOpen] = useState(false);
  const [selectedClubForModal, setSelectedClubForModal] = useState<Club | null>(null);
  const [opponentModalTargetField, setOpponentModalTargetField] = useState<'current' | 'previous'>('current');

  const handleOpenAddClub = (targetField: 'current' | 'previous') => {
    setSelectedClubForModal(null);
    setOpponentModalTargetField(targetField);
    setIsOpponentModalOpen(true);
  };

  const handleOpenEditClub = (clubName: string, targetField: 'current' | 'previous') => {
    const existingClub = opponentClubs.find(c => c.name.toLowerCase() === clubName.toLowerCase().trim());
    setSelectedClubForModal(existingClub || null);
    setOpponentModalTargetField(targetField);
    setIsOpponentModalOpen(true);
  };

  const handleOpponentClubSuccess = (savedClub: Club) => {
    if (opponentModalTargetField === 'current') {
      setCurrentClub(savedClub.name);
    } else {
      setPreviousClubs(prev => prev ? `${prev}, ${savedClub.name}` : savedClub.name);
    }
  };

  // Photo du Joueur
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const url = await uploadRecruitmentPhoto(file, 'players');
      setPhotoUrl(url);
      toast.success('Photo du joueur chargée avec succès', { icon: '📸' });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléversement de la photo');
    } finally {
      setIsUploadingPhoto(false);
      // Réinitialiser la valeur de l'input pour permettre de re-sélectionner le même fichier si besoin
      e.target.value = '';
    }
  };

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
  const [primaryPosition, setPrimaryPosition] = useState(UNIFIED_POSITION_OPTIONS[7].full);
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

  // Vidéo Highlights (YouTube ou Google Drive)
  const [videoType, setVideoType] = useState<'youtube' | 'drive' | 'none'>('none');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoSource, setVideoSource] = useState('');

  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setVideoType('youtube');
    } else if (url.includes('drive.google.com')) {
      setVideoType('drive');
    }
  };

  // Découverte Scout & Recruteur
  const scoutMembers = useMemo(() => {
    const list = scouts.filter(s => 
      s.role_title?.toLowerCase().includes('scout') || 
      (!s.role_title?.toLowerCase().includes('recrut') && !s.role_title?.toLowerCase().includes('directeur'))
    );
    return list.length > 0 ? list : scouts;
  }, [scouts]);

  const recruiterMembers = useMemo(() => {
    const list = scouts.filter(s => 
      s.role_title?.toLowerCase().includes('recrut') || 
      s.role_title?.toLowerCase().includes('directeur') ||
      s.role_title?.toLowerCase().includes('responsable')
    );
    return list.length > 0 ? list : scouts;
  }, [scouts]);

  const [discoveringScoutId, setDiscoveringScoutId] = useState(candidate?.discovering_scout_id || scoutMembers[0]?.id || scouts[0]?.id || '');
  const [recruiterId, setRecruiterId] = useState(candidate?.recruiter_id || recruiterMembers[0]?.id || scouts[0]?.id || '');
  
  // Lieu de Découverte Géographique en Cascade
  const [discoveryContinent, setDiscoveryContinent] = useState('Afrique');
  const [discoveryCountry, setDiscoveryCountry] = useState('Maroc');
  const [discoveryCity, setDiscoveryCity] = useState('Rabat');
  const [discoveryCustomCity, setDiscoveryCustomCity] = useState('');
  const [discoveryLocation, setDiscoveryLocation] = useState('Rabat, Maroc');
  
  const [discoveryMatch, setDiscoveryMatch] = useState('');
  const [priority, setPriority] = useState<RecommendationPriority>('high');
  const [initialScore, setInitialScore] = useState<number>(8.0);
  const [scoutNotes, setScoutNotes] = useState('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  // LocationPicker state pour zones préférées
  const [prefContinent, setPrefContinent] = useState('Afrique');
  const [prefCountry, setPrefCountry] = useState('Maroc');
  const [prefCity, setPrefCity] = useState('Rabat');
  const [prefCustomCity, setPrefCustomCity] = useState('');
  const [prefLocationString, setPrefLocationString] = useState('');

  const [status, setStatus] = useState<CandidateStatus>('registered');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcul automatique de l'âge et déduction de catégorie Ux
  const calculateAge = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const getSuggestedAgeCategory = (ageVal: number | null): string => {
    if (ageVal === null) return 'U19';
    if (ageVal <= 7) return 'U7';
    if (ageVal <= 9) return 'U9';
    if (ageVal <= 11) return 'U11';
    if (ageVal === 13) return 'U13';
    if (ageVal === 14) return 'U14';
    if (ageVal === 15) return 'U15';
    if (ageVal === 16) return 'U16';
    if (ageVal === 17) return 'U17';
    if (ageVal === 18) return 'U18';
    if (ageVal === 19) return 'U19';
    if (ageVal <= 21) return 'U21';
    if (ageVal <= 23) return 'U23';
    return 'SENIOR';
  };

  const handleBirthDateChange = (dateVal: string) => {
    setBirthDate(dateVal);
    const newAge = calculateAge(dateVal);
    if (newAge !== null && !candidate) {
      setAgeCategory(getSuggestedAgeCategory(newAge));
    }
  };

  const age = calculateAge(birthDate);
  const isMinor = age !== null && age < 18;

  useEffect(() => {
    if (candidate) {
      setPhotoUrl(candidate.photo_url || '');
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

      setPrimaryPosition(formatUnifiedPosition(candidate.primary_position));
      setSecondaryPosition(candidate.secondary_position ? formatUnifiedPosition(candidate.secondary_position) : '');
      setPreferredFoot(candidate.preferred_foot || 'Droitier');
      setHeightCm(candidate.height_cm ?? '');
      setWeightKg(candidate.weight_kg ?? '');
      setAgeCategory(normalizeAgeCategory(candidate.age_category || 'U19'));
      setCurrentClub(candidate.current_club || '');
      setPreviousClubs(candidate.previous_clubs || '');
      setMatchesPlayed(candidate.matches_played ?? '');
      setMinutesPlayed(candidate.minutes_played ?? '');
      setGoals(candidate.goals ?? '');
      setAssists(candidate.assists ?? '');
      setNationalSelections(candidate.national_selections || '');
      setInjuryHistory(candidate.injury_history || '');

      setVideoType(candidate.video_type || (candidate.video_url ? (candidate.video_url.includes('drive.google') ? 'drive' : 'youtube') : 'none'));
      setVideoUrl(candidate.video_url || '');
      setVideoSource((candidate as any).video_source || '');

      setDiscoveringScoutId(candidate.discovering_scout_id || scoutMembers[0]?.id || scouts[0]?.id || '');
      setRecruiterId(candidate.recruiter_id || recruiterMembers[0]?.id || scouts[0]?.id || '');
      
      if (candidate.discovery_location) {
        setDiscoveryLocation(candidate.discovery_location);
        let found = false;
        for (const [cont, countries] of Object.entries(GEOGRAPHY_DATA)) {
          for (const [country, cities] of Object.entries(countries)) {
            const matchedCity = cities.find(ct => candidate.discovery_location?.toLowerCase().includes(ct.toLowerCase()));
            if (matchedCity) {
              setDiscoveryContinent(cont);
              setDiscoveryCountry(country);
              setDiscoveryCity(matchedCity);
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (!found) {
          setDiscoveryContinent('Afrique');
          setDiscoveryCountry('Maroc');
          setDiscoveryCity('Autre');
          setDiscoveryCustomCity(candidate.discovery_location);
        }
      } else {
        setDiscoveryContinent('Afrique');
        setDiscoveryCountry('Maroc');
        setDiscoveryCity('Rabat');
        setDiscoveryCustomCity('');
        setDiscoveryLocation('Rabat, Maroc');
      }

      setDiscoveryMatch(candidate.discovery_match || '');
      setPriority(candidate.recommendation_priority || 'high');
      setInitialScore(candidate.initial_scout_score || 8.0);
      setScoutNotes(candidate.scout_recommendation_notes || '');
      setStatus(candidate.status || 'registered');
      // Zones préférées
      const locs = candidate.preferred_locations || [];
      setPreferredLocations(locs);
      if (locs.length > 0) {
        setPrefLocationString(`[VILLES] ${locs.join(', ')}`);
      }
    } else {
      setPhotoUrl('');
    }
  }, [candidate, isOpen, scouts, scoutMembers, recruiterMembers]);

  const handleContinentChange = (continent: string) => {
    setDiscoveryContinent(continent);
    const countries = Object.keys(GEOGRAPHY_DATA[continent] || {});
    const firstCountry = countries[0] || '';
    setDiscoveryCountry(firstCountry);
    const cities = GEOGRAPHY_DATA[continent]?.[firstCountry] || [];
    const firstCity = cities[0] || 'Autre';
    setDiscoveryCity(firstCity);
    setDiscoveryLocation(firstCity === 'Autre' ? (discoveryCustomCity || firstCountry) : `${firstCity}, ${firstCountry}`);
  };

  const handleCountryChange = (country: string) => {
    setDiscoveryCountry(country);
    const cities = GEOGRAPHY_DATA[discoveryContinent]?.[country] || [];
    const firstCity = cities[0] || 'Autre';
    setDiscoveryCity(firstCity);
    setDiscoveryLocation(firstCity === 'Autre' ? (discoveryCustomCity || country) : `${firstCity}, ${country}`);
  };

  const handleCityChange = (cityVal: string) => {
    setDiscoveryCity(cityVal);
    if (cityVal === 'Autre') {
      setDiscoveryLocation(discoveryCustomCity ? `${discoveryCustomCity}, ${discoveryCountry}` : discoveryCountry);
    } else {
      setDiscoveryLocation(`${cityVal}, ${discoveryCountry}`);
    }
  };

  const handleCustomCityChange = (customVal: string) => {
    setDiscoveryCustomCity(customVal);
    setDiscoveryLocation(customVal ? `${customVal}, ${discoveryCountry}` : discoveryCountry);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const selectedScout = scouts.find(s => s.id === discoveringScoutId);
    const selectedRecruiter = scouts.find(s => s.id === recruiterId);

    setIsSubmitting(true);
    try {
      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        photo_url: photoUrl.trim() || undefined,
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
        discovering_scout_name: selectedScout?.full_name || candidate?.discovering_scout_name || 'Scout FUS',
        recruiter_id: recruiterId || undefined,
        recruiter_name: selectedRecruiter?.full_name || candidate?.recruiter_name || 'Direction Recrutement',
        discovery_location: discoveryLocation || undefined,
        discovery_match: discoveryMatch || undefined,
        recommendation_priority: priority,
        initial_scout_score: Number(initialScore),
        scout_recommendation_notes: scoutNotes || undefined,

        video_type: videoType,
        video_url: videoUrl.trim() || undefined,
        ...(videoSource.trim() ? { video_source: videoSource.trim() } : {}),

        preferred_locations: preferredLocations.length > 0 ? preferredLocations : undefined,

        pipeline_stage: candidate?.pipeline_stage || 'prospect',
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b flex items-start sm:items-center justify-between bg-slate-50/50 rounded-t-2xl">
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
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm">
              <X className="w-4 h-4" /> Annuler
            </button>
        </div>

        {/* Navigation des 4 sous-onglets du formulaire */}
        <div className="flex border-b bg-white px-6 overflow-x-auto gap-2 py-2.5">
          {[
            { id: 'civil', label: '1. État Civil & Contact', icon: User },
            { id: 'sport', label: '2. Profil Sportif & Stats', icon: Shield },
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
        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-6 space-y-4 max-w-4xl mx-auto w-full">
          {/* SECTION 1 : ÉTAT CIVIL & STATUT */}
          {activeSection === 'civil' && (
            <div className="space-y-4">
              {/* Photo Officielle du Joueur */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl border-2 border-slate-300 bg-white overflow-hidden shadow-xs flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Photo joueur"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="w-9 h-9 text-slate-300" />
                    )}
                  </div>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        Photo Officielle du Joueur
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Téléversez une photo nette (portrait face, maillot ou tenue de sport). Formats JPG, PNG, WebP (max 10 Mo).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                      <label className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs",
                        isUploadingPhoto
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary/95 hover:scale-[1.02] active:scale-98 shadow-primary/20"
                      )}>
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Chargement...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{photoUrl ? 'Changer la photo' : 'Téléverser photo'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingPhoto}
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Champ URL direct optionnel */}
                  <div className="pt-1">
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Ou collez directement l'URL d'une image (optionnel)..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] bg-white font-normal text-slate-700 outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Statut du Joueur / Pipeline avec mise en évidence de l'icône */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Statut de la Candidature / Joueur Détecté *
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Sélectionnez l'étape courante
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'registered', label: 'Inscrit', icon: UserCheck, desc: 'Fiche créée' },
                    { id: 'in_trial', label: 'En Test', icon: Zap, desc: 'Essai en cours' },
                    { id: 'selected', label: 'Retenu', icon: Star, desc: 'Validé FUS' },
                    { id: 'on_hold', label: 'En Réserve', icon: Clock, desc: 'Suivi ultérieur' },
                    { id: 'rejected', label: 'Non Retenu', icon: XCircle, desc: 'Clôturé' },
                  ].map((st) => {
                    const Icon = st.icon;
                    const isSelected = status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatus(st.id as CandidateStatus)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5",
                          isSelected
                            ? "bg-white border-primary ring-2 ring-primary/25 shadow-sm font-bold"
                            : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-transform",
                          isSelected
                            ? "bg-primary text-white shadow-md shadow-primary/30 scale-110"
                            : "bg-slate-100 text-slate-400"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={cn("text-[11px] font-bold block leading-tight", isSelected ? "text-primary" : "text-slate-700")}>
                            {st.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground block">{st.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                    onChange={(e) => handleBirthDateChange(e.target.value)}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nationalité (Liste Déroulante)</label>
                  <select
                    value={nationality || 'Maroc'}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white cursor-pointer"
                  >
                    {NATIONALITIES.map(nat => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
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

          {activeSection === 'sport' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Poste Principal *</label>
                  <select
                    value={primaryPosition}
                    onChange={(e) => setPrimaryPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    {UNIFIED_POSITION_OPTIONS.map(p => (
                      <option key={p.code} value={p.full}>
                        {p.full}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Poste Secondaire</label>
                  <select
                    value={secondaryPosition}
                    onChange={(e) => setSecondaryPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
                  >
                    <option value="">-- Aucun (Spécialiste) --</option>
                    {UNIFIED_POSITION_OPTIONS.map(p => (
                      <option key={p.code} value={p.full}>
                        {p.full}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pied Fort *</label>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {(['Droitier', 'Gaucher', 'Ambidextre'] as FootType[]).map(foot => (
                      <button
                        key={foot}
                        type="button"
                        onClick={() => setPreferredFoot(foot)}
                        className={cn(
                          "py-2 text-[11px] font-bold rounded-xl border transition-all truncate px-1",
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
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-white cursor-pointer"
                  >
                    {RECRUITMENT_AGE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                {/* Club Actuel */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">Club Actuel</label>
                    <div className="flex items-center gap-2">
                      {currentClub && opponentClubs.some(c => c.name.toLowerCase() === currentClub.toLowerCase().trim()) && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditClub(currentClub, 'current')}
                          className="text-[10px] font-bold text-slate-600 hover:text-primary flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors"
                          title="Consulter ou modifier la fiche de ce club adversaire"
                        >
                          <Building2 className="w-3 h-3 text-primary" /> Fiche Club
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenAddClub('current')}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Nouveau Club
                      </button>
                    </div>
                  </div>
                  <select
                    value={currentClub}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        handleOpenAddClub('current');
                      } else {
                        setCurrentClub(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white cursor-pointer font-medium"
                  >
                    <option value="">-- Sélectionner le Club Actuel --</option>
                    {opponentClubs.map((club) => (
                      <option key={club.id} value={club.name}>
                        {club.name} ({club.city ? `${club.city}, ` : ''}{club.country || 'Maroc'})
                      </option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-primary">
                      ➕ + Ajouter un nouveau club adversaire...
                    </option>
                  </select>
                </div>

                {/* Clubs Précédents */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">Clubs Précédents / Formation</label>
                    <button
                      type="button"
                      onClick={() => handleOpenAddClub('previous')}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Nouveau Club
                    </button>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        handleOpenAddClub('previous');
                      } else if (e.target.value) {
                        setPreviousClubs(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white cursor-pointer font-medium mb-1"
                  >
                    <option value="">-- Sélectionner un Club à ajouter --</option>
                    {opponentClubs.map((club) => (
                      <option key={club.id} value={club.name}>
                        {club.name} ({club.city ? `${club.city}, ` : ''}{club.country || 'Maroc'})
                      </option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-primary">
                      ➕ + Ajouter un nouveau club adversaire...
                    </option>
                  </select>
                  <input
                    type="text"
                    value={previousClubs}
                    onChange={(e) => setPreviousClubs(e.target.value)}
                    placeholder="Ex: AS FAR, WAC, Académie..."
                    className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 text-[11px] bg-slate-50 font-medium"
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

              {/* Vidéo Highlights & Détection (YouTube ou Google Drive) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-400" />
                    Vidéo Highlights & Détection
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">YouTube ou Google Drive</span>
                </div>

                {/* Sélecteur de type */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setVideoType('none'); setVideoUrl(''); }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                      videoType === 'none'
                        ? "bg-slate-600 text-white border-slate-500 shadow-sm"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-300"
                    )}
                  >
                    Aucun
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('youtube')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                      videoType === 'youtube'
                        ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/40"
                        : "bg-slate-800 text-red-400 border-slate-700 hover:border-red-600/50 hover:text-red-300"
                    )}
                  >
                    {/* YouTube icon */}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Lien YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('drive')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                      videoType === 'drive'
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40"
                        : "bg-slate-800 text-emerald-400 border-slate-700 hover:border-emerald-600/50 hover:text-emerald-300"
                    )}
                  >
                    {/* Drive icon */}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.433 22.396l2.788-4.828H22.5l-2.787 4.828H4.433zm5.023-4.828l-4.3-7.444 7.845-13.58 4.301 7.443-7.846 13.581zM1.5 17.568l4.3-7.444h8.6l-4.3 7.444H1.5z"/>
                    </svg>
                    Google Drive
                  </button>
                </div>

                {/* Champ Source (visible toujours) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Source</label>
                  <input
                    type="text"
                    value={videoSource}
                    onChange={(e) => setVideoSource(e.target.value)}
                    placeholder="Ex: Canal officiel FUS, Match Ligue U17, Tournoi de Marrakech..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-700 border border-slate-600 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 ring-primary/30 focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Champ URL */}
                {videoType !== 'none' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        placeholder={
                          videoType === 'youtube'
                            ? "https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                            : "https://drive.google.com/file/d/.../view?usp=sharing"
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-xs font-mono text-white placeholder:text-slate-500 pr-24 focus:ring-2 ring-primary/30 outline-none focus:border-primary/50 transition-colors"
                      />
                      {videoUrl && (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-600 hover:bg-slate-500 text-[10px] font-bold text-white flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Ouvrir
                        </a>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      {videoType === 'youtube'
                        ? "✦ Collez l'URL YouTube — un aperçu intégré apparaîtra automatiquement ci-dessous."
                        : "✦ Collez le lien de partage Google Drive. Assurez-vous que les droits d'accès sont définis sur « Tous les utilisateurs avec le lien »."}
                    </p>

                    {/* ── YouTube embed full width ─────────────────────── */}
                    {videoType === 'youtube' && extractYouTubeId(videoUrl) && (
                      <div className="rounded-xl overflow-hidden border border-slate-600 bg-black w-full shadow-inner" style={{ aspectRatio: '16/9' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}?rel=0&modestbranding=1`}
                          title="Aperçu Highlights Joueur"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {/* Placeholder si YouTube sans vidéo valide */}
                    {videoType === 'youtube' && videoUrl && !extractYouTubeId(videoUrl) && (
                      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/50 flex flex-col items-center justify-center py-8 gap-2">
                        <svg className="w-8 h-8 text-red-500 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <p className="text-[11px] text-slate-400 font-medium">URL YouTube invalide — vérifiez le lien</p>
                      </div>
                    )}

                    {/* ── Google Drive embed ───────────────────────────── */}
                    {videoType === 'drive' && videoUrl && videoUrl.includes('drive.google.com') && (
                      <div className="rounded-xl overflow-hidden border border-slate-600 bg-black w-full shadow-inner" style={{ aspectRatio: '16/9' }}>
                        <iframe
                          src={videoUrl.replace('/view', '/preview').replace('?usp=sharing', '')}
                          title="Aperçu Google Drive"
                          className="w-full h-full"
                          allow="autoplay"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}
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
          </div>
        </form>
      </div>

      {/* Modal Officiel Complet d'Ajout / Modification de Club Adversaire */}
      {isOpponentModalOpen && (
        <OpponentClubFormModal
          isOpen={isOpponentModalOpen}
          onClose={() => {
            setIsOpponentModalOpen(false);
            setSelectedClubForModal(null);
          }}
          club={selectedClubForModal}
          onSuccess={handleOpponentClubSuccess}
        />
      )}
    </>
  );
};
export default CandidateModal;
