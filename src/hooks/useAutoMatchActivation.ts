import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Match } from '../types';

/**
 * Hook pour l'activation automatique des matchs à l'heure prévue
 * Ce hook vérifie périodiquement si des matchs programmés doivent démarrer
 */
export const useAutoMatchActivation = (matches: Match[], onMatchActivated?: (matchId: string) => void) => {
  
  const checkAndActivateMatches = useCallback(async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Find scheduled matches that should start now
    const matchesToActivate = matches.filter(match => {
      if (match.status !== 'scheduled') return false;
      
      const matchDate = match.match_date;
      const matchTime = match.match_time?.slice(0, 5);
      
      // Match is today and time has passed
      if (matchDate === currentDate && matchTime && matchTime <= currentTime) {
        return true;
      }
      
      // Match was scheduled for a past date (should have started already)
      if (matchDate < currentDate) {
        return true;
      }
      
      return false;
    });

    // Activate each match
    for (const match of matchesToActivate) {
      try {
        const { error } = await supabase
          .from('matches')
          .update({
            status: 'live',
            current_half: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id);

        if (error) {
          console.error(`Failed to auto-activate match ${match.id}:`, error);
        } else {
          console.log(`Auto-activated match: ${match.id}`);
          onMatchActivated?.(match.id);
        }
      } catch (err) {
        console.error(`Error auto-activating match ${match.id}:`, err);
      }
    }
  }, [matches, onMatchActivated]);

  useEffect(() => {
    // Check immediately on mount
    checkAndActivateMatches();

    // Then check every minute
    const interval = setInterval(checkAndActivateMatches, 60000);

    return () => clearInterval(interval);
  }, [checkAndActivateMatches]);
};

export default useAutoMatchActivation;
