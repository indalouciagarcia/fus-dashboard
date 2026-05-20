import React from 'react';
import { useMatches } from '../../hooks/useMatches';
import { usePlayers } from '../../hooks/usePlayers';
import { Skeleton } from '../../components/ui/skeleton';

import MiniStatRow from '../../components/MiniStatRow';
import MatchCalendarWidget from '../../components/MatchCalendarWidget';
import MatchesPerMonthChart from '../../components/MatchesPerMonthChart';
import TopScorers from '../../components/TopScorers';

import ErrorEmptyState from '../../components/ErrorEmptyState';

const DashboardPage: React.FC = () => {
  const { isLoading: matchesLoading, isError: matchesError, matches } = useMatches();
  const { isLoading: playersLoading, isError: playersError, players } = usePlayers();

  const isLoading = matchesLoading || playersLoading;
  const isError = matchesError || playersError;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[340px] rounded-[2rem]" />
        <Skeleton className="h-[400px] rounded-[3rem]" />
        <Skeleton className="h-[300px] rounded-[3rem]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <ErrorEmptyState 
          title="Erreur de chargement" 
          message="Une erreur est survenue lors du chargement des données de votre club. Veuillez vérifier votre connexion ou vos permissions Supabase."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const hasNoData = matches.length === 0 && players.length === 0;
  if (hasNoData) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <ErrorEmptyState 
          type="empty"
          title="Club sans données" 
          message="Bienvenue dans votre dashboard ! Commencez par ajouter des joueurs ou planifier des matchs pour voir vos statistiques."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Row 1: Key Performance Indicators */}
      <MiniStatRow />

      {/* Row 2: Match Calendar */}
      <MatchCalendarWidget />

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 gap-6">
        <MatchesPerMonthChart />
      </div>

      {/* Row 4: Top Scorers & Detailed Stats */}
      <div className="grid grid-cols-1 gap-6">
        <TopScorers />
      </div>


    </div>
  );
};

export default DashboardPage;
