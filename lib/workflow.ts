import type { Role } from "./types";

export const transitions: Record<
  string,
  { role: Role; action: string; next: string; nextRole: Role | null }
> = {
  PENDING_ENDORSEMENT: {
    role: "HEAD_OF_OFFICE",
    action: "ENDORSE",
    next: "PENDING_RECOMMENDATION",
    nextRole: "REGIONAL_OPERATIONS_CHIEF",
  },
  PENDING_RECOMMENDATION: {
    role: "REGIONAL_OPERATIONS_CHIEF",
    action: "RECOMMEND_APPROVAL",
    next: "PENDING_REGIONAL_DIRECTOR",
    nextRole: "REGIONAL_DIRECTOR",
  },
  PENDING_REGIONAL_DIRECTOR: {
    role: "REGIONAL_DIRECTOR",
    action: "APPROVE",
    next: "PENDING_MID_VERIFICATION",
    nextRole: "MID_VERIFIER",
  },
  PENDING_MID_VERIFICATION: {
    role: "MID_VERIFIER",
    action: "RECOMMEND_APPROVAL",
    next: "PENDING_MID_APPROVAL",
    nextRole: "MID_CHIEF",
  },
  PENDING_MID_APPROVAL: {
    role: "MID_CHIEF",
    action: "APPROVE",
    next: "PENDING_IMPLEMENTATION",
    nextRole: "TECHNICAL_TEAM",
  },
  PENDING_IMPLEMENTATION: {
    role: "TECHNICAL_TEAM",
    action: "IMPLEMENT",
    next: "CLOSED",
    nextRole: null,
  },
};

export const roleLabels: Record<Role, string> = {
  DO: "DO",
  HEAD_OF_OFFICE: "Head of Office",
  REGIONAL_OPERATIONS_CHIEF: "Regional Operations Chief",
  REGIONAL_DIRECTOR: "Regional Director",
  MID_VERIFIER: "MID Verification",
  MID_CHIEF: "MID Chief",
  TECHNICAL_TEAM: "Technical Team",
  SYSTEM_ADMIN: "System Administrator",
};
