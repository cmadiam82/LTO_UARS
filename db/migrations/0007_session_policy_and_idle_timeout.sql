ALTER TABLE uars.sessions ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE uars.sessions ADD COLUMN IF NOT EXISTS policy_accepted_at timestamptz;

ALTER TABLE uars.policy_acceptances DROP CONSTRAINT IF EXISTS policy_acceptances_user_id_policy_version_key;
ALTER TABLE uars.policy_acceptances ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES uars.sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sessions_last_activity_idx ON uars.sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS policy_acceptances_session_idx ON uars.policy_acceptances(session_id);

ALTER TABLE uars.sessions OWNER TO lto_uars_app;
ALTER TABLE uars.policy_acceptances OWNER TO lto_uars_app;
