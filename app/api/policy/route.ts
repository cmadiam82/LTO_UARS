import { NextResponse } from "next/server";
import { acceptPolicyForCurrentSession, currentUser } from "../../../lib/auth";
import { query } from "../../../lib/db";
import { POLICY_CONFIRMATION, POLICY_HASH, POLICY_SECTIONS, POLICY_TITLE, POLICY_VERSION } from "../../../lib/policy";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ title:POLICY_TITLE, version:POLICY_VERSION, hash:POLICY_HASH, sections:POLICY_SECTIONS, confirmation:POLICY_CONFIRMATION, accepted:user.policyAccepted });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.mustChangePassword) return NextResponse.json({ error:"Change your temporary password first." }, { status:403 });
  const body = await request.json().catch(() => null) as { agree?:boolean } | null;
  if (body?.agree !== true) return NextResponse.json({ error:"Explicit agreement is required." }, { status:400 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const sessionId = await acceptPolicyForCurrentSession();
  if (!sessionId) return NextResponse.json({error:"Your session has expired. Sign in again."},{status:401});
  await query(`INSERT INTO uars.policy_acceptances (user_id,session_id,policy_version,policy_hash,ip_address,user_agent) VALUES ($1,$2,$3,$4,$5,$6)`, [user.id,sessionId,POLICY_VERSION,POLICY_HASH,forwarded||null,request.headers.get("user-agent")?.slice(0,500)||null]);
  return NextResponse.json({ accepted:true, acceptedAt:new Date().toISOString(), version:POLICY_VERSION });
}
