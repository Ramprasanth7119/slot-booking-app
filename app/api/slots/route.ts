import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { verifyOwnerPin } from "@/lib/owner-auth";
import {
  serializeSlot,
  type SlotDocument,
  validateSlotInput,
} from "@/lib/slots";

const collectionName = "slots";

export async function GET() {
  try {
    const db = await getMongoDb();
    const slots = await db
      .collection<SlotDocument>(collectionName)
      .find({ isArchived: false })
      .sort({ startTime: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ slots: slots.map(serializeSlot) });
  } catch (error) {
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
    const ownerPin = request.headers.get("x-owner-pin");

    if (!verifyOwnerPin(ownerPin)) {
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create slot.",
      },
      { status: 500 }
    );
  }
}