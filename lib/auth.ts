import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db";
import type { AuthUser, IdentityProvider, Role } from "./types";
import { IDLE_TIMEOUT_MINUTES } from "./security";

export const SESSION_COOKIE = "uars_session";
const SESSION_HOURS = 12;

type UserRow = {
  id: string;
  username: string;
  password_hash: string | null;
  full_name: string;
  employee_id: string;
  email: string;
  office: string;
  region_code: string;
  agency_code: string;
  position: string | null;
  contact_info: string | null;
  role: Role;
  identity_provider: IdentityProvider;
  must_change_password: boolean;
  is_active: boolean;
  policy_accepted: boolean;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expectedHex] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    employeeId: row.employee_id,
    email: row.email,
    office: row.office,
    regionCode: row.region_code,
    agencyCode: row.agency_code,
    position: row.position || "",
    contactInfo: row.contact_info || "",
    role: row.role,
    identityProvider: row.identity_provider,
    mustChangePassword: row.must_change_password,
    policyAccepted: row.policy_accepted,
  };
}

export async function authenticate(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  const result = await query<UserRow>(
    `SELECT id, username, password_hash, full_name, employee_id, email, office, region_code, agency_code, position, contact_info, role, identity_provider,
            must_change_password, is_active, CASE WHEN role='DO' THEN false ELSE EXISTS(SELECT 1 FROM uars.policy_acceptances p WHERE p.user_id=u.id) END AS policy_accepted
       FROM uars.users u WHERE lower(username) = lower($1) AND identity_provider='LOCAL'`,
    [username],
  );
  const row = result.rows[0];
  if (
    !row?.is_active ||
    !row.password_hash ||
    !verifyPassword(password, row.password_hash)
  )
    return null;
  return toUser(row);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO uars.sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash(token), expiresAt],
  );
  return { token, expiresAt };
}

export async function currentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await query<UserRow>(
    `SELECT u.id, u.username, u.password_hash, u.full_name, u.employee_id, u.email,
            u.office, u.region_code, u.agency_code, u.position, u.contact_info, u.role, u.identity_provider, u.must_change_password, u.is_active,
            CASE WHEN u.role='DO' THEN (s.policy_accepted_at IS NOT NULL) ELSE EXISTS(SELECT 1 FROM uars.policy_acceptances p WHERE p.user_id=u.id) END AS policy_accepted
       FROM uars.sessions s JOIN uars.users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()
        AND s.last_activity_at > now() - ($2::text || ' minutes')::interval
        AND u.is_active = true`,
    [tokenHash(token), IDLE_TIMEOUT_MINUTES],
  );
  if (!result.rows[0]) {
    await query(`DELETE FROM uars.sessions WHERE token_hash=$1`, [
      tokenHash(token),
    ]);
    return null;
  }
  await query(
    `UPDATE uars.sessions SET last_activity_at=now() WHERE token_hash=$1`,
    [tokenHash(token)],
  );
  return toUser(result.rows[0]);
}

export async function acceptPolicyForCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await query<{ id: string }>(
    `UPDATE uars.sessions SET policy_accepted_at=now(),last_activity_at=now() WHERE token_hash=$1 RETURNING id`,
    [tokenHash(token)],
  );
  return result.rows[0]?.id || null;
}

export async function revokeCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token)
    await query(`DELETE FROM uars.sessions WHERE token_hash = $1`, [
      tokenHash(token),
    ]);
}

export async function verifyUserPassword(userId: string, password: string) {
  const result = await query<{ password_hash: string | null }>(
    `SELECT password_hash FROM uars.users WHERE id = $1 AND identity_provider='LOCAL'`,
    [userId],
  );
  return (
    !!result.rows[0]?.password_hash &&
    verifyPassword(password, result.rows[0].password_hash)
  );
}
