"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SerializedSlot } from "@/lib/slots";

const requestTimeoutMs = 1500;
const availabilityRefreshIntervalMs = 60_000;

type Props = {
  slotId: string;
  remaining: number;
};

type BookingResponse = {
  error?: string;
};

async function fetchSlotAvailability(slotId: string, signal: AbortSignal) {
  const response = await fetch(`/api/slots/${slotId}`, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Failed to load live slot data.");
  }

  const payload = (await response.json()) as { slot?: SerializedSlot };
  return payload.slot ?? null;
}

async function createBooking(slotId: string, customerName: string, customerEmail: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        slotId,
        customerName,
        customerEmail,
      }),
    });

    const rawText = await response.text();
    let data: BookingResponse = {};

    if (rawText) {
      try {
        data = JSON.parse(rawText) as BookingResponse;
      } catch {
        data = {};
      }
    }

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to create booking. Please try again.");
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function BookForm({ slotId, remaining }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const availabilityQuery = useQuery({
    queryKey: ["slot-availability", slotId],
    queryFn: ({ signal }) => fetchSlotAvailability(slotId, signal),
    refetchInterval: availabilityRefreshIntervalMs,
    staleTime: 30_000,
  });

  const liveSlot = availabilityQuery.data;
  const liveRemaining = liveSlot?.remainingSeats ?? remaining;
  const liveStatus = liveSlot?.status ?? (remaining > 0 ? "Available" : "Full");
  const lastCheckedAt = availabilityQuery.dataUpdatedAt ? new Date(availabilityQuery.dataUpdatedAt) : null;
  const availableSeats = Math.max(0, liveRemaining);
  const isSlotOpen = liveStatus === "Available" && availableSeats > 0;

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedName) {
        throw new Error("Please enter your name.");
      }

      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!isSlotOpen) {
        throw new Error("This slot is now full. Please select another slot.");
      }

      return createBooking(slotId, trimmedName, trimmedEmail);
    },
    onSuccess: async () => {
      setMessage("✓ Booking confirmed! Returning you to the public site...");
      setIsError(false);
      setName("");
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["slot-availability", slotId] });
      window.setTimeout(() => {
        router.push("/");
      }, 1500);
    },
    onError: (error) => {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Network error while booking. Please try again.");
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    try {
      await bookingMutation.mutateAsync();
    } catch {
      // onError already updates the visible message
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-white">Live availability</p>
          <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            {lastCheckedAt ? `Updated ${lastCheckedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Syncing"}
          </span>
        </div>
        <p className="mt-2 text-zinc-400">
          {isSlotOpen
            ? `${availableSeats} seat${availableSeats === 1 ? "" : "s"} remain open for this slot.`
            : "This slot is full or unavailable right now. The form will prevent stale bookings."}
        </p>
      </div>

      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm transition-all ${
            isError
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Your name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            disabled={bookingMutation.isPending}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Email address</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={bookingMutation.isPending}
            required
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Spots remaining: <strong className="text-white">{availableSeats}</strong>
        </p>
        <Button
          type="submit"
          disabled={bookingMutation.isPending || !isSlotOpen}
          className="sm:min-w-44"
        >
          {bookingMutation.isPending ? "Booking..." : !isSlotOpen ? "Slot Full" : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}
