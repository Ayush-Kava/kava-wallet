import type {
  Document,
  DocumentLink,
  DocumentReminder,
  DocumentWithLinks,
  CreateDocumentData,
  UpdateDocumentData,
  CreateDocumentLinkData,
  CreateDocumentReminderData,
  UpdateDocumentReminderData,
} from '@/types/document-types';
import { apiFetch } from '@/lib/api-client';

export const documentsApi = {
  // Documents
  getDocuments: async (userId: string): Promise<Document[]> => {
    return apiFetch<Document[]>(`/api/documents?userId=${encodeURIComponent(userId)}`);
  },

  getDocument: async (userId: string, documentId: string): Promise<DocumentWithLinks> => {
    return apiFetch<DocumentWithLinks>(
      `/api/documents/${documentId}?userId=${encodeURIComponent(userId)}`,
    );
  },

  createDocument: async (userId: string, payload: CreateDocumentData): Promise<Document> => {
    return apiFetch<Document>(`/api/documents`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  updateDocument: async (userId: string, { id, ...rest }: UpdateDocumentData): Promise<void> => {
    await apiFetch<void>(`/api/documents/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  archiveDocument: async (userId: string, documentId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/${documentId}/archive`, 'POST', {
      user_id: userId,
    });
  },

  deleteDocument: async (userId: string, documentId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/${documentId}`, 'DELETE', {
      user_id: userId,
    });
  },

  // Document Links
  addDocumentLink: async (
    userId: string,
    payload: CreateDocumentLinkData,
  ): Promise<DocumentLink> => {
    return apiFetch<DocumentLink>(`/api/documents/${payload.document_id}/links`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  removeDocumentLink: async (userId: string, linkId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/links/${linkId}`, 'DELETE', {
      user_id: userId,
    });
  },

  // Document Reminders
  createReminder: async (
    userId: string,
    payload: CreateDocumentReminderData,
  ): Promise<DocumentReminder> => {
    return apiFetch<DocumentReminder>(`/api/documents/${payload.document_id}/reminders`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  updateReminder: async (
    userId: string,
    { id, ...rest }: UpdateDocumentReminderData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/documents/reminders/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  deleteReminder: async (userId: string, reminderId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/reminders/${reminderId}`, 'DELETE', {
      user_id: userId,
    });
  },

  getUpcomingReminders: async (userId: string): Promise<DocumentReminder[]> => {
    return apiFetch<DocumentReminder[]>(
      `/api/documents/reminders/upcoming?userId=${encodeURIComponent(userId)}`,
    );
  },

  getDocumentsByLinkedEntity: async (
    userId: string,
    linkedEntityId: string,
  ): Promise<DocumentWithLinks[]> => {
    return apiFetch<DocumentWithLinks[]>(
      `/api/documents/by-entity/${linkedEntityId}?userId=${encodeURIComponent(userId)}`,
    );
  },
};
