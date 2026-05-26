import { ObjectId } from "mongodb";

export type SlotStatus = "Available" | "Full" | "Expired" | "Archived";

export type SlotInput = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
};

export type SlotInsertInput = Omit<SlotInput, "startTime" | "endTime"> & {
  startTime: Date;
  endTime: Date;
};

export type SlotDocument = SlotInsertInput & {
  _id?: ObjectId;
  bookedCount: number;
  isArchived: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
};

export type SerializedSlot = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  timezone: string;
  capacity: number;
  bookedCount: number;
  remainingSeats: number;
  isArchived: boolean;
  createdAt: string;
  status: SlotStatus;
};

type SlotValidationResult =
  | { success: true; data: SlotInput }
  | { success: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function validateSlotInput(body: unknown): SlotValidationResult {
  if (!isPlainObject(body)) {
    return { success: false, error: "Invalid request body." };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  const capacityValue = typeof body.capacity === "number" ? body.capacity : Number(body.capacity);
  const startTime = toDate(body.startTime);
  const endTime = toDate(body.endTime);

  if (!title) {
    return { success: false, error: "Title is required." };
  }

  if (title.length > 120) {
    return { success: false, error: "Title must be 120 characters or less." };
  }

  if (!description) {
    return { success: false, error: "Description is required." };
  }

  if (!timezone) {
    return { success: false, error: "Timezone is required." };
  }

  if (!startTime || !endTime) {
    return { success: false, error: "Valid start and end times are required." };
  }

  if (endTime <= startTime) {
    return { success: false, error: "End time must be after start time." };
  }

  if (!Number.isInteger(capacityValue) || capacityValue < 1 || capacityValue > 100) {
    return { success: false, error: "Capacity must be an integer between 1 and 100." };
  }

  return {
    success: true,
    data: {
      title,
      description,
      timezone,
      capacity: capacityValue,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
  };
}

export function getRemainingSeats(slot: Pick<SlotDocument, "capacity" | "bookedCount">) {
  return Math.max(0, slot.capacity - slot.bookedCount);
}

export function getSlotStatus(
  slot: Pick<SlotDocument, "startTime" | "endTime" | "capacity" | "bookedCount" | "isArchived">,
  now = new Date()
): SlotStatus {
  if (slot.isArchived) {
    return "Archived";
  }

  if (slot.endTime.getTime() <= now.getTime()) {
    return "Expired";
  }

  if (slot.bookedCount >= slot.capacity) {
    return "Full";
  }

  return "Available";
}

export function formatSlotTimeRange(startTime: Date, endTime: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });

  const startLabel = formatter.format(startTime);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(endTime);

  return `${startLabel} - ${endLabel}`;
}

export function serializeSlot(slot: SlotDocument) {
  const status = getSlotStatus(slot);
  const remainingSeats = getRemainingSeats(slot);

  return {
    id: slot._id?.toString() ?? "",
    title: slot.title,
    description: slot.description,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    timeRange: formatSlotTimeRange(slot.startTime, slot.endTime, slot.timezone),
    timezone: slot.timezone,
    capacity: slot.capacity,
    bookedCount: slot.bookedCount,
    remainingSeats,
    isArchived: slot.isArchived,
    createdAt: slot.createdAt.toISOString(),
    status,
  } satisfies SerializedSlot;
}