import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { query } from "../../../lib/db";

type OptionRow = { value: string; label: string };

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "DO") return NextResponse.json({ error: "Only DO accounts can create applications." }, { status: 403 });
  if (!user.policyAccepted) return NextResponse.json({ error: "Accept the LTOCM Policy Agreement first." }, { status: 403 });

  const [agencyCodes, supervisors] = await Promise.all([
    query<OptionRow>(
      `SELECT DISTINCT employee_id AS value, employee_id || ' · ' || office AS label
         FROM uars.users
        WHERE is_active=true AND employee_id <> ''
        ORDER BY label`,
    ),
    query<OptionRow>(
      `SELECT full_name AS value, full_name || ' · ' || office AS label
         FROM uars.users
        WHERE is_active=true AND role='HEAD_OF_OFFICE'
        ORDER BY full_name`,
    ),
  ]);

  return NextResponse.json({ agencyCodes: agencyCodes.rows, supervisors: supervisors.rows });
}
