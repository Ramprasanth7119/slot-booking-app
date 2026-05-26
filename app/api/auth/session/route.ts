import { NextResponse } from "next/server";
import { verifySessionToken, parseCookies } from "@/lib/owner-auth";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["owner-auth"];
  const ok = verifySessionToken(token);
  return NextResponse.json({ authenticated: ok });
}
