CREATE TABLE IF NOT EXISTS uars.request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES uars.access_requests(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES uars.users(id),
  original_name varchar(255) NOT NULL,
  stored_name varchar(80) NOT NULL UNIQUE,
  content_type varchar(120) NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uars_attachments_request ON uars.request_attachments (request_id, created_at);
