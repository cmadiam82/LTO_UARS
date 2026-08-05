ALTER TABLE uars.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE uars.users ADD CONSTRAINT users_role_check CHECK (role IN (
  'DO','HEAD_OF_OFFICE','REGIONAL_OPERATIONS_CHIEF','REGIONAL_DIRECTOR',
  'MID_VERIFIER','MID_CHIEF','TECHNICAL_TEAM','SYSTEM_ADMIN'
));
ALTER TABLE uars.request_attachments ADD COLUMN IF NOT EXISTS document_type varchar(60) NOT NULL DEFAULT 'SUPPORTING_DOCUMENT';
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS verification_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_uars_request_verification_token ON uars.access_requests(verification_token);
