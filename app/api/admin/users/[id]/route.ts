import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSystemAdmin } from "../../../../../lib/admin";
import { hashPassword } from "../../../../../lib/auth";
import { transaction } from "../../../../../lib/db";
import { ROLES, type Role } from "../../../../../lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const { id } = await params; const body = await request.json();
  if (id === auth.user!.id && (body.isActive === false || (body.role && body.role !== "SYSTEM_ADMIN"))) return NextResponse.json({ error: "You cannot disable or remove your own administrator access." }, { status: 400 });
  if (body.role && !ROLES.includes(body.role as Role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  return transaction(async (client) => {
    const existing = await client.query(`SELECT username,role,is_active,region_code,agency_code FROM uars.users WHERE id=$1`, [id]);
    if (!existing.rows[0]) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (body.action === "RESET_PASSWORD") {
      const temporaryPassword = randomBytes(12).toString("base64url") + "!9a";
      await client.query(`UPDATE uars.users SET password_hash=$1,must_change_password=true,updated_at=now() WHERE id=$2`, [hashPassword(temporaryPassword),id]);
      await client.query(`DELETE FROM uars.sessions WHERE user_id=$1`, [id]);
      await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'PASSWORD_RESET','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,id,JSON.stringify({username:existing.rows[0].username})]);
      return NextResponse.json({ temporaryPassword });
    }
    const role = body.role || existing.rows[0].role; const isActive = typeof body.isActive === "boolean" ? body.isActive : existing.rows[0].is_active;const regionCode=String(body.regionCode||existing.rows[0].region_code).trim().toUpperCase();const agencyCode=String(body.agencyCode||existing.rows[0].agency_code).trim().toUpperCase();
    const updated = await client.query(`UPDATE uars.users SET role=$1,is_active=$2,region_code=$3,agency_code=$4,updated_at=now() WHERE id=$5 RETURNING id,username,full_name,employee_id,email,office,region_code,agency_code,position,contact_info,role,identity_provider,is_active,must_change_password,created_at,updated_at`, [role,isActive,regionCode,agencyCode,id]);
    if (!isActive) await client.query(`DELETE FROM uars.sessions WHERE user_id=$1`, [id]);
    await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'USER_UPDATED','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,id,JSON.stringify({before:existing.rows[0],after:{role,is_active:isActive}})]);
    return NextResponse.json({ user: updated.rows[0] });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const { id } = await params;
  if (id === auth.user!.id) return NextResponse.json({ error: "You cannot delete your own administrator account." }, { status: 400 });
  try {
    return await transaction(async (client) => {
      const existing = await client.query(`SELECT username,full_name,role FROM uars.users WHERE id=$1 FOR UPDATE`, [id]);
      const target = existing.rows[0];
      if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
      await client.query(`DELETE FROM uars.users WHERE id=$1`, [id]);
      await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'USER_DELETED','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,id,JSON.stringify({username:target.username,full_name:target.full_name,role:target.role})]);
      return NextResponse.json({ ok:true });
    });
  } catch (error) {
    if ((error as {code?:string}).code === "23503") return NextResponse.json({ error: "This user has permanent workflow or audit records and cannot be deleted. Suspend the account instead." }, { status: 409 });
    throw error;
  }
}
