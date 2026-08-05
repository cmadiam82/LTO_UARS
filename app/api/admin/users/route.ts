import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSystemAdmin } from "../../../../lib/admin";
import { hashPassword } from "../../../../lib/auth";
import { transaction } from "../../../../lib/db";
import { ROLES, type Role } from "../../../../lib/types";

export async function GET() {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  return transaction(async (client) => {
    const users = await client.query(`SELECT id,username,full_name,employee_id,email,office,office_id,region_code,agency_code,position,contact_info,role,identity_provider,is_active,must_change_password,created_at,updated_at FROM uars.users ORDER BY full_name`);
    return NextResponse.json({ users: users.rows });
  });
}

export async function POST(request: Request) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const body = await request.json();
  if (!("officeId" in body)) return NextResponse.json({ error: "This page is from an older LTOCM version. Refresh the browser, then create the account using the Managed Office field." }, { status:409 });
  const required = ["username","fullName","employeeId","email","officeId","position","contactInfo","role"];
  if (required.some((key) => !String(body[key] || "").trim())) return NextResponse.json({ error: "All user fields are required." }, { status: 400 });
  if (!ROLES.includes(body.role as Role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  const temporaryPassword = randomBytes(12).toString("base64url") + "!9a";
  try {
    return await transaction(async (client) => {
      const location=await client.query(`SELECT o.id,o.name office,a.code agency_code,a.region_code FROM uars.offices o JOIN uars.agencies a ON a.code=o.agency_code JOIN uars.regions r ON r.code=a.region_code WHERE o.id=$1 AND o.is_active AND a.is_active AND r.is_active`,[body.officeId]);if(!location.rows[0])return NextResponse.json({error:"Select an active managed office."},{status:400});const place=location.rows[0];
      const result = await client.query(`INSERT INTO uars.users (username,password_hash,full_name,employee_id,email,office,office_id,region_code,agency_code,position,contact_info,role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id,username,full_name,employee_id,email,office,office_id,region_code,agency_code,position,contact_info,role,identity_provider,is_active,must_change_password,created_at,updated_at`, [body.username.trim(),hashPassword(temporaryPassword),body.fullName.trim(),body.employeeId.trim(),body.email.trim(),place.office,place.id,place.region_code,place.agency_code,body.position.trim(),body.contactInfo.trim(),body.role]);
      const user = result.rows[0];
      await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'USER_CREATED','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,user.id,JSON.stringify({ username:user.username, role:user.role })]);
      return NextResponse.json({ user, temporaryPassword }, { status: 201 });
    });
  } catch (error) {
    if ((error as {code?:string}).code === "23505") return NextResponse.json({ error: "Username, employee number, or active DO agency assignment already exists." }, { status: 409 });
    throw error;
  }
}
