ALTER TABLE uars.users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS identity_provider varchar(30) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS external_subject varchar(255);
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS external_issuer varchar(500);
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS last_external_login_at timestamptz;
ALTER TABLE uars.users DROP CONSTRAINT IF EXISTS users_identity_provider_check;
ALTER TABLE uars.users ADD CONSTRAINT users_identity_provider_check CHECK (identity_provider IN ('LOCAL','KEYCLOAK'));
ALTER TABLE uars.users DROP CONSTRAINT IF EXISTS users_identity_fields_check;
ALTER TABLE uars.users ADD CONSTRAINT users_identity_fields_check CHECK (
  (identity_provider='LOCAL' AND password_hash IS NOT NULL) OR
  (identity_provider='KEYCLOAK' AND external_subject IS NOT NULL AND external_issuer IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uars_users_external_identity ON uars.users (external_issuer,external_subject) WHERE external_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS uars.identity_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider varchar(30) NOT NULL CHECK (provider IN ('KEYCLOAK')),
  external_role varchar(160) NOT NULL,
  uars_role varchar(40) NOT NULL CHECK (uars_role IN ('DO','HEAD_OF_OFFICE','REGIONAL_OPERATIONS_CHIEF','REGIONAL_DIRECTOR','MID_CHIEF','TECHNICAL_TEAM','SYSTEM_ADMIN')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider,external_role)
);
