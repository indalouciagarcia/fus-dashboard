import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '../services/matchService';
import { toast } from 'sonner';
import type { Match } from '../types';

export const useMatches = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['matches'],
    queryFn: matchService.getAllMatches,
  });

  const createMutation = useMutation({
    mutationFn: matchService.createMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Match planifié avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) => 
      matchService.updateMatch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Match mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: matchService.deleteMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Match supprimé');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const saveLineupMutation = useMutation({
    mutationFn: ({ matchId, startingXI, substitutes }: { matchId: string; startingXI: string[]; substitutes: string[] }) =>
      matchService.saveLineup(matchId, startingXI, substitutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Composition enregistrée');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const saveStaffMutation = useMutation({
    mutationFn: ({ matchId, staffIds }: { matchId: string; staffIds: string[] }) =>
      matchService.saveStaff(matchId, staffIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Staff du match enregistré');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  return {
    matches: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    addMatch: createMutation.mutateAsync,
    updateMatch: updateMutation.mutateAsync,
    deleteMatch: deleteMutation.mutateAsync,
    saveLineup: saveLineupMutation.mutateAsync,
    saveStaff: saveStaffMutation.mutateAsync,
  };
};
