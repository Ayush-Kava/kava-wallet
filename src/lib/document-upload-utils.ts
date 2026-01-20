import { supabase } from '@/integrations/supabase/client';

const DOCUMENTS_BUCKET = 'documents';
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 year in seconds

export const documentUploadUtils = {
  uploadFile: async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(fileName, file);

    if (error) throw error;

    // Generate signed URL for private bucket
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(fileName, SIGNED_URL_EXPIRY);

    if (signedError) throw signedError;

    return signedUrlData.signedUrl;
  },

  deleteFile: async (fileUrl: string): Promise<void> => {
    try {
      const urlPath = new URL(fileUrl).pathname;
      const filePath = urlPath
        .split('/storage/v1/object/sign/documents/')[1]
        ?.split('?')[0];

      if (filePath) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  },
};
