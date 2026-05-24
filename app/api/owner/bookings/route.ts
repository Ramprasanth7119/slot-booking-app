import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { verifyOwnerPin } from "@/lib/owner-auth";
import { type SlotDocument } from "@/lib/slots";
import { type BookingDocument } from "@/lib/bookings";

const BOOKINGS = "bookings";
const SLOTS = "slots";

type OwnerBookingRow = BookingDocument & {
  slot?: SlotDocument;
};

function toIdString(value: string | import("mongodb").ObjectId | undefined) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.toString();
}

export async function GET(request: Request) {
  try {
    const ownerPin = request.headers.get("x-owner-pin");

    if (!verifyOwnerPin(ownerPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDb();

    // Fetch all bookings with their slot details
    const results = await db
      .collection(BOOKINGS)
      .aggregate([
        {
          $lookup: {
            from: SLOTS,
            localField: "slotId",
            foreignField: "_id",
            as: "slot",
          },
        },
        { $unwind: { path: "$slot", preserveNullAndEmptyArrays: true } },
        { $sort: { "slot.startTime": -1, bookedAt: -1 } },
      ])
      .toArray();

    const bookings = (results as OwnerBookingRow[]).map((booking) => {
      const slot = booking.slot;

      return {
        slotId: toIdString(booking.slotId),
        slotTitle: slot?.title ?? "(Slot deleted)",
        slotStartTime: slot?.startTime?.toISOString() ?? "",
        slotEndTime: slot?.endTime?.toISOString() ?? "",
        slotTimezone: slot?.timezone ?? "UTC",
        slotCapacity: slot?.capacity ?? 0,
        slotBookedCount: slot?.bookedCount ?? 0,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        bookingStatus: booking.status,
        bookedAt: booking.bookedAt?.toISOString() ?? "",
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch bookings.",
      },
      { status: 500 }
    );
  }
}
