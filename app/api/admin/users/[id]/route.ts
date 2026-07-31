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
    const existing = await client.query(`SELECT username,role,is_active FROM uars.users WHERE id=$1`, [id]);
    if (!existing.rows[0]) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (body.action === "RESET_PASSWORD") {
      const temporaryPassword = randomBytes(12).toString("base64url") + "!9a";
      await client.query(`UPDATE uars.users SET password_hash=$1,must_change_password=true,updated_at=now() WHERE id=$2`, [hashPassword(temporaryPassword),id]);
      await client.query(`DELETE FROM uars.sessions WHERE user_id=$1`, [id]);
      await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'PASSWORD_RESET','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,id,JSON.stringify({username:existing.rows[0].username})]);
      return NextResponse.json({ temporaryPassword });
    }
    const role = body.role || existing.rows[0].role; const isActive = typeof body.isActive === "boolean" ? body.isActive : existing.rows[0].is_active;
    const updated = await client.query(`UPDATE uars.users SET role=$1,is_active=$2,updated_at=now() WHERE id=$3 RETURNING id,username,full_name,employee_id,email,office,role,is_active,must_change_password,created_at,updated_at`, [role,isActive,id]);
    if (!isActive) await client.query(`DELETE FROM uars.sessions WHERE user_id=$1`, [id]);
    await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'USER_UPDATED','USER',$3,$4)`, [auth.user!.id,auth.user!.fullName,id,JSON.stringify({before:existing.rows[0],after:{role,is_active:isActive}})]);
    return NextResponse.json({ user: updated.rows[0] });
  });
}
