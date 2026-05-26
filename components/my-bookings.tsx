"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Booking = {
  id: string;
  _id?: string;
  slotId: string;
  customerName: string;
  customerEmail: string;
  status: "confirmed" | "cancelled";
  bookedAt: string;
  slot?: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    capacity: number;
    bookedCount: number;
    remainingSeats: number;
    isArchived: boolean;
    status: "Available" | "Full" | "Expired" | "Archived";
  };
};

type AvailableSlot = {
  id: string;
  title: string;
  timeRange: string;
  timezone: string;
  remainingSeats: number;
  status: "Available" | "Full" | "Expired" | "Archived";
};

export function MyBookingsClient() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [cancellationInProgress, setCancellationInProgress] = useState<Set<string>>(new Set());
  const [reschedulingInProgress, setReschedulingInProgress] = useState<Set<string>>(new Set());
  const [rescheduleTargets, setRescheduleTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchAvailableSlots();
  }, []);

  async function fetchAvailableSlots() {
    setAvailabilityLoading(true);

    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setAvailableSlots([]);
        return;
      }

      const slots = ((data.slots ?? []) as AvailableSlot[]).filter((slot) => slot.status === "Available");
      setAvailableSlots(slots);
    } catch (error) {
      console.error(error);
      setAvailableSlots([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function fetchBookings(e?: FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    
    if (!email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setBookings(null);

    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json();
      
      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Failed to load bookings. Please try again.");
      } else {
        const loadedBookings = (data.bookings ?? []) as Booking[];
        setBookings(loadedBookings);
        await fetchAvailableSlots();
        
        if (loadedBookings.length === 0) {
          setMessageType("error");
          setMessage("No bookings found for this email address.");
        } else {
          setMessageType("success");
          setMessage(`Found ${loadedBookings.length} booking${loadedBookings.length !== 1 ? 's' : ''}.`);
        }
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Network error while fetching bookings. Please check your connection and try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;
    
    setCancellationInProgress((prev) => new Set(prev).add(bookingId));
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
      const data = await res.json();
      
      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Failed to cancel booking. Please try again.");
      } else {
        setMessageType("success");
        setMessage("Booking cancelled successfully.");
        // Update local list
        setBookings((current) => 
          current?.map((b) => {
            const bid = b._id || b.id;
            return bid === bookingId || bid === bookingId 
              ? { ...b, status: "cancelled" as const }
              : b;
          }) ?? null
        );
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Network error while cancelling. Please try again.");
      console.error(error);
    } finally {
      setCancellationInProgress((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  }

  async function rescheduleBooking(bookingId: string) {
    const targetSlotId = rescheduleTargets[bookingId];

    if (!targetSlotId) {
      setMessageType("error");
      setMessage("Please choose a target slot before rescheduling.");
      return;
    }

    setReschedulingInProgress((prev) => new Set(prev).add(bookingId));
    setMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSlotId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Failed to reschedule booking. Please try again.");
      } else {
        setMessageType("success");
        setMessage("Booking rescheduled successfully.");
        setRescheduleTargets((current) => {
          const next = { ...current };
          delete next[bookingId];
          return next;
        });
        await fetchBookings();
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Network error while rescheduling. Please try again.");
      console.error(error);
    } finally {
      setReschedulingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  }

  function updateRescheduleTarget(bookingId: string, targetSlotId: string) {
    setRescheduleTargets((current) => ({ ...current, [bookingId]: targetSlotId }));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => fetchBookings(e)} className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input 
          placeholder="Enter your booking email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          disabled={loading}
          type="email"
          required 
        />
        <Button 
          type="submit" 
          disabled={loading}
          className="min-w-32"
        >
          {loading ? "Searching..." : "Lookup"}
        </Button>
      </form>

      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm transition-all ${
          messageType === "error" 
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200" 
            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
        }`}>
          {message}
        </div>
      ) : null}

      {loading && !bookings ? (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-zinc-400">
          <div className="animate-pulse">Loading your bookings...</div>
        </div>
      ) : null}

      {!availabilityLoading && availableSlots.length === 0 ? (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          No available slots are open right now.
        </div>
      ) : null}

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Your Bookings ({bookings.filter(b => b.status === "confirmed").length} active)
          </p>
          <div className="grid gap-4">
            {bookings.map((b) => {
              const bookingId = b._id || b.id;
              const slotTitle = b.slot?.title ?? "(Slot deleted)";
              const slotStart = b.slot?.startTime 
                ? new Date(b.slot.startTime).toLocaleString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: b.slot.timezone,
                  })
                : "Date unavailable";
              
              const isExpired = b.slot?.status === "Expired" || b.slot?.endTime 
                ? new Date(b.slot.endTime ?? "").getTime() < Date.now()
                : false;
              const isArchived = b.slot?.status === "Archived" || Boolean(b.slot?.isArchived);
              
              const badgeTone = b.status === "cancelled" ? "warning" : isArchived ? "neutral" : isExpired ? "danger" : "success";
              const rescheduleOptions = availableSlots.filter((slot) => slot.id !== b.slotId);
              
              return (
                <div 
                  key={bookingId} 
                  className="group rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{slotTitle}</h3>
                          <p className="mt-1 text-sm text-zinc-400">{slotStart}</p>
                          {b.slot && (
                            <p className="mt-2 text-xs text-zinc-500">
                              Timezone: <span className="text-zinc-300">{b.slot.timezone}</span>
                            </p>
                          )}
                        </div>
                        <Badge tone={badgeTone}>
                          {b.status === "cancelled" 
                            ? "Cancelled" 
                            : isArchived 
                            ? "Archived"
                            : isExpired 
                            ? "Expired" 
                            : "Confirmed"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">
                        Booked on: <span className="text-zinc-400">{new Date(b.bookedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    
                    {b.status === "confirmed" && !isExpired ? (
                      <div className="mt-4 space-y-3 sm:mt-0 sm:min-w-64">
                        <label className="block space-y-2 text-left">
                          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Reschedule to</span>
                          <select
                            value={rescheduleTargets[bookingId] ?? ""}
                            onChange={(event) => updateRescheduleTarget(bookingId, event.target.value)}
                            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-200 ease-out focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={reschedulingInProgress.has(bookingId) || availabilityLoading || rescheduleOptions.length === 0}
                          >
                            <option value="">Select a new slot</option>
                            {rescheduleOptions.map((slot) => (
                              <option key={slot.id} value={slot.id} className="bg-zinc-900 text-white">
                                {slot.title} · {slot.timeRange} · {slot.timezone} · {slot.remainingSeats} left
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="secondary"
                            onClick={() => void rescheduleBooking(bookingId)}
                            disabled={reschedulingInProgress.has(bookingId) || rescheduleOptions.length === 0}
                            className="w-full sm:w-auto"
                          >
                            {reschedulingInProgress.has(bookingId) ? "Rescheduling..." : "Reschedule"}
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={() => cancelBooking(bookingId)}
                            disabled={cancellationInProgress.has(bookingId)}
                            className="w-full sm:w-auto"
                          >
                            {cancellationInProgress.has(bookingId) ? "Cancelling..." : "Cancel Booking"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
