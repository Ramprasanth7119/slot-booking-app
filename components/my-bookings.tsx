"use client";

import { useState, type FormEvent } from "react";
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
    isArchived: boolean;
  };
};

export function MyBookingsClient() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [cancellationInProgress, setCancellationInProgress] = useState<Set<string>>(new Set());

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
              
              const isExpired = b.slot?.endTime 
                ? new Date(b.slot.endTime) < new Date()
                : false;
              
              const badgeTone = b.status === "cancelled" ? "warning" : isExpired ? "danger" : "success";
              
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
                      <Button 
                        variant="ghost"
                        onClick={() => cancelBooking(bookingId)}
                        disabled={cancellationInProgress.has(bookingId)}
                        className="mt-4 sm:mt-0 w-full sm:w-auto"
                      >
                        {cancellationInProgress.has(bookingId) ? "Cancelling..." : "Cancel Booking"}
                      </Button>
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
