-- Add description and contact_email to companies table
ALTER TABLE companies
ADD COLUMN description TEXT,
ADD COLUMN contact_email VARCHAR(255);
