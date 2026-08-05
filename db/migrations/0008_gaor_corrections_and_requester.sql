ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS region_code varchar(40) NOT NULL DEFAULT 'UNASSIGNED';
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS agency_code varchar(80);
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS position varchar(160);
ALTER TABLE uars.users ADD COLUMN IF NOT EXISTS contact_info varchar(120);

UPDATE uars.users SET agency_code=employee_id WHERE agency_code IS NULL;
UPDATE uars.users SET region_code='NCR' WHERE region_code='UNASSIGNED' AND (employee_id LIKE 'NCR-%' OR office ILIKE '%Diliman%');
UPDATE uars.users SET region_code='NCR' WHERE region_code='UNASSIGNED' AND role IN ('HEAD_OF_OFFICE','REGIONAL_OPERATIONS_CHIEF','REGIONAL_DIRECTOR');
UPDATE uars.users SET region_code='NATIONAL' WHERE role IN ('MID_CHIEF','TECHNICAL_TEAM','SYSTEM_ADMIN');
UPDATE uars.users SET agency_code='NCR-4150' WHERE lower(username)='head.office' AND role='HEAD_OF_OFFICE';
ALTER TABLE uars.users ALTER COLUMN agency_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_uars_one_active_do_per_agency
  ON uars.users (agency_code) WHERE role='DO' AND is_active=true;

ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS region_code varchar(40) NOT NULL DEFAULT 'UNASSIGNED';
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS requester_position varchar(160);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS requester_office varchar(180);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS requester_employee_no varchar(80);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS requester_contact varchar(120);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS requester_email varchar(180);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS returned_at timestamptz;
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS resubmission_count integer NOT NULL DEFAULT 0;

UPDATE uars.access_requests SET
  region_code=CASE WHEN agency_code LIKE 'NCR-%' THEN 'NCR' WHEN agency_code LIKE 'R4B-%' THEN 'R4B' ELSE region_code END,
  requester_position=COALESCE(requester_position,position,'Not recorded'),
  requester_office=COALESCE(requester_office,office,'Not recorded'),
  requester_employee_no=COALESCE(requester_employee_no,employee_id,'Not recorded'),
  requester_contact=COALESCE(requester_contact,contact_no,'Not recorded'),
  requester_email=COALESCE(requester_email,email,'Not recorded');

CREATE INDEX IF NOT EXISTS idx_uars_requests_region ON uars.access_requests(region_code,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uars_requests_agency ON uars.access_requests(agency_code,created_at DESC);
