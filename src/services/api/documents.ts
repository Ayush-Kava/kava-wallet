import { supabase } from '@/integrations/supabase/client';
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

export const documentsApi = {
  // Documents
  getDocuments: async (userId: string): Promise<Document[]> => {
    const { data, error } = await (supabase
      .from('documents' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false }) as any);

    if (error) throw error;
    return (data || []) as Document[];
  },

  getDocument: async (
    userId: string,
    documentId: string,
  ): Promise<DocumentWithLinks> => {
    const { data: documentData, error: docError } = await (supabase
      .from('documents' as any)
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single() as any);

    if (docError) throw docError;

    const { data: linksData, error: linksError } = await (supabase
      .from('document_links' as any)
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId) as any);

    if (linksError) throw linksError;

    const { data: remindersData, error: remindersError } = await (supabase
      .from('document_reminders' as any)
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId) as any);

    if (remindersError) throw remindersError;

    return {
      ...(documentData as Document),
      links: (linksData || []) as DocumentLink[],
      reminders: (remindersData || []) as DocumentReminder[],
    };
  },

  createDocument: async (
    userId: string,
    payload: CreateDocumentData,
  ): Promise<Document> => {
    const { data, error } = await (supabase
      .from('documents' as any)
      .insert({
        user_id: userId,
        ...payload,
        tags: payload.tags || [],
      })
      .select()
      .single() as any);

    if (error) throw error;
    return data as Document;
  },

  updateDocument: async (
    userId: string,
    { id, ...rest }: UpdateDocumentData,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('documents' as any)
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  archiveDocument: async (
    userId: string,
    documentId: string,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('documents' as any)
      .update({ archived: true })
      .eq('id', documentId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  deleteDocument: async (userId: string, documentId: string): Promise<void> => {
    const { error } = await (supabase
      .from('documents' as any)
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Document Links
  addDocumentLink: async (
    userId: string,
    payload: CreateDocumentLinkData,
  ): Promise<DocumentLink> => {
    const { data, error } = await (supabase
      .from('document_links' as any)
      .insert({
        user_id: userId,
        ...payload,
      })
      .select()
      .single() as any);

    if (error) throw error;
    return data as DocumentLink;
  },

  removeDocumentLink: async (userId: string, linkId: string): Promise<void> => {
    const { error } = await (supabase
      .from('document_links' as any)
      .delete()
      .eq('id', linkId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Document Reminders
  createReminder: async (
    userId: string,
    payload: CreateDocumentReminderData,
  ): Promise<DocumentReminder> => {
    const { data, error } = await (supabase
      .from('document_reminders' as any)
      .insert({
        user_id: userId,
        ...payload,
      })
      .select()
      .single() as any);

    if (error) throw error;
    return data as DocumentReminder;
  },

  updateReminder: async (
    userId: string,
    { id, ...rest }: UpdateDocumentReminderData,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('document_reminders' as any)
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  deleteReminder: async (userId: string, reminderId: string): Promise<void> => {
    const { error } = await (supabase
      .from('document_reminders' as any)
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  getUpcomingReminders: async (userId: string): Promise<DocumentReminder[]> => {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await (supabase
      .from('document_reminders' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('reminder_date', today)
      .order('reminder_date', { ascending: true }) as any);

    if (error) throw error;
    return (data || []) as DocumentReminder[];
  },

  getDocumentsByLinkedEntity: async (
    userId: string,
    linkedEntityId: string,
  ): Promise<DocumentWithLinks[]> => {
    const { data: linksData, error: linksError } = await (supabase
      .from('document_links' as any)
      .select('document_id')
      .eq('user_id', userId)
      .eq('linked_entity_id', linkedEntityId) as any);

    if (linksError) throw linksError;

    if (!linksData || linksData.length === 0) {
      return [];
    }

    const documentIds = linksData.map((link: any) => link.document_id);

    const { data: documentsData, error: docsError } = await (supabase
      .from('documents' as any)
      .select('*')
      .in('id', documentIds)
      .eq('user_id', userId) as any);

    if (docsError) throw docsError;
    return (documentsData || []) as DocumentWithLinks[];
  },
};
