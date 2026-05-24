import { NextResponse } from "next/server";

import { verifyOwnerPin } from "@/lib/owner-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };

    if (typeof body.pin !== "string" || !body.pin.trim()) {
      return NextResponse.json(
        { error: "PIN is required." },
        { status: 400 }
      );
    }

    if (verifyOwnerPin(body.pin)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid PIN. Please try again." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PIN verification failed." },
      { status: 500 }
    );
  }
}