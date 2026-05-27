import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import {
  createDemoBooking,
  getDemoBookingsByEmail,
  shouldUseDemoData,
} from "@/lib/demo-data";
import { getMongoDb } from "@/lib/mongodb";
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
    venueName?: string;
    conductorName?: string;
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
            venueName: row.slot.venueName ?? "",
            conductorName: row.slot.conductorName ?? "",
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
    if (shouldUseDemoData(error)) {
      const url = new URL(request.url);
      const email = url.searchParams.get("email")?.toLowerCase();

      if (!email) {
        return NextResponse.json({ error: "Email query is required." }, { status: 400 });
      }

      return NextResponse.json({ bookings: getDemoBookingsByEmail(email) });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch bookings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let bookingInput:
    | {
        slotId: string;
        customerName: string;
        customerEmail: string;
      }
    | null = null;

  try {
    const body = await request.json();
    const validation = validateBookingInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    bookingInput = validation.data;
    const { slotId, customerName, customerEmail } = bookingInput;
    const db = await getMongoDb();

    const now = new Date();
    const slot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: new ObjectId(slotId) });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    const slotStatus = getSlotStatus(slot, now);

    if (slotStatus === "Archived") {
      return NextResponse.json({ error: "Slot is archived." }, { status: 400 });
    }

    if (slotStatus === "Expired") {
      return NextResponse.json({ error: "Slot has already ended." }, { status: 400 });
    }

    if (slotStatus === "Full") {
      return NextResponse.json({ error: "Slot is full or no longer available." }, { status: 409 });
    }

    const existing = await db.collection(BOOKINGS).findOne({ slotId: slot._id, customerEmail, status: "confirmed" });
    if (existing) {
      return NextResponse.json({ error: "You already have a booking for this slot." }, { status: 409 });
    }

    const reservedSlot = await db.collection<SlotDocument>(SLOTS).findOneAndUpdate(
      { _id: slot._id, isArchived: false, endTime: { $gt: now }, bookedCount: { $lt: slot.capacity } },
      { $inc: { bookedCount: 1 } },
      { returnDocument: "after" }
    );

    if (!reservedSlot) {
      return NextResponse.json({ error: "Slot is full or no longer available." }, { status: 409 });
    }

    const bookingDoc = {
      slotId: slot._id,
      customerName,
      customerEmail,
      status: "confirmed",
      bookedAt: new Date(),
    };

    try {
      const res = await db.collection(BOOKINGS).insertOne(bookingDoc);
      const bookingResult = { ...bookingDoc, _id: res.insertedId } as BookingDocument;

      return NextResponse.json({ booking: serializeBooking(bookingResult) }, { status: 201 });
    } catch (error) {
      await db.collection<SlotDocument>(SLOTS).updateOne({ _id: slot._id }, { $inc: { bookedCount: -1 } });

      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("duplicate key")) {
        return NextResponse.json({ error: "You already have a booking for this slot." }, { status: 409 });
      }

      return NextResponse.json({ error: message || "Failed to create booking." }, { status: 500 });
    }
  } catch (error) {
    if (shouldUseDemoData(error)) {
      if (!bookingInput) {
        return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
      }

      const result = createDemoBooking(bookingInput.slotId, bookingInput.customerName, bookingInput.customerEmail);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json({ booking: result.booking }, { status: 201 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create booking." }, { status: 500 });
  }
}
