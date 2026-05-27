import { ObjectId } from "mongodb";

import {
  getRemainingSeats,
  getSlotStatus,
  serializeSlot,
  type SlotDocument,
  type SlotInput,
  type SerializedSlot,
} from "@/lib/slots";
import {
  serializeBooking,
  type BookingDocument,
  type BookingStatus,
} from "@/lib/bookings";

type DemoState = {
  slots: SlotDocument[];
  bookings: BookingDocument[];
};

type DemoBookingLookupRow = {
  id: string;
  _id: string;
  slotId: string;
  customerName: string;
  customerEmail: string;
  status: BookingStatus;
  bookedAt: string;
  slot: {
    id: string;
    title: string;
    description: string;
    venueName: string;
    conductorName: string;
    startTime: string;
    endTime: string;
    timezone: string;
    capacity: number;
    bookedCount: number;
    remainingSeats: number;
    isArchived: boolean;
    status: SerializedSlot["status"];
  } | null;
};

type DemoOwnerBookingRow = {
  slotId: string;
  slotTitle: string;
  slotVenueName: string;
  slotConductorName: string;
  slotStartTime: string;
  slotEndTime: string;
  slotTimezone: string;
  slotCapacity: number;
  slotBookedCount: number;
  slotRemainingSeats: number;
  slotStatus: SerializedSlot["status"];
  customerName: string;
  customerEmail: string;
  bookingStatus: BookingStatus;
  bookedAt: string;
};

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function makeSlot(id: string, overrides: Omit<Partial<SlotDocument>, "_id" | "startTime" | "endTime" | "createdAt"> & {
  title: string;
  description: string;
  venueName: string;
  conductorName: string;
  category: SlotInput["category"];
  format: SlotInput["format"];
  audience: string;
  highlights: string[];
  featured: boolean;
  roomLabel?: string;
  meetingUrl?: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
  capacity: number;
  bookedCount: number;
  isArchived: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
}) {
  return {
    _id: new ObjectId(id),
    ...overrides,
  } satisfies SlotDocument;
}

function createInitialSlots(): SlotDocument[] {
  const createdAt = new Date();

  return [
    makeSlot("665a00000000000000000001", {
      title: "Executive Strategy Consultation",
      description: "A focused one-to-one planning session for founders and team leads who want a clear roadmap and a cleaner backlog.",
      venueName: "North Tower Suite 12B",
      conductorName: "Avery Collins",
      category: "Consultation",
      format: "In-person",
      audience: "Founders and product leaders",
      highlights: [
        "Priority advisory session for growth decisions",
        "Ideal for roadmap reviews and client escalation planning",
        "Whiteboard collaboration with live notes",
      ],
      featured: true,
      roomLabel: "Suite 12B",
      meetingUrl: null,
      startTime: hoursFromNow(12),
      endTime: hoursFromNow(13),
      timezone: "UTC",
      capacity: 6,
      bookedCount: 2,
      isArchived: false,
      deletedAt: null,
      createdAt,
    }),
    makeSlot("665a00000000000000000002", {
      title: "Design Systems Workshop",
      description: "Hands-on workshop for teams that want to align on spacing, typography, component tokens, and product-ready UI consistency.",
      venueName: "Studio 4, Horizon Lab",
      conductorName: "Mina Patel",
      category: "Workshop",
      format: "Hybrid",
      audience: "Design and engineering teams",
      highlights: [
        "Practical component audit and system cleanup",
        "Hybrid participation for remote collaborators",
        "Includes a live critique and implementation checklist",
      ],
      featured: true,
      roomLabel: "Studio 4",
      meetingUrl: "https://meet.example.com/design-systems",
      startTime: hoursFromNow(16),
      endTime: hoursFromNow(18),
      timezone: "UTC",
      capacity: 14,
      bookedCount: 9,
      isArchived: false,
      deletedAt: null,
      createdAt,
    }),
    makeSlot("665a00000000000000000003", {
      title: "Leadership Performance Review",
      description: "A structured review session for managers and department leads to evaluate progress, blockers, and next-quarter priorities.",
      venueName: "Boardroom C",
      conductorName: "Jordan Reyes",
      category: "Meeting",
      format: "In-person",
      audience: "Leadership and operations",
      highlights: [
        "Private boardroom setting with executive pacing",
        "Clear agenda review and follow-up ownership",
        "Best for quarterly planning and alignment",
      ],
      featured: false,
      roomLabel: "Boardroom C",
      meetingUrl: null,
      startTime: hoursFromNow(20),
      endTime: hoursFromNow(21),
      timezone: "UTC",
      capacity: 8,
      bookedCount: 8,
      isArchived: false,
      deletedAt: null,
      createdAt,
    }),
    makeSlot("665a00000000000000000004", {
      title: "Live Product Demo Session",
      description: "A polished showcase slot designed for clients and internal stakeholders to experience the product in action.",
      venueName: "Virtual Demo Theater",
      conductorName: "Samira Khan",
      category: "Performance",
      format: "Virtual",
      audience: "Customers and stakeholders",
      highlights: [
        "Narrated demo with guided feature walkthrough",
        "Perfect for showcasing release highlights",
        "Includes live Q&A and feedback capture",
      ],
      featured: true,
      roomLabel: "Virtual stage",
      meetingUrl: "https://meet.example.com/product-demo",
      startTime: hoursFromNow(24),
      endTime: hoursFromNow(25),
      timezone: "UTC",
      capacity: 40,
      bookedCount: 18,
      isArchived: false,
      deletedAt: null,
      createdAt,
    }),
    makeSlot("665a00000000000000000005", {
      title: "Archived Evening Planning Session",
      description: "A previously used planning slot kept in the collection as an archived record for historical reporting and audits.",
      venueName: "Old Studio 1",
      conductorName: "Taylor Singh",
      category: "Training",
      format: "In-person",
      audience: "Internal operations",
      highlights: [
        "Historical record only",
        "Useful for analytics and admin review",
        "Not bookable from the public site",
      ],
      featured: false,
      roomLabel: "Old Studio 1",
      meetingUrl: null,
      startTime: hoursFromNow(-48),
      endTime: hoursFromNow(-47),
      timezone: "UTC",
      capacity: 12,
      bookedCount: 12,
      isArchived: true,
      deletedAt: createdAt,
      createdAt,
    }),
  ];
}

declare global {
  var slotBookDemoState: DemoState | undefined;
}

const demoState: DemoState = globalThis.slotBookDemoState ?? {
  slots: createInitialSlots(),
  bookings: [],
};

globalThis.slotBookDemoState = demoState;

function findSlotIndex(slotId: string) {
  return demoState.slots.findIndex((slot) => slot._id?.toString() === slotId || (slot as { id?: string }).id === slotId);
}

function findBookingIndex(bookingId: string) {
  return demoState.bookings.findIndex((booking) => booking._id?.toString() === bookingId);
}

function serializeDemoSlot(slot: SlotDocument) {
  return serializeSlot(slot);
}

function serializeDemoBookingWithSlot(booking: BookingDocument): DemoBookingLookupRow {
  const slot = demoState.slots.find((item) => item._id?.toString() === booking.slotId.toString());

  return {
    id: booking._id?.toString() ?? "",
    _id: booking._id?.toString() ?? "",
    slotId: booking.slotId.toString(),
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    status: booking.status,
    bookedAt: booking.bookedAt.toISOString(),
    slot: slot
      ? {
          id: slot._id?.toString() ?? "",
          title: slot.title,
          description: slot.description,
          venueName: slot.venueName,
          conductorName: slot.conductorName,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          timezone: slot.timezone,
          capacity: slot.capacity,
          bookedCount: slot.bookedCount,
          remainingSeats: getRemainingSeats(slot),
          isArchived: slot.isArchived,
          status: getSlotStatus(slot),
        }
      : null,
  };
}

function serializeDemoOwnerBooking(booking: BookingDocument): DemoOwnerBookingRow {
  const slot = demoState.slots.find((item) => item._id?.toString() === booking.slotId.toString());

  return {
    slotId: booking.slotId.toString(),
    slotTitle: slot?.title ?? "(Slot deleted)",
    slotVenueName: slot?.venueName ?? "",
    slotConductorName: slot?.conductorName ?? "",
    slotStartTime: slot?.startTime.toISOString() ?? "",
    slotEndTime: slot?.endTime.toISOString() ?? "",
    slotTimezone: slot?.timezone ?? "UTC",
    slotCapacity: slot?.capacity ?? 0,
    slotBookedCount: slot?.bookedCount ?? 0,
    slotRemainingSeats: slot ? getRemainingSeats(slot) : 0,
    slotStatus: slot ? getSlotStatus(slot) : "Archived",
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    bookingStatus: booking.status,
    bookedAt: booking.bookedAt.toISOString(),
  };
}

export function shouldUseDemoData(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ECONNREFUSED") ||
    message.includes("connect ECONNREFUSED") ||
    message.includes("Failed to open database") ||
    message.includes("Loading persistence directory failed") ||
    message.includes("Unable to open meta file") ||
    message.includes("MongoNetworkError")
  );
}

export function getDemoSlots() {
  return demoState.slots
    .filter((slot) => !slot.isArchived)
    .slice()
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime() || right.createdAt.getTime() - left.createdAt.getTime())
    .map((slot) => serializeDemoSlot(slot));
}

export function getDemoSlotById(slotId: string) {
  const slot = demoState.slots.find((item) => item._id?.toString() === slotId || (item as { id?: string }).id === slotId);
  return slot ? serializeDemoSlot(slot) : null;
}

export function getDemoSlotRecordById(slotId: string) {
  const slot = demoState.slots.find((item) => item._id?.toString() === slotId || (item as { id?: string }).id === slotId);
  return slot ? cloneSlotForRead(slot) : null;
}

function cloneSlotForRead(slot: SlotDocument) {
  return {
    ...slot,
    _id: slot._id ? new ObjectId(slot._id) : undefined,
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
    createdAt: new Date(slot.createdAt),
    deletedAt: slot.deletedAt ? new Date(slot.deletedAt) : slot.deletedAt,
    highlights: [...slot.highlights],
  } as SlotDocument;
}

export function createDemoSlot(slotInput: SlotInput) {
  const slot: SlotDocument = {
    _id: new ObjectId(),
    title: slotInput.title,
    description: slotInput.description,
    venueName: slotInput.venueName,
    conductorName: slotInput.conductorName,
    category: slotInput.category,
    format: slotInput.format,
    audience: slotInput.audience,
    highlights: [...slotInput.highlights],
    featured: slotInput.featured,
    roomLabel: slotInput.roomLabel,
    meetingUrl: slotInput.meetingUrl ?? null,
    startTime: new Date(slotInput.startTime),
    endTime: new Date(slotInput.endTime),
    timezone: slotInput.timezone,
    capacity: slotInput.capacity,
    bookedCount: 0,
    isArchived: false,
    deletedAt: null,
    createdAt: new Date(),
  };

  demoState.slots.push(slot);
  return serializeDemoSlot(slot);
}

export function updateDemoSlot(slotId: string, slotInput: SlotInput) {
  const index = findSlotIndex(slotId);

  if (index === -1) {
    return null;
  }

  const current = demoState.slots[index];

  if (slotInput.capacity < current.bookedCount) {
    throw new Error("Capacity cannot be lower than the number of existing bookings.");
  }

  const nextSlot: SlotDocument = {
    ...current,
    title: slotInput.title,
    description: slotInput.description,
    venueName: slotInput.venueName,
    conductorName: slotInput.conductorName,
    category: slotInput.category,
    format: slotInput.format,
    audience: slotInput.audience,
    highlights: [...slotInput.highlights],
    featured: slotInput.featured,
    roomLabel: slotInput.roomLabel,
    meetingUrl: slotInput.meetingUrl ?? null,
    timezone: slotInput.timezone,
    capacity: slotInput.capacity,
    startTime: new Date(slotInput.startTime),
    endTime: new Date(slotInput.endTime),
  };

  demoState.slots[index] = nextSlot;
  return serializeDemoSlot(nextSlot);
}

export function archiveDemoSlot(slotId: string, isArchived = true) {
  const index = findSlotIndex(slotId);

  if (index === -1) {
    return null;
  }

  const nextSlot = {
    ...demoState.slots[index],
    isArchived,
    deletedAt: isArchived ? new Date() : null,
  };

  demoState.slots[index] = nextSlot;
  return serializeDemoSlot(nextSlot);
}

export function getDemoBookingsByEmail(email: string) {
  return demoState.bookings
    .filter((booking) => booking.customerEmail === email)
    .sort((left, right) => {
      const leftSlot = demoState.slots.find((slot) => slot._id?.toString() === left.slotId.toString());
      const rightSlot = demoState.slots.find((slot) => slot._id?.toString() === right.slotId.toString());
      const leftTime = leftSlot?.startTime.getTime() ?? left.bookedAt.getTime();
      const rightTime = rightSlot?.startTime.getTime() ?? right.bookedAt.getTime();
      return leftTime - rightTime || left.bookedAt.getTime() - right.bookedAt.getTime();
    })
    .map((booking) => serializeDemoBookingWithSlot(booking));
}

export function getDemoOwnerBookings() {
  return demoState.bookings
    .slice()
    .sort((left, right) => right.bookedAt.getTime() - left.bookedAt.getTime())
    .map((booking) => serializeDemoOwnerBooking(booking));
}

export function createDemoBooking(slotId: string, customerName: string, customerEmail: string) {
  const slot = demoState.slots.find((item) => item._id?.toString() === slotId);

  if (!slot) {
    return { success: false as const, status: 404, error: "Slot not found." };
  }

  const now = new Date();
  const status = getSlotStatus(slot, now);

  if (status === "Archived") {
    return { success: false as const, status: 400, error: "Slot is archived." };
  }

  if (status === "Expired") {
    return { success: false as const, status: 400, error: "Slot has already ended." };
  }

  if (status === "Full") {
    return { success: false as const, status: 409, error: "Slot is full or no longer available." };
  }

  const duplicate = demoState.bookings.find(
    (booking) => booking.slotId.toString() === slotId && booking.customerEmail === customerEmail && booking.status === "confirmed"
  );

  if (duplicate) {
    return { success: false as const, status: 409, error: "You already have a booking for this slot." };
  }

  if (getRemainingSeats(slot) <= 0) {
    return { success: false as const, status: 409, error: "Slot is full or no longer available." };
  }

  slot.bookedCount += 1;

  const booking: BookingDocument = {
    _id: new ObjectId(),
    slotId: slot._id ?? new ObjectId(),
    customerName,
    customerEmail,
    status: "confirmed",
    bookedAt: new Date(),
  };

  demoState.bookings.push(booking);
  return { success: true as const, booking: serializeBooking(booking) };
}

export function cancelDemoBooking(bookingId: string) {
  const index = findBookingIndex(bookingId);

  if (index === -1) {
    return { success: false as const, status: 404, error: "Booking not found." };
  }

  const booking = demoState.bookings[index];

  if (booking.status !== "confirmed") {
    return { success: false as const, status: 409, error: "Booking is already cancelled." };
  }

  const slot = demoState.slots.find((item) => item._id?.toString() === booking.slotId.toString());

  booking.status = "cancelled";

  if (slot && slot.bookedCount > 0) {
    slot.bookedCount -= 1;
  }

  return { success: true as const };
}

export function rescheduleDemoBooking(bookingId: string, targetSlotId: string) {
  const bookingIndex = findBookingIndex(bookingId);

  if (bookingIndex === -1) {
    return { success: false as const, status: 404, error: "Booking not found." };
  }

  const currentBooking = demoState.bookings[bookingIndex];

  if (currentBooking.status !== "confirmed") {
    return { success: false as const, status: 409, error: "Booking is already cancelled." };
  }

  const sourceSlot = demoState.slots.find((item) => item._id?.toString() === currentBooking.slotId.toString());
  const targetSlot = demoState.slots.find((item) => item._id?.toString() === targetSlotId);

  if (!sourceSlot) {
    return { success: false as const, status: 404, error: "Source slot not found." };
  }

  if (!targetSlot) {
    return { success: false as const, status: 404, error: "Target slot not found." };
  }

  if (currentBooking.slotId.toString() === targetSlotId) {
    return { success: false as const, status: 400, error: "Choose a different slot to reschedule." };
  }

  const targetStatus = getSlotStatus(targetSlot);

  if (targetStatus === "Archived") {
    return { success: false as const, status: 400, error: "Target slot is archived." };
  }

  if (targetStatus === "Expired") {
    return { success: false as const, status: 400, error: "Target slot has already ended." };
  }

  if (targetStatus === "Full" || getRemainingSeats(targetSlot) <= 0) {
    return { success: false as const, status: 409, error: "Target slot is full or no longer available." };
  }

  const duplicate = demoState.bookings.find(
    (item) => item.slotId.toString() === targetSlotId && item.customerEmail === currentBooking.customerEmail && item.status === "confirmed"
  );

  if (duplicate) {
    return { success: false as const, status: 409, error: "You already have a booking for that slot." };
  }

  sourceSlot.bookedCount = Math.max(0, sourceSlot.bookedCount - 1);
  targetSlot.bookedCount += 1;

  currentBooking.status = "cancelled";

  const replacementBooking: BookingDocument = {
    _id: new ObjectId(),
    slotId: targetSlot._id ?? new ObjectId(),
    customerName: currentBooking.customerName,
    customerEmail: currentBooking.customerEmail,
    status: "confirmed",
    bookedAt: new Date(),
  };

  demoState.bookings.push(replacementBooking);

  return { success: true as const, booking: serializeBooking(replacementBooking) };
}

export function createDemoSlotFromValidatedInput(validatedInput: SlotInput) {
  return createDemoSlot(validatedInput);
}
