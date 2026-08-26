import { supabase } from '../lib/supabase';
import type { Arbitre, ArbitreFormData } from '../types/arbitre';

const STORAGE_KEY = 'fus_arbitres_registry_v1';

const DEFAULT_MOCK_ARBITRES: Arbitre[] = [
  {
    id: 1,
    nom: 'Ghayat',
    prenom: 'Redouane',
    date_naissance: '1987-03-15',
    nationalite: 'Maroc',
    numero_licence: 'ARB-2024-001',
    email: 'r.ghayat@frmf.ma',
    telephone: '+212 661 123456',
    role_principal: 'central',
    grade: 'FIFA',
    statut: 'actif',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    nom: 'Jiyed',
    prenom: 'Redouane',
    date_naissance: '1979-04-09',
    nationalite: 'Maroc',
    numero_licence: 'ARB-2024-002',
    email: 'r.jiyed@frmf.ma',
    telephone: '+212 662 234567',
    role_principal: 'var',
    grade: 'FIFA',
    statut: 'actif',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    nom: 'Bouchra',
    prenom: 'Karboubi',
    date_naissance: '1987-05-15',
    nationalite: 'Maroc',
    numero_licence: 'ARB-2024-003',
    email: 'b.karboubi@frmf.ma',
    telephone: '+212 663 345678',
    role_principal: 'central',
    grade: 'FIFA',
    statut: 'actif',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    nom: 'Azgaou',
    prenom: 'Lahsen',
    date_naissance: '1989-11-20',
    nationalite: 'Maroc',
    numero_licence: 'ARB-2024-004',
    email: 'l.azgaou@frmf.ma',
    telephone: '+212 664 456789',
    role_principal: 'assistant',
    grade: 'National 1',
    statut: 'actif',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    nom: 'Brinsi',
    prenom: 'Fatiha',
    date_naissance: '1992-08-05',
    nationalite: 'Maroc',
    numero_licence: 'ARB-2024-005',
    email: 'f.brinsi@frmf.ma',
    telephone: '+212 665 567890',
    role_principal: 'quatrieme',
    grade: 'Régional',
    statut: 'actif',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getStoredArbitres(): Arbitre[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erreur lecture localStorage pour les arbitres:', err);
  }
  return [...DEFAULT_MOCK_ARBITRES];
}

function setStoredArbitres(list: Arbitre[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Erreur écriture localStorage pour les arbitres:', err);
  }
}

/** Nettoie et formate les données pour respecter les contraintes SQL de la table arbitres */
function sanitizeArbitrePayload(data: Partial<ArbitreFormData>) {
  const payload: Record<string, any> = {};

  if (data.nom !== undefined) payload.nom = data.nom.trim();
  if (data.prenom !== undefined) payload.prenom = data.prenom.trim();
  if (data.numero_licence !== undefined) payload.numero_licence = data.numero_licence.trim();
  if (data.role_principal !== undefined) payload.role_principal = data.role_principal;
  if (data.grade !== undefined) payload.grade = data.grade;
  if (data.statut !== undefined) payload.statut = data.statut;
  if (data.nationalite !== undefined) {
    payload.nationalite = data.nationalite.trim() || 'Maroc';
  }

  // Évite les erreurs "invalid input syntax for type date: """ sur Postgres
  if (data.date_naissance !== undefined) {
    payload.date_naissance = data.date_naissance && data.date_naissance.trim() !== '' 
      ? data.date_naissance.trim() 
      : null;
  }

  // Évite les conflits d'unicité sur chaine vide pour l'email
  if (data.email !== undefined) {
    payload.email = data.email && data.email.trim() !== '' 
      ? data.email.trim() 
      : null;
  }

  if (data.telephone !== undefined) {
    payload.telephone = data.telephone && data.telephone.trim() !== '' 
      ? data.telephone.trim() 
      : null;
  }

  if (data.photo_url !== undefined) {
    payload.photo_url = data.photo_url && data.photo_url.trim() !== '' 
      ? data.photo_url.trim() 
      : null;
  }

  return payload;
}

export const arbitreService = {
  /**
   * Récupère la liste de tous les arbitres (Supabase en priorité, sinon localStorage)
   */
  async getArbitres(): Promise<Arbitre[]> {
    try {
      const { data, error } = await supabase
        .from('arbitres')
        .select('*')
        .order('nom', { ascending: true });

      if (error) {
        console.warn('Supabase arbitres indisponible, utilisation du stockage local:', error.message);
        return getStoredArbitres();
      }

      if (data && data.length > 0) {
        setStoredArbitres(data);
        return data;
      }

      // Si la table est vide, initialiser avec le stockage local
      const local = getStoredArbitres();
      return local;
    } catch (err) {
      console.warn('Erreur réseau / Supabase, retour du cache local:', err);
      return getStoredArbitres();
    }
  },

  /**
   * Crée un nouvel arbitre dans Supabase avec fallback localStorage
   */
  async createArbitre(formData: ArbitreFormData): Promise<Arbitre> {
    const payload = sanitizeArbitrePayload(formData);

    try {
      const { data: inserted, error } = await supabase
        .from('arbitres')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Échec insertion Supabase, enregistrement dans localStorage:', error.message);
        const currentList = getStoredArbitres();
        const fallbackArbitre: Arbitre = {
          id: Date.now(),
          nom: payload.nom || '',
          prenom: payload.prenom || '',
          date_naissance: payload.date_naissance || null,
          nationalite: payload.nationalite || 'Maroc',
          numero_licence: payload.numero_licence || `ARB-${Date.now()}`,
          email: payload.email || null,
          telephone: payload.telephone || null,
          role_principal: payload.role_principal || 'central',
          grade: payload.grade || 'Régional',
          statut: payload.statut || 'actif',
          photo_url: payload.photo_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updatedList = [fallbackArbitre, ...currentList];
        setStoredArbitres(updatedList);
        return fallbackArbitre;
      }

      // Succès Supabase : mettre à jour le cache local
      const currentList = getStoredArbitres();
      const updatedList = [inserted, ...currentList.filter(a => a.id !== inserted.id)];
      setStoredArbitres(updatedList);
      return inserted;
    } catch (err: any) {
      console.warn('Exception création arbitre, enregistrement local:', err);
      const currentList = getStoredArbitres();
      const fallbackArbitre: Arbitre = {
        id: Date.now(),
        nom: payload.nom || '',
        prenom: payload.prenom || '',
        date_naissance: payload.date_naissance || null,
        nationalite: payload.nationalite || 'Maroc',
        numero_licence: payload.numero_licence || `ARB-${Date.now()}`,
        email: payload.email || null,
        telephone: payload.telephone || null,
        role_principal: payload.role_principal || 'central',
        grade: payload.grade || 'Régional',
        statut: payload.statut || 'actif',
        photo_url: payload.photo_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedList = [fallbackArbitre, ...currentList];
      setStoredArbitres(updatedList);
      return fallbackArbitre;
    }
  },

  /**
   * Met à jour un arbitre existant
   */
  async updateArbitre(id: number, updates: Partial<ArbitreFormData>): Promise<Arbitre> {
    const payload = sanitizeArbitrePayload(updates);

    try {
      const { data: updated, error } = await supabase
        .from('arbitres')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Échec mise à jour Supabase, modification locale:', error.message);
        const currentList = getStoredArbitres();
        const updatedList = currentList.map((a) =>
          a.id === id ? { ...a, ...payload, updated_at: new Date().toISOString() } : a
        );
        setStoredArbitres(updatedList);
        return updatedList.find((a) => a.id === id)!;
      }

      // Succès Supabase
      const currentList = getStoredArbitres();
      const updatedList = currentList.map((a) => (a.id === id ? updated : a));
      setStoredArbitres(updatedList);
      return updated;
    } catch (err) {
      console.warn('Exception mise à jour arbitre, modification locale:', err);
      const currentList = getStoredArbitres();
      const updatedList = currentList.map((a) =>
        a.id === id ? { ...a, ...payload, updated_at: new Date().toISOString() } : a
      );
      setStoredArbitres(updatedList);
      return updatedList.find((a) => a.id === id)!;
    }
  },

  /**
   * Supprime un arbitre
   */
  async deleteArbitre(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('arbitres')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Échec suppression Supabase, suppression locale:', error.message);
      }
      
      const currentList = getStoredArbitres();
      const filtered = currentList.filter((a) => a.id !== id);
      setStoredArbitres(filtered);
    } catch (err) {
      console.warn('Exception suppression arbitre:', err);
      const currentList = getStoredArbitres();
      const filtered = currentList.filter((a) => a.id !== id);
      setStoredArbitres(filtered);
    }
  },
};

