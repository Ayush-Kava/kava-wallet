export const documentUploadUtils = {
  uploadFile: async (_userId: string, file: File): Promise<string> => {
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
    const { publicUrl, url } = (json.data ?? json) as {
      publicUrl?: string;
      url?: string;
    };

    return publicUrl || url || '';
  },

  deleteFile: async (_fileUrl: string): Promise<void> => {
    await fetch('/api/documents/upload', {
      method: 'DELETE',
      credentials: 'include',
    });
  },
};
