import { NextResponse } from "next/server";

import { verifyOwnerPin } from "@/lib/owner-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };

    if (verifyOwnerPin(body.pin)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}