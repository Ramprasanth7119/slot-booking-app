import { ObjectId } from "mongodb";

export type BookingStatus = "confirmed" | "cancelled";

export type BookingInput = {
  slotId: string;
  customerName: string;
  customerEmail: string;
};

export type BookingDocument = {
  _id?: ObjectId;
  slotId: ObjectId;
  customerName: string;
  customerEmail: string;
  status: BookingStatus;
  bookedAt: Date;
};

export type SerializedBooking = {
  id: string;
  slotId: string;
  customerName: string;
  customerEmail: string;
  status: BookingStatus;
  bookedAt: string;
};

export type SerializedBookingSlot = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
  bookedCount: number;
  remainingSeats: number;
  isArchived: boolean;
  status: "Available" | "Full" | "Expired" | "Archived";
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateBookingInput(body: unknown): { success: true; data: BookingInput } | { success: false; error: string } {
  if (!isPlainObject(body)) {
    return { success: false, error: "Invalid request body." };
  }

  const slotId = typeof body.slotId === "string" ? body.slotId.trim() : "";
  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim().toLowerCase() : "";

  if (!slotId) return { success: false, error: "slotId is required." };
  if (!customerName) return { success: false, error: "Customer name is required." };
  if (!customerEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) return { success: false, error: "A valid customer email is required." };

  return { success: true, data: { slotId, customerName, customerEmail } };
}

export function serializeBooking(b: BookingDocument): SerializedBooking {
  return {
    id: b._id?.toString() ?? "",
    slotId: b.slotId.toString(),
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    status: b.status,
    bookedAt: b.bookedAt.toISOString(),
  };
}
