import { NextResponse } from "next/server";
import { currentUser, hashPassword, verifyUserPassword } from "../../../../lib/auth";
import { query } from "../../../../lib/db";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { currentPassword?: string; newPassword?: string } | null;
  if (!body?.currentPassword || !body.newPassword || body.newPassword.length < 12) {
    return NextResponse.json({ error: "Use a new password with at least 12 characters." }, { status: 400 });
  }
  if (!(await verifyUserPassword(user.id, body.currentPassword))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  await query(`UPDATE uars.users SET password_hash=$1, must_change_password=false, updated_at=now() WHERE id=$2`, [hashPassword(body.newPassword), user.id]);
  return NextResponse.json({ ok: true });
}
