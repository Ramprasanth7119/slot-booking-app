"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SlotFormValues = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: string;
};

const initialForm: SlotFormValues = {
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
  "America/Denver",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

type CreateSlotFormProps = {
  initialValues?: Partial<SlotFormValues>;
  endpoint?: string;
  method?: "POST" | "PATCH";
  submitLabel?: string;
  successMessage?: string;
  clearOnSuccess?: boolean;
  redirectTo?: string;
};

function toDatetimeInputValue(value: string) {
  if (!value) {
    return "";
  }

  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function buildInitialForm(values?: Partial<SlotFormValues>) {
  return {
    title: values?.title ?? initialForm.title,
    description: values?.description ?? initialForm.description,
    startTime: toDatetimeInputValue(values?.startTime ?? initialForm.startTime),
    endTime: toDatetimeInputValue(values?.endTime ?? initialForm.endTime),
    timezone: values?.timezone ?? initialForm.timezone,
    capacity: values?.capacity ?? initialForm.capacity,
  } satisfies SlotFormValues;
}

export function CreateSlotForm({
  initialValues,
  endpoint = "/api/slots",
  method = "POST",
  submitLabel,
  successMessage,
  clearOnSuccess = method === "POST",
  redirectTo,
}: CreateSlotFormProps = {}) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    // Authentication is handled server-side via HttpOnly cookie set on login.

    // Validate form
    if (!form.title.trim()) {
      setIsError(true);
      setMessage("Please enter a slot title.");
      setIsSubmitting(false);
      return;
    }

    if (!form.description.trim()) {
      setIsError(true);
      setMessage("Please enter a slot description.");
      setIsSubmitting(false);
      return;
    }

    if (!form.startTime) {
      setIsError(true);
      setMessage("Please select a start time.");
      setIsSubmitting(false);
      return;
    }

    if (!form.endTime) {
      setIsError(true);
      setMessage("Please select an end time.");
      setIsSubmitting(false);
      return;
    }

    const startDate = new Date(form.startTime);
    const endDate = new Date(form.endTime);

    if (endDate <= startDate) {
      setIsError(true);
      setMessage("End time must be after start time.");
      setIsSubmitting(false);
      return;
    }

    if (endDate.getTime() < Date.now()) {
      setIsError(true);
      setMessage("Slot end time cannot be in the past.");
      setIsSubmitting(false);
      return;
    }

    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
      setIsError(true);
      setMessage("Capacity must be between 1 and 100.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      timezone: form.timezone,
      capacity,
    };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { slot?: unknown; error?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to create slot. Please try again.");
        return;
      }

      if (clearOnSuccess) {
        setForm(buildInitialForm(initialValues));
      }

      setMessage(successMessage ?? (method === "POST" ? "✓ Slot created successfully! It's now live and visible to customers." : "✓ Slot updated successfully."));
      setIsError(false);

      if (redirectTo) {
        window.setTimeout(() => router.push(redirectTo), 900);
      } else {
        window.setTimeout(() => setMessage(null), 4000);
      }
    } catch (error) {
      setIsError(true);
      setMessage("Network error while creating the slot. Please try again.");
      console.error(error);
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
          className={`rounded-2xl border px-4 py-3 text-sm transition-all ${
            isError
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-zinc-200">Slot Title</span>
          <Input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="E.g., 1-hour consultation"
            maxLength={120}
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-zinc-500">{form.title.length}/120 characters</p>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-zinc-200">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Describe what this slot is for..."
            rows={4}
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-200 ease-out placeholder:text-zinc-500 focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Start time</span>
          <Input
            type="datetime-local"
            value={form.startTime}
            onChange={(event) => updateField("startTime", event.target.value)}
            required
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">End time</span>
          <Input
            type="datetime-local"
            value={form.endTime}
            onChange={(event) => updateField("endTime", event.target.value)}
            required
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Timezone</span>
          <select
            value={form.timezone}
            onChange={(event) => updateField("timezone", event.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-200 ease-out focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
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
            placeholder="Number of available spots"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-zinc-500">Maximum 100 spots per slot</p>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div>
          <p className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Note</p>
          <p className="mt-1 text-sm text-zinc-400">
            All times are stored in UTC. The timezone setting helps display the correct local time to customers.
          </p>
        </div>
        <Button type="submit" className="sm:min-w-44 w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? (method === "POST" ? "Creating..." : "Saving...") : submitLabel ?? (method === "POST" ? "Create Slot" : "Update Slot")}
        </Button>
      </div>
    </form>
  );
}