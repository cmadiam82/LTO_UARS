import { NextResponse } from "next/server";
import { currentUser, verifyUserPassword } from "../../../../../lib/auth";
import { transaction } from "../../../../../lib/db";
import { roleLabels, transitions } from "../../../../../lib/workflow";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.mustChangePassword) return NextResponse.json({ error: "Change your temporary password first." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { action?: string; notes?: string; password?: string } | null;
  try {
    const result = await transaction(async (client) => {
      const locked = await client.query<{ status: string; reference_no: string }>(`SELECT status, reference_no FROM uars.access_requests WHERE id=$1 FOR UPDATE`, [id]);
      const record = locked.rows[0];
      if (!record) throw new Error("NOT_FOUND");
      const transition = transitions[record.status];
      if (!transition || transition.role !== user.role || transition.action !== body?.action) throw new Error("INVALID_TRANSITION");
      if (user.role === "REGIONAL_DIRECTOR" && (!body.password || !(await verifyUserPassword(user.id, body.password)))) throw new Error("VERIFY_FAILED");
      const implementationId = transition.next === "CLOSED" ? `IMP-${Date.now().toString().slice(-10)}` : null;
      await client.query(`UPDATE uars.access_requests SET status=$1::varchar,assigned_role=$2,implementation_id=COALESCE($3,implementation_id),closed_at=CASE WHEN $1::text='CLOSED' THEN now() ELSE closed_at END,updated_at=now() WHERE id=$4`, [transition.next,transition.nextRole,implementationId,id]);
      await client.query(`INSERT INTO uars.workflow_events (request_id,actor_id,actor_name,actor_role,action,from_status,to_status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id,user.id,user.fullName,user.role,transition.action,record.status,transition.next,body.notes?.trim().slice(0,500) || null]);
      if (transition.nextRole) await client.query(`INSERT INTO uars.notifications (target_role,request_id,title,message) VALUES ($1,$2,$3,$4)`, [transition.nextRole,id,`Action required · ${record.reference_no}`,`${roleLabels[user.role]} completed ${transition.action.toLowerCase().replaceAll("_", " ")}.`]);
      else await client.query(`INSERT INTO uars.notifications (user_id,request_id,title,message) SELECT requester_id,id,$2,$3 FROM uars.access_requests WHERE id=$1`, [id,`${record.reference_no} implemented`,`The request was implemented and closed automatically.`]);
      return { status: transition.next, implementationId };
    });
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Request not found." }, { status: 404 });
    if (code === "VERIFY_FAILED") return NextResponse.json({ error: "Director verification failed." }, { status: 403 });
    if (code === "INVALID_TRANSITION") return NextResponse.json({ error: "This action is not permitted for your role or the request has already advanced." }, { status: 409 });
    throw error;
  }
}
