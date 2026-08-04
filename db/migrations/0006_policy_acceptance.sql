CREATE TABLE IF NOT EXISTS uars.policy_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES uars.users(id) ON DELETE CASCADE,
  policy_version varchar(40) NOT NULL,
  policy_hash char(64) NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address varchar(64),
  user_agent varchar(500),
  UNIQUE (user_id, policy_version)
);

CREATE INDEX IF NOT EXISTS policy_acceptances_user_idx ON uars.policy_acceptances(user_id);
