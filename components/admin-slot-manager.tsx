"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import type { SerializedSlot } from "@/lib/slots";

const OWNER_PIN_KEY = "owner-pin";

type AdminSlotManagerProps = {
  initialSlots: SerializedSlot[];
};

function getStatusTone(slot: SerializedSlot) {
  if (slot.isArchived) {
    return "neutral" as const;
  }

  if (slot.status === "Expired") {
    return "danger" as const;
  }

  if (slot.status === "Full") {
    return "warning" as const;
  }

  return "success" as const;
}

export function AdminSlotManager({ initialSlots }: AdminSlotManagerProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  const totals = useMemo(() => {
    return {
      active: slots.filter((slot) => !slot.isArchived).length,
      archived: slots.filter((slot) => slot.isArchived).length,
      available: slots.filter((slot) => !slot.isArchived && slot.status === "Available").length,
    };
  }, [slots]);

  async function submitSlotChange(slotId: string, payload: Record<string, unknown>, successText: string) {
    setActiveSlotId(slotId);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-owner-pin": window.sessionStorage.getItem(OWNER_PIN_KEY) || "",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to update the slot.");
        return;
      }

      setSlots((current) =>
        current.map((slot) =>
          slot.id === slotId
            ? { ...slot, isArchived: typeof payload.isArchived === "boolean" ? payload.isArchived : slot.isArchived }
            : slot
        )
      );
      setMessage(successText);
    } catch {
      setIsError(true);
      setMessage("Network error while updating this slot.");
    } finally {
      setActiveSlotId(null);
    }
  }

  async function deleteSlot(slotId: string) {
    if (!window.confirm("Delete this slot permanently? Existing bookings will still remain on the booking records.")) {
      return;
    }

    setActiveSlotId(slotId);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: "DELETE",
        headers: {
          "x-owner-pin": window.sessionStorage.getItem(OWNER_PIN_KEY) || "",
        },
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to delete the slot.");
        return;
      }

      setSlots((current) => current.filter((slot) => slot.id !== slotId));
      setMessage("Slot deleted successfully.");
    } catch {
      setIsError(true);
      setMessage("Network error while deleting this slot.");
    } finally {
      setActiveSlotId(null);
    }
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm text-zinc-400">No slots have been created yet.</p>
        <Link href="/admin/create-slot" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
          Create Your First Slot
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{slots.length} total</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{totals.active} active</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{totals.available} available</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{totals.archived} archived</span>
      </div>

      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {slots.map((slot) => {
          const remaining = Math.max(0, slot.capacity - slot.bookedCount);
          const tone = getStatusTone(slot);

          return (
            <article key={slot.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/15 hover:bg-white/[0.05]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{slot.title}</h2>
                    <Badge tone={tone}>{slot.isArchived ? "Archived" : slot.status}</Badge>
                  </div>
                  <p className="max-w-3xl text-sm leading-7 text-zinc-400">{slot.description}</p>
                  <p className="text-sm text-zinc-300">{slot.timeRange} · {slot.timezone}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Booked {slot.bookedCount}/{slot.capacity}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Remaining {remaining}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">ID {slot.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/slots/${slot.id}`} className={`${buttonClassName("secondary")} inline-flex`}>
                    Edit
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 px-4 text-sm"
                    disabled={activeSlotId === slot.id}
                    onClick={() => void submitSlotChange(slot.id, { isArchived: !slot.isArchived }, slot.isArchived ? "Slot restored successfully." : "Slot archived successfully.")}
                  >
                    {activeSlotId === slot.id ? (slot.isArchived ? "Restoring..." : "Archiving...") : slot.isArchived ? "Restore" : "Archive"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 px-4 text-sm text-rose-200 hover:bg-rose-400/10 hover:text-rose-100"
                    disabled={activeSlotId === slot.id}
                    onClick={() => void deleteSlot(slot.id)}
                  >
                    {activeSlotId === slot.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
