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
  const [activeSection, setActiveSection] = useState<'civil' | 'guardian' | 'sport' | 'scout'>('civil');

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
            { id: 'scout', label: '4. Découverte (Scout & Recruteur)', icon: Sparkles },
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Statut du Consentement Parental (Cadre Légal & Tuteurs) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsentStatus('granted')}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex items-center gap-3",
                        consentStatus === 'granted'
                          ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-950 font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform",
                        consentStatus === 'granted'
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-110"
                          : "bg-slate-100 text-slate-400"
                      )}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black leading-tight text-emerald-950">Accord Accordé</div>
                        <div className="text-[10px] text-emerald-700/80 font-medium">Consentement signé & validé</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsentStatus('pending')}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex items-center gap-3",
                        consentStatus === 'pending'
                          ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/30 text-amber-950 font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform",
                        consentStatus === 'pending'
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-110"
                          : "bg-slate-100 text-slate-400"
                      )}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black leading-tight text-amber-950">En Attente</div>
                        <div className="text-[10px] text-amber-700/80 font-medium">Dossier en cours de signature</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsentStatus('refused')}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex items-center gap-3",
                        consentStatus === 'refused'
                          ? "bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/30 text-rose-950 font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform",
                        consentStatus === 'refused'
                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-110"
                          : "bg-slate-100 text-slate-400"
                      )}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black leading-tight text-rose-950">Refusé</div>
                        <div className="text-[10px] text-rose-700/80 font-medium">Refus formel des tuteurs</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3 : PROFIL SPORTIF & STATS */}
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
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-red-50/20 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-primary" /> Vidéo Highlights & Détection (YouTube ou Google Drive)
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">Lien vidéo joueur</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setVideoType('none'); setVideoUrl(''); }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      videoType === 'none'
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Aucun
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('youtube')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                      videoType === 'youtube'
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Lien YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('drive')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                      videoType === 'drive'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Google Drive
                  </button>
                </div>

                {videoType !== 'none' && (
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        placeholder={videoType === 'youtube' ? "https://www.youtube.com/watch?v=... ou https://youtu.be/..." : "https://drive.google.com/file/d/.../view?usp=sharing"}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono pr-24 focus:ring-2 ring-primary/20 outline-none"
                      />
                      {videoUrl && (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Tester
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {videoType === 'youtube'
                        ? "Collez l'URL de la vidéo YouTube (match complet ou highlights). Elle sera lisible directement dans la fiche joueur."
                        : "Collez le lien de partage Google Drive de la vidéo. Assurez-vous que les droits d'accès sont ouverts."}
                    </p>

                    {/* YouTube live preview */}
                    {videoType === 'youtube' && extractYouTubeId(videoUrl) && (
                      <div className="mt-2 rounded-xl overflow-hidden border aspect-video max-w-sm bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                          title="Aperçu Highlights"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4 : DÉCOUVERTE & SCOUTING / RECRUTEMENT */}
          {activeSection === 'scout' && (
            <div className="space-y-6">
              {/* Binôme Terrain & Recrutement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Scout Découvreur */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800">Scout Observateur</h4>
                      <p className="text-[10px] text-muted-foreground">Détection & observation terrain</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Scout Découvreur *</label>
                    <select
                      value={discoveringScoutId}
                      onChange={(e) => setDiscoveringScoutId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                    >
                      <option value="">Sélectionner un scout...</option>
                      {scoutMembers.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.recruitment_region || s.role_title})</option>
                      ))}
                    </select>
                  </div>

                  {/* Lieu de Découverte : Cascades Continent ➔ Pays ➔ Ville */}
                  <div className="space-y-2 p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Lieu de Découverte (Géographie) *
                      </label>
                      <span className="text-[10px] font-bold text-primary truncate max-w-[180px]">
                        {discoveryLocation || 'Non renseigné'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Continent</label>
                        <select
                          value={discoveryContinent}
                          onChange={(e) => handleContinentChange(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 cursor-pointer font-medium"
                        >
                          {Object.keys(GEOGRAPHY_DATA).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Pays</label>
                        <select
                          value={discoveryCountry}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 cursor-pointer font-medium"
                        >
                          {discoveryContinent && GEOGRAPHY_DATA[discoveryContinent] && Object.keys(GEOGRAPHY_DATA[discoveryContinent]).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Ville</label>
                        <select
                          value={discoveryCity}
                          onChange={(e) => handleCityChange(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 cursor-pointer font-medium"
                        >
                          {discoveryContinent && discoveryCountry && GEOGRAPHY_DATA[discoveryContinent]?.[discoveryCountry]?.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                          <option value="Autre">Autre (Personnalisée)</option>
                        </select>
                      </div>
                    </div>

                    {discoveryCity === 'Autre' && (
                      <div className="pt-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">Préciser la ville</label>
                        <input
                          type="text"
                          value={discoveryCustomCity}
                          onChange={(e) => handleCustomCityChange(e.target.value)}
                          placeholder="Nom de la ville / localité..."
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Match Observé / Tournoi</label>
                    <input
                      type="text"
                      value={discoveryMatch}
                      onChange={(e) => setDiscoveryMatch(e.target.value)}
                      placeholder="Ex: Finale U17, Tournoi International..."
                      className="w-full px-3 py-1.5 rounded-xl border text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Note Initiale du Scout (1 à 10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={initialScore}
                      onChange={(e) => setInitialScore(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border text-xs font-black text-blue-600 bg-white"
                    />
                  </div>
                </div>

                {/* 2. Recruteur Référent */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-950">Recruteur Référent</h4>
                      <p className="text-[10px] text-amber-800/80">Instruction administrative & négociation</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1">Recruteur en Charge du Dossier *</label>
                    <select
                      value={recruiterId}
                      onChange={(e) => setRecruiterId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-medium"
                    >
                      <option value="">Sélectionner un recruteur...</option>
                      {recruiterMembers.map(r => (
                        <option key={r.id} value={r.id}>{r.full_name} ({r.role_title})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-950 mb-1">Priorité de Recommandation *</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-black"
                    >
                      <option value="very_high">🔥 Très Haute (Priorité 1)</option>
                      <option value="high">⭐ Haute (Priorité 2)</option>
                      <option value="medium">🟡 Moyenne</option>
                      <option value="low">⚪ Faible</option>
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-100/50 border border-amber-200/70 text-[10px] text-amber-900 font-medium">
                    ⚡ Le recruteur référent coordonne la relation avec la famille, le club d'origine et la signature de la convention.
                  </div>
                </div>
              </div>

              {/* Commentaires & Synthèse */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Commentaires & Recommandation Métier</label>
                <textarea
                  rows={3}
                  value={scoutNotes}
                  onChange={(e) => setScoutNotes(e.target.value)}
                  placeholder="Arguments clés de recrutement, qualités distinctives, potentiel estimé..."
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
    </div>
  );
};
export default CandidateModal;
