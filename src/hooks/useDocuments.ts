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

/** Upcoming reminders only — does not load the full documents list. */
export const useUpcomingReminders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document-reminders', 'upcoming'],
    queryFn: () => documentsApi.getUpcomingReminders(),
    enabled: !!user,
  });
};

type UseDocumentsOptions = {
  /** When false, skips the documents list query (mutations still work). Default: true */
  loadList?: boolean;
};

export const useDocuments = (options?: UseDocumentsOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loadList = options?.loadList ?? true;

  const getDocuments = useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: () => documentsApi.getDocuments(),
    enabled: !!user && loadList,
  });

  const useDocument = (documentId: string) =>
    useQuery({
      queryKey: [...DOCUMENTS_QUERY_KEY, documentId],
      queryFn: () => documentsApi.getDocument(documentId),
      enabled: !!user && !!documentId,
    });

  const getUpcomingReminders = useUpcomingReminders();

  const createDocument = useMutation({
    mutationFn: (payload: CreateDocumentData) => documentsApi.createDocument(payload),
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
    mutationFn: (payload: UpdateDocumentData) => documentsApi.updateDocument(payload),
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
    mutationFn: (documentId: string) => documentsApi.archiveDocument(documentId),
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
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
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
    mutationFn: (payload: CreateDocumentLinkData) => documentsApi.addDocumentLink(payload),
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
      documentsApi.removeDocumentLink(linkId).then(() => documentId),
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
    mutationFn: (payload: CreateDocumentReminderData) => documentsApi.createReminder(payload),
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
    mutationFn: (payload: UpdateDocumentReminderData) => documentsApi.updateReminder(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['document-reminders', 'upcoming'],
      });
      if (variables.document_id) {
        queryClient.invalidateQueries({
          queryKey: [...DOCUMENTS_QUERY_KEY, variables.document_id],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      }
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
    mutationFn: (reminderId: string) => documentsApi.deleteReminder(reminderId),
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
