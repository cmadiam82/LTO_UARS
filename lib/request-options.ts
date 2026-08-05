export const SYSTEM_OPTIONS = [
  "Land Transportation Management System (LTMS)",
  "LTO Credentials Management (LTOCM)",
  "Motor Vehicle & License Registry Verification System",
  "LTO Document Management System",
  "LTO DRIVE",
  "Queueing System",
] as const;

export const ACCESS_LEVELS = ["Evaluator","Cashier","Inspector","Assistant Chief","District Chief","Regional Office Personnel","RO Division/ Section/ Unit Chief","Regional Director","Assistant Regional Director","Central Office Personnel","CO Division/ Section/ Unit Chief","Executive Director","Assistant Secretary","Medical Stakeholder","Driving School","MAIRDS","PETC","PMVIC","Service Provider"] as const;
export const ACCOUNT_TYPES = ["New Account","Add Role","Remove Role","Transfer Office","Reactive User","Deactive User"] as const;
export const LOGIN_MODES = ["Password","Fingerprint","Facial Recognition"] as const;
export const EMPLOYMENT_STATUSES = ["Regular","Job Order","Contract of Service","LTO Stakeholder"] as const;

export const LTMS_MODULE_GROUPS = [
  {name:"Drivers' Licensing System (DLS)",items:["DLS Access and Examination","Client Care Officer- Link Client","Client Care Officer Search DL"]},
  {name:"Motor Vehicle Inspection and Registration System (MVIRS)",items:["MV Approving Officer","MV Officer w/o Biometrics","MV Releasing Officer","MV DO Inspector","Plate Management Request (Regional Office)","Plate Management Request (Requestor Office)","Plate Management Tracking (NRU)","MVIRS Plate Admin Role (NRU)","MVIRS Overview"]},
  {name:"Law Enforcement and Traffic Adjudication System",items:["Law Enforcer/ Deputize Agent (Handheld)","Data Control Officer (Apprehension Encoder)","TAS Hearing Officer","Alarm Internal Account- Requestor","Alarm Internal Account- Tagging/ Lifting","Custodial and Releasing (CRS Officer)","Intervention Program","Lift Suspension- Requestor","Lift Suspension- Approving","LETAS: View Apprehension"]},
  {name:"Inter- Agency Collaboration (OGA)",items:["Apprehension","Alarm"]},
  {name:"Revenue Collection System (RCS)",items:["RCS Primary Cashier User","RCS Cashier User","RCS Official Receipt (Office)","RCS Official Receipt (Region Office)","RCS Resident Auditor"]},
  {name:"Others",items:["Frontliner- Client Assistance","Clients Admin- Biometrics Enroll","Client Care Officer- View Address Only","OAAS- View Appointment","Stakeholder- RO OD Evaluator","Stakeholder- Stakeholder Enrollment Access","Client Care Officer- Edit Stakeholder Details","Client Care Officer- Edit Stakeholder Representative Details","Imported Legacy Motor Vehicle (Regular Only)","Others. Please specify"]},
  {name:"Roles for the Chief/ OIC Only",chiefOnly:true,items:["MV Super Administrator","TAS Approving Officer/ Director","Closing/ Lifting of Pending Migrated Apprehensions/ Alarm","RCS OR Cancellation Requestor","Clients Admin- Client Verification","Client Care Edit Plate from 7 to 6 Digits"]},
] as const;

export const ALL_LTMS_MODULES = LTMS_MODULE_GROUPS.flatMap((group)=>group.items);
