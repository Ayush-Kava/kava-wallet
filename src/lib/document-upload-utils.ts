import type { DocumentFileType } from '@/types/document-types';

export interface DocumentUploadResult {
  publicUrl: string;
  mime_type: string;
  file_extension: string;
  file_type: DocumentFileType;
}

export const documentUploadUtils = {
  uploadFile: async (_userId: string, file: File): Promise<DocumentUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch('/api/documents/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!uploadRes.ok) {
      const message = await uploadRes.text();
      throw new Error(message || 'Failed to upload file');
    }

    const json = await uploadRes.json();
    const data = (json.data ?? json) as {
      publicUrl?: string;
      url?: string;
      mime_type?: string;
      file_extension?: string;
      file_type?: DocumentFileType;
    };

    const publicUrl = data.publicUrl || data.url || '';
    if (!publicUrl || !data.mime_type || !data.file_extension || !data.file_type) {
      throw new Error('Upload response was missing file metadata');
    }

    return {
      publicUrl,
      mime_type: data.mime_type,
      file_extension: data.file_extension,
      file_type: data.file_type,
    };
  },

  deleteFile: async (_fileUrl: string): Promise<void> => {
    await fetch('/api/documents/upload', {
      method: 'DELETE',
      credentials: 'include',
    });
  },
};
