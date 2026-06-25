import { asPublicId } from '@/lib/public-id';

// Define types directly since tables don't exist yet in Supabase types
export interface Document {
  id: string;
  name: string;
  description?: string | null;
  file_url: string;
  file_type: string;
  file_extension: string;
  mime_type: string;
  file_size: number;
  tags: string[];
  notes?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentLink {
  id: string;
  document_id: string;
  linked_entity_type: string;
  linked_entity_id: string;
  created_at: string;
}

export interface DocumentReminder {
  id: string;
  document_id: string;
  reminder_type: string;
  reminder_date: string;
  title: string;
  description?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export type DocumentFileType = 'pdf' | 'image' | 'scan' | 'receipt';
export type LinkedEntityType =
  | 'transaction'
  | 'credit_card'
  | 'loan'
  | 'emi'
  | 'account'
  | 'investment';
export type ReminderType = 'policy_expiry' | 'statement_due' | 'document_validity';

export interface CreateDocumentData {
  name: string;
  description?: string;
  file_url: string;
  file_type: DocumentFileType;
  file_extension: string;
  mime_type: string;
  file_size: number;
  tags?: string[];
  notes?: string;
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  id: string;
}

export interface DocumentWithLinks extends Document {
  links: DocumentLink[];
  reminders: DocumentReminder[];
}

export interface CreateDocumentLinkData {
  document_id: string;
  linked_entity_type: LinkedEntityType;
  linked_entity_id: string;
}

export interface CreateDocumentReminderData {
  document_id: string;
  reminder_type: ReminderType;
  reminder_date: string;
  title: string;
  description?: string;
}

export interface UpdateDocumentReminderData extends Partial<CreateDocumentReminderData> {
  id: string;
  completed?: boolean;
}

export const toDocumentType = (doc: any): Document => ({
  id: asPublicId(doc.publicId),
  name: doc.name,
  description: doc.description,
  file_url: doc.file_url,
  file_type: doc.file_type,
  file_extension: doc.file_extension ?? '',
  mime_type: doc.mime_type ?? 'application/octet-stream',
  file_size: doc.file_size,
  tags: doc.tags ?? [],
  notes: doc.notes,
  archived: doc.archived,
  created_at: doc.createdAt.toISOString(),
  updated_at: doc.updatedAt.toISOString(),
});

export const toDocumentLinkType = (link: any): DocumentLink => ({
  id: asPublicId(link.publicId),
  document_id: link.document?.publicId != null ? asPublicId(link.document.publicId) : '',
  linked_entity_type: link.linked_entity_type,
  linked_entity_id: asPublicId(link.linked_entity_public_id),
  created_at: link.createdAt.toISOString(),
});

export const toDocumentReminderType = (reminder: any): DocumentReminder => ({
  id: asPublicId(reminder.publicId),
  document_id: reminder.document?.publicId != null ? asPublicId(reminder.document.publicId) : '',
  reminder_type: reminder.reminder_type,
  reminder_date: reminder.reminder_date?.toISOString().split('T')[0],
  title: reminder.title,
  description: reminder.description,
  completed: reminder.completed,
  created_at: reminder.createdAt.toISOString(),
  updated_at: reminder.updatedAt.toISOString(),
});
