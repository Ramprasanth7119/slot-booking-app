import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";

const BOOKINGS = "bookings";
const SLOTS = "slots";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) return NextResponse.json({ error: "Missing booking id." }, { status: 400 });

    const db = await getMongoDb();

    // Atomically mark booking cancelled only if currently confirmed.
    const bookingUpdated = await db.collection(BOOKINGS).findOneAndUpdate(
      { _id: new ObjectId(id), status: "confirmed" },
      { $set: { status: "cancelled" } },
      { returnDocument: "before" }
    );

    if (!bookingUpdated || !bookingUpdated.value) {
      return NextResponse.json({ error: "Booking not found or already cancelled." }, { status: 409 });
    }

    const booking = bookingUpdated.value;

    // Decrement slot bookedCount safely
    const slotUpdate = await db.collection(SLOTS).findOneAndUpdate(
      { _id: booking.slotId, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } },
      { returnDocument: "after" }
    );

    if (!slotUpdate || !slotUpdate.value) {
      // Attempt to revert booking status to confirmed
      await db.collection(BOOKINGS).updateOne({ _id: booking._id }, { $set: { status: "confirmed" } });
      return NextResponse.json({ error: "Failed to update slot availability." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to cancel booking." }, { status: 500 });
  }
}
