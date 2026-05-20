import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import { useAdvancedDashboardStats } from '../hooks/useAdvancedDashboardStats';
import { Filter, Calendar, Users } from 'lucide-react';
import type { AgeCategory } from '../types';

const CATEGORIES: AgeCategory[] = ['SENIOR', 'U23', 'U21', 'U19', 'U17', 'U15', 'U13', 'U11', 'U9'];
const MONTHS = [
  { value: 'all', label: 'Tous les mois' },
  { value: '0', label: 'Janvier' }, { value: '1', label: 'Février' },
  { value: '2', label: 'Mars' }, { value: '3', label: 'Avril' },
  { value: '4', label: 'Mai' }, { value: '5', label: 'Juin' },
  { value: '6', label: 'Juillet' }, { value: '7', label: 'Août' },
  { value: '8', label: 'Septembre' }, { value: '9', label: 'Octobre' },
  { value: '10', label: 'Novembre' }, { value: '11', label: 'Décembre' }
];
const TRIMESTERS = [
  { value: 'all', label: 'Toute l\'année' },
  { value: '1', label: 'T1 (Jan-Mar)' },
  { value: '2', label: 'T2 (Avr-Jun)' },
  { value: '3', label: 'T3 (Jul-Sep)' },
  { value: '4', label: 'T4 (Oct-Déc)' }
];

const TopScorers: React.FC = () => {
  const { players } = usePlayers();
  const { matches } = useMatches();
  const { data: statsData } = useAdvancedDashboardStats();

  const [selectedCategory, setSelectedCategory] = useState<AgeCategory | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedTrimester, setSelectedTrimester] = useState<string>('all');

  const scorers = useMemo(() => {
    const events = statsData?.events || [];
    const finishedMatches = matches.filter(m => m.status === 'finished');

    // Filter matches by period
    const filteredMatches = finishedMatches.filter(m => {
      const matchDate = new Date(m.match_date);
      const matchMonth = matchDate.getMonth();
      const matchTrimester = Math.floor(matchMonth / 3) + 1;

      if (selectedMonth !== 'all' && matchMonth !== parseInt(selectedMonth)) return false;
      if (selectedTrimester !== 'all' && matchTrimester !== parseInt(selectedTrimester)) return false;
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;

      return true;
    });

    const matchIds = new Set(filteredMatches.map(m => m.id));

    // Calculate goals per player from events
    const playerGoals = new Map<string, number>();
    const playerAssists = new Map<string, number>();
    const playerMatches = new Map<string, Set<string>>();

    events.forEach(e => {
      if (!matchIds.has(e.match_id)) return;

      if (e.type === 'goal' && e.player_id) {
        playerGoals.set(e.player_id, (playerGoals.get(e.player_id) || 0) + 1);
      }
      if (e.type === 'assist' && e.player_id) {
        playerAssists.set(e.player_id, (playerAssists.get(e.player_id) || 0) + 1);
      }
    });

    // Count matches played per player
    filteredMatches.forEach(m => {
      const lineup = m.lineup as { startingXI?: string[]; substitutes?: string[] } | undefined;
      if (lineup?.startingXI) {
        lineup.startingXI.forEach(id => {
          if (!playerMatches.has(id)) playerMatches.set(id, new Set());
          playerMatches.get(id)!.add(m.id);
        });
      }
      if (lineup?.substitutes) {
        lineup.substitutes.forEach(id => {
          if (!playerMatches.has(id)) playerMatches.set(id, new Set());
          playerMatches.get(id)!.add(m.id);
        });
      }
    });

    return players
      .map(p => ({
        ...p,
        goals: playerGoals.get(p.id) || 0,
        assists: playerAssists.get(p.id) || 0,
        played: playerMatches.get(p.id)?.size || 0
      }))
      .filter(p => p.goals > 0 || p.played > 0)
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10);
  }, [players, matches, statsData, selectedCategory, selectedMonth, selectedTrimester]);

  return (
    <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col gap-4 pb-6">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight">Meilleurs Buteurs</CardTitle>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-secondary/50">
            <Filter className="w-3 h-3 mr-1" />
            Filtrés
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2">
            <Users className="w-4 h-4 text-primary" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AgeCategory | 'ALL')}
              className="bg-transparent text-[11px] font-bold outline-none border-none cursor-pointer"
            >
              <option value="ALL">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-primary" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[11px] font-bold outline-none border-none cursor-pointer"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Trimester Filter */}
          <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-primary" />
            <select
              value={selectedTrimester}
              onChange={(e) => setSelectedTrimester(e.target.value)}
              className="bg-transparent text-[11px] font-bold outline-none border-none cursor-pointer"
            >
              {TRIMESTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joueur</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">B</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">P</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">M</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scorers.map((scorer, index) => (
              <motion.tr
                key={scorer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group border-b border-secondary/50 last:border-0 hover:bg-secondary/20 transition-colors"
                style={{ cursor: 'pointer' }}
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-secondary/80 overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all flex items-center justify-center font-bold text-primary">
                        <img src={(scorer.photo_url && scorer.photo_url !== 'null') ? scorer.photo_url : `https://i.pravatar.cc/300?u=${scorer.id}`} alt={scorer.full_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{scorer.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{scorer.position}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-xs font-black text-foreground">{scorer.goals}</span>
                </TableCell>
                <TableCell className="text-center">
                   <span className="text-xs font-bold text-muted-foreground">{scorer.assists}</span>
                </TableCell>
                <TableCell className="text-center">
                   <span className="text-xs font-bold text-muted-foreground">{scorer.played}</span>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopScorers;
