import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { verifyOwnerPin } from "@/lib/owner-auth";
import { serializeSlot, type SlotDocument, validateSlotInput } from "@/lib/slots";

const SLOTS = "slots";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const objectId = parseObjectId(id);

    if (!objectId) {
      return NextResponse.json({ error: "Invalid slot id." }, { status: 400 });
    }

    const db = await getMongoDb();
    const slot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: objectId });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    return NextResponse.json({ slot: serializeSlot(slot) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load slot." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ownerPin = request.headers.get("x-owner-pin");

    if (!verifyOwnerPin(ownerPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const objectId = parseObjectId(id);

    if (!objectId) {
      return NextResponse.json({ error: "Invalid slot id." }, { status: 400 });
    }

    const db = await getMongoDb();
    const currentSlot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: objectId });

    if (!currentSlot) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    const body = await request.json();

    if (isPlainObject(body) && Object.keys(body).length === 1 && typeof body.isArchived === "boolean") {
      await db.collection<SlotDocument>(SLOTS).updateOne({ _id: objectId }, { $set: { isArchived: body.isArchived } });

      const updatedSlot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: objectId });

      if (!updatedSlot) {
        return NextResponse.json({ error: "Slot not found after update." }, { status: 404 });
      }

      return NextResponse.json({ slot: serializeSlot(updatedSlot) });
    }

    const validation = validateSlotInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const startTime = new Date(validation.data.startTime);
    const endTime = new Date(validation.data.endTime);

    if (endTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Slot end time cannot be in the past." }, { status: 400 });
    }

    if (validation.data.capacity < currentSlot.bookedCount) {
      return NextResponse.json({ error: "Capacity cannot be lower than the number of existing bookings." }, { status: 400 });
    }

    const result = await db.collection<SlotDocument>(SLOTS).findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          title: validation.data.title,
          description: validation.data.description,
          timezone: validation.data.timezone,
          capacity: validation.data.capacity,
          startTime,
          endTime,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Slot not found after update." }, { status: 404 });
    }

    return NextResponse.json({ slot: serializeSlot(result as SlotDocument) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update slot." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const ownerPin = request.headers.get("x-owner-pin");

    if (!verifyOwnerPin(ownerPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const objectId = parseObjectId(id);

    if (!objectId) {
      return NextResponse.json({ error: "Invalid slot id." }, { status: 400 });
    }

    const db = await getMongoDb();
    const result = await db.collection<SlotDocument>(SLOTS).deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete slot." }, { status: 500 });
  }
}
