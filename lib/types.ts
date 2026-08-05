export const ROLES = [
  "DO",
  "HEAD_OF_OFFICE",
  "REGIONAL_OPERATIONS_CHIEF",
  "REGIONAL_DIRECTOR",
  "MID_CHIEF",
  "TECHNICAL_TEAM",
  "SYSTEM_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];
export type IdentityProvider = "LOCAL" | "KEYCLOAK";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  employeeId: string;
  email: string;
  office: string;
  regionCode: string;
  agencyCode: string;
  position: string;
  contactInfo: string;
  role: Role;
  identityProvider: IdentityProvider;
  mustChangePassword: boolean;
  policyAccepted: boolean;
};

export type AccessRequest = {
  id: string;
  referenceNo: string;
  applicantName: string;
  agencyCode: string;
  immediateSuperior: string;
  regionCode: string;
  requesterPosition: string;
  requesterOffice: string;
  requesterEmployeeNo: string;
  requesterContact: string;
  requesterEmail: string;
  resubmissionCount: number;
  employeeId: string;
  email: string;
  contactNo: string;
  office: string;
  position: string;
  systemName: string;
  accessLevel: string;
  accessLevels: string[];
  accountType: string;
  changeOfficeRequested: boolean;
  changeOfficeFrom: string | null;
  changeOfficeTo: string | null;
  loginMode: string | null;
  ltmsModules: string[];
  ltmsOther: string | null;
  requestedStartDate: string;
  justification: string;
  status: string;
  currentRole: Role | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  implementationId: string | null;
  events: WorkflowEvent[];
};

export type WorkflowEvent = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  actorName: string;
  actorRole: Role;
  createdAt: string;
};
