import { supabase } from '../lib/supabase';
import { getMyClubId } from './_helpers';
import type { Banner } from '../types';

export const storeService = {
  async getBanners(): Promise<Banner[]> {
    const clubId = await getMyClubId();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') return [];
      throw error;
    }
    return data || [];
  },

  async addBanner(banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>): Promise<Banner> {
    const clubId = await getMyClubId();
    const { data, error } = await supabase
      .from('banners')
      .insert([{ ...banner, club_id: clubId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
    const clubId = await getMyClubId();
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .eq('club_id', clubId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Bannière introuvable ou accès refusé (RLS)');
    return data;
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
