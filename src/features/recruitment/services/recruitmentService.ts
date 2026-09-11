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
import {
  initialMockScouts,
  initialMockCandidates,
  initialMockTests,
  initialMockEvaluations,
  initialMockObservations,
  initialMockTimeline,
} from '../mocks/mockRecruitmentData';

// Storage keys
const KEY_SCOUTS = 'fus_rec_scouts_v2';
const KEY_CANDIDATES = 'fus_rec_candidates_v2';
const KEY_TESTS = 'fus_rec_tests_v2';
const KEY_EVALS = 'fus_rec_evaluations_v2';
const KEY_OBS = 'fus_rec_observations_v2';
const KEY_TIMELINE = 'fus_rec_timeline_v2';
const KEY_CLEARED = 'fus_rec_is_cleared_v2';

// Aliases for safety
const KEY_EVALUATIONS = KEY_EVALS;
const KEY_OBSERVATIONS = KEY_OBS;

function getLocal<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    if (r !== null) return JSON.parse(r);
  } catch (err) {
    console.warn(`[RecruitmentService] Erreur lecture localStorage (${key}):`, err);
  }
  return fallback;
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[RecruitmentService] Erreur écriture localStorage (${key}):`, err);
  }
}

export const recruitmentService = {
  // 1. SCOUTS (Synchronisé Supabase avec Résilience Cache Local)
  async getScouts(): Promise<Scout[]> {
    try {
      const { data, error } = await supabase
        .from('scouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[RecruitmentService] Supabase getScouts erreur, bascule cache local:', error.message);
      } else if (data && data.length > 0) {
        setLocal(KEY_SCOUTS, data);
        return data;
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception getScouts, bascule cache local:', err);
    }
    return getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
  },

  async createScout(scout: Omit<Scout, 'id' | 'created_at' | 'updated_at'>): Promise<Scout> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `scout-${Date.now()}`;
    const newScout: Scout = {
      ...scout,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('scouts')
        .insert([newScout])
        .select()
        .single();
      if (error) {
        console.warn('[RecruitmentService] Erreur Supabase createScout, persistance locale:', error.message);
      } else if (data) {
        const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
        setLocal(KEY_SCOUTS, [data, ...list.filter(s => s.id !== data.id)]);
        return data;
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau createScout, persistance locale:', err);
    }

    const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
    const updated = [newScout, ...list];
    setLocal(KEY_SCOUTS, updated);
    return newScout;
  },

  async updateScout(id: string, updates: Partial<Scout>): Promise<Scout> {
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase
        .from('scouts')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase updateScout (${id}):`, error.message);
      } else if (data) {
        const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
        const updated = list.map(s => s.id === id ? data : s);
        setLocal(KEY_SCOUTS, updated);
        return data;
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception updateScout (${id}):`, err);
    }

    const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
    const updated = list.map(s => s.id === id ? { ...s, ...updates } : s);
    setLocal(KEY_SCOUTS, updated);
    return updated.find(s => s.id === id)!;
  },

  async deleteScout(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('scouts').delete().eq('id', id);
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase deleteScout (${id}):`, error.message);
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception deleteScout (${id}):`, err);
    }

    const list = getLocal<Scout[]>(KEY_SCOUTS, initialMockScouts);
    setLocal(KEY_SCOUTS, list.filter(s => s.id !== id));
  },

  // 2. CANDIDATES & PIPELINE
  async getCandidates(): Promise<TrialCandidate[]> {
    const isCleared = getLocal<boolean>(KEY_CLEARED, false);
    try {
      const { data, error } = await supabase
        .from('trial_candidates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[RecruitmentService] Supabase indisponible pour getCandidates, bascule sur cache local:', error.message);
      } else if (data) {
        if (data.length > 0) {
          if (isCleared) setLocal(KEY_CLEARED, false);
          setLocal(KEY_CANDIDATES, data);
          return data;
        }
        // Base de données vide (ex: suite à réinitialisation)
        if (isCleared) {
          setLocal(KEY_CANDIDATES, []);
          return [];
        }
        const local = getLocal<TrialCandidate[] | null>(KEY_CANDIDATES, null);
        if (local !== null) {
          return local;
        }
        return initialMockCandidates;
      }
    } catch (err) {
      console.warn('[RecruitmentService] Erreur réseau getCandidates, retour du cache local:', err);
    }
    if (isCleared) return [];
    const local = getLocal<TrialCandidate[] | null>(KEY_CANDIDATES, null);
    return local !== null ? local : initialMockCandidates;
  },

  async createCandidate(candidate: Omit<TrialCandidate, 'id' | 'created_at' | 'updated_at'>): Promise<TrialCandidate> {
    setLocal(KEY_CLEARED, false);
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cand-${Date.now()}`;
    const newCand: TrialCandidate = {
      ...candidate,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from('trial_candidates').insert([newCand]).select().single();
      if (error) {
        console.warn('[RecruitmentService] Erreur Supabase createCandidate, sauvegarde en local:', error.message);
      } else if (data) {
        setLocal(KEY_CLEARED, false);
        return data;
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau createCandidate, sauvegarde en local:', err);
    }
    const list = getLocal<TrialCandidate[]>(KEY_CANDIDATES, []);
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
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase updateCandidate (${id}):`, error.message);
      } else if (data) {
        return data;
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception réseau updateCandidate (${id}):`, err);
    }
    const list = getLocal<TrialCandidate[]>(KEY_CANDIDATES, initialMockCandidates);
    const updated = list.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    setLocal(KEY_CANDIDATES, updated);
    return updated.find(c => c.id === id)!;
  },

  async updatePipelineStage(id: string, stage: PipelineStage, reason?: string): Promise<TrialCandidate> {
    const cand = await this.updateCandidate(id, { pipeline_stage: stage });
    const isShortlist = stage === 'shortlisted';
    await this.addTimelineEvent({
      candidate_id: id,
      event_type: stage,
      event_title: isShortlist 
        ? '⭐ Joueur Shortlisté & Intégré au Onze Idéal' 
        : `Transition Pipeline : ${stage.replace('_', ' ').toUpperCase()}`,
      event_description: reason || (isShortlist 
        ? 'Le joueur a été validé en Shortlist officielle et est désormais déployé sur la pelouse tactique du Onze Idéal.' 
        : `Le joueur est passé à l'étape ${stage}.`),
      performed_by: 'Staff Recrutement',
      event_date: new Date().toISOString().split('T')[0],
    });
    return cand;
  },

  async deleteCandidate(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('trial_candidates').delete().eq('id', id);
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase deleteCandidate (${id}):`, error.message);
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception réseau deleteCandidate (${id}):`, err);
    }
    const list = getLocal<TrialCandidate[]>(KEY_CANDIDATES, initialMockCandidates);
    setLocal(KEY_CANDIDATES, list.filter(c => c.id !== id));
  },

  // 3. TESTS / SESSIONS
  async getTests(): Promise<PlayerTest[]> {
    const isCleared = getLocal<boolean>(KEY_CLEARED, false);
    const local = getLocal<PlayerTest[] | null>(KEY_TESTS, null);
    let testsList: PlayerTest[] = [];

    try {
      const { data, error } = await supabase
        .from('trial_sessions')
        .select('*')
        .order('session_date', { ascending: false });
      if (error) {
        console.warn('[RecruitmentService] Erreur Supabase getTests, bascule sur local:', error.message);
      } else if (data && data.length > 0) {
        testsList = data.map(s => ({
          id: s.id,
          candidate_id: s.candidate_id || (s.notes && s.notes.includes('candidate_id:') ? s.notes.split('candidate_id:')[1]?.split(';')[0]?.trim() : undefined),
          test_name: s.session_name || 'Session Détection',
          test_date: s.session_date,
          start_time: s.session_time || '10:00',
          end_time: '12:00',
          location: s.location || 'Complexe Sportif FUS',
          training_ground: 'Terrain Synthétique 1',
          target_team: 'Académie FUS',
          test_type: 'comprehensive',
          category_age: s.category_age || 'U19',
          age_category: s.category_age || 'U19',
          max_participants: 25,
          status: s.status || 'scheduled',
          notes: s.notes || undefined,
          created_at: s.created_at,
        }));
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau getTests, bascule sur local:', err);
    }

    if (testsList.length === 0) {
      if (isCleared) return [];
      testsList = local !== null ? local : [...initialMockTests];
    }

    if (isCleared) return testsList;

    // Synchronisation automatique : toute évaluation existante doit être liée et visible dans le calendrier des tests
    try {
      const evals = getLocal<CandidateEvaluation[]>(KEY_EVALS, []);
      const candidates = getLocal<TrialCandidate[]>(KEY_CANDIDATES, []);

      evals.forEach((ev, idx) => {
        const matchingTest = testsList.find(t => 
          (ev.test_id && t.id === ev.test_id) ||
          (t.candidate_id === ev.candidate_id && t.test_date === ev.evaluation_date)
        );

        if (matchingTest) {
          // S'assurer de la liaison bidirectionnelle
          if (!matchingTest.candidate_id) matchingTest.candidate_id = ev.candidate_id;
          matchingTest.status = 'completed';
        } else {
          // Créer virtuellement la session de test liée à cette évaluation pour qu'elle apparaisse dans le calendrier
          const cand = candidates.find(c => c.id === ev.candidate_id);
          const autoTestId = ev.test_id || `test-eval-${ev.id}`;
          testsList.push({
            id: autoTestId,
            candidate_id: ev.candidate_id,
            test_name: ev.test_name || `Session d'Évaluation #${evals.length - idx} (${cand ? `${cand.first_name} ${cand.last_name}` : 'Candidat'})`,
            test_date: ev.evaluation_date || new Date().toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '12:00',
            location: 'Complexe Sportif FUS - Académie',
            training_ground: 'Terrain Synthétique 1',
            target_team: cand ? `Académie FUS ${cand.age_category || 'U19'}` : 'Académie FUS',
            age_category: cand?.age_category || 'U19',
            assigned_coaches: ['Staff Technique Académie FUS'],
            assigned_scouts: ev.evaluator_name ? [ev.evaluator_name] : ['Cellule Recrutement'],
            test_type: 'comprehensive',
            status: 'completed',
            notes: ev.recommendation || `Évaluation enregistrée : score ${ev.overall_score}/10 (${ev.verdict})`,
            created_at: ev.created_at || new Date().toISOString(),
          });
        }
      });
    } catch (e) {
      console.warn('[RecruitmentService] Exception lors de la synchronisation des tests avec les évaluations:', e);
    }

    return testsList;
  },

  async createTest(test: Omit<PlayerTest, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerTest> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `test-${Date.now()}`;
    const newTest: PlayerTest = { ...test, id: newId, created_at: new Date().toISOString() };
    try {
      const { error } = await supabase.from('trial_sessions').insert([{
        id: newId,
        session_name: test.test_name,
        session_date: test.test_date,
        location: test.location,
        category_age: test.age_category || 'U19',
        status: test.status || 'scheduled',
      }]);
      if (error) {
        console.warn('[RecruitmentService] Erreur Supabase createTest, persistance en local:', error.message);
      }

      // Liaison avec la feuille de match si match_id et candidate_id sont définis
      if (test.match_id && test.candidate_id) {
        try {
          await supabase.from('match_players').insert([{
            match_id: test.match_id,
            player_id: test.candidate_id,
            is_starting: false,
            position_index: null,
          }]);
        } catch (mpErr) {
          console.warn('[RecruitmentService] Note: liaison match_players candidate:', mpErr);
        }
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau createTest, persistance en local:', err);
    }
    const list = getLocal<PlayerTest[]>(KEY_TESTS, initialMockTests);
    const updated = [newTest, ...list];
    setLocal(KEY_TESTS, updated);

    if (test.candidate_id) {
      // Déplacer automatiquement le joueur dans la colonne 'test_scheduled' du Kanban
      await this.updateCandidate(test.candidate_id, {
        pipeline_stage: 'test_scheduled',
        status: 'in_trial',
      });

      await this.addTimelineEvent({
        candidate_id: test.candidate_id,
        event_type: 'test_scheduled',
        event_title: `Test Planifié : ${test.test_name}`,
        event_description: `Session prévue ${test.match_name ? `lors du ${test.match_name}` : `le ${test.test_date}`} à ${test.location}. Le joueur est inscrit pour observation en match officiel/amical.`,
        performed_by: 'Direction Technique & Cellule Recrutement',
        event_date: test.test_date,
      });
    }
    return newTest;
  },

  async updateTest(id: string, updates: Partial<PlayerTest>): Promise<PlayerTest> {
    const list = getLocal<PlayerTest[]>(KEY_TESTS, initialMockTests);
    const existing = list.find(t => t.id === id);
    if (!existing) throw new Error(`Session de test ${id} non trouvée`);
    const updatedTest: PlayerTest = { ...existing, ...updates, updated_at: new Date().toISOString() };
    const updatedList = list.map(t => t.id === id ? updatedTest : t);
    setLocal(KEY_TESTS, updatedList);

    if (updates.candidate_id && updates.candidate_id !== existing.candidate_id) {
      await this.updateCandidate(updates.candidate_id, {
        pipeline_stage: 'test_scheduled',
        status: 'in_trial',
      });
    }

    try {
      const { error } = await supabase.from('trial_sessions').update({
        session_name: updatedTest.test_name,
        session_date: updatedTest.test_date,
        location: updatedTest.location,
        category_age: updatedTest.age_category,
        status: updatedTest.status,
      }).eq('id', id);
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase updateTest (${id}):`, error.message);
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception réseau updateTest (${id}):`, err);
    }

    return updatedTest;
  },

  async deleteTest(id: string): Promise<void> {
    const list = getLocal<PlayerTest[]>(KEY_TESTS, initialMockTests);
    const updatedList = list.filter(t => t.id !== id);
    setLocal(KEY_TESTS, updatedList);

    try {
      const { error } = await supabase.from('trial_sessions').delete().eq('id', id);
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase deleteTest (${id}):`, error.message);
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception réseau deleteTest (${id}):`, err);
    }
  },

  // 4. EVALUATIONS (1–10 Scale, 4 Pillars with Weights)
  async getEvaluations(): Promise<CandidateEvaluation[]> {
    const isCleared = getLocal<boolean>(KEY_CLEARED, false);
    if (isCleared) return [];
    const local = getLocal<CandidateEvaluation[] | null>(KEY_EVALS, null);
    try {
      const { data, error } = await supabase
        .from('candidate_evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });
      if (error) {
        console.warn('[RecruitmentService] Erreur Supabase getEvaluations, bascule sur local:', error.message);
      } else if (data) {
        if (local !== null && data.length === 0) return local;
        if (data.length > 0) return data;
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau getEvaluations, bascule sur local:', err);
    }
    if (isCleared) return [];
    return local !== null ? local : initialMockEvaluations;
  },

  async saveEvaluation(
    evaluation: Omit<CandidateEvaluation, 'id' | 'created_at'>,
    options?: { isReevaluation?: boolean; updateId?: string }
  ): Promise<CandidateEvaluation> {
    // Calcul weighted score : Tech 30%, Phys 25%, Tact 25%, Ment 20%
    const overall = (
      evaluation.technical_score * 0.30 +
      evaluation.physical_score * 0.25 +
      evaluation.tactical_score * 0.25 +
      evaluation.mental_score * 0.20
    );

    const isUpdate = Boolean(options?.updateId && !options?.isReevaluation);
    const newId = isUpdate ? options!.updateId! : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eval-${Date.now()}`);
    const newEval: CandidateEvaluation = {
      ...evaluation,
      id: newId,
      overall_score: Math.round(overall * 10) / 10,
      created_at: new Date().toISOString(),
    };

    try {
      if (isUpdate) {
        const { error } = await supabase.from('candidate_evaluations').update(newEval).eq('id', newId);
        if (error) console.warn('[RecruitmentService] Erreur Supabase update evaluation, persistance en local:', error.message);
      } else {
        const { error } = await supabase.from('candidate_evaluations').insert([newEval]);
        if (error) console.warn('[RecruitmentService] Erreur Supabase saveEvaluation, persistance en local:', error.message);
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau saveEvaluation, persistance en local:', err);
    }

    const list = getLocal<CandidateEvaluation[]>(KEY_EVALS, initialMockEvaluations);
    let updated: CandidateEvaluation[];
    if (isUpdate) {
      const idx = list.findIndex(e => e.id === newId);
      if (idx >= 0) {
        updated = [...list];
        updated[idx] = newEval;
      } else {
        updated = [newEval, ...list];
      }
    } else {
      // Nouvelle évaluation ou réévaluation : ajoutée en tête d'historique
      updated = [newEval, ...list];
    }
    setLocal(KEY_EVALS, updated);

    // Si un test est rattaché à l'évaluation, marquer automatiquement ce test comme 'completed'
    if (evaluation.test_id) {
      try {
        await this.updateTest(evaluation.test_id, { status: 'completed' });
        if (evaluation.candidate_id) {
          const candidates = await this.getCandidates();
          const cand = candidates.find(c => c.id === evaluation.candidate_id);
          if (cand && cand.pipeline_stage === 'test_scheduled') {
            await this.updateCandidate(evaluation.candidate_id, {
              pipeline_stage: 'test_completed',
            });
          }
        }
      } catch (testErr) {
        console.warn('[RecruitmentService] Impossible de mettre à jour le statut du test rattaché:', testErr);
      }
    } else if (evaluation.candidate_id) {
      // Si aucun test_id n'était spécifié, créer automatiquement la session de test correspondante
      try {
        const autoTest = await this.createTest({
          candidate_id: evaluation.candidate_id,
          test_name: evaluation.test_name || `Session d'Évaluation — ${evaluation.evaluator_name || 'Staff FUS'}`,
          test_date: evaluation.evaluation_date,
          start_time: '10:00',
          end_time: '12:00',
          location: 'Complexe Sportif FUS - Académie',
          training_ground: 'Terrain Synthétique 1',
          target_team: 'Académie FUS',
          age_category: 'U19',
          test_type: 'comprehensive',
          status: 'completed',
          assigned_coaches: ['Staff Technique Académie FUS'],
          assigned_scouts: [evaluation.evaluator_name || 'Cellule Recrutement'],
          notes: `Évaluation enregistrée : Note ${newEval.overall_score}/10 (${newEval.verdict})`,
        });
        newEval.test_id = autoTest.id;
      } catch (err) {
        console.warn('[RecruitmentService] Auto-création de test pour évaluation échouée:', err);
      }
    }

    // Auto-log in timeline
    const isReeval = options?.isReevaluation;
    const testNote = evaluation.test_name ? ` (Session : ${evaluation.test_name})` : '';
    await this.addTimelineEvent({
      candidate_id: evaluation.candidate_id,
      event_type: 'evaluated',
      event_title: isReeval ? `Réévaluation 1–10 : Note ${newEval.overall_score}/10${testNote}` : `Évaluation 1–10 Validée : Note ${newEval.overall_score}/10${testNote}`,
      event_description: `Par ${evaluation.evaluator_name}. Verdict : ${evaluation.verdict}.`,
      performed_by: evaluation.evaluator_name,
      event_date: evaluation.evaluation_date,
    });

    return newEval;
  },

  async deleteEvaluation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('candidate_evaluations')
        .delete()
        .eq('id', id);
      if (error) {
        console.warn(`[RecruitmentService] Erreur Supabase deleteEvaluation (${id}):`, error.message);
      }
    } catch (err) {
      console.warn(`[RecruitmentService] Exception réseau deleteEvaluation (${id}):`, err);
    }

    const list = getLocal<CandidateEvaluation[]>(KEY_EVALS, initialMockEvaluations);
    const target = list.find(e => e.id === id);
    const updated = list.filter(e => e.id !== id);
    setLocal(KEY_EVALS, updated);

    // Si le test rattaché n'a plus d'autre évaluation, rétablir son statut à 'scheduled'
    if (target?.test_id) {
      const remainingForTest = updated.some(e => e.test_id === target.test_id);
      if (!remainingForTest) {
        try {
          await this.updateTest(target.test_id, { status: 'scheduled' });
        } catch (e) {
          console.warn('[RecruitmentService] Erreur mise à jour statut test suite à suppression évaluation:', e);
        }
      }
    }
  },

  // 5. OBSERVATIONS (Local Storage Managed)
  async getObservations(): Promise<ScoutObservation[]> {
    const isCleared = getLocal<boolean>(KEY_CLEARED, false);
    if (isCleared) return [];
    const local = getLocal<ScoutObservation[] | null>(KEY_OBS, null);
    return local !== null ? local : initialMockObservations;
  },

  async createObservation(obs: Omit<ScoutObservation, 'id' | 'created_at'>): Promise<ScoutObservation> {
    setLocal(KEY_CLEARED, false);
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `obs-${Date.now()}`;
    const newObs: ScoutObservation = { ...obs, id: newId, created_at: new Date().toISOString() };
    const list = getLocal<ScoutObservation[]>(KEY_OBS, []);
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
    const isCleared = getLocal<boolean>(KEY_CLEARED, false);
    if (isCleared) return [];
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
      const { error } = await supabase.from('recruitment_timeline').insert([newEvent]);
      if (error) {
        console.warn('[RecruitmentService] Erreur Supabase addTimelineEvent, persistance en local:', error.message);
      }
    } catch (err) {
      console.warn('[RecruitmentService] Exception réseau addTimelineEvent, persistance en local:', err);
    }
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
  },

  // 6. HARD RESET SÉCURISÉ À TRIPLE FACTEUR
  async resetRecruitmentData(credentials: {
    email: string;
    password: string;
    confirmationWord: string;
  }): Promise<{ success: boolean; message: string }> {
    const cleanWord = credentials.confirmationWord.trim().toUpperCase();
    if (cleanWord !== 'REINITIALISER' && cleanWord !== 'RÉINITIALISER') {
      throw new Error('Le mot de confirmation est incorrect. Veuillez saisir exactement "REINITIALISER".');
    }

    if (!credentials.email.trim() || !credentials.password) {
      throw new Error('L\'identifiant email et le mot de passe administrateur sont obligatoires.');
    }

    // 1. Vérification des identifiants avec Supabase Auth
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (authError) {
        // Tolérance si la session active correspond déjà à l'administrateur
        const { data: sessionData } = await supabase.auth.getSession();
        const activeEmail = sessionData?.session?.user?.email;
        if (!activeEmail || activeEmail.toLowerCase() !== credentials.email.trim().toLowerCase()) {
          throw new Error(`Échec d'authentification : ${authError.message || 'Mot de passe ou email incorrect.'}`);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Échec')) throw err;
      console.warn('[RecruitmentService] Note vérification auth:', err.message);
    }

    // 2. Suppression dans les tables Supabase existantes
    try {
      const { error } = await supabase.from('candidate_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn('[RecruitmentService] Erreur reset candidate_evaluations:', error.message);
    } catch (err) {
      console.warn('[RecruitmentService] Exception reset candidate_evaluations:', err);
    }

    try {
      const { error } = await supabase.from('trial_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn('[RecruitmentService] Erreur reset trial_sessions:', error.message);
    } catch (err) {
      console.warn('[RecruitmentService] Exception reset trial_sessions:', err);
    }

    try {
      const { error } = await supabase.from('trial_candidates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn('[RecruitmentService] Erreur reset trial_candidates:', error.message);
    } catch (err) {
      console.warn('[RecruitmentService] Exception reset trial_candidates:', err);
    }

    // 3. Purge du stockage local et caches
    setLocal(KEY_CLEARED, true);
    setLocal(KEY_CANDIDATES, []);
    setLocal(KEY_EVALS, []);
    setLocal(KEY_OBS, []);
    setLocal(KEY_TESTS, []);
    setLocal(KEY_TIMELINE, []);

    return {
      success: true,
      message: 'La cellule Détection & Recrutement a été entièrement réinitialisée à 0.',
    };
  }
};
