import { supabaseServer as supabase } from '@/lib/supabase/server';

export class StorageService {
  static async uploadFoundItemImage(file: File, filename: string): Promise<{ url?: string; error?: string }> {
    try {
      const bucketName = 'found-items';
      const filePath = `${Date.now()}_${filename}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl };
    } catch (error: unknown) {
      console.error('Storage upload error:', error);
      return { error: 'Failed to upload image' };
    }
  }

  static async uploadLostItemImage(file: File, filename: string): Promise<{ url?: string; error?: string }> {
    try {
      const bucketName = 'lost-items';
      const filePath = `${Date.now()}_${filename}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl };
    } catch (error: unknown) {
      console.error('Storage upload error:', error);
      return { error: 'Failed to upload image' };
    }
  }
  static async getSignedUrl(fullUrl: string, bucketName: 'found-items' | 'lost-items'): Promise<string | null> {
    try {
      // Extract the path from the full URL if necessary
      const urlObj = new URL(fullUrl);
      const pathParts = urlObj.pathname.split(`/${bucketName}/`);
      if (pathParts.length < 2) return fullUrl; // Not a Supabase storage URL we can parse easily? Return as is or handle it
      const filePath = pathParts[1];

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (e) {
      console.error('Error generating signed URL:', e);
      return null;
    }
  }
}
