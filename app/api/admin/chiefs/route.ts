import { NextResponse } from "next/server";
import { requireSystemAdmin } from "../../../../lib/admin";
import { transaction } from "../../../../lib/db";

export async function GET() {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  return transaction(async (client) => {
    const result = await client.query(`SELECT c.office_id,c.chief_name,c.created_at,c.updated_at,o.name office_name,o.is_active office_is_active,a.code agency_code,a.region_code FROM uars.office_chiefs c JOIN uars.offices o ON o.id=c.office_id JOIN uars.agencies a ON a.code=o.agency_code ORDER BY a.region_code,a.code,o.name`);
    return NextResponse.json({ chiefs: result.rows });
  });
}

export async function PUT(request: Request) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const body = await request.json();
  const officeId = String(body.officeId || "").trim(); const chiefName = String(body.chiefName || "").trim();
  if (!officeId || !chiefName) return NextResponse.json({ error: "Office and Chief of Office name are required." }, { status: 400 });
  return transaction(async (client) => {
    const office = await client.query(`SELECT id,name FROM uars.offices WHERE id=$1 AND is_active`, [officeId]);
    if (!office.rows[0]) return NextResponse.json({ error: "Select an active managed office." }, { status: 400 });
    const previous = await client.query(`SELECT chief_name FROM uars.office_chiefs WHERE office_id=$1`, [officeId]);
    await client.query(`INSERT INTO uars.office_chiefs(office_id,chief_name) VALUES($1,$2) ON CONFLICT(office_id) DO UPDATE SET chief_name=EXCLUDED.chief_name,updated_at=now()`, [officeId, chiefName]);
    await client.query(`INSERT INTO uars.admin_audit_events(actor_id,actor_name,action,entity_type,entity_id,details) VALUES($1,$2,$3,'OFFICE_CHIEF',$4,$5)`, [auth.user!.id,auth.user!.fullName,previous.rows[0]?"OFFICE_CHIEF_UPDATED":"OFFICE_CHIEF_ASSIGNED",officeId,JSON.stringify({office:office.rows[0].name,before:previous.rows[0]?.chief_name||null,chief_name:chiefName})]);
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(request: Request) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const body = await request.json(); const officeId = String(body.officeId || "").trim();
  if (!officeId) return NextResponse.json({ error: "Office is required." }, { status: 400 });
  return transaction(async (client) => {
    const result = await client.query(`DELETE FROM uars.office_chiefs WHERE office_id=$1 RETURNING chief_name`, [officeId]);
    if (!result.rowCount) return NextResponse.json({ error: "Chief of Office assignment not found." }, { status: 404 });
    await client.query(`INSERT INTO uars.admin_audit_events(actor_id,actor_name,action,entity_type,entity_id,details) VALUES($1,$2,'OFFICE_CHIEF_REMOVED','OFFICE_CHIEF',$3,$4)`, [auth.user!.id,auth.user!.fullName,officeId,JSON.stringify({chief_name:result.rows[0].chief_name})]);
    return NextResponse.json({ ok: true });
  });
}
