import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { documentsApi } from '@/services/api/documents';
import {
  CreateDocumentData,
  UpdateDocumentData,
  CreateDocumentLinkData,
  CreateDocumentReminderData,
  UpdateDocumentReminderData,
} from '@/types/document-types';
import { useToast } from './useToast';

const DOCUMENTS_QUERY_KEY = ['documents'];

export const useDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  const getDocuments = useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: () => documentsApi.getDocuments(userId),
    enabled: !!userId,
  });

  const useDocument = (documentId: string) =>
    useQuery({
      queryKey: [...DOCUMENTS_QUERY_KEY, documentId],
      queryFn: () => documentsApi.getDocument(userId, documentId),
      enabled: !!userId && !!documentId,
    });

  const getUpcomingReminders = useQuery({
    queryKey: ['document-reminders', 'upcoming'],
    queryFn: () => documentsApi.getUpcomingReminders(userId),
    enabled: !!userId,
  });

  const createDocument = useMutation({
    mutationFn: (payload: CreateDocumentData) => documentsApi.createDocument(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      toast({ title: 'Document uploaded successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error uploading document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateDocument = useMutation({
    mutationFn: (payload: UpdateDocumentData) => documentsApi.updateDocument(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...DOCUMENTS_QUERY_KEY, variables.id],
      });
      toast({ title: 'Document updated successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveDocument = useMutation({
    mutationFn: (documentId: string) => documentsApi.archiveDocument(userId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      toast({ title: 'Document archived' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error archiving document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(userId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      toast({ title: 'Document deleted' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addDocumentLink = useMutation({
    mutationFn: (payload: CreateDocumentLinkData) => documentsApi.addDocumentLink(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...DOCUMENTS_QUERY_KEY, variables.document_id],
      });
      toast({ title: 'Document linked successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error linking document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeDocumentLink = useMutation({
    mutationFn: ({ linkId, documentId }: { linkId: string; documentId: string }) =>
      documentsApi.removeDocumentLink(userId, linkId).then(() => documentId),
    onSuccess: documentId => {
      queryClient.invalidateQueries({
        queryKey: [...DOCUMENTS_QUERY_KEY, documentId],
      });
      toast({ title: 'Link removed' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createReminder = useMutation({
    mutationFn: (payload: CreateDocumentReminderData) =>
      documentsApi.createReminder(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...DOCUMENTS_QUERY_KEY, variables.document_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['document-reminders', 'upcoming'],
      });
      toast({ title: 'Reminder created' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateReminder = useMutation({
    mutationFn: (payload: UpdateDocumentReminderData) =>
      documentsApi.updateReminder(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['document-reminders', 'upcoming'],
      });
      toast({ title: 'Reminder updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: (reminderId: string) => documentsApi.deleteReminder(userId, reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['document-reminders', 'upcoming'],
      });
      toast({ title: 'Reminder deleted' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    getDocuments,
    useDocument,
    getUpcomingReminders,
    createDocument,
    updateDocument,
    archiveDocument,
    deleteDocument,
    addDocumentLink,
    removeDocumentLink,
    createReminder,
    updateReminder,
    deleteReminder,
  };
};
