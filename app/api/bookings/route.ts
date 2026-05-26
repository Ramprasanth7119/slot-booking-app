import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getMongoDb, getMongoClient } from "@/lib/mongodb";
import { validateBookingInput, serializeBooking, type BookingDocument, type BookingStatus } from "@/lib/bookings";
import { getRemainingSeats, getSlotStatus, type SlotDocument } from "@/lib/slots";

const BOOKINGS = "bookings";
const SLOTS = "slots";

type BookingLookupRow = {
  _id?: ObjectId;
  slotId: ObjectId | string;
  customerName: string;
  customerEmail: string;
  status: BookingStatus;
  bookedAt: Date;
  slot?: {
    _id?: ObjectId;
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    timezone?: string;
    capacity?: number;
    bookedCount?: number;
    remainingSeats?: number;
    isArchived?: boolean;
    status?: "Available" | "Full" | "Expired" | "Archived";
  };
};

function toIdString(value: ObjectId | string | undefined) {
  if (!value) {
    return "";
  }

  return value instanceof ObjectId ? value.toString() : value;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email query is required." }, { status: 400 });
    }

    const db = await getMongoDb();

    // Join bookings with slot details
    const results = await db
      .collection(BOOKINGS)
      .aggregate([
        { $match: { customerEmail: email } },
        {
          $lookup: {
            from: SLOTS,
            localField: "slotId",
            foreignField: "_id",
            as: "slot",
          },
        },
        { $unwind: { path: "$slot", preserveNullAndEmptyArrays: true } },
        { $sort: { "slot.startTime": 1, bookedAt: 1 } },
      ])
      .toArray();

    const serialized = (results as BookingLookupRow[]).map((row) => ({
      id: toIdString(row._id),
      _id: toIdString(row._id),
      slotId: toIdString(row.slotId),
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      status: row.status,
      bookedAt: row.bookedAt.toISOString(),
      slot: row.slot
        ? {
            id: toIdString(row.slot._id),
            title: row.slot.title ?? "",
            description: row.slot.description ?? "",
            startTime: row.slot.startTime ? row.slot.startTime.toISOString() : "",
            endTime: row.slot.endTime ? row.slot.endTime.toISOString() : "",
            timezone: row.slot.timezone ?? "UTC",
            capacity: row.slot.capacity ?? 0,
            bookedCount: row.slot.bookedCount ?? 0,
            remainingSeats: row.slot.remainingSeats ?? getRemainingSeats({
              capacity: row.slot.capacity ?? 0,
              bookedCount: row.slot.bookedCount ?? 0,
            }),
            isArchived: Boolean(row.slot.isArchived),
            status: row.slot.status ?? "Available",
          }
        : null,
    }));

    return NextResponse.json({ bookings: serialized });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch bookings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateBookingInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { slotId, customerName, customerEmail } = validation.data;

    const client = await getMongoClient();
    const db = await getMongoDb();

    // Start transaction session
    const session = client.startSession();

    const now = new Date();

    let bookingResult: BookingDocument | null = null;

    try {
      await session.withTransaction(async () => {
        // Ensure slot exists with session
        const slot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: new ObjectId(slotId) }, { session });

        if (!slot) {
          throw new Error("SLOT_NOT_FOUND");
        }

        const slotStatus = getSlotStatus(slot, now);

        if (slotStatus === "Archived") {
          throw new Error("SLOT_ARCHIVED");
        }

        if (slotStatus === "Expired") {
          throw new Error("SLOT_ENDED");
        }

        if (slotStatus === "Full") {
          throw new Error("SLOT_FULL");
        }

        // Prevent duplicate confirmed booking for same slot + email
        const existing = await db.collection(BOOKINGS).findOne({ slotId: slot._id, customerEmail, status: "confirmed" }, { session });
        if (existing) {
          throw new Error("DUPLICATE_BOOKING");
        }

        // Atomic capacity increment
        const reservedSlot = await db.collection<SlotDocument>(SLOTS).findOneAndUpdate(
          { _id: slot._id, isArchived: false, endTime: { $gt: now }, bookedCount: { $lt: slot.capacity } },
          { $inc: { bookedCount: 1 } },
          { returnDocument: "after", session }
        );

        if (!reservedSlot) {
          throw new Error("SLOT_FULL");
        }

        const bookingDoc = {
          slotId: slot._id,
          customerName,
          customerEmail,
          status: "confirmed",
          bookedAt: new Date(),
        };

        const res = await db.collection(BOOKINGS).insertOne(bookingDoc, { session });
        bookingResult = { ...bookingDoc, _id: res.insertedId } as BookingDocument;
      });
    } catch (err) {
      // Translate known errors to HTTP responses
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "SLOT_NOT_FOUND") return NextResponse.json({ error: "Slot not found." }, { status: 404 });
      if (msg === "SLOT_ARCHIVED") return NextResponse.json({ error: "Slot is archived." }, { status: 400 });
      if (msg === "SLOT_ENDED") return NextResponse.json({ error: "Slot has already ended." }, { status: 400 });
      if (msg === "DUPLICATE_BOOKING") return NextResponse.json({ error: "You already have a booking for this slot." }, { status: 409 });
      if (msg === "SLOT_FULL") return NextResponse.json({ error: "Slot is full or no longer available." }, { status: 409 });

      return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create booking." }, { status: 500 });
    } finally {
      await session.endSession();
    }

    if (!bookingResult) {
      return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
    }

    return NextResponse.json({ booking: serializeBooking(bookingResult) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create booking." }, { status: 500 });
  }
}
