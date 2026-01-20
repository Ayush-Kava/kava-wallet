// Define types directly since tables don't exist yet in Supabase types
export interface Document {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  file_url: string;
  file_type: string;
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
  user_id: string;
  linked_entity_type: string;
  linked_entity_id: string;
  created_at: string;
}

export interface DocumentReminder {
  id: string;
  document_id: string;
  user_id: string;
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
  | 'account';
export type ReminderType =
  | 'policy_expiry'
  | 'statement_due'
  | 'document_validity';

export interface CreateDocumentData {
  name: string;
  description?: string;
  file_url: string;
  file_type: DocumentFileType;
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
}
