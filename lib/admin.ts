import { NextResponse } from "next/server";
import { currentUser } from "./auth";

export async function requireSystemAdmin() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (user.mustChangePassword) return { error: NextResponse.json({ error: "Change your temporary password first." }, { status: 403 }) };
  if (user.role !== "SYSTEM_ADMIN") return { error: NextResponse.json({ error: "System administrator access required." }, { status: 403 }) };
  return { user };
}
