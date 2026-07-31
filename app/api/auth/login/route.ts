import { NextResponse } from "next/server";
import { authenticate, createSession, SESSION_COOKIE } from "../../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  if (!body?.username || !body.password) return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  const user = await authenticate(body.username.trim(), body.password);
  if (!user) return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  const session = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    expires: session.expiresAt,
  });
  return response;
}
