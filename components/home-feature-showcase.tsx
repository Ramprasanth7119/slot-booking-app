"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import type { SerializedSlot } from "@/lib/slots";

type FeatureKey = "realtime" | "preview" | "details";

type HomeFeatureShowcaseProps = {
  initialSlots: SerializedSlot[];
};

const featureCopy: Record<FeatureKey, { eyebrow: string; title: string; description: string }> = {
  realtime: {
    eyebrow: "Real-time updates",
    title: "The public site refreshes itself while people are booking.",
    description:
      "Availability is re-fetched on an interval and whenever the browser regains focus, so the inventory shown to customers stays close to what is actually in the database.",
  },
  preview: {
    eyebrow: "Live availability preview",
    title: "Customers see the next available slot before they commit.",
    description:
      "The preview panel highlights the best open slot, the remaining seats, and the exact time window so users can make a quick booking decision.",
  },
  details: {
    eyebrow: "Venue and conductor details",
    title: "Venue and conductor data are surfaced on demand, not buried in the UI.",
    description:
      "People can inspect the room, conductor, timezone, and capacity from the same panel without leaving the homepage or opening a separate page.",
  },
};

const featureOrder: FeatureKey[] = ["realtime", "preview", "details"];
const liveRefreshIntervalMs = 60_000;

async function fetchLiveSlots({ signal }: { signal: AbortSignal }) {
  const response = await fetch("/api/slots", { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Failed to load live slot data.");
  }

  const payload = (await response.json()) as { slots?: SerializedSlot[] };
  return payload.slots ?? [];
}

function getStatusTone(status: SerializedSlot["status"]) {
  if (status === "Archived") {
    return "neutral";
  }

  if (status === "Full") {
    return "danger";
  }

  if (status === "Expired") {
    return "warning";
  }

  return "success";
}

function formatRelativeTime(value: Date | null) {
  if (!value) {
    return "Waiting for first sync";
  }

  const hours = value.getUTCHours();
  const minutes = value.getUTCMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedTime = `${displayHours}:${minutes} ${period}`;

  return `Last synced ${formattedTime}`;
}

export function HomeFeatureShowcase({ initialSlots }: HomeFeatureShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("realtime");
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() => initialSlots[0]?.id ?? "");
  const slotsQuery = useQuery({
    queryKey: ["home-slots"],
    queryFn: fetchLiveSlots,
    initialData: initialSlots,
    refetchInterval: liveRefreshIntervalMs,
  });

  const slots = slotsQuery.data ?? initialSlots;
  const lastSyncedAt = slotsQuery.dataUpdatedAt ? new Date(slotsQuery.dataUpdatedAt) : null;
  const isRefreshing = slotsQuery.isFetching;
  const syncError = slotsQuery.error instanceof Error ? slotsQuery.error.message : null;
  const activeSelectedSlotId = slots.some((slot) => slot.id === selectedSlotId) ? selectedSlotId : slots[0]?.id ?? "";
  const visibleSlot = useMemo(() => slots.find((slot) => slot.id === activeSelectedSlotId) ?? slots[0] ?? null, [activeSelectedSlotId, slots]);

  const availableSlots = slots.filter((slot) => slot.status === "Available");
  const fullSlots = slots.filter((slot) => slot.status === "Full");
  const archivedSlots = slots.filter((slot) => slot.status === "Archived");
  const nextAvailableSlot = availableSlots[0] ?? null;
  const totalRemainingSeats = slots.reduce((total, slot) => total + slot.remainingSeats, 0);
  const activeCopy = featureCopy[activeFeature];

  return (
    <section className="w-full min-w-0 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">Platform signals</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">Click a feature to inspect the public experience.</h2>
        </div>

        <div className="flex flex-col items-start gap-2 text-xs text-zinc-400 sm:items-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Live
          </span>
          <span>{formatRelativeTime(lastSyncedAt)}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {featureOrder.map((featureKey) => {
          const isActive = activeFeature === featureKey;
          const item = featureCopy[featureKey];

          return (
            <button
              key={featureKey}
              type="button"
              onClick={() => setActiveFeature(featureKey)}
              className={`rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 ${
                isActive
                  ? "border-violet-400/30 bg-violet-400/12 shadow-[0_14px_32px_rgba(99,102,241,0.14)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.055]"
              }`}
              aria-pressed={isActive}
            >
              <p className={`text-[0.7rem] uppercase tracking-[0.28em] ${isActive ? "text-violet-200" : "text-zinc-500"}`}>
                {item.eyebrow}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-white">{item.title}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">{activeCopy.eyebrow}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">{activeCopy.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">{activeCopy.description}</p>

          {activeFeature === "realtime" ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Available</p>
                <p className="mt-2 text-2xl font-semibold text-white">{availableSlots.length}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Full</p>
                <p className="mt-2 text-2xl font-semibold text-white">{fullSlots.length}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Seats left</p>
                <p className="mt-2 text-2xl font-semibold text-white">{totalRemainingSeats}</p>
              </div>
            </div>
          ) : null}

          {activeFeature === "preview" ? (
            <div className="mt-6 space-y-3">
              {nextAvailableSlot ? (
                <div className="rounded-[1.4rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Next available slot</p>
                    <Badge tone="success">Live</Badge>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">{nextAvailableSlot.title}</p>
                  <p className="mt-1 text-sm text-emerald-100/80">{nextAvailableSlot.timeRange}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.95),rgba(34,197,94,0.7))]"
                      style={{ width: `${Math.max(8, 100 - (nextAvailableSlot.remainingSeats / nextAvailableSlot.capacity) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-100/80">
                    <span className="rounded-full border border-emerald-400/20 bg-white/[0.04] px-3 py-1">{nextAvailableSlot.remainingSeats} seats left</span>
                    <span className="rounded-full border border-emerald-400/20 bg-white/[0.04] px-3 py-1">{nextAvailableSlot.timezone}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
                  No open slots right now. The preview updates automatically when inventory changes.
                </div>
              )}
            </div>
          ) : null}

          {activeFeature === "details" ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {slots.slice(0, 4).map((slot) => {
                  const isSelected = visibleSlot?.id === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`min-h-28 rounded-[1.2rem] border px-4 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 ${
                        isSelected
                          ? "border-violet-400/30 bg-violet-400/12 shadow-[0_12px_28px_rgba(99,102,241,0.14)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.055]"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-white break-words">{slot.title}</p>
                          </div>
                          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                            {slot.venueName}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="min-w-0 text-sm leading-6 text-zinc-400 break-words">
                            {slot.conductorName}
                          </p>
                          <Badge tone={getStatusTone(slot.status)} className="shrink-0">
                            {slot.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {visibleSlot ? (
                <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Selected slot</p>
                      <h4 className="mt-2 text-xl font-semibold text-white">{visibleSlot.title}</h4>
                    </div>
                    <Badge tone={getStatusTone(visibleSlot.status)}>{visibleSlot.status}</Badge>
                  </div>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">{visibleSlot.description}</p>

                  <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Venue</dt>
                      <dd className="mt-2 text-sm font-medium text-white">{visibleSlot.venueName}</dd>
                    </div>
                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Conductor</dt>
                      <dd className="mt-2 text-sm font-medium text-white">{visibleSlot.conductorName}</dd>
                    </div>
                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Time</dt>
                      <dd className="mt-2 text-sm font-medium text-white">{visibleSlot.timeRange}</dd>
                    </div>
                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Timezone</dt>
                      <dd className="mt-2 text-sm font-medium text-white">{visibleSlot.timezone}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{visibleSlot.remainingSeats} remaining</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{visibleSlot.bookedCount}/{visibleSlot.capacity} booked</span>
                  </div>
                </article>
              ) : null}
            </div>
          ) : null}
        </article>

        <aside className="space-y-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Snapshot</p>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${isRefreshing ? "border-violet-400/20 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/[0.04] text-zinc-300"}`}>
              {isRefreshing ? "Refreshing" : "Idle"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Slots shown</p>
              <p className="mt-2 text-2xl font-semibold text-white">{slots.length}</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Archived</p>
              <p className="mt-2 text-2xl font-semibold text-white">{archivedSlots.length}</p>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),rgba(255,255,255,0.03))] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-200/80">Why it feels live</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              <li>• Fresh inventory is pulled on a timer so the preview does not drift for long.</li>
              <li>• The booking form also polls the slot API before submission.</li>
              <li>• Venue and conductor data stay visible on the same surface.</li>
            </ul>
          </div>

          {syncError ? (
            <div className="rounded-[1.2rem] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              {syncError}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}