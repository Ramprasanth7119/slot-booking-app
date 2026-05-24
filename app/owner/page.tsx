"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OWNER_PIN_KEY = "owner-pin";

export default function OwnerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!window.sessionStorage.getItem(OWNER_PIN_KEY);
  });

  const [pinInput, setPinInput] = useState("");
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [isPinError, setIsPinError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setPinMessage(null);
    setIsPinError(false);

    if (!pinInput.trim()) {
      setIsPinError(true);
      setPinMessage("Please enter your PIN.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsPinError(true);
        setPinMessage(data.error ?? "Invalid PIN. Please try again.");
        return;
      }

      window.sessionStorage.setItem(OWNER_PIN_KEY, pinInput);
      setIsAuthenticated(true);
      setPinInput("");
      setPinMessage("Authentication successful!");
      setTimeout(() => setPinMessage(null), 2000);
    } catch (error) {
      setIsPinError(true);
      setPinMessage("Network error during authentication. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(OWNER_PIN_KEY);
    setIsAuthenticated(false);
    setPinInput("");
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center space-y-8 py-12">
        <div className="text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-300/80">
            Owner Access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Welcome, Owner
          </h1>
          <p className="text-sm leading-6 text-zinc-400">
            Enter your PIN to access the owner workspace and manage your slots.
          </p>
        </div>

        <form onSubmit={handlePinSubmit} className="w-full space-y-4">
          {pinMessage ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                isPinError
                  ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {pinMessage}
            </div>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-200">Owner PIN</span>
            <Input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter your PIN"
              disabled={isSubmitting}
              required
              autoComplete="off"
            />
          </label>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Verifying..." : "Sign In"}
          </Button>
        </form>

        <p className="text-xs text-zinc-500 text-center">
          Demo PIN: Check your .env.local OWNER_PIN variable
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-300/80">Owner</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Slot Management</h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Create, manage, and monitor your booking slots. Track availability and bookings in real time.
          </p>
        </div>
        <Button variant="secondary" onClick={handleLogout} className="w-full sm:w-auto">
          Sign Out
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
          <h2 className="text-lg font-semibold text-white">Create New Slot</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Add a new time slot with your preferred capacity, timing, and timezone.
          </p>
          <Link href="/owner/create-slot" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            Create Slot
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
          <h2 className="text-lg font-semibold text-white">View Bookings</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            See all confirmed bookings across your slots and manage customer reservations.
          </p>
          <Link href="/owner/bookings" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            View Bookings
          </Link>
        </article>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-white">Quick Links</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className={`${buttonClassName("secondary")} inline-flex`}>
              View Public Slots
            </Link>
            <Link href="/my-bookings" className={`${buttonClassName("secondary")} inline-flex`}>
              Lookup Customer Bookings
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}