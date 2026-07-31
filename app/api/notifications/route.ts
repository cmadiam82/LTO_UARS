import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { query } from "../../../lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await query(`SELECT id,request_id,title,message,is_read,created_at FROM uars.notifications WHERE user_id=$1 OR target_role=$2 ORDER BY created_at DESC LIMIT 50`, [user.id,user.role]);
  return NextResponse.json({ notifications: result.rows, unread: result.rows.filter((row) => !row.is_read).length });
}

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await query(`UPDATE uars.notifications SET is_read=true WHERE user_id=$1 OR target_role=$2`, [user.id,user.role]);
  return NextResponse.json({ ok: true });
}
