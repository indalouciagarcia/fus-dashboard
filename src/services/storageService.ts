import { supabase } from '../lib/supabase';

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
    } catch (_) {
      // Ignorer les erreurs de suppression storage (fichier déjà absent)
    }
  },

  async uploadFile(file: File, type: 'leagues' | 'clubs' | 'players' | 'staff' | 'stadiums' | 'blog' | 'banners' | 'arbitres'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    let bucketName = 'logos';
    let filePath = '';

    if (type === 'players') {
      bucketName = 'players';
      filePath = fileName; 
    } else if (type === 'staff' || type === 'arbitres') {
      bucketName = 'staff';
      filePath = `${type}/${fileName}`; 
    } else if (type === 'stadiums') {
      bucketName = 'logos';
      filePath = `stadiums/${fileName}`;
    } else if (type === 'blog') {
      bucketName = 'logos';
      filePath = `blog/${fileName}`;
    } else if (type === 'banners') {
      bucketName = 'logos';
      filePath = `banners/${fileName}`;
    } else {
      bucketName = 'logos';
      filePath = `${type}/${fileName}`; // leagues or clubs
    }

    // 1. Upload file to specific bucket
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    // 2. Get Public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
