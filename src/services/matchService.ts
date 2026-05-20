import { supabase } from '../lib/supabase';
import type { Match, MatchEvent, MatchStats, PlayerMatchStat, MatchLineup } from '../types';
import type { Inserts, Updates } from '../types/supabase';
import { getMyClubId } from './_helpers';

// -------------------------------------------------------
// Matches
// -------------------------------------------------------

export const matchService = {
  async getAllMatches(): Promise<(Match & { lineup: MatchLineup; staff_ids: string[] })[]> {
    const clubId = await getMyClubId();

    const { data, error } = await supabase
      .from('matches')
      .select('*, match_players(player_id, is_starting), match_staff(staff_id)')
      .eq('club_id', clubId)
      .order('match_date', { ascending: false });

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') return [];
      throw error;
    }

    return (data ?? []).map(m => ({
      ...m,
      lineup: {
        startingXI: m.match_players?.filter((p: any) => p.is_starting).map((p: any) => p.player_id) ?? [],
        substitutes: m.match_players?.filter((p: any) => !p.is_starting).map((p: any) => p.player_id) ?? [],
      },
      staff_ids: m.match_staff?.map((s: any) => s.staff_id) ?? [],
    }));
  },

  async createMatch(
    match: Omit<Inserts<'matches'>, 'id' | 'club_id'> & {
      lineup?: MatchLineup;
      staff_ids?: string[];
      opponent_lineup?: any[];
      opponent_subs?: any[];
    }
  ): Promise<Match> {
    const clubId = await getMyClubId();

    if (!match.team_id)     throw new Error('team_id est obligatoire');
    if (!match.opponent_id) throw new Error('opponent_id est obligatoire');

    // Extract fields handled separately or not yet in DB schema
    const { lineup, staff_ids, opponent_lineup, opponent_subs, ...payload } = match;

    // Build the DB payload — only include opponent scouting if we have data
    const dbPayload: any = { ...payload, club_id: clubId, status: payload.status ?? 'scheduled' };
    
    // Safely try to include opponent fields (they require the migration to be run)
    if (opponent_lineup !== undefined) dbPayload.opponent_lineup = opponent_lineup;
    if (opponent_subs !== undefined)   dbPayload.opponent_subs   = opponent_subs;

    const { data, error } = await supabase
      .from('matches')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      // If columns don't exist yet (400), retry without opponent scouting fields
      const isColumnError = error.code === 'PGRST204' || error.code === 'PGRST205' ||
        error.message?.includes('opponent_lineup') || error.message?.includes('opponent_subs') ||
        error.message?.includes('column') || (error as any)?.status === 400;
      if (isColumnError) {
        const { opponent_lineup: _ol, opponent_subs: _os, ...safePayload } = dbPayload;
        const { data: retryData, error: retryError } = await supabase
          .from('matches')
          .insert([safePayload])
          .select()
          .single();
        if (retryError) throw retryError;
        if (lineup) await matchService.saveLineup(retryData.id, lineup.startingXI, lineup.substitutes);
        if (staff_ids?.length) await matchService.saveStaff(retryData.id, staff_ids);
        return retryData;
      }
      throw error;
    }

    if (lineup) {
      await matchService.saveLineup(data.id, lineup.startingXI, lineup.substitutes);
    }
    if (staff_ids?.length) {
      await matchService.saveStaff(data.id, staff_ids);
    }

    return data;
  },

  async updateMatch(id: string, updates: Updates<'matches'> & { lineup?: MatchLineup; staff_ids?: string[] }): Promise<Match> {
    const { lineup, staff_ids, ...payload } = updates;

    const sanitized = { ...payload } as any;
    (['id', 'created_at', 'match_players', 'match_staff'] as const).forEach(f => delete sanitized[f]);
    (['opponent_id', 'league_id', 'stadium_id', 'team_id'] as const).forEach(f => {
      if (sanitized[f] === '') sanitized[f] = null;
    });

    const { data, error } = await supabase
      .from('matches')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (lineup) {
      await matchService.saveLineup(id, lineup.startingXI, lineup.substitutes);
    }
    if (staff_ids) {
      await matchService.saveStaff(id, staff_ids);
    }

    return data;
  },

  async deleteMatch(id: string): Promise<void> {
    await supabase.from('match_players').delete().eq('match_id', id);
    await supabase.from('match_staff').delete().eq('match_id', id);
    await supabase.from('match_events').delete().eq('match_id', id);
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;
  },

  // -------------------------------------------------------
  // Composition
  // -------------------------------------------------------

  async saveLineup(matchId: string, startingXI: string[], substitutes: string[]): Promise<void> {
    await supabase.from('match_players').delete().eq('match_id', matchId);

    const rows = [
      ...startingXI.filter(Boolean).map(pid => ({ match_id: matchId, player_id: pid, is_starting: true })),
      ...substitutes.filter(Boolean).map(pid => ({ match_id: matchId, player_id: pid, is_starting: false })),
    ];

    if (rows.length) {
      const { error } = await supabase.from('match_players').insert(rows);
      if (error) throw error;
    }
  },

  async getMatchLineup(matchId: string): Promise<{ player_id: string; is_starting: boolean }[]> {
    const { data, error } = await supabase
      .from('match_players')
      .select('player_id, is_starting')
      .eq('match_id', matchId);
    if (error) throw error;
    return data ?? [];
  },

  // -------------------------------------------------------
  // Staff du match
  // -------------------------------------------------------

  async saveStaff(matchId: string, staffIds: string[]): Promise<void> {
    await supabase.from('match_staff').delete().eq('match_id', matchId);
    if (!staffIds.length) return;

    const { error } = await supabase
      .from('match_staff')
      .insert(staffIds.map(sid => ({ match_id: matchId, staff_id: sid })));
    if (error) throw error;
  },

  async getMatchStaff(matchId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('match_staff')
      .select('staff_id')
      .eq('match_id', matchId);
    if (error) throw error;
    return (data ?? []).map(s => s.staff_id);
  },

  // -------------------------------------------------------
  // Événements
  // -------------------------------------------------------

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const { data, error } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') return [];
      throw error;
    }

    return (data ?? []).map(e => ({
      ...e,
      playerId: e.player_id,
      relatedPlayerId: e.related_player_id,
    }));
  },

  async addEvent(event: Omit<Inserts<'match_events'>, 'id'>): Promise<void> {
    const { error } = await supabase.from('match_events').insert([event]);
    if (error) throw error;
  },

  async updateEvent(id: string, updates: Updates<'match_events'>): Promise<void> {
    const { error } = await supabase.from('match_events').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase.from('match_events').delete().eq('id', eventId);
    if (error) throw error;
  },

  // -------------------------------------------------------
  // Stats d'équipe (1:1 avec match)
  // -------------------------------------------------------

  async getMatchStats(matchId: string): Promise<MatchStats | null> {
    const { data, error } = await supabase
      .from('match_stats')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertMatchStats(stats: Inserts<'match_stats'>): Promise<MatchStats> {
    const { data, error } = await supabase
      .from('match_stats')
      .upsert(stats, { onConflict: 'match_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // -------------------------------------------------------
  // Stats individuelles
  // -------------------------------------------------------

  async getPlayerMatchStats(matchId: string): Promise<PlayerMatchStat[]> {
    const { data, error } = await supabase
      .from('player_match_stats')
      .select('*')
      .eq('match_id', matchId);
    if (error) throw error;
    return data ?? [];
  },

  async upsertPlayerMatchStat(stat: Inserts<'player_match_stats'>): Promise<PlayerMatchStat> {
    const { data, error } = await supabase
      .from('player_match_stats')
      .upsert(stat, { onConflict: 'match_id,player_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
