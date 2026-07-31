export const ROLES = [
  "DO",
  "HEAD_OF_OFFICE",
  "REGIONAL_OPERATIONS_CHIEF",
  "REGIONAL_DIRECTOR",
  "MID_CHIEF",
  "TECHNICAL_TEAM",
] as const;

export type Role = (typeof ROLES)[number];

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  employeeId: string;
  email: string;
  office: string;
  role: Role;
  mustChangePassword: boolean;
};

export type AccessRequest = {
  id: string;
  referenceNo: string;
  applicantName: string;
  employeeId: string;
  email: string;
  contactNo: string;
  office: string;
  position: string;
  systemName: string;
  accessLevel: string;
  accountType: string;
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
