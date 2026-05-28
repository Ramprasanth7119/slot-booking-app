import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import {
  archiveDemoSlot,
  getDemoSlotById,
  getDemoSlotRecordById,
  shouldUseDemoData,
  updateDemoSlot,
} from "@/lib/demo-data";
import { getMongoDb } from "@/lib/mongodb";
import { verifyOwnerRequest } from "@/lib/owner-auth";
import { serializeSlot, type SlotDocument, type SlotInput, validateSlotInput } from "@/lib/slots";

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
    if (shouldUseDemoData(error)) {
      const { id } = await context.params;
      const demoSlot = getDemoSlotById(id);

      if (demoSlot) {
        return NextResponse.json({ slot: demoSlot });
      }
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load slot." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!verifyOwnerRequest(request)) {
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

    if (currentSlot.endTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Expired slots cannot be edited." }, { status: 400 });
    }

    const body = await request.json();

    if (isPlainObject(body) && Object.keys(body).length === 1 && typeof body.isArchived === "boolean") {
      await db.collection<SlotDocument>(SLOTS).updateOne(
        { _id: objectId },
        {
          $set: {
            isArchived: body.isArchived,
            deletedAt: body.isArchived ? new Date() : null,
          },
        }
      );

      const updatedSlot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: objectId });

      if (!updatedSlot) {
        return NextResponse.json({ error: "Slot not found after update." }, { status: 404 });
      }

      return NextResponse.json({ slot: serializeSlot(updatedSlot) });
    }

    const validation = validateSlotInput(body, currentSlot as unknown as Partial<SlotInput>);

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
          venueName: validation.data.venueName,
          conductorName: validation.data.conductorName,
          category: validation.data.category,
          format: validation.data.format,
          audience: validation.data.audience,
          highlights: validation.data.highlights,
          featured: validation.data.featured,
          roomLabel: validation.data.roomLabel,
          meetingUrl: validation.data.meetingUrl,
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
    if (shouldUseDemoData(error)) {
      const { id } = await context.params;
      const demoCurrentSlot = getDemoSlotRecordById(id);

      if (!demoCurrentSlot) {
        return NextResponse.json({ error: "Slot not found." }, { status: 404 });
      }

      const body = await request.json().catch(() => null);

      if (isPlainObject(body) && Object.keys(body).length === 1 && typeof body.isArchived === "boolean") {
        const archived = archiveDemoSlot(id, body.isArchived);

        if (!archived) {
          return NextResponse.json({ error: "Slot not found." }, { status: 404 });
        }

        return NextResponse.json({ slot: archived });
      }

      const validation = validateSlotInput(body, demoCurrentSlot as unknown as Partial<SlotInput>);

      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const updated = updateDemoSlot(id, validation.data);

      if (!updated) {
        return NextResponse.json({ error: "Slot not found after update." }, { status: 404 });
      }

      return NextResponse.json({ slot: updated });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update slot." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    if (!verifyOwnerRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const objectId = parseObjectId(id);

    if (!objectId) {
      return NextResponse.json({ error: "Invalid slot id." }, { status: 400 });
    }

    const db = await getMongoDb();
    const result = await db.collection<SlotDocument>(SLOTS).updateOne(
      { _id: objectId },
      {
        $set: {
          isArchived: true,
          deletedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    const updatedSlot = await db.collection<SlotDocument>(SLOTS).findOne({ _id: objectId });

    return NextResponse.json({ slot: updatedSlot ? serializeSlot(updatedSlot) : null });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      const { id } = await context.params;
      const archived = archiveDemoSlot(id, true);

      if (!archived) {
        return NextResponse.json({ error: "Slot not found." }, { status: 404 });
      }

      return NextResponse.json({ slot: archived });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete slot." }, { status: 500 });
  }
}
