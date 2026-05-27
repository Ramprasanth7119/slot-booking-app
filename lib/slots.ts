import { ObjectId } from "mongodb";

export type SlotStatus = "Available" | "Full" | "Expired" | "Archived";
export type SlotCategory = "Consultation" | "Workshop" | "Performance" | "Meeting" | "Training";
export type SlotFormat = "In-person" | "Virtual" | "Hybrid";

export type SlotCollectionValidator = {
  $jsonSchema: Record<string, unknown>;
};

export type SlotInput = {
  title: string;
  description: string;
  venueName: string;
  conductorName: string;
  category: SlotCategory;
  format: SlotFormat;
  audience: string;
  highlights: string[];
  featured: boolean;
  roomLabel?: string;
  meetingUrl?: string | null;
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
  venueName: string;
  conductorName: string;
  category: SlotCategory;
  format: SlotFormat;
  audience: string;
  highlights: string[];
  featured: boolean;
  roomLabel?: string;
  meetingUrl?: string | null;
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

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function toStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items.slice(0, 5) : fallback;
}

function normalizeCategory(value: unknown, fallback: SlotCategory): SlotCategory {
  const categories: SlotCategory[] = ["Consultation", "Workshop", "Performance", "Meeting", "Training"];
  return typeof value === "string" && categories.includes(value as SlotCategory) ? (value as SlotCategory) : fallback;
}

function normalizeFormat(value: unknown, fallback: SlotFormat): SlotFormat {
  const formats: SlotFormat[] = ["In-person", "Virtual", "Hybrid"];
  return typeof value === "string" && formats.includes(value as SlotFormat) ? (value as SlotFormat) : fallback;
}

function toOptionalString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function buildHighlights(description: string, venueName: string, conductorName: string) {
  return [
    description.slice(0, 88),
    `Venue: ${venueName}`,
    `Conductor: ${conductorName}`,
  ].filter(Boolean).slice(0, 3);
}

function buildDefaults(overrides?: Partial<SlotInput>) {
  return {
    category: overrides?.category ?? "Consultation",
    format: overrides?.format ?? "In-person",
    audience: overrides?.audience ?? "General attendees",
    highlights: overrides?.highlights ?? [],
    featured: overrides?.featured ?? false,
    roomLabel: overrides?.roomLabel,
    meetingUrl: overrides?.meetingUrl ?? null,
  } satisfies Pick<SlotInput, "category" | "format" | "audience" | "highlights" | "featured" | "roomLabel" | "meetingUrl">;
}

export function validateSlotInput(body: unknown, defaults?: Partial<SlotInput>): SlotValidationResult {
  if (!isPlainObject(body)) {
    return { success: false, error: "Invalid request body." };
  }

  const normalizedDefaults = buildDefaults(defaults);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const venueName = typeof body.venueName === "string" ? body.venueName.trim() : "";
  const conductorName = typeof body.conductorName === "string" ? body.conductorName.trim() : "";
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  const capacityValue = typeof body.capacity === "number" ? body.capacity : Number(body.capacity);
  const startTime = toDate(body.startTime);
  const endTime = toDate(body.endTime);
  const category = normalizeCategory(body.category, normalizedDefaults.category);
  const format = normalizeFormat(body.format, normalizedDefaults.format);
  const audience = toOptionalString(body.audience, normalizedDefaults.audience);
  const roomLabel = toOptionalString(body.roomLabel, normalizedDefaults.roomLabel ?? venueName);
  const meetingUrl = typeof body.meetingUrl === "string" && body.meetingUrl.trim() ? body.meetingUrl.trim() : normalizedDefaults.meetingUrl;
  const featured = toBoolean(body.featured, normalizedDefaults.featured);
  const highlights = toStringArray(body.highlights, buildHighlights(description, venueName, conductorName));

  if (!title) {
    return { success: false, error: "Title is required." };
  }

  if (title.length > 120) {
    return { success: false, error: "Title must be 120 characters or less." };
  }

  if (!description) {
    return { success: false, error: "Description is required." };
  }

  if (!venueName) {
    return { success: false, error: "Venue name is required." };
  }

  if (!conductorName) {
    return { success: false, error: "Conductor name is required." };
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
      venueName,
      conductorName,
      category,
      format,
      audience,
      highlights,
      featured,
      roomLabel,
      meetingUrl,
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
    venueName: slot.venueName,
    conductorName: slot.conductorName,
    category: slot.category,
    format: slot.format,
    audience: slot.audience,
    highlights: slot.highlights,
    featured: slot.featured,
    roomLabel: slot.roomLabel,
    meetingUrl: slot.meetingUrl,
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

export function getSlotCollectionValidator(): SlotCollectionValidator {
  return {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "title",
        "description",
        "venueName",
        "conductorName",
        "category",
        "format",
        "audience",
        "highlights",
        "featured",
        "startTime",
        "endTime",
        "timezone",
        "capacity",
        "bookedCount",
        "isArchived",
        "createdAt",
      ],
      properties: {
        title: { bsonType: "string", minLength: 1, maxLength: 120 },
        description: { bsonType: "string", minLength: 1, maxLength: 2000 },
        venueName: { bsonType: "string", minLength: 1, maxLength: 120 },
        conductorName: { bsonType: "string", minLength: 1, maxLength: 120 },
        category: {
          bsonType: "string",
          enum: ["Consultation", "Workshop", "Performance", "Meeting", "Training"],
        },
        format: {
          bsonType: "string",
          enum: ["In-person", "Virtual", "Hybrid"],
        },
        audience: { bsonType: "string", minLength: 1, maxLength: 120 },
        highlights: {
          bsonType: "array",
          minItems: 1,
          maxItems: 5,
          items: { bsonType: "string", minLength: 1, maxLength: 140 },
        },
        featured: { bsonType: "bool" },
        roomLabel: { bsonType: ["string", "null"] },
        meetingUrl: { bsonType: ["string", "null"] },
        startTime: { bsonType: "date" },
        endTime: { bsonType: "date" },
        timezone: { bsonType: "string", minLength: 1, maxLength: 64 },
        capacity: { bsonType: "int", minimum: 1, maximum: 100 },
        bookedCount: { bsonType: "int", minimum: 0 },
        isArchived: { bsonType: "bool" },
        deletedAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
      },
    },
  };
}