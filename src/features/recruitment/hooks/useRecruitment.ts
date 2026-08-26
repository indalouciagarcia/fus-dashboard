import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentService } from '../services/recruitmentService';
import type {
  Scout,
  TrialCandidate,
  PlayerTest,
  CandidateEvaluation,
  ScoutObservation,
  PipelineStage
} from '../types/recruitment';
import { toast } from 'sonner';

export const RECRUITMENT_KEYS = {
  scouts: ['recruitment', 'scouts'] as const,
  candidates: ['recruitment', 'candidates'] as const,
  candidate: (id: string) => ['recruitment', 'candidate', id] as const,
  tests: ['recruitment', 'tests'] as const,
  evaluations: ['recruitment', 'evaluations'] as const,
  observations: ['recruitment', 'observations'] as const,
  timeline: (id?: string) => ['recruitment', 'timeline', id] as const,
};

export function useRecruitment(candidateIdForTimeline?: string) {
  const queryClient = useQueryClient();

  const scoutsQuery = useQuery({
    queryKey: RECRUITMENT_KEYS.scouts,
    queryFn: () => recruitmentService.getScouts(),
  });

  const candidatesQuery = useQuery({
    queryKey: RECRUITMENT_KEYS.candidates,
    queryFn: () => recruitmentService.getCandidates(),
  });

  const testsQuery = useQuery({
    queryKey: RECRUITMENT_KEYS.tests,
    queryFn: () => recruitmentService.getTests(),
  });

  const evaluationsQuery = useQuery({
    queryKey: RECRUITMENT_KEYS.evaluations,
    queryFn: () => recruitmentService.getEvaluations(),
  });

  const observationsQuery = useQuery({
    queryKey: RECRUITMENT_KEYS.observations,
    queryFn: () => recruitmentService.getObservations(),
  });

  const timelineQuery = useQuery({
    queryKey: RECRUITMENT_KEYS.timeline(candidateIdForTimeline),
    queryFn: () => recruitmentService.getTimeline(candidateIdForTimeline),
  });

  // SCOUTS MUTATIONS
  const createScoutMutation = useMutation({
    mutationFn: (scout: Omit<Scout, 'id' | 'created_at' | 'updated_at'>) => recruitmentService.createScout(scout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.scouts });
      toast.success('Scout ajouté à la cellule de recrutement');
    },
    onError: () => toast.error('Erreur lors de l\'ajout du scout'),
  });

  const updateScoutMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Scout> }) => recruitmentService.updateScout(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.scouts });
      toast.success('Profil scout mis à jour');
    },
  });

  const deleteScoutMutation = useMutation({
    mutationFn: (id: string) => recruitmentService.deleteScout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.scouts });
      toast.success('Scout retiré de la cellule');
    },
  });

  // CANDIDATES MUTATIONS
  const createCandidateMutation = useMutation({
    mutationFn: (candidate: Omit<TrialCandidate, 'id' | 'created_at' | 'updated_at'>) =>
      recruitmentService.createCandidate(candidate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.candidates });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.timeline() });
      toast.success('Candidat enregistré avec succès');
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TrialCandidate> }) =>
      recruitmentService.updateCandidate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.candidates });
      toast.success('Fiche candidat mise à jour');
    },
  });

  const updatePipelineStageMutation = useMutation({
    mutationFn: ({ id, stage, reason }: { id: string; stage: PipelineStage; reason?: string }) =>
      recruitmentService.updatePipelineStage(id, stage, reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.candidates });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.timeline() });
      toast.success(`Étape mise à jour : ${vars.stage.replace('_', ' ').toUpperCase()}`);
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: (id: string) => recruitmentService.deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.candidates });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.evaluations });
      toast.success('Candidat supprimé');
    },
  });

  // TESTS MUTATIONS
  const createTestMutation = useMutation({
    mutationFn: (test: Omit<PlayerTest, 'id' | 'created_at' | 'updated_at'>) => recruitmentService.createTest(test),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.tests });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.timeline() });
      toast.success('Session de test planifiée');
    },
  });

  // EVALUATIONS MUTATIONS
  const saveEvaluationMutation = useMutation({
    mutationFn: (evalData: Omit<CandidateEvaluation, 'id' | 'created_at'>) => recruitmentService.saveEvaluation(evalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.evaluations });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.candidates });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.timeline() });
      toast.success('Évaluation 1–10 enregistrée avec succès');
    },
  });

  // OBSERVATIONS MUTATIONS
  const createObservationMutation = useMutation({
    mutationFn: (obs: Omit<ScoutObservation, 'id' | 'created_at'>) => recruitmentService.createObservation(obs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.observations });
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.timeline() });
      toast.success('Rapport d\'observation match enregistré');
    },
  });

  return {
    scouts: scoutsQuery.data || [],
    isLoadingScouts: scoutsQuery.isLoading,
    candidates: candidatesQuery.data || [],
    isLoadingCandidates: candidatesQuery.isLoading,
    tests: testsQuery.data || [],
    isLoadingTests: testsQuery.isLoading,
    evaluations: evaluationsQuery.data || [],
    isLoadingEvaluations: evaluationsQuery.isLoading,
    observations: observationsQuery.data || [],
    isLoadingObservations: observationsQuery.isLoading,
    timeline: timelineQuery.data || [],
    isLoadingTimeline: timelineQuery.isLoading,

    createScout: createScoutMutation.mutateAsync,
    updateScout: updateScoutMutation.mutateAsync,
    deleteScout: deleteScoutMutation.mutateAsync,

    createCandidate: createCandidateMutation.mutateAsync,
    updateCandidate: updateCandidateMutation.mutateAsync,
    updatePipelineStage: updatePipelineStageMutation.mutateAsync,
    deleteCandidate: deleteCandidateMutation.mutateAsync,

    createTest: createTestMutation.mutateAsync,
    saveEvaluation: saveEvaluationMutation.mutateAsync,
    createObservation: createObservationMutation.mutateAsync,
  };
}
