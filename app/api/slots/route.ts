import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { getDemoSlots, shouldUseDemoData } from "@/lib/demo-data";
import { verifyOwnerRequest } from "@/lib/owner-auth";
import {
  serializeSlot,
  type SlotDocument,
  validateSlotInput,
} from "@/lib/slots";

const collectionName = "slots";
const fastApiTimeoutMs = 300;

async function readLiveSlotsFast() {
  const db = await getMongoDb();
  if (!db) return null;

  // Use aggregation to get actual booking counts from the bookings collection
  // This ensures that manual additions to bookings are reflected in the UI
  const slots = await db
    .collection<SlotDocument>(collectionName)
    .aggregate([
      { $match: { isArchived: false } },
      {
        $lookup: {
          from: "bookings",
          let: { slotId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$status", "confirmed"] },
                    {
                      $or: [
                        { $eq: ["$slotId", "$$slotId"] },
                        { $eq: ["$slotId", { $toString: "$$slotId" }] },
                      ],
                    },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "bookingCountResult",
        },
      },
      {
        $addFields: {
          bookedCount: {
            $ifNull: [{ $arrayElemAt: ["$bookingCountResult.count", 0] }, 0],
          },
        },
      },
      { $sort: { startTime: 1, createdAt: -1 } },
    ])
    .toArray();

  return (slots as SlotDocument[]).map(serializeSlot);
}

export async function GET() {
  try {
    const slots = await readLiveSlotsFast();

    if (!slots) {
      return NextResponse.json({ slots: getDemoSlots() });
    }

    return NextResponse.json({ slots });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      return NextResponse.json({ slots: getDemoSlots() });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load slots.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyOwnerRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateSlotInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const db = await getMongoDb();
    const slotToInsert: SlotDocument = {
      ...validation.data,
      startTime: new Date(validation.data.startTime),
      endTime: new Date(validation.data.endTime),
      bookedCount: 0,
      isArchived: false,
      createdAt: new Date(),
    };

    const result = await db.collection<SlotDocument>(collectionName).insertOne(slotToInsert);

    return NextResponse.json(
      {
        slot: serializeSlot({ ...slotToInsert, _id: result.insertedId }),
      },
      { status: 201 }
    );
  } catch (error) {
    if (shouldUseDemoData(error)) {
      return NextResponse.json({ error: "Failed to create slot." }, { status: 500 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create slot.",
      },
      { status: 500 }
    );
  }
}