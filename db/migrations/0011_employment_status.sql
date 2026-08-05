ALTER TABLE uars.access_requests
  ADD COLUMN IF NOT EXISTS employment_status varchar(40) NOT NULL DEFAULT 'Not recorded';

ALTER TABLE uars.access_requests OWNER TO lto_uars_app;
