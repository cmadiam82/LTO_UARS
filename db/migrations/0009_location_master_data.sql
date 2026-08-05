CREATE TABLE IF NOT EXISTS uars.regions (
  code varchar(40) PRIMARY KEY,
  name varchar(160) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uars.agencies (
  code varchar(80) PRIMARY KEY,
  region_code varchar(40) NOT NULL REFERENCES uars.regions(code),
  name varchar(180) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uars.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code varchar(80) NOT NULL REFERENCES uars.agencies(code),
  name varchar(180) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_code,name)
);

INSERT INTO uars.regions(code,name)
SELECT DISTINCT region_code,CASE region_code WHEN 'NATIONAL' THEN 'National / Central Office' WHEN 'UNASSIGNED' THEN 'Unassigned legacy records' ELSE region_code END
FROM (SELECT region_code FROM uars.users UNION SELECT region_code FROM uars.access_requests) source
WHERE region_code IS NOT NULL AND region_code<>'' ON CONFLICT(code) DO NOTHING;

INSERT INTO uars.agencies(code,region_code,name)
SELECT agency_code,min(region_code),agency_code
FROM (SELECT agency_code,region_code FROM uars.users UNION ALL SELECT agency_code,region_code FROM uars.access_requests) source
WHERE agency_code IS NOT NULL AND agency_code<>'' GROUP BY agency_code ON CONFLICT(code) DO NOTHING;

INSERT INTO uars.offices(agency_code,name)
SELECT DISTINCT agency_code,office FROM uars.users WHERE agency_code<>'' AND office<>'' ON CONFLICT(agency_code,name) DO NOTHING;
INSERT INTO uars.offices(agency_code,name)
SELECT DISTINCT agency_code,office FROM uars.access_requests WHERE agency_code<>'' AND office<>'' ON CONFLICT(agency_code,name) DO NOTHING;

ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES uars.offices(id);
UPDATE uars.users u SET office_id=o.id FROM uars.offices o WHERE o.agency_code=u.agency_code AND o.name=u.office AND u.office_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_uars_users_office ON uars.users(office_id);

ALTER TABLE uars.regions OWNER TO lto_uars_app;
ALTER TABLE uars.agencies OWNER TO lto_uars_app;
ALTER TABLE uars.offices OWNER TO lto_uars_app;
