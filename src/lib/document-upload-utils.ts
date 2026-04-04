export const documentUploadUtils = {
  uploadFile: async (userId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('file', file);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Upload failed');
    }

    const { url } = (await response.json()) as { url: string };
    return url;
  },

  deleteFile: async (fileUrl: string): Promise<void> => {
    await fetch('/api/documents/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url: fileUrl }),
    });
  },
};
