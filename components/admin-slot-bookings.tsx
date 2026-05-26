"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminSlotBooking = {
  id: string;
  customerName: string;
  customerEmail: string;
  bookedAt: string;
  status: "confirmed" | "cancelled";
};

type AdminSlotBookingsProps = {
  initialBookings: AdminSlotBooking[];
};

export function AdminSlotBookings({ initialBookings }: AdminSlotBookingsProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  async function cancelBooking(bookingId: string) {
    if (!window.confirm("Cancel this booking?")) return;

    setBusyBookingId(bookingId);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to cancel booking.");
        return;
      }

      setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, status: "cancelled" } : booking)));
      setMessage("Booking cancelled.");
    } catch {
      setIsError(true);
      setMessage("Network error while cancelling booking.");
    } finally {
      setBusyBookingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
          {message}
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-sm text-zinc-400">No bookings for this slot yet.</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-white">{booking.customerName}</p>
                <p className="text-sm text-zinc-400">{booking.customerEmail}</p>
                <p className="text-xs text-zinc-500">Booked: {new Date(booking.bookedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={booking.status === "cancelled" ? "warning" : "success"}>{booking.status}</Badge>
                {booking.status === "confirmed" ? (
                  <Button type="button" variant="ghost" onClick={() => void cancelBooking(booking.id)} disabled={busyBookingId === booking.id}>
                    {busyBookingId === booking.id ? "Cancelling..." : "Cancel"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
