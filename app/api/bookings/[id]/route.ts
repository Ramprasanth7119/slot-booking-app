import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import {
  cancelDemoBooking,
  rescheduleDemoBooking,
  shouldUseDemoData,
} from "@/lib/demo-data";
import { getMongoClient, getMongoDb } from "@/lib/mongodb";
import { type BookingDocument } from "@/lib/bookings";
import { getSlotStatus, type SlotDocument } from "@/lib/slots";

const BOOKINGS = "bookings";
const SLOTS = "slots";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) return NextResponse.json({ error: "Missing booking id." }, { status: 400 });

    let body: Record<string, unknown> = {};

    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const targetSlotId = typeof body.targetSlotId === "string" ? body.targetSlotId.trim() : "";
    const db = await getMongoDb();
    const client = await getMongoClient();
    const session = client.startSession();

    const now = new Date();

    try {
      const result = await session.withTransaction(async () => {
        const booking = await db.collection<BookingDocument>(BOOKINGS).findOne({ _id: new ObjectId(id) }, { session });

        if (!booking) {
          throw new Error("BOOKING_NOT_FOUND");
        }

        if (booking.status !== "confirmed") {
          throw new Error("BOOKING_ALREADY_CANCELLED");
        }

        const sourceSlot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: booking.slotId }, { session });

        if (!sourceSlot) {
          throw new Error("SOURCE_SLOT_NOT_FOUND");
        }

        if (!targetSlotId) {
          const cancelled = await db.collection(BOOKINGS).updateOne(
            { _id: booking._id, status: "confirmed" },
            { $set: { status: "cancelled" } },
            { session }
          );

          if (cancelled.matchedCount === 0) {
            throw new Error("BOOKING_ALREADY_CANCELLED");
          }

          const restored = await db.collection<SlotDocument>(SLOTS).updateOne(
            { _id: booking.slotId, bookedCount: { $gt: 0 } },
            { $inc: { bookedCount: -1 } },
            { session }
          );

          if (restored.matchedCount === 0) {
            throw new Error("SLOT_UPDATE_FAILED");
          }

          return { type: "cancel" as const };
        }

        const targetObjectId = ObjectId.isValid(targetSlotId) ? new ObjectId(targetSlotId) : null;

        if (!targetObjectId) {
          throw new Error("INVALID_TARGET_SLOT");
        }

        if (booking.slotId.toString() === targetObjectId.toString()) {
          throw new Error("SAME_SLOT");
        }

        const targetSlot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: targetObjectId }, { session });

        if (!targetSlot) {
          throw new Error("TARGET_SLOT_NOT_FOUND");
        }

        const targetStatus = getSlotStatus(targetSlot, now);

        if (targetStatus === "Archived") {
          throw new Error("TARGET_SLOT_ARCHIVED");
        }

        if (targetStatus === "Expired") {
          throw new Error("TARGET_SLOT_EXPIRED");
        }

        if (targetStatus === "Full") {
          throw new Error("TARGET_SLOT_FULL");
        }

        const duplicate = await db.collection(BOOKINGS).findOne(
          { slotId: targetSlot._id, customerEmail: booking.customerEmail, status: "confirmed" },
          { session }
        );

        if (duplicate) {
          throw new Error("DUPLICATE_BOOKING");
        }

        const slotReserved = await db.collection<SlotDocument>(SLOTS).updateOne(
          {
            _id: targetSlot._id,
            isArchived: false,
            endTime: { $gt: now },
            bookedCount: { $lt: targetSlot.capacity },
          },
          { $inc: { bookedCount: 1 } },
          { session }
        );

        if (slotReserved.matchedCount === 0) {
          throw new Error("TARGET_SLOT_FULL");
        }

        const cancelled = await db.collection(BOOKINGS).updateOne(
          { _id: booking._id, status: "confirmed" },
          { $set: { status: "cancelled" } },
          { session }
        );

        if (cancelled.matchedCount === 0) {
          throw new Error("BOOKING_ALREADY_CANCELLED");
        }

        const sourceRestored = await db.collection<SlotDocument>(SLOTS).updateOne(
          { _id: booking.slotId, bookedCount: { $gt: 0 } },
          { $inc: { bookedCount: -1 } },
          { session }
        );

        if (sourceRestored.matchedCount === 0) {
          throw new Error("SOURCE_SLOT_UPDATE_FAILED");
        }

        const replacementBooking = {
          slotId: targetSlot._id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          status: "confirmed" as const,
          bookedAt: new Date(),
        };

        const inserted = await db.collection(BOOKINGS).insertOne(replacementBooking, { session });

        return { type: "reschedule" as const, booking: { ...replacementBooking, _id: inserted.insertedId } };
      });

      if (result.type === "reschedule") {
        return NextResponse.json({ booking: result.booking }, { status: 200 });
      }

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (shouldUseDemoData(error)) {
      const targetSlotId = typeof body.targetSlotId === "string" ? body.targetSlotId.trim() : "";

      if (!targetSlotId) {
        const result = cancelDemoBooking(id);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ success: true });
      }

      const result = rescheduleDemoBooking(id, targetSlotId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json({ booking: result.booking }, { status: 200 });
    }

    if (message === "BOOKING_NOT_FOUND") return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (message === "BOOKING_ALREADY_CANCELLED") return NextResponse.json({ error: "Booking is already cancelled." }, { status: 409 });
    if (message === "SOURCE_SLOT_NOT_FOUND") return NextResponse.json({ error: "Source slot not found." }, { status: 404 });
    if (message === "TARGET_SLOT_NOT_FOUND") return NextResponse.json({ error: "Target slot not found." }, { status: 404 });
    if (message === "INVALID_TARGET_SLOT") return NextResponse.json({ error: "Invalid target slot id." }, { status: 400 });
    if (message === "SAME_SLOT") return NextResponse.json({ error: "Choose a different slot to reschedule." }, { status: 400 });
    if (message === "TARGET_SLOT_ARCHIVED") return NextResponse.json({ error: "Target slot is archived." }, { status: 400 });
    if (message === "TARGET_SLOT_EXPIRED") return NextResponse.json({ error: "Target slot has already ended." }, { status: 400 });
    if (message === "TARGET_SLOT_FULL") return NextResponse.json({ error: "Target slot is full or no longer available." }, { status: 409 });
    if (message === "DUPLICATE_BOOKING") return NextResponse.json({ error: "You already have a booking for that slot." }, { status: 409 });
    if (message === "SLOT_UPDATE_FAILED" || message === "SOURCE_SLOT_UPDATE_FAILED") {
      return NextResponse.json({ error: "Failed to update slot availability." }, { status: 500 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to cancel booking." }, { status: 500 });
  }
}
