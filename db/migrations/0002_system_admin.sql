ALTER TABLE uars.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE uars.users ADD CONSTRAINT users_role_check CHECK (role IN (
  'DO','HEAD_OF_OFFICE','REGIONAL_OPERATIONS_CHIEF','REGIONAL_DIRECTOR',
  'MID_CHIEF','TECHNICAL_TEAM','SYSTEM_ADMIN'
));

CREATE TABLE IF NOT EXISTS uars.system_settings (
  key varchar(80) PRIMARY KEY,
  value text NOT NULL,
  description varchar(240) NOT NULL,
  updated_by uuid REFERENCES uars.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO uars.system_settings (key,value,description) VALUES
  ('application_name','User Access Request System','Name displayed throughout the application'),
  ('support_email','uars-support@lto.gov.ph','Support contact shown to users'),
  ('request_prefix','UARS','Prefix used for newly generated request references'),
  ('target_processing_days','5','Target number of business days for completion'),
  ('maintenance_message','','Optional system-wide maintenance advisory')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS uars.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES uars.users(id),
  actor_name varchar(160) NOT NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id varchar(120) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uars_admin_audit_created ON uars.admin_audit_events (created_at DESC);
