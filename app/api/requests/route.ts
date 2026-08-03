import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { currentUser } from "../../../lib/auth";
import { query, transaction } from "../../../lib/db";
import type { AccessRequest } from "../../../lib/types";

type RequestRow = {
  id: string; reference_no: string; applicant_name: string; employee_id: string; email: string; contact_no: string;
  office: string; position: string; system_name: string; access_level: string; account_type: string;
  requested_start_date: string; justification: string; status: string; assigned_role: AccessRequest["currentRole"];
  implementation_id: string | null; created_at: string; updated_at: string; closed_at: string | null;
};

const requestSelect = `SELECT id, reference_no, applicant_name, employee_id, email, contact_no, office, position,
 system_name, access_level, account_type, requested_start_date::text, justification, status, assigned_role,
 implementation_id, created_at, updated_at, closed_at FROM uars.access_requests`;

function mapRow(row: RequestRow): AccessRequest {
  return { id: row.id, referenceNo: row.reference_no, applicantName: row.applicant_name, employeeId: row.employee_id,
    email: row.email, contactNo: row.contact_no, office: row.office, position: row.position, systemName: row.system_name,
    accessLevel: row.access_level, accountType: row.account_type, requestedStartDate: row.requested_start_date,
    justification: row.justification, status: row.status, currentRole: row.assigned_role, implementationId: row.implementation_id,
    createdAt: row.created_at, updatedAt: row.updated_at, closedAt: row.closed_at, events: [] };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const values: unknown[] = [];
  let where = "";
  if (user.role === "DO") { values.push(user.id); where = " WHERE requester_id = $1"; }
  const result = await query<RequestRow>(`${requestSelect}${where} ORDER BY created_at DESC LIMIT 100`, values);
  return NextResponse.json({ requests: result.rows.map(mapRow) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "DO") return NextResponse.json({ error: "Only DO accounts can submit applications." }, { status: 403 });
  if (user.mustChangePassword) return NextResponse.json({ error: "Change your temporary password before submitting." }, { status: 403 });
  const contentType = request.headers.get("content-type") || "";
  let body: Record<string,string> | null = null;
  let attachments: File[] = [];
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (form) {
      body = Object.fromEntries([...form.entries()].filter(([,value]) => typeof value === "string")) as Record<string,string>;
      attachments = form.getAll("attachments").filter((value): value is File => typeof value !== "string" && value.size > 0);
    }
  } else body = await request.json().catch(() => null) as Record<string,string> | null;
  const required = ["applicantName","employeeId","email","contactNo","office","position","systemName","accessLevel","accountType","requestedStartDate","justification"];
  if (!body || required.some((key) => !body[key]?.trim())) return NextResponse.json({ error: "Complete every required field." }, { status: 400 });
  if (attachments.length > 5) return NextResponse.json({ error: "Attach no more than 5 files." }, { status:400 });
  const allowedTypes = new Set(["application/pdf","image/png","image/jpeg","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
  if (attachments.some((file) => file.size > 10 * 1024 * 1024)) return NextResponse.json({ error:"Each attachment must be 10 MB or smaller." }, { status:400 });
  if (attachments.some((file) => !allowedTypes.has(file.type))) return NextResponse.json({ error:"Attachments must be PDF, PNG, JPG, DOCX, or XLSX files." }, { status:400 });
  const uploadDir = process.env.UPLOAD_DIR || "/tmp/lto-uars-uploads";
  const writtenFiles: string[] = [];
  try {
    await mkdir(uploadDir, { recursive:true });
    const created = await transaction(async (client) => {
    const sequence = await client.query<{ nextval: string }>(`SELECT nextval('uars.request_number_seq')::text`);
    const configuredPrefix = await client.query<{value:string}>(`SELECT value FROM uars.system_settings WHERE key='request_prefix'`);
    const prefix = (configuredPrefix.rows[0]?.value || "UARS").replace(/[^A-Za-z0-9-]/g, "").slice(0, 12) || "UARS";
    const ref = `${prefix}-${new Date().getFullYear()}-${sequence.rows[0].nextval.padStart(5, "0")}`;
    const result = await client.query<RequestRow>(
      `INSERT INTO uars.access_requests (reference_no, requester_id, applicant_name, employee_id, email, contact_no,
       office, position, system_name, access_level, account_type, requested_start_date, justification, status, assigned_role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDING_ENDORSEMENT','HEAD_OF_OFFICE')
       RETURNING id, reference_no, applicant_name, employee_id, email, contact_no, office, position, system_name,
        access_level, account_type, requested_start_date::text, justification, status, assigned_role, implementation_id,
        created_at, updated_at, closed_at`,
      [ref,user.id,body.applicantName.trim(),body.employeeId.trim(),body.email.trim(),body.contactNo.trim(),body.office.trim(),body.position.trim(),body.systemName.trim(),body.accessLevel.trim(),body.accountType.trim(),body.requestedStartDate,body.justification.trim()],
    );
    const row = result.rows[0];
    for (const file of attachments) {
      const storedName = randomUUID(); const path = join(uploadDir,storedName);
      await writeFile(path,Buffer.from(await file.arrayBuffer()),{flag:"wx",mode:0o640}); writtenFiles.push(path);
      await client.query(`INSERT INTO uars.request_attachments (request_id,uploaded_by,original_name,stored_name,content_type,size_bytes) VALUES ($1,$2,$3,$4,$5,$6)`,[row.id,user.id,file.name.slice(0,255),storedName,file.type,file.size]);
    }
    await client.query(`INSERT INTO uars.workflow_events (request_id,actor_id,actor_name,actor_role,action,from_status,to_status,notes) VALUES ($1,$2,$3,$4,'SUBMIT',NULL,'PENDING_ENDORSEMENT',$5)`, [row.id,user.id,user.fullName,user.role,"Application submitted"]);
    await client.query(`INSERT INTO uars.notifications (target_role,request_id,title,message) VALUES ('HEAD_OF_OFFICE',$1,$2,$3)`, [row.id,`Endorsement required · ${ref}`,`${user.fullName} submitted an access request.`]);
    return mapRow(row);
    });
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    await Promise.all(writtenFiles.map((path)=>unlink(path).catch(()=>undefined)));
    throw error;
  }
}
