import { supabase } from '../lib/supabase';

export type StorageUploadType =
  | 'leagues'
  | 'clubs'
  | 'players'
  | 'staff'
  | 'stadiums'
  | 'blog'
  | 'banners'
  | 'arbitres'
  | 'scouts'
  | 'scout_players';

interface StorageStrategy {
  bucket: string;
  resolvePath: (fileName: string) => string;
}

/**
 * Registre de stratégies de stockage respectant le principe Open/Closed (OCP).
 * L'extension vers un nouveau type d'entité se fait par simple déclaration sans modifier la logique d'upload.
 */
const STORAGE_STRATEGIES: Record<StorageUploadType, StorageStrategy> = {
  players:       { bucket: 'players', resolvePath: (fn) => fn },
  staff:         { bucket: 'staff',   resolvePath: (fn) => `staff/${fn}` },
  arbitres:      { bucket: 'staff',   resolvePath: (fn) => `arbitres/${fn}` },
  stadiums:      { bucket: 'logos',   resolvePath: (fn) => `stadiums/${fn}` },
  blog:          { bucket: 'logos',   resolvePath: (fn) => `blog/${fn}` },
  banners:       { bucket: 'logos',   resolvePath: (fn) => `banners/${fn}` },
  leagues:       { bucket: 'logos',   resolvePath: (fn) => `leagues/${fn}` },
  clubs:         { bucket: 'logos',   resolvePath: (fn) => `clubs/${fn}` },
  scouts:        { bucket: 'scouts',  resolvePath: (fn) => `scouts/${fn}` },
  scout_players: { bucket: 'scouts',  resolvePath: (fn) => `players/${fn}` },
};

export const storageService = {
  /** Supprime un fichier depuis son URL publique Supabase Storage */
  async deleteFile(publicUrl: string): Promise<void> {
    try {
      // Extraire bucket + path depuis l'URL publique
      // Format: .../storage/v1/object/public/<bucket>/<path>
      const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      if (!match) return;
      const [, bucket, path] = match;
      await supabase.storage.from(bucket).remove([path]);
    } catch (err) {
      console.warn('[StorageService] Erreur non-bloquante lors de la suppression du fichier:', err);
    }
  },

  /** Téléverse un fichier en appliquant la stratégie dédiée à son type */
  async uploadFile(file: File, type: StorageUploadType): Promise<string> {
    const strategy = STORAGE_STRATEGIES[type] ?? {
      bucket: 'logos',
      resolvePath: (fn: string) => `${type}/${fn}`,
    };

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = strategy.resolvePath(fileName);

    // 1. Upload file to specific bucket
    const { error: uploadError } = await supabase.storage
      .from(strategy.bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`[StorageService] Échec upload image (${type}):`, uploadError);
      throw uploadError;
    }

    // 2. Get Public URL
    const { data } = supabase.storage
      .from(strategy.bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

