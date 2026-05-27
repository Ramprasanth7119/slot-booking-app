import { getMongoDb } from "@/lib/mongodb";
import { getDemoSlotRecordById } from "@/lib/demo-data";
import { serializeSlot, type SlotDocument } from "@/lib/slots";
import { ObjectId } from "mongodb";
import { BookForm } from "@/components/book-form";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";

type Params = { params: { slotId: string } };

const fastLookupTimeoutMs = 300;

async function readSlotWithFastFallback(slotId: string) {
  const demoSlot = getDemoSlotRecordById(slotId);

  try {
    const dbPromise = getMongoDb();
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), fastLookupTimeoutMs);
    });

    const db = await Promise.race([dbPromise, timeoutPromise]);

    if (!db) {
      return demoSlot;
    }

    const slot = await db.collection<SlotDocument>("slots").findOne({ _id: new ObjectId(slotId) });

    if (slot) {
      return slot;
    }
  } catch {
    // fall through to demo data below
  }

  if (demoSlot) {
    return demoSlot;
  }

  return null;
}

export default async function BookPage({ params }: Params) {
  const { slotId } = await params;

  const slot = await readSlotWithFastFallback(slotId);

  if (!slot) {
    return (
      <section className="mx-auto max-w-3xl space-y-8 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Slot Not Found</h1>
          <p className="text-sm text-zinc-400">
            The slot you&apos;re looking for doesn&apos;t exist or has been archived.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center space-y-4">
          <p className="text-sm text-zinc-400">
            Browse available slots from the home page to book a time.
          </p>
          <Link href="/" className={`${buttonClassName("primary")} inline-flex`}>
            Back to Available Slots
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-zinc-400">
            Need help? You can view your bookings or check the admin page for more information.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <Link href="/my-bookings" className={`${buttonClassName("secondary")} inline-flex`}>
              View My Bookings
            </Link>
            <Link href="/owner" className={`${buttonClassName("secondary")} inline-flex`}>
              Owner Tools
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const displaySlot = slot as SlotDocument & {
    venueName?: string;
    conductorName?: string;
    roomLabel?: string;
    audience?: string;
    highlights?: string[];
    category?: string;
    format?: string;
    featured?: boolean;
    meetingUrl?: string | null;
  };

  const serialized = serializeSlot(slot);
  const remaining = serialized.remainingSeats;
  const availabilityTone = serialized.status === "Archived" ? "neutral" : serialized.status === "Full" ? "danger" : serialized.status === "Expired" ? "warning" : "success";
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isBookable = serialized.status === "Available";
  const venueName = displaySlot.venueName?.trim() || displaySlot.roomLabel?.trim() || "To be announced";
  const conductorName = displaySlot.conductorName?.trim() || "To be announced";
  const audience = displaySlot.audience?.trim() || "General audience";
  const highlights = displaySlot.highlights?.filter(Boolean).slice(0, 3) ?? [];

  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={availabilityTone}>{serialized.status}</Badge>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
              {remaining} remaining
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
              {serialized.timezone}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{serialized.title}</h1>
            <p className="text-sm text-zinc-400 sm:text-base">{serialized.timeRange}</p>
            <p className="text-sm text-zinc-400">Venue: {venueName} · Conductor: {conductorName}</p>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">{serialized.description}</p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{displaySlot.category ?? "Consultation"}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{displaySlot.format ?? "In-person"}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Audience: {audience}</span>
          </div>

          {highlights.length ? (
            <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Highlights</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                {highlights.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Capacity</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{serialized.capacity}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Booked</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{serialized.bookedCount}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Local timezone</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{localTimeZone}</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-white">Booking panel</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Check the current availability state before confirming a reservation.</p>

          <div className="mt-6 space-y-3">
            {serialized.status === "Archived" ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                This slot is archived and cannot be booked.
              </div>
            ) : serialized.status === "Expired" ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                This slot has expired and is no longer available for booking.
              </div>
            ) : serialized.status === "Full" ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
                This slot is full. All available spots have been booked.
              </div>
            ) : (
              <BookForm slotId={serialized.id} remaining={remaining} />
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-6 text-sm text-zinc-400">
            Shown in {serialized.timezone}. Your browser timezone is {localTimeZone}.
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-zinc-400">
        <p>{isBookable ? "This slot is available for booking now." : "This slot is not currently bookable."}</p>
        <Link href="/" className="text-zinc-300 transition-colors hover:text-white">
          ← Back to all slots
        </Link>
      </div>
    </section>
  );
}
