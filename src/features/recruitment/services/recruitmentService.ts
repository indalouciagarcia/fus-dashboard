import { supabase } from '../../../lib/supabase';
import { getMyClubId } from '../../../services/_helpers';
import type {
  Scout,
  TrialCandidate,
  PlayerTest,
  CandidateEvaluation,
  ScoutObservation,
  RecruitmentTimelineEvent,
  RecruitmentDecision,
  PipelineStage
} from '../types/recruitment';

// SCOUTS INITIAL DEMO DATA
const initialMockScouts: Scout[] = [
  {
    id: 'scout-001',
    full_name: 'Hassan Benabicha',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+212 6 61 11 22 33',
    email: 'h.benabicha@fus.ma',
    role_title: 'Directeur du Recrutement & Scouting',
    recruitment_region: 'National / Élite',
    assigned_categories: ['U19', 'U21', 'Équipe Pro'],
    assigned_teams: ['Académie FUS Élite', 'Équipe Réserve'],
    status: 'active',
    recruited_date: '2022-06-01',
    notes: 'Ancien cadre fédéral, réseau très étendu au Maroc et en Afrique subsaharienne.',
  },
  {
    id: 'scout-002',
    full_name: 'Youssef Safri',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+212 6 62 44 55 66',
    email: 'y.safri@fus.ma',
    role_title: 'Scout Principal - Nord & Centre',
    recruitment_region: 'Rabat-Salé-Kénitra & Casablanca',
    assigned_categories: ['U15', 'U17', 'U19'],
    assigned_teams: ['Académie FUS Formation'],
    status: 'active',
    recruited_date: '2023-09-15',
    notes: 'Spécialiste de la détection précoce des milieux et profils techniques.',
  },
  {
    id: 'scout-003',
    full_name: 'Tarik Sektioui',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+212 6 63 77 88 99',
    email: 't.sektioui@fus.ma',
    role_title: 'Scout Régional - Nord & Oriental',
    recruitment_region: 'Tanger-Tétouan & Fès-Meknès',
    assigned_categories: ['U17', 'U19'],
    assigned_teams: ['Académie FUS'],
    status: 'active',
    recruited_date: '2024-01-10',
    notes: 'Veille active sur les championnats régionaux et tournois scolaires.',
  }
];

// CANDIDATES INITIAL DEMO DATA
const initialMockCandidates: TrialCandidate[] = [
  {
    id: 'cand-001',
    first_name: 'Amine',
    last_name: 'El Idrissi',
    birth_date: '2008-04-12',
    birth_place: 'Salé',
    nationality: 'Marocaine',
    gender: 'Masculin',
    primary_position: 'Ailier Gauche',
    secondary_position: 'Attaquant',
    preferred_foot: 'Gaucher',
    height_cm: 178,
    weight_kg: 71,
    age_category: 'U17',
    current_club: 'Académie Mohammed VI',
    previous_clubs: 'AS FAR Jeunes (2020-2022)',
    league_competition: 'Championnat National U17',
    matches_played: 22,
    minutes_played: 1840,
    goals: 14,
    assists: 9,
    yellow_cards: 2,
    red_cards: 0,
    national_selections: 'Équipe Nationale Maroc U17 (4 sélections, 1 but)',
    injury_history: 'Aucune blessure majeure',
    
    // Tuteur (Mineur)
    guardian_name: 'Mohamed El Idrissi',
    guardian_relationship: 'Père',
    guardian_phone: '+212 6 12 34 56 78',
    guardian_email: 'm.elidrissi.famille@gmail.com',
    guardian_address: '14 Rue Al Bassatine, Tabriquet, Salé',
    emergency_contact: 'Khadija El Idrissi (Mère) - +212 6 12 34 56 79',
    guardian_consent_status: 'granted',

    // Découverte
    discovering_scout_id: 'scout-002',
    discovering_scout_name: 'Youssef Safri',
    discovery_date: '2026-07-15',
    discovery_location: 'Stade Municipal de Kénitra',
    discovery_match: 'AMF U17 vs KAC U17',
    recommendation_priority: 'very_high',
    initial_scout_score: 8.8,
    scout_recommendation_notes: 'Pépite offensive, accélération dévastatrice sur premier pas, excellent pied gauche.',

    pipeline_stage: 'shortlisted',
    status: 'in_trial',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cand-002',
    first_name: 'Yassine',
    last_name: 'Benjelloun',
    birth_date: '2006-09-20',
    birth_place: 'Kénitra',
    nationality: 'Marocaine',
    gender: 'Masculin',
    primary_position: 'Milieu Défensif',
    secondary_position: 'Défenseur Central',
    preferred_foot: 'Droitier',
    height_cm: 185,
    weight_kg: 78,
    age_category: 'U19',
    current_club: 'KAC Kénitra (U19)',
    previous_clubs: 'KAC Formation (2018-2024)',
    league_competition: 'Ligue Régionale U19',
    matches_played: 18,
    minutes_played: 1620,
    goals: 3,
    assists: 5,
    yellow_cards: 4,
    red_cards: 0,
    national_selections: 'Présélection Maroc U18',
    
    guardian_name: 'Abdelkader Benjelloun',
    guardian_relationship: 'Père',
    guardian_phone: '+212 6 98 76 54 32',
    guardian_email: 'benjelloun.family@gmail.com',
    guardian_consent_status: 'granted',

    discovering_scout_id: 'scout-001',
    discovering_scout_name: 'Hassan Benabicha',
    discovery_date: '2026-06-28',
    discovery_location: 'Complexe KAC Kénitra',
    discovery_match: 'KAC U19 vs FUS U19',
    recommendation_priority: 'high',
    initial_scout_score: 8.4,
    scout_recommendation_notes: 'Sentinelle très mûre tactiquement, impact physique imposant.',

    pipeline_stage: 'signed',
    status: 'selected',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cand-003',
    first_name: 'Ousmane',
    last_name: 'Traoré',
    birth_date: '2007-11-03',
    birth_place: 'Bamako',
    nationality: 'Malienne',
    gender: 'Masculin',
    primary_position: 'Avant-Centre',
    secondary_position: 'Ailier Droit',
    preferred_foot: 'Ambidextre',
    height_cm: 183,
    weight_kg: 75,
    age_category: 'U19',
    current_club: 'Djoliba AC',
    previous_clubs: 'Académie Bamako Foot',
    league_competition: 'Championnat Jeunes Mali',
    matches_played: 15,
    minutes_played: 1300,
    goals: 16,
    assists: 4,
    national_selections: 'Mali U17 (6 sélections, 4 buts)',

    guardian_name: 'Bakary Traoré (Représentant officiel)',
    guardian_relationship: 'Tuteur / Représentant Légal',
    guardian_phone: '+223 70 11 22 33',
    guardian_email: 'b.traore@management.ml',
    guardian_consent_status: 'granted',

    discovering_scout_id: 'scout-001',
    discovering_scout_name: 'Hassan Benabicha',
    discovery_date: '2026-07-02',
    discovery_location: 'Tournoi International U17 Bamako',
    discovery_match: 'Djoliba U17 vs Stade Malien',
    recommendation_priority: 'very_high',
    initial_scout_score: 8.6,
    scout_recommendation_notes: 'Buteur puissant, finition clinique des deux pieds et très fort dans les 16 mètres.',

    pipeline_stage: 'under_evaluation',
    status: 'in_trial',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cand-004',
    first_name: 'Mehdi',
    last_name: 'Chakir',
    birth_date: '2008-02-18',
    birth_place: 'Témara',
    nationality: 'Marocaine',
    gender: 'Masculin',
    primary_position: 'Latéral Droit',
    secondary_position: 'Milieu Droit',
    preferred_foot: 'Droitier',
    height_cm: 175,
    weight_kg: 68,
    age_category: 'U17',
    current_club: 'Widad Témara (U17)',
    matches_played: 20,
    goals: 2,
    assists: 7,

    guardian_name: 'Mustapha Chakir',
    guardian_relationship: 'Père',
    guardian_phone: '+212 6 55 44 33 22',
    guardian_consent_status: 'granted',

    discovering_scout_id: 'scout-003',
    discovering_scout_name: 'Tarik Sektioui',
    discovery_date: '2026-08-01',
    recommendation_priority: 'medium',
    initial_scout_score: 7.2,

    pipeline_stage: 'test_scheduled',
    status: 'registered',
    created_at: new Date().toISOString(),
  }
];

// TESTS / SESSIONS DEMO DATA
const initialMockTests: PlayerTest[] = [
  {
    id: 'test-001',
    candidate_id: 'cand-001',
    test_name: 'Évaluation Spécifique Vitesse & Match d\'Essai U19',
    test_date: '2026-08-28',
    start_time: '09:30:00',
    end_time: '12:00:00',
    location: 'Complexe Sportif FUS - Terrain Annexe 1',
    training_ground: 'Terrain Synthétique 1',
    target_team: 'Académie FUS U19',
    age_category: 'U19',
    assigned_position: 'Ailier Gauche',
    assigned_coaches: ['Coach Jamal (U19)', 'Préparateur Physique Élite'],
    assigned_scouts: ['Hassan Benabicha', 'Youssef Safri'],
    test_type: 'comprehensive',
    status: 'completed',
    notes: 'Batterie de tests VMA 30-15 + Ateliers finition + Opposition 2x30 min.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'test-002',
    candidate_id: 'cand-004',
    test_name: 'Session Détection Latéraux & Défenseurs U17',
    test_date: '2026-09-04',
    start_time: '15:00:00',
    end_time: '17:30:00',
    location: 'Stade Belvédère - Rabat',
    training_ground: 'Terrain Honneur',
    target_team: 'Académie U17',
    age_category: 'U17',
    assigned_position: 'Latéral Droit',
    assigned_coaches: ['Directeur Académie U17'],
    assigned_scouts: ['Tarik Sektioui'],
    test_type: 'trial_match',
    status: 'scheduled',
    notes: 'Match amical de détection contre l\'équipe réserve U17.',
    created_at: new Date().toISOString(),
  }
];

// EVALUATIONS DEMO DATA (1–10 Scale)
const initialMockEvaluations: CandidateEvaluation[] = [
  {
    id: 'eval-001',
    candidate_id: 'cand-001',
    test_id: 'test-001',
    evaluator_name: 'Hassan Benabicha',
    evaluator_role: 'Directeur Recrutement',
    evaluation_date: '2026-08-28',
    position_evaluated: 'Ailier Gauche',

    // Technique (1–10)
    tech_ball_control: 8.8,
    tech_first_touch: 8.9,
    tech_passing_short: 8.0,
    tech_passing_long: 7.5,
    tech_dribbling: 9.2,
    tech_crossing: 8.2,
    tech_finishing: 8.4,
    tech_heading: 6.8,
    tech_1v1_attacking: 9.4,
    tech_1v1_defending: 6.5,
    tech_weak_foot: 7.0,
    technical_score: 8.3,

    // Physique (1–10)
    phys_acceleration: 9.5,
    phys_sprint_speed: 9.3,
    phys_agility: 9.0,
    phys_balance: 8.2,
    phys_strength: 7.0,
    phys_endurance: 8.4,
    phys_explosiveness: 9.2,
    physical_score: 8.6,

    // Tactique (1–10)
    tact_positioning: 7.8,
    tact_awareness: 8.2,
    tact_decision_making: 8.0,
    tact_anticipation: 8.4,
    tact_space_awareness: 8.6,
    tact_transition: 9.0,
    tactical_score: 8.3,

    // Mental (1–10)
    ment_concentration: 8.0,
    ment_discipline: 8.5,
    ment_motivation: 9.2,
    ment_confidence: 8.5,
    ment_teamwork: 8.0,
    ment_leadership: 7.2,
    ment_coachability: 9.0,
    mental_score: 8.3,

    // Critères Spécifiques Ailier
    pos_specific_1_label: 'Percussion 1v1',
    pos_specific_1_score: 9.4,
    pos_specific_2_label: 'Qualité de Centre',
    pos_specific_2_score: 8.2,
    pos_specific_3_label: 'Vitesse de repli',
    pos_specific_3_score: 7.5,

    // Overall = 8.3*0.30 + 8.6*0.25 + 8.3*0.25 + 8.3*0.20 = 2.49 + 2.15 + 2.075 + 1.66 = 8.38
    overall_score: 8.4,

    verdict: 'shortlist',
    strengths: 'Vitesse de pointe exceptionnelle, élimination en 1v1 irrésistible, grand volume de jeu offensif.',
    weaknesses: 'Repli défensif et concentration dans les temps faibles.',
    comments: 'Profil rare à fort potentiel de revente. Recommandé pour signature contrat stagiaire pro.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'eval-002',
    candidate_id: 'cand-002',
    test_id: 'test-001',
    evaluator_name: 'Youssef Safri',
    evaluator_role: 'Scout Principal',
    evaluation_date: '2026-08-20',
    position_evaluated: 'Milieu Défensif',

    tech_ball_control: 8.2,
    tech_first_touch: 8.0,
    tech_passing_short: 8.8,
    tech_passing_long: 8.5,
    tech_dribbling: 7.4,
    tech_crossing: 6.8,
    tech_finishing: 7.2,
    tech_heading: 8.6,
    tech_1v1_attacking: 7.0,
    tech_1v1_defending: 8.9,
    tech_weak_foot: 7.5,
    technical_score: 8.0,

    phys_acceleration: 7.5,
    phys_sprint_speed: 7.6,
    phys_agility: 7.8,
    phys_balance: 8.8,
    phys_strength: 9.0,
    phys_endurance: 9.2,
    phys_explosiveness: 8.2,
    physical_score: 8.3,

    tact_positioning: 9.2,
    tact_awareness: 8.8,
    tact_decision_making: 8.9,
    tact_anticipation: 9.0,
    tact_space_awareness: 8.6,
    tact_transition: 8.4,
    tactical_score: 8.8,

    ment_concentration: 9.0,
    ment_discipline: 9.5,
    ment_motivation: 9.0,
    ment_confidence: 8.8,
    ment_teamwork: 9.2,
    ment_leadership: 9.0,
    ment_coachability: 9.2,
    mental_score: 9.1,

    pos_specific_1_label: 'Interception & Récupération',
    pos_specific_1_score: 9.1,
    pos_specific_2_label: 'Passe Progressive',
    pos_specific_2_score: 8.6,
    pos_specific_3_label: 'Résistance au Pressing',
    pos_specific_3_score: 8.8,

    overall_score: 8.5,
    verdict: 'signed',
    strengths: 'Leadership naturel, intelligence tactique très au-dessus de la moyenne, impact défensif.',
    weaknesses: 'Vivacité sur les premiers mètres.',
    comments: 'Signé au club pour intégrer l\'équipe réserve avec passerelle équipe première.',
    created_at: new Date().toISOString(),
  }
];

// OBSERVATIONS DEMO DATA
const initialMockObservations: ScoutObservation[] = [
  {
    id: 'obs-001',
    candidate_id: 'cand-001',
    scout_id: 'scout-002',
    scout_name: 'Youssef Safri',
    observation_date: '2026-07-15',
    competition_name: 'Championnat National U17',
    match_name: 'AMF U17 vs KAC U17',
    opponent_name: 'KAC Kénitra',
    location: 'Stade Municipal Kénitra',
    observed_position: 'Ailier Gauche',
    minutes_observed: 85,
    general_impression: 'Joueur ultra-dynamique, a changé le cours de la seconde période à lui seul.',
    strengths: 'Prise de vitesse, changement de direction, frappe enroulée.',
    weaknesses: 'Choix de passe parfois individualiste dans les 25m.',
    potential_rating: 9,
    recommendation_verdict: 'Convocation Immédiate pour Test Académie',
    comments: 'À signer rapidement avant que d\'autres clubs ne se positionnent.',
    created_at: new Date().toISOString(),
  }
];

// TIMELINE DEMO DATA
const initialMockTimeline: RecruitmentTimelineEvent[] = [
  {
    id: 'time-001',
    candidate_id: 'cand-001',
    event_type: 'discovered',
    event_title: 'Joueur Découvert sur le Terrain',
    event_description: 'Observé par Youssef Safri lors du match AMF U17 vs KAC U17.',
    performed_by: 'Youssef Safri (Scout)',
    event_date: '2026-07-15',
    created_at: new Date().toISOString(),
  },
  {
    id: 'time-002',
    candidate_id: 'cand-001',
    event_type: 'recommended',
    event_title: 'Recommandation Prioritaire Validée',
    event_description: 'Fiche transmise à la Direction du Recrutement avec mention Priorité Très Haute.',
    performed_by: 'Hassan Benabicha',
    event_date: '2026-07-18',
    created_at: new Date().toISOString(),
  },
  {
    id: 'time-003',
    candidate_id: 'cand-001',
    event_type: 'tested',
    event_title: 'Session de Test Réalisée avec Succès',
    event_description: 'Test complet VMA et match d\'opposition réalisé au Complexe FUS.',
    performed_by: 'Staff Technique U19',
    event_date: '2026-08-28',
    created_at: new Date().toISOString(),
  },
  {
    id: 'time-004',
    candidate_id: 'cand-001',
    event_type: 'evaluated',
    event_title: 'Évaluation 4 Piliers Enregistrée (Note 8.4/10)',
    event_description: 'Score technique 8.3/10, physique 8.6/10, tactique 8.3/10, mental 8.3/10.',
    performed_by: 'Hassan Benabicha',
    event_date: '2026-08-28',
    created_at: new Date().toISOString(),
  }
];

// Storage keys
const KEY_SCOUTS = 'fus_rec_scouts_v2';
const KEY_CANDIDATES = 'fus_rec_candidates_v2';
const KEY_TESTS = 'fus_rec_tests_v2';
const KEY_EVALS = 'fus_rec_evaluations_v2';
const KEY_OBS = 'fus_rec_observations_v2';
const KEY_TIMELINE = 'fus_rec_timeline_v2';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch (_) {}
  return fallback;
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

export const recruitmentService = {
  // 1. SCOUTS
  async getScouts(): Promise<Scout[]> {
    try {
      const { data, error } = await supabase.from('scouts').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
  },

  async createScout(scout: Omit<Scout, 'id' | 'created_at' | 'updated_at'>): Promise<Scout> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `scout-${Date.now()}`;
    const newScout: Scout = { ...scout, id: newId, created_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('scouts').insert([newScout]).select().single();
      if (!error && data) return data;
    } catch (_) {}
    const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
    const updated = [newScout, ...list];
    setLocal(KEY_SCOUTS, updated);
    return newScout;
  },

  async updateScout(id: string, updates: Partial<Scout>): Promise<Scout> {
    try {
      const { data, error } = await supabase.from('scouts').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (_) {}
    const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
    const updated = list.map(s => s.id === id ? { ...s, ...updates } : s);
    setLocal(KEY_SCOUTS, updated);
    return updated.find(s => s.id === id)!;
  },

  async deleteScout(id: string): Promise<void> {
    try {
      await supabase.from('scouts').delete().eq('id', id);
    } catch (_) {}
    const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
    setLocal(KEY_SCOUTS, list.filter(s => s.id !== id));
  },

  // 2. CANDIDATES & PIPELINE
  async getCandidates(): Promise<TrialCandidate[]> {
    try {
      const { data, error } = await supabase
        .from('trial_candidates')
        .select('*, evaluations:player_evaluations(*), observations:scout_observations(*)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return getLocal<TrialCandidate[]>(KEY_CANDIDATES, initialMockCandidates);
  },

  async createCandidate(candidate: Omit<TrialCandidate, 'id' | 'created_at' | 'updated_at'>): Promise<TrialCandidate> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cand-${Date.now()}`;
    const newCand: TrialCandidate = {
      ...candidate,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from('trial_candidates').insert([newCand]).select().single();
      if (!error && data) return data;
    } catch (_) {}
    const list = getLocal<TrialCandidate[]>(KEY_CANDIDATES, initialMockCandidates);
    const updated = [newCand, ...list];
    setLocal(KEY_CANDIDATES, updated);

    // Auto-create initial timeline event
    await this.addTimelineEvent({
      candidate_id: newId,
      event_type: 'discovered',
      event_title: 'Profil Candidat Enregistré',
      event_description: `Candidat enregistré en statut ${candidate.pipeline_stage}.`,
      performed_by: candidate.discovering_scout_name || 'Cellule Recrutement',
      event_date: new Date().toISOString().split('T')[0],
    });

    return newCand;
  },

  async updateCandidate(id: string, updates: Partial<TrialCandidate>): Promise<TrialCandidate> {
    try {
      const { data, error } = await supabase.from('trial_candidates').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (_) {}
    const list = getLocal<TrialCandidate[]>(KEY_CANDIDATES, initialMockCandidates);
    const updated = list.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    setLocal(KEY_CANDIDATES, updated);
    return updated.find(c => c.id === id)!;
  },

  async updatePipelineStage(id: string, stage: PipelineStage, reason?: string): Promise<TrialCandidate> {
    const cand = await this.updateCandidate(id, { pipeline_stage: stage });
    await this.addTimelineEvent({
      candidate_id: id,
      event_type: stage,
      event_title: `Transition Pipeline : ${stage.replace('_', ' ').toUpperCase()}`,
      event_description: reason || `Le joueur est passé à l'étape ${stage}.`,
      performed_by: 'Staff Recrutement',
      event_date: new Date().toISOString().split('T')[0],
    });
    return cand;
  },

  async deleteCandidate(id: string): Promise<void> {
    try {
      await supabase.from('trial_candidates').delete().eq('id', id);
    } catch (_) {}
    const list = getLocal<TrialCandidate[]>(KEY_CANDIDATES, initialMockCandidates);
    setLocal(KEY_CANDIDATES, list.filter(c => c.id !== id));
  },

  // 3. TESTS
  async getTests(): Promise<PlayerTest[]> {
    try {
      const { data, error } = await supabase.from('player_tests').select('*').order('test_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return getLocal<PlayerTest[]>(KEY_TESTS, initialMockTests);
  },

  async createTest(test: Omit<PlayerTest, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerTest> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `test-${Date.now()}`;
    const newTest: PlayerTest = { ...test, id: newId, created_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('player_tests').insert([newTest]).select().single();
      if (!error && data) return data;
    } catch (_) {}
    const list = getLocal<PlayerTest[]>(KEY_TESTS, initialMockTests);
    const updated = [newTest, ...list];
    setLocal(KEY_TESTS, updated);

    if (test.candidate_id) {
      await this.addTimelineEvent({
        candidate_id: test.candidate_id,
        event_type: 'test_scheduled',
        event_title: `Test Planifié : ${test.test_name}`,
        event_description: `Session prévue le ${test.test_date} à ${test.location}.`,
        performed_by: 'Direction Technique',
        event_date: test.test_date,
      });
    }
    return newTest;
  },

  // 4. EVALUATIONS (1–10 Scale, 4 Pillars with Weights)
  async getEvaluations(): Promise<CandidateEvaluation[]> {
    try {
      const { data, error } = await supabase.from('player_evaluations').select('*, candidate:trial_candidates(*)').order('evaluation_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return getLocal<CandidateEvaluation[]>(KEY_EVALS, initialMockEvaluations);
  },

  async saveEvaluation(evaluation: Omit<CandidateEvaluation, 'id' | 'created_at'>): Promise<CandidateEvaluation> {
    // Calcul weighted score : Tech 30%, Phys 25%, Tact 25%, Ment 20%
    const overall = (
      evaluation.technical_score * 0.30 +
      evaluation.physical_score * 0.25 +
      evaluation.tactical_score * 0.25 +
      evaluation.mental_score * 0.20
    );

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eval-${Date.now()}`;
    const newEval: CandidateEvaluation = {
      ...evaluation,
      id: newId,
      overall_score: Math.round(overall * 10) / 10,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('player_evaluations').insert([newEval]).select().single();
      if (!error && data) return data;
    } catch (_) {}

    const list = getLocal<CandidateEvaluation[]>(KEY_EVALS, initialMockEvaluations);
    const existingIdx = list.findIndex(e => e.candidate_id === evaluation.candidate_id);
    let updated: CandidateEvaluation[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = newEval;
    } else {
      updated = [newEval, ...list];
    }
    setLocal(KEY_EVALS, updated);

    // Auto-log in timeline
    await this.addTimelineEvent({
      candidate_id: evaluation.candidate_id,
      event_type: 'evaluated',
      event_title: `Évaluation 1–10 Validée : Note ${newEval.overall_score}/10`,
      event_description: `Par ${evaluation.evaluator_name}. Verdict : ${evaluation.verdict}.`,
      performed_by: evaluation.evaluator_name,
      event_date: evaluation.evaluation_date,
    });

    return newEval;
  },

  // 5. OBSERVATIONS
  async getObservations(): Promise<ScoutObservation[]> {
    try {
      const { data, error } = await supabase.from('scout_observations').select('*').order('observation_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return getLocal<ScoutObservation[]>(KEY_OBS, initialMockObservations);
  },

  async createObservation(obs: Omit<ScoutObservation, 'id' | 'created_at'>): Promise<ScoutObservation> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `obs-${Date.now()}`;
    const newObs: ScoutObservation = { ...obs, id: newId, created_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('scout_observations').insert([newObs]).select().single();
      if (!error && data) return data;
    } catch (_) {}
    const list = getLocal<ScoutObservation[]>(KEY_OBS, initialMockObservations);
    const updated = [newObs, ...list];
    setLocal(KEY_OBS, updated);

    await this.addTimelineEvent({
      candidate_id: obs.candidate_id,
      event_type: 'scouted',
      event_title: `Rapport d'Observation Match (${obs.match_name || 'Observation'})`,
      event_description: `Potentiel évalué à ${obs.potential_rating}/10 par ${obs.scout_name || 'Scout'}.`,
      performed_by: obs.scout_name || 'Scout',
      event_date: obs.observation_date,
    });
    return newObs;
  },

  // 6. TIMELINE
  async getTimeline(candidateId?: string): Promise<RecruitmentTimelineEvent[]> {
    const all = getLocal<RecruitmentTimelineEvent[]>(KEY_TIMELINE, initialMockTimeline);
    if (candidateId) {
      return all.filter(t => t.candidate_id === candidateId);
    }
    return all;
  },

  async addTimelineEvent(event: Omit<RecruitmentTimelineEvent, 'id' | 'created_at'>): Promise<RecruitmentTimelineEvent> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `time-${Date.now()}`;
    const newEvent: RecruitmentTimelineEvent = { ...event, id: newId, created_at: new Date().toISOString() };
    try {
      await supabase.from('recruitment_timeline').insert([newEvent]);
    } catch (_) {}
    const list = getLocal<RecruitmentTimelineEvent[]>(KEY_TIMELINE, initialMockTimeline);
    const updated = [newEvent, ...list];
    setLocal(KEY_TIMELINE, updated);
    return newEvent;
  },

  // 7. SQUAD INTEGRATION (Recruitment -> Players Table Sync)
  async integrateCandidateToSquad(candidateId: string, teamId?: string): Promise<{ success: boolean; message: string; player?: any }> {
    const candidates = await this.getCandidates();
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Candidat introuvable');

    await this.updateCandidate(candidateId, {
      pipeline_stage: 'signed',
      status: 'selected',
    });

    const clubId = await getMyClubId();
    const fullName = `${candidate.first_name} ${candidate.last_name}`;

    let prefFoot: 'right' | 'left' | 'both' = 'right';
    if (candidate.preferred_foot === 'Gaucher') prefFoot = 'left';
    else if (candidate.preferred_foot === 'Ambidextre') prefFoot = 'both';

    let pos = candidate.primary_position || 'FW';
    if (pos.toLowerCase().includes('gardien')) pos = 'GK';
    else if (pos.toLowerCase().includes('défenseur') || pos.toLowerCase().includes('latéral') || pos.toLowerCase().includes('central')) pos = 'DF';
    else if (pos.toLowerCase().includes('milieu') || pos.toLowerCase().includes('sentinelle') || pos.toLowerCase().includes('meneur')) pos = 'MF';
    else if (pos.toLowerCase().includes('ailier') || pos.toLowerCase().includes('attaquant') || pos.toLowerCase().includes('centre')) pos = 'FW';

    try {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('club_id', clubId)
        .ilike('full_name', fullName)
        .maybeSingle();

      if (existingPlayer) {
        return { success: true, message: `${fullName} est déjà présent dans l'effectif officiel.`, player: existingPlayer };
      }

      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert([{
          club_id: clubId,
          team_id: teamId || null,
          full_name: fullName,
          birth_date: candidate.birth_date || null,
          nationality: candidate.nationality || 'Maroc',
          height: candidate.height_cm || 175,
          weight: candidate.weight_kg || 68,
          preferred_foot: prefFoot,
          position: pos,
          jersey_number: Math.floor(Math.random() * 80) + 10,
          photo_url: candidate.photo_url || null,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      await this.addTimelineEvent({
        candidate_id: candidateId,
        event_type: 'signed',
        event_title: `Signature & Intégration à l'Effectif Officiel`,
        event_description: `Le joueur ${fullName} a officiellement signé et a été intégré à l'effectif du club.`,
        performed_by: 'Cellule Recrutement & Direction Sportive',
        event_date: new Date().toISOString().split('T')[0],
      });

      return { success: true, message: `${fullName} intégré avec succès dans l'effectif officiel !`, player: newPlayer };
    } catch (err: any) {
      console.error('Error integrating candidate to squad:', err);
      return { success: false, message: err.message || 'Erreur lors de l\'intégration' };
    }
  },

  async syncAllSignedCandidatesToSquad(teamId?: string): Promise<{ added: number; total: number; message: string }> {
    const candidates = await this.getCandidates();
    const signedCandidates = candidates.filter(c => ['signed', 'academy', 'selected'].includes(c.pipeline_stage) || c.status === 'selected');

    let count = 0;
    for (const c of signedCandidates) {
      const res = await this.integrateCandidateToSquad(c.id, teamId);
      if (res.success && res.player) count++;
    }

    return {
      added: count,
      total: signedCandidates.length,
      message: `${count} recrue(s) signée(s) synchronisée(s) avec succès dans l'effectif officiel.`,
    };
  }
};
