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
  LinkedEntityType,
} from '@/types/document-types';
import { apiFetch } from '@/lib/api-client';

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    return apiFetch<Document[]>('/api/documents');
  },

  getDocument: async (documentId: string): Promise<DocumentWithLinks> => {
    return apiFetch<DocumentWithLinks>(`/api/documents/${documentId}`);
  },

  createDocument: async (payload: CreateDocumentData): Promise<Document> => {
    return apiFetch<Document>('/api/documents', 'POST', payload);
  },

  updateDocument: async ({ id, ...rest }: UpdateDocumentData): Promise<void> => {
    await apiFetch<void>(`/api/documents/${id}`, 'PUT', rest);
  },

  archiveDocument: async (documentId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/${documentId}/archive`, 'POST');
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/${documentId}`, 'DELETE');
  },

  addDocumentLink: async (payload: CreateDocumentLinkData): Promise<DocumentLink> => {
    return apiFetch<DocumentLink>(`/api/documents/${payload.document_id}/links`, 'POST', payload);
  },

  removeDocumentLink: async (linkId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/links/${linkId}`, 'DELETE');
  },

  createReminder: async (payload: CreateDocumentReminderData): Promise<DocumentReminder> => {
    return apiFetch<DocumentReminder>(`/api/documents/${payload.document_id}/reminders`, 'POST', payload);
  },

  updateReminder: async ({ id, ...rest }: UpdateDocumentReminderData): Promise<void> => {
    await apiFetch<void>(`/api/documents/reminders/${id}`, 'PUT', rest);
  },

  deleteReminder: async (reminderId: string): Promise<void> => {
    await apiFetch<void>(`/api/documents/reminders/${reminderId}`, 'DELETE');
  },

  getUpcomingReminders: async (): Promise<DocumentReminder[]> => {
    return apiFetch<DocumentReminder[]>('/api/documents/reminders/upcoming');
  },

  getDocumentsByLinkedEntity: async (
    entityType: LinkedEntityType,
    entityId: string,
  ): Promise<DocumentWithLinks[]> => {
    const params = new URLSearchParams({
      entity_type: entityType,
      entity_id: entityId,
    });
    return apiFetch<DocumentWithLinks[]>(`/api/documents/by-entity?${params.toString()}`);
  },
};
