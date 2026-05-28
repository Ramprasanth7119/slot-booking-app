"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const OWNER_PIN_KEY = "owner-pin";

type OwnerBooking = {
  slotId: string;
  slotTitle: string;
  slotStartTime: string;
  slotEndTime: string;
  slotTimezone: string;
  slotCapacity: number;
  slotBookedCount: number;
  slotRemainingSeats: number;
  slotStatus: "Available" | "Full" | "Expired" | "Archived";
  customerName: string;
  customerEmail: string;
  bookingStatus: "confirmed" | "cancelled";
  bookedAt: string;
};

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<OwnerBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueSlots = Array.from(
    new Map((bookings || []).map((b) => [b.slotId, { id: b.slotId, title: b.slotTitle }])).values()
  ).sort((a, b) => a.title.localeCompare(b.title));

  const filteredBookings = (bookings || []).filter((b) => {
    const matchesSlot = selectedSlotId === "all" || b.slotId === selectedSlotId;
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slotTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSlot && matchesSearch;
  });

  async function fetchBookings() {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch("/api/owner/bookings", {
        headers: {
          "x-owner-pin": window.sessionStorage.getItem(OWNER_PIN_KEY) || "",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to fetch bookings.");
        return;
      }

      const bookingsList = (data.bookings ?? []) as OwnerBooking[];
      setBookings(bookingsList);

      if (bookingsList.length === 0) {
        setMessage("No bookings yet. Your created slots will show up here once customers book them.");
      }
    } catch (error) {
      setIsError(true);
      setMessage("Network error while fetching bookings. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const pin = window.sessionStorage.getItem(OWNER_PIN_KEY);
    if (!pin) {
      router.push("/owner");
      return;
    }
    const timer = window.setTimeout(() => {
      setIsAuthenticated(true);
      void fetchBookings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (!isAuthenticated) {
    return (
      <section className="space-y-8 py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-rose-300">Redirecting to owner login...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-300/80">
            Owner / Bookings
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            All Bookings
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            View all customer bookings across your slots. Monitor booking status and customer information.
          </p>
        </div>
        <Link href="/owner" className={`${buttonClassName("secondary")} inline-flex`}>
          Back to owner
        </Link>
      </div>

      {bookings && bookings.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Search</label>
            <input
              type="text"
              placeholder="Filter by name, email, or event title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl border border-black/10 bg-white/50 px-4 text-sm text-foreground focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="slot-filter" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Event
            </label>
            <select
              id="slot-filter"
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="h-10 rounded-xl border border-black/10 bg-white/50 px-4 text-sm text-foreground focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 dark:border-white/10 dark:bg-zinc-900 dark:text-white sm:w-80"
            >
              <option value="all" className="bg-white text-black dark:bg-zinc-900 dark:text-white">All Events ({bookings.length})</option>
              {uniqueSlots.map((slot) => (
                <option key={slot.id} value={slot.id} className="bg-white text-black dark:bg-zinc-900 dark:text-white">
                  {slot.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isError
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-zinc-400">
          <div className="animate-pulse">Loading bookings...</div>
        </div>
      ) : null}

      {filteredBookings && filteredBookings.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Total Bookings: {filteredBookings.filter((b) => b.bookingStatus === "confirmed").length} confirmed, {filteredBookings.filter((b) => b.bookingStatus === "cancelled").length} cancelled
          </p>
          <div className="grid gap-4">
            {filteredBookings.map((booking, idx) => {
              const slotStart = new Date(booking.slotStartTime).toLocaleString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: booking.slotTimezone,
              });

              const isExpired = new Date(booking.slotEndTime) < new Date();
              const slotTone = booking.slotStatus === "Archived" ? "neutral" : booking.slotStatus === "Expired" ? "warning" : booking.slotStatus === "Full" ? "danger" : "success";
              const badgeTone =
                booking.bookingStatus === "cancelled"
                  ? "warning"
                  : isExpired
                    ? "danger"
                    : "success";

              return (
                <div
                  key={`${booking.slotId}-${booking.customerEmail}-${idx}`}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-white">{booking.slotTitle}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{slotStart}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                          {booking.slotBookedCount}/{booking.slotCapacity} booked
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                          {booking.slotRemainingSeats} remaining
                        </span>
                        <Badge tone={slotTone}>{booking.slotStatus}</Badge>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                          {booking.slotTimezone}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-200">{booking.customerName}</p>
                      <p className="mt-1 text-sm text-zinc-400">{booking.customerEmail}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge tone={badgeTone}>
                          {booking.bookingStatus === "cancelled"
                            ? "Cancelled"
                            : isExpired
                              ? "Expired"
                              : "Confirmed"}
                        </Badge>
                        <p className="text-xs text-zinc-500">
                          Booked: {new Date(booking.bookedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {bookings && bookings.length === 0 && !loading ? (
        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-sm text-zinc-400">
            No bookings yet. Create some slots and they&apos;ll appear on the home page.
          </p>
          <Link href="/owner/create-slot" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            Create Your First Slot
          </Link>
        </div>
      ) : null}
    </section>
  );
}
