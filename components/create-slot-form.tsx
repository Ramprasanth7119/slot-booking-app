"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialForm = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  timezone: "UTC",
  capacity: "1",
};

const timezoneOptions = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

const OWNER_PIN_KEY = "owner-pin";

function getOwnerPin() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(OWNER_PIN_KEY);
}

export function CreateSlotForm() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const ownerPin = getOwnerPin();

    if (!ownerPin) {
      setIsError(true);
      setMessage("Owner PIN is missing. Please sign in again.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      timezone: form.timezone,
      capacity: Number(form.capacity),
    };

    try {
      const response = await fetch("/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-owner-pin": ownerPin,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { slot?: unknown; error?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to create slot.");
        return;
      }

      setForm(initialForm);
      setMessage("Slot created successfully.");
    } catch {
      setIsError(true);
      setMessage("Something went wrong while creating the slot.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-zinc-200">Title</span>
          <Input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Consultation slot"
            required
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-zinc-200">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short context for this slot"
            rows={4}
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-200 ease-out placeholder:text-zinc-500 focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/15"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Start time</span>
          <Input
            type="datetime-local"
            value={form.startTime}
            onChange={(event) => updateField("startTime", event.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">End time</span>
          <Input
            type="datetime-local"
            value={form.endTime}
            onChange={(event) => updateField("endTime", event.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Timezone</span>
          <select
            value={form.timezone}
            onChange={(event) => updateField("timezone", event.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-200 ease-out focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/15"
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone} className="bg-zinc-900 text-white">
                {timezone}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Capacity</span>
          <Input
            type="number"
            min="1"
            max="100"
            value={form.capacity}
            onChange={(event) => updateField("capacity", event.target.value)}
            required
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">Dates are stored in UTC. Booking logic comes later.</p>
        <Button type="submit" className="sm:min-w-44" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Slot"}
        </Button>
      </div>
    </form>
  );
}