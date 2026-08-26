import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MatchReminderContextData {
  reminderInterval: number;
  maxReminders: number;
  setReminderInterval: (val: number) => void;
  setMaxReminders: (val: number) => void;
}

const MatchReminderContext = createContext<MatchReminderContextData>({
  reminderInterval: 5,
  maxReminders: 3,
  setReminderInterval: () => {},
  setMaxReminders: () => {}
});

export const useMatchReminder = () => useContext(MatchReminderContext);

export const MatchReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reminderInterval, setReminderIntervalState] = useState(5);
  const [maxReminders, setMaxRemindersState] = useState(3);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const reminderState = useRef<Record<string, { count: number; lastReminderAt: number }>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const savedInterval = localStorage.getItem('fus_reminder_interval');
    if (savedInterval) setReminderIntervalState(parseInt(savedInterval, 10));
    const savedMax = localStorage.getItem('fus_max_reminders');
    if (savedMax) setMaxRemindersState(parseInt(savedMax, 10));
  }, []);

  const setReminderInterval = (val: number) => {
    setReminderIntervalState(val);
    localStorage.setItem('fus_reminder_interval', val.toString());
  };

  const setMaxReminders = (val: number) => {
    setMaxRemindersState(val);
    localStorage.setItem('fus_max_reminders', val.toString());
  };

  const fetchMatches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('matches')
        .select('*, opponent:clubs!opponent_id(name)')
        .eq('status', 'scheduled')
        .eq('match_date', today);

      if (!error && data) {
        setUpcomingMatches(data);
      }
    } catch (err) {
      console.warn('Error fetching matches for reminder:', err);
    }
  };

  useEffect(() => {
    fetchMatches();
    const refreshInterval = setInterval(fetchMatches, 60 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleStartMatch = (matchId: string) => {
    toast.dismiss(`match-reminder-${matchId}`);
    navigate(`/matchday?matchId=${matchId}`);
  };

  const handlePostponeMatch = async (matchId: string) => {
    try {
      toast.dismiss(`match-reminder-${matchId}`);
      await supabase
        .from('matches')
        .update({ status: 'postponed' })
        .eq('id', matchId);
      
      setUpcomingMatches(prev => prev.filter(m => m.id !== matchId));
      delete reminderState.current[matchId];
      toast.info('Le match a été reporté.');
    } catch (err) {
      toast.error('Erreur lors du report du match');
    }
  };

  const handleCancelMatch = async (matchId: string) => {
    try {
      await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId);
      
      setUpcomingMatches(prev => prev.filter(m => m.id !== matchId));
      delete reminderState.current[matchId];
      toast.error('Le match a été annulé après trop de rappels ignorés.');
    } catch (err) {
      console.warn('Error cancelling match', err);
    }
  };

  const checkReminders = () => {
    if (upcomingMatches.length === 0) return;

    const now = new Date();
    const intervalMs = reminderInterval * 60 * 1000;

    upcomingMatches.forEach(match => {
      if (!match.match_time || !match.match_date) return;

      const matchDateTime = new Date(`${match.match_date}T${match.match_time}`);
      
      if (now >= matchDateTime) {
        const state = reminderState.current[match.id] || { count: 0, lastReminderAt: 0 };

        if (state.count >= maxReminders) {
          handleCancelMatch(match.id);
          toast.dismiss(`match-reminder-${match.id}`);
          return;
        }

        if (now.getTime() - state.lastReminderAt >= intervalMs || state.count === 0) {
          state.count += 1;
          state.lastReminderAt = now.getTime();
          reminderState.current[match.id] = state;

          const oppName = match.opponent?.name || 'Adversaire';

          toast(`Le match contre ${oppName} est prêt à démarrer ! (Rappel ${state.count}/${maxReminders})`, {
            id: `match-reminder-${match.id}`,
            duration: intervalMs, // Stays until the next reminder
            action: {
              label: 'Démarrer',
              onClick: () => handleStartMatch(match.id),
            },
            cancel: {
              label: 'Reporter',
              onClick: () => handlePostponeMatch(match.id),
            },
          });
        }
      }
    });
  };

  useEffect(() => {
    intervalRef.current = setInterval(checkReminders, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [upcomingMatches, reminderInterval, maxReminders]);

  return (
    <MatchReminderContext.Provider value={{
      reminderInterval, maxReminders, setReminderInterval, setMaxReminders
    }}>
      {children}
    </MatchReminderContext.Provider>
  );
};
