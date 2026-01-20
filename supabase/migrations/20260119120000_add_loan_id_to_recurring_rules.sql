-- Add loan_id column to recurring_rules to track EMI rules linked to loans
ALTER TABLE recurring_rules
ADD COLUMN loan_id UUID REFERENCES loans(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_recurring_rules_loan_id ON recurring_rules(loan_id);
