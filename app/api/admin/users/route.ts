import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSystemAdmin } from "../../../../lib/admin";
import { hashPassword } from "../../../../lib/auth";
import { transaction } from "../../../../lib/db";
import { ROLES, type Role } from "../../../../lib/types";

export async function GET() {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  return transaction(async (client) => {
    const users = await client.query(`SELECT id,username,full_name,employee_id,email,office,role,is_active,must_change_password,created_at,updated_at FROM uars.users ORDER BY full_name`);
    return NextResponse.json({ users: users.rows });
  });
}

export async function POST(request: Request) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const body = await request.json(); const required = ["username","fullName","employeeId","email","office","role"];
  if (required.some((key) => !String(body[key] || "").trim())) return NextResponse.json({ error: "All user fields are required." }, { status: 400 });
  if (!ROLES.includes(body.role as Role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  const temporaryPassword = randomBytes(12).toString("base64url") + "!9a";
  try {
    return await transaction(async (client) => {
      const result = await client.query(`INSERT INTO uars.users (username,password_hash,full_name,employee_id,email,office,role) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,username,full_name,employee_id,email,office,role,is_active,must_change_password,created_at,updated_at`, [body.username.trim(),hashPassword(temporaryPassword),body.fullName.trim(),body.employeeId.trim(),body.email.trim(),body.office.trim(),body.role]);
      const user = result.rows[0];
      await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'USER_CREATED','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,user.id,JSON.stringify({ username:user.username, role:user.role })]);
      return NextResponse.json({ user, temporaryPassword }, { status: 201 });
    });
  } catch (error) {
    if ((error as {code?:string}).code === "23505") return NextResponse.json({ error: "Username or employee ID already exists." }, { status: 409 });
    throw error;
  }
}
