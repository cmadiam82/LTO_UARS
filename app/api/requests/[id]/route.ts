import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { query } from "../../../../lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const requestResult = await query(`SELECT ar.*, ar.requested_start_date::text FROM uars.access_requests ar WHERE ar.id=$1 AND ($2::text <> 'DO' OR ar.requester_id=$3)`, [id,user.role,user.id]);
  if (!requestResult.rows[0]) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  const events = await query(`SELECT id,action,from_status,to_status,notes,actor_name,actor_role,created_at FROM uars.workflow_events WHERE request_id=$1 ORDER BY created_at DESC`, [id]);
  const attachments = await query(`SELECT id,original_name,content_type,size_bytes,created_at FROM uars.request_attachments WHERE request_id=$1 ORDER BY created_at`, [id]);
  return NextResponse.json({ request: requestResult.rows[0], events: events.rows, attachments:attachments.rows });
}
