"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";

const OWNER_PIN_KEY = "owner-pin";

type AdminBooking = {
  slotId: string;
  slotTitle: string;
  slotStartTime: string;
  slotEndTime: string;
  slotTimezone: string;
  slotCapacity: number;
  slotBookedCount: number;
  customerName: string;
  customerEmail: string;
  bookingStatus: "confirmed" | "cancelled";
  bookedAt: string;
};

export default function AdminBookingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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

      const bookingsList = (data.bookings ?? []) as AdminBooking[];
      setBookings(bookingsList);

      if (bookingsList.length === 0) {
        setMessage("No bookings yet. Your created slots will show up here once customers book them.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error while fetching bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const pin = window.sessionStorage.getItem(OWNER_PIN_KEY);
    if (!pin) {
      window.location.href = "/admin";
      return;
    }

    const timer = window.setTimeout(() => {
      setIsAuthenticated(true);
      void fetchBookings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isAuthenticated) {
    return (
      <section className="space-y-8 py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-rose-300">Redirecting to admin login...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-300/80">Admin / Bookings</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">All Bookings</h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            View all customer bookings across your slots.
          </p>
        </div>
        <Link href="/admin" className={`${buttonClassName("secondary")} inline-flex`}>
          Back to admin
        </Link>
      </div>

      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-zinc-400">
          <div className="animate-pulse">Loading bookings...</div>
        </div>
      ) : null}

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Total Bookings: {bookings.filter((b) => b.bookingStatus === "confirmed").length} confirmed, {bookings.filter((b) => b.bookingStatus === "cancelled").length} cancelled
          </p>
          <div className="grid gap-4">
            {bookings.map((booking, idx) => {
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
              const badgeTone = booking.bookingStatus === "cancelled" ? "warning" : isExpired ? "danger" : "success";

              return (
                <div key={`${booking.slotId}-${booking.customerEmail}-${idx}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/15 hover:bg-white/[0.05]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-white">{booking.slotTitle}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{slotStart}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{booking.slotBookedCount}/{booking.slotCapacity} booked</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{booking.slotTimezone}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-200">{booking.customerName}</p>
                      <p className="mt-1 text-sm text-zinc-400">{booking.customerEmail}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge tone={badgeTone}>{booking.bookingStatus === "cancelled" ? "Cancelled" : isExpired ? "Expired" : "Confirmed"}</Badge>
                        <p className="text-xs text-zinc-500">Booked: {new Date(booking.bookedAt).toLocaleDateString()}</p>
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
          <p className="text-sm text-zinc-400">No bookings yet. Create some slots and they&apos;ll appear on the public site.</p>
          <Link href="/admin/create-slot" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            Create Your First Slot
          </Link>
        </div>
      ) : null}
    </section>
  );
}
