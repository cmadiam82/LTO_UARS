ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS agency_code varchar(80);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS immediate_superior varchar(160);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS access_levels jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS change_office_requested boolean NOT NULL DEFAULT false;
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS change_office_from varchar(80);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS change_office_to varchar(80);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS login_mode varchar(80);
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS ltms_modules jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE uars.access_requests ADD COLUMN IF NOT EXISTS ltms_other varchar(255);

UPDATE uars.access_requests SET agency_code=employee_id WHERE agency_code IS NULL;
UPDATE uars.access_requests SET immediate_superior='Not recorded' WHERE immediate_superior IS NULL;
UPDATE uars.access_requests SET access_levels=jsonb_build_array(access_level) WHERE access_levels='[]'::jsonb AND access_level<>'';
ALTER TABLE uars.access_requests ALTER COLUMN agency_code SET NOT NULL;
ALTER TABLE uars.access_requests ALTER COLUMN immediate_superior SET NOT NULL;

UPDATE uars.system_settings SET value='LTO Credentials Management' WHERE key='application_name' AND value='User Access Request System';
UPDATE uars.system_settings SET value='LTOCM' WHERE key='request_prefix' AND value IN ('UARS','UAR');
