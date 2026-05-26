import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { verifyOwnerRequest } from "@/lib/owner-auth";

const BOOKINGS = "bookings";
const SLOTS = "slots";

export async function POST(request: Request) {
  try {
    if (!verifyOwnerRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDb();

    // Create useful indexes
    await db.collection(BOOKINGS).createIndex({ customerEmail: 1 });
    await db.collection(BOOKINGS).createIndex({ slotId: 1 });

    // Partial unique index to help prevent duplicate confirmed bookings (best-effort)
    try {
      await db.collection(BOOKINGS).createIndex({ slotId: 1, customerEmail: 1 }, { unique: true, partialFilterExpression: { status: "confirmed" } });
    } catch {
      // Index may already exist or not supported; ignore errors
    }

    await db.collection(SLOTS).createIndex({ startTime: 1 });
    await db.collection(SLOTS).createIndex({ isArchived: 1 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create indexes." }, { status: 500 });
  }
}
