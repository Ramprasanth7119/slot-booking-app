"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  slotId: string;
  remaining: number;
};

export function BookForm({ slotId, remaining }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    // Validate inputs
    if (!name.trim()) {
      setIsError(true);
      setMessage("Please enter your name.");
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsError(true);
      setMessage("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (remaining <= 0) {
      setIsError(true);
      setMessage("This slot is now full. Please select another slot.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slotId, 
          customerName: name.trim(), 
          customerEmail: email.trim().toLowerCase() 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to create booking. Please try again.");
        return;
      }

      setMessage("✓ Booking confirmed! Redirecting to your bookings...");
      setIsError(false);
      setName("");
      setEmail("");

      // Redirect after a short delay to let user see the success message
      setTimeout(() => {
        router.push(
          `/my-bookings?email=${encodeURIComponent(
            data.booking.customerEmail ?? email
          )}`
        );
      }, 1500);
    } catch (error) {
      setIsError(true);
      setMessage("Network error while booking. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            required
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Spots remaining: <strong className="text-white">{remaining}</strong>
        </p>
        <Button
          type="submit"
          disabled={isSubmitting || remaining <= 0}
          className="sm:min-w-44"
        >
          {isSubmitting ? "Booking..." : remaining <= 0 ? "Slot Full" : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}