import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const accounts = [
  ["do.user", "Dianne O. Reyes", "DO-001", "do.user@lto.gov.ph", "District Office", "DO"],
  ["head.office", "Atty. Luis M. Santos", "HOO-001", "head.office@lto.gov.ph", "Office of the Regional Director", "HEAD_OF_OFFICE"],
  ["operations.chief", "Carlo D. Flores", "ROC-001", "operations.chief@lto.gov.ph", "Regional Operations Division", "REGIONAL_OPERATIONS_CHIEF"],
  ["regional.director", "Elena V. Cruz", "RD-001", "regional.director@lto.gov.ph", "Office of the Regional Director", "REGIONAL_DIRECTOR"],
  ["mid.chief", "Marco L. Tan", "MID-001", "mid.chief@lto.gov.ph", "Management Information Division", "MID_CHIEF"],
  ["technical.team", "UARS Technical Team", "TECH-001", "technical.team@lto.gov.ph", "Management Information Division", "TECHNICAL_TEAM"],
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
console.log("UARS v0.2.1 INITIAL ACCOUNTS");
console.log("Change each temporary password immediately after first login.\n");
for (const [username, fullName, employeeId, email, office, role] of accounts) {
  const password = `Uars!${randomBytes(9).toString("base64url")}`;
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const result = await pool.query(
    `INSERT INTO uars.users (username,password_hash,full_name,employee_id,email,office,role)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT ((lower(username))) DO NOTHING RETURNING username`,
    [username, `scrypt:${salt}:${hash}`, fullName, employeeId, email, office, role],
  );
  if (result.rowCount) console.log(`${username}\t${password}\t${role}`);
}
await pool.end();
