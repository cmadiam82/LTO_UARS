import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { query } from "../../../lib/db";
import { policyRequired, visibilitySql } from "../../../lib/visibility";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (policyRequired(user)) return NextResponse.json({ error: "Accept the LTOCM Policy Agreement first." }, { status: 403 });
  const scope=visibilitySql(user,"ar",3);
  const result = await query(`SELECT n.id,n.request_id,n.title,n.message,n.is_read,n.created_at FROM uars.notifications n JOIN uars.access_requests ar ON ar.id=n.request_id WHERE (n.user_id=$1 OR n.target_role=$2) AND ${scope.sql} ORDER BY n.created_at DESC LIMIT 50`, [user.id,user.role,...scope.values]);
  return NextResponse.json({ notifications: result.rows, unread: result.rows.filter((row) => !row.is_read).length });
}

export async function POST(request:Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (policyRequired(user)) return NextResponse.json({ error: "Accept the LTOCM Policy Agreement first." }, { status: 403 });
  const scope=visibilitySql(user,"ar",3);
  const body=await request.json().catch(()=>null) as {notificationId?:string}|null;
  const values=[user.id,user.role,...scope.values];
  const idFilter=body?.notificationId?` AND n.id=$${values.length+1}`:"";
  if(body?.notificationId)values.push(body.notificationId);
  await query(`UPDATE uars.notifications n SET is_read=true FROM uars.access_requests ar WHERE ar.id=n.request_id AND (n.user_id=$1 OR n.target_role=$2) AND ${scope.sql}${idFilter}`, values);
  return NextResponse.json({ ok: true });
}
