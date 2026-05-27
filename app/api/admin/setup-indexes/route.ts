import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { verifyOwnerRequest } from "@/lib/owner-auth";
import { getSlotCollectionValidator } from "@/lib/slots";

const BOOKINGS = "bookings";
const SLOTS = "slots";

export async function POST(request: Request) {
  try {
    if (!verifyOwnerRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDb();
    const slotValidator = getSlotCollectionValidator();

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

    try {
      await db.command({
        collMod: SLOTS,
        validator: slotValidator,
        validationLevel: "moderate",
        validationAction: "error",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("NamespaceNotFound") || message.includes("ns not found")) {
        await db.createCollection(SLOTS, {
          validator: slotValidator,
          validationLevel: "moderate",
          validationAction: "error",
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create indexes." }, { status: 500 });
  }
}
