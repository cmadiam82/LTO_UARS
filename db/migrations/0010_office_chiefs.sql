CREATE TABLE IF NOT EXISTS uars.office_chiefs (
  office_id uuid PRIMARY KEY REFERENCES uars.offices(id) ON DELETE CASCADE,
  chief_name varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uars.office_chiefs OWNER TO lto_uars_app;
