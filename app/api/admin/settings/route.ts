import { NextResponse } from "next/server";
import { requireSystemAdmin } from "../../../../lib/admin";
import { transaction } from "../../../../lib/db";
import { authenticationReadiness } from "../../../../lib/auth-provider";

export async function GET() {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  return transaction(async (client) => {
    const [settings,audit] = await Promise.all([
      client.query(`SELECT key,value,description,updated_at FROM uars.system_settings ORDER BY key`),
      client.query(`SELECT id,actor_name,action,entity_type,entity_id,details,created_at FROM uars.admin_audit_events ORDER BY created_at DESC LIMIT 100`),
    ]);
    return NextResponse.json({ settings:settings.rows, audit:audit.rows, authentication:authenticationReadiness() });
  });
}

export async function PUT(request: Request) {
  const auth = await requireSystemAdmin(); if (auth.error) return auth.error;
  const body = await request.json();
  if (!body.settings || typeof body.settings !== "object") return NextResponse.json({ error:"Settings are required." }, { status:400 });
  return transaction(async (client) => {
    const allowed = await client.query(`SELECT key,value FROM uars.system_settings`); const map = new Map(allowed.rows.map((r)=>[r.key,r.value]));
    for (const [key,value] of Object.entries(body.settings as Record<string,unknown>)) {
      if (!map.has(key) || typeof value !== "string" || value.length > 500) return NextResponse.json({ error:`Invalid setting: ${key}` }, { status:400 });
      await client.query(`UPDATE uars.system_settings SET value=$1,updated_by=$2,updated_at=now() WHERE key=$3`, [value,auth.user!.id,key]);
    }
    await client.query(`INSERT INTO uars.admin_audit_events (actor_id,actor_name,action,entity_type,entity_id,details) VALUES ($1,$2,'SETTINGS_UPDATED','SYSTEM','global',$3)`, [auth.user!.id,auth.user!.fullName,JSON.stringify({keys:Object.keys(body.settings),before:Object.fromEntries(map)})]);
    return NextResponse.json({ ok:true });
  });
}
