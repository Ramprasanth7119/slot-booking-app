import { NextResponse } from "next/server";

import { verifyOwnerPin, createSessionToken } from "@/lib/owner-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };

    if (typeof body.pin !== "string" || !body.pin.trim()) {
      return NextResponse.json({ error: "PIN is required." }, { status: 400 });
    }

    if (!verifyOwnerPin(body.pin)) {
      return NextResponse.json({ error: "Invalid PIN. Please try again." }, { status: 401 });
    }

    const token = createSessionToken();
    const res = NextResponse.json({ success: true });
    // Set HttpOnly cookie for admin session
    res.cookies.set("owner-auth", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "PIN verification failed." }, { status: 500 });
  }
}