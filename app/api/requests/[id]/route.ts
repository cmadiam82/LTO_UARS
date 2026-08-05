import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { query, transaction } from "../../../../lib/db";
import {
  ACCESS_LEVELS,
  ACCOUNT_TYPES,
  ALL_LTMS_MODULES,
  EMPLOYMENT_STATUSES,
  LOGIN_MODES,
  SYSTEM_OPTIONS,
} from "../../../../lib/request-options";
import { policyRequired, visibilitySql } from "../../../../lib/visibility";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (policyRequired(user))
    return NextResponse.json(
      { error: "Accept the LTOCM Policy Agreement first." },
      { status: 403 },
    );
  const { id } = await context.params;
  const scope = visibilitySql(user, "ar", 2);
  const requestResult = await query(
    `SELECT ar.*, ar.requested_start_date::text FROM uars.access_requests ar WHERE ar.id=$1 AND ${scope.sql}`,
    [id, ...scope.values],
  );
  if (!requestResult.rows[0])
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  const events = await query(
    `SELECT id,action,from_status,to_status,notes,actor_name,actor_role,created_at FROM uars.workflow_events WHERE request_id=$1 ORDER BY created_at DESC`,
    [id],
  );
  const attachments = await query(
    `SELECT id,original_name,content_type,size_bytes,document_type,created_at FROM uars.request_attachments WHERE request_id=$1 ORDER BY created_at`,
    [id],
  );
  return NextResponse.json({
    request: requestResult.rows[0],
    events: events.rows,
    attachments: attachments.rows,
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "DO")
    return NextResponse.json(
      { error: "Only the requestor can correct this application." },
      { status: 403 },
    );
  if (policyRequired(user))
    return NextResponse.json(
      { error: "Accept the LTOCM Policy Agreement first." },
      { status: 403 },
    );
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const text = (key: string) => String(body?.[key] || "").trim();
  const levels = Array.isArray(body?.accessLevels)
    ? (body!.accessLevels as string[])
    : [];
  const modules = Array.isArray(body?.ltmsModules)
    ? (body!.ltmsModules as string[])
    : [];
  if (
    [
      "applicantName",
      "requesterPosition",
      "requesterOffice",
      "requesterEmployeeNo",
      "requesterContact",
      "requesterEmail",
      "systemName",
      "accountType",
    ].some((k) => !text(k))
  )
    return NextResponse.json(
      { error: "Complete every required field." },
      { status: 400 },
    );
  if (
    !SYSTEM_OPTIONS.includes(text("systemName") as never) ||
    !ACCOUNT_TYPES.includes(text("accountType") as never) ||
    levels.length === 0 ||
    levels.some((v) => !ACCESS_LEVELS.includes(v as never))
  )
    return NextResponse.json(
      { error: "Select valid access requirements." },
      { status: 400 },
    );
  if (text("loginMode") && !LOGIN_MODES.includes(text("loginMode") as never))
    return NextResponse.json(
      { error: "Select a valid login mode." },
      { status: 400 },
    );
  if (
    text("employmentStatus") &&
    !EMPLOYMENT_STATUSES.includes(text("employmentStatus") as never)
  )
    return NextResponse.json(
      { error: "Select a valid employment status." },
      { status: 400 },
    );
  if (
    text("systemName") === "Land Transportation Management System (LTMS)" &&
    (modules.length === 0 ||
      modules.some((v) => !ALL_LTMS_MODULES.includes(v as never)))
  )
    return NextResponse.json(
      { error: "Select valid LTMS modules." },
      { status: 400 },
    );
  const supervisor = await query<{ chief_name: string }>(
    `SELECT c.chief_name FROM uars.users u JOIN uars.office_chiefs c ON c.office_id=u.office_id JOIN uars.offices o ON o.id=c.office_id WHERE u.id=$1 AND o.is_active=true`,
    [user.id],
  );
  if (supervisor.rowCount === 0)
    return NextResponse.json(
      {
        error:
          "No Chief of Office is enrolled for your office. Contact the System Administrator.",
      },
      { status: 400 },
    );
  return transaction(async (client) => {
    const locked = await client.query(
      `SELECT status FROM uars.access_requests WHERE id=$1 AND requester_id=$2 FOR UPDATE`,
      [id, user.id],
    );
    if (locked.rows[0]?.status !== "RETURNED_FOR_CORRECTION")
      return NextResponse.json(
        { error: "This request is not awaiting correction." },
        { status: 409 },
      );
    await client.query(
      `UPDATE uars.access_requests SET applicant_name=$1,position=$2,office=$3,employee_id=$4,contact_no=$5,email=$6,requester_position=$2,requester_office=$3,requester_employee_no=$4,requester_contact=$5,requester_email=$6,immediate_superior=$7,system_name=$8,account_type=$9,access_levels=$10,access_level=$11,login_mode=$12,ltms_modules=$13,ltms_other=$14,employment_status=COALESCE(NULLIF($15,''),employment_status),status='PENDING_ENDORSEMENT',assigned_role='HEAD_OF_OFFICE',resubmission_count=resubmission_count+1,updated_at=now() WHERE id=$16`,
      [
        text("applicantName"),
        text("requesterPosition"),
        text("requesterOffice"),
        text("requesterEmployeeNo"),
        text("requesterContact"),
        text("requesterEmail"),
        supervisor.rows[0].chief_name,
        text("systemName"),
        text("accountType"),
        JSON.stringify(levels),
        levels.join(", "),
        text("loginMode") || null,
        JSON.stringify(modules),
        text("ltmsOther") || null,
        text("employmentStatus"),
        id,
      ],
    );
    await client.query(
      `INSERT INTO uars.workflow_events(request_id,actor_id,actor_name,actor_role,action,from_status,to_status,notes) VALUES($1,$2,$3,'DO','RESUBMIT','RETURNED_FOR_CORRECTION','PENDING_ENDORSEMENT',$4)`,
      [
        id,
        user.id,
        user.fullName,
        text("correctionRemarks").slice(0, 500) ||
          "Corrections applied and resubmitted",
      ],
    );
    await client.query(
      `INSERT INTO uars.notifications(target_role,request_id,title,message) SELECT 'HEAD_OF_OFFICE',id,'Corrected request resubmitted · '||reference_no,$2 FROM uars.access_requests WHERE id=$1`,
      [id, `${user.fullName} corrected and resubmitted the application.`],
    );
    return NextResponse.json({ ok: true });
  });
}
