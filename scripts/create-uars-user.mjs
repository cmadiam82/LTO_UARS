import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

const [username, password, fullName, employeeId, email, office, role] = process.argv.slice(2);
if (![username, password, fullName, employeeId, email, office, role].every(Boolean)) {
  console.error("Usage: create-uars-user <username> <password> <full-name> <employee-id> <email> <office> <role>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(
  `INSERT INTO uars.users (username, password_hash, full_name, employee_id, email, office, role)
   VALUES ($1,$2,$3,$4,$5,$6,$7)
   ON CONFLICT ((lower(username))) DO UPDATE SET full_name=excluded.full_name, employee_id=excluded.employee_id,
     email=excluded.email, office=excluded.office, role=excluded.role, is_active=true`,
  [username, `scrypt:${salt}:${hash}`, fullName, employeeId, email, office, role],
);
await pool.end();
console.log(`Created ${username} (${role})`);
