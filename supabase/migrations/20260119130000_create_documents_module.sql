-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- pdf, image, scan, receipt
  file_size INT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create document links table (for linking to transactions, loans, etc.)
CREATE TABLE document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_entity_type VARCHAR(50) NOT NULL, -- transaction, credit_card, loan, emi, account
  linked_entity_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create reminders table
CREATE TABLE document_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- policy_expiry, statement_due, document_validity
  reminder_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_archived ON documents(archived);
CREATE INDEX idx_document_links_document_id ON document_links(document_id);
CREATE INDEX idx_document_links_user_id ON document_links(user_id);
CREATE INDEX idx_document_links_entity ON document_links(linked_entity_type, linked_entity_id);
CREATE INDEX idx_document_reminders_document_id ON document_reminders(document_id);
CREATE INDEX idx_document_reminders_user_id ON document_reminders(user_id);
CREATE INDEX idx_document_reminders_date ON document_reminders(reminder_date);

-- RLS Policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
  ON documents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for document_links
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document links"
  ON document_links
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own document links"
  ON document_links
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own document links"
  ON document_links
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for document_reminders
ALTER TABLE document_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document reminders"
  ON document_reminders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own document reminders"
  ON document_reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own document reminders"
  ON document_reminders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own document reminders"
  ON document_reminders
  FOR DELETE
  USING (user_id = auth.uid());
