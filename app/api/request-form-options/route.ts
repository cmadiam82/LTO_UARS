import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { query } from "../../../lib/db";

type OptionRow = { value: string; label: string };

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "DO") return NextResponse.json({ error: "Only DO accounts can create applications." }, { status: 403 });
  if (!user.policyAccepted) return NextResponse.json({ error: "Accept the LTOCM Policy Agreement first." }, { status: 403 });

  const [agencyCodes, supervisor] = await Promise.all([
    query<OptionRow>(
      `SELECT DISTINCT employee_id AS value, employee_id || ' · ' || office AS label
         FROM uars.users
        WHERE is_active=true AND employee_id <> ''
        ORDER BY label`,
    ),
    query<OptionRow>(
      `SELECT c.chief_name AS value, c.chief_name || ' · ' || o.name AS label
         FROM uars.users u
         JOIN uars.office_chiefs c ON c.office_id=u.office_id
         JOIN uars.offices o ON o.id=c.office_id
        WHERE u.id=$1 AND o.is_active=true`,
      [user.id],
    ),
  ]);

  return NextResponse.json({ agencyCodes: agencyCodes.rows, supervisor: supervisor.rows[0] || null });
}
