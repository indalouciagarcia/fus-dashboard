import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '../services/matchService';
import { toast } from 'sonner';
import type { MatchEvent } from '../types';

export const useMatchEvents = (matchId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['match_events', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      return matchService.getMatchEvents(matchId);
    },
    enabled: !!matchId,
  });

  const addEventMutation = useMutation({
    mutationFn: (event: Omit<MatchEvent, 'id'>) => matchService.addEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match_events', matchId] });
    },
    onError: (error: any) => {
      toast.error(`Erreur création: ${error.message}`);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MatchEvent> }) => 
      matchService.updateEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match_events', matchId] });
      toast.success('Événement mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur modification: ${error.message}`);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => matchService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match_events', matchId] });
      toast.success('Événement supprimé');
    },
    onError: (error: any) => {
      toast.error(`Erreur suppression: ${error.message}`);
    }
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    addEvent: addEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
  };
};
