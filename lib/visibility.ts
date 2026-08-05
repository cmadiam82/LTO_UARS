import type { AuthUser } from "./types";

export function visibilitySql(user: AuthUser, alias = "ar", start = 1) {
  if (
    ["MID_VERIFIER", "MID_CHIEF", "TECHNICAL_TEAM", "SYSTEM_ADMIN"].includes(
      user.role,
    )
  )
    return { sql: "TRUE", values: [] as unknown[] };
  if (user.role === "DO")
    return { sql: `${alias}.requester_id=$${start}`, values: [user.id] };
  if (user.role === "HEAD_OF_OFFICE")
    return { sql: `${alias}.agency_code=$${start}`, values: [user.agencyCode] };
  return { sql: `${alias}.region_code=$${start}`, values: [user.regionCode] };
}

export function policyRequired(user: AuthUser) {
  return !user.policyAccepted;
}
