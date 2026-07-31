CREATE SCHEMA IF NOT EXISTS uars;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS uars.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(80) NOT NULL,
  password_hash text NOT NULL,
  full_name varchar(160) NOT NULL,
  employee_id varchar(80) NOT NULL,
  email varchar(180) NOT NULL,
  office varchar(180) NOT NULL,
  role varchar(40) NOT NULL CHECK (role IN ('DO','HEAD_OF_OFFICE','REGIONAL_OPERATIONS_CHIEF','REGIONAL_DIRECTOR','MID_CHIEF','TECHNICAL_TEAM')),
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uars_users_username ON uars.users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_uars_users_employee_id ON uars.users (employee_id);

CREATE TABLE IF NOT EXISTS uars.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES uars.users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uars_sessions_user_expires ON uars.sessions (user_id, expires_at);

CREATE SEQUENCE IF NOT EXISTS uars.request_number_seq START 1;
CREATE TABLE IF NOT EXISTS uars.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no varchar(32) NOT NULL UNIQUE,
  requester_id uuid NOT NULL REFERENCES uars.users(id),
  applicant_name varchar(160) NOT NULL,
  employee_id varchar(80) NOT NULL,
  email varchar(180) NOT NULL,
  contact_no varchar(60) NOT NULL,
  office varchar(180) NOT NULL,
  position varchar(160) NOT NULL,
  system_name varchar(180) NOT NULL,
  access_level varchar(180) NOT NULL,
  account_type varchar(100) NOT NULL,
  requested_start_date date NOT NULL,
  justification text NOT NULL,
  status varchar(50) NOT NULL,
  current_role varchar(40),
  implementation_id varchar(40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_uars_requests_status_role ON uars.access_requests (status, current_role);
CREATE INDEX IF NOT EXISTS idx_uars_requests_requester ON uars.access_requests (requester_id, created_at DESC);

CREATE TABLE IF NOT EXISTS uars.workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES uars.access_requests(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES uars.users(id),
  actor_name varchar(160) NOT NULL,
  actor_role varchar(40) NOT NULL,
  action varchar(50) NOT NULL,
  from_status varchar(50),
  to_status varchar(50) NOT NULL,
  notes varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uars_events_request_created ON uars.workflow_events (request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS uars.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES uars.users(id) ON DELETE CASCADE,
  target_role varchar(40),
  request_id uuid REFERENCES uars.access_requests(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR target_role IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_uars_notifications_user_unread ON uars.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uars_notifications_role_unread ON uars.notifications (target_role, is_read, created_at DESC);
