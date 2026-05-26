import { getMongoDb } from "@/lib/mongodb";
import { serializeSlot, type SlotDocument } from "@/lib/slots";
import { ObjectId } from "mongodb";
import { BookForm } from "@/components/book-form";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";

type Params = { params: { slotId: string } };

type LooseSlotRecord = SlotDocument & {
  _id?: string | ObjectId;
  id?: string;
};

export default async function BookPage({ params }: Params) {
  const { slotId } = params;

  const db = await getMongoDb();
  let slot: SlotDocument | null = null;

  try {
    slot = await db.collection<SlotDocument>("slots").findOne({ _id: new ObjectId(slotId) });
  } catch {
    // ignore invalid ObjectId
  }

  if (!slot) {
    const rawSlots = db.collection<LooseSlotRecord>("slots");
    slot = (await rawSlots.findOne({ _id: slotId } as never)) as SlotDocument | null;
  }

  if (!slot) {
    const rawSlots = db.collection<LooseSlotRecord>("slots");
    slot = (await rawSlots.findOne({ id: slotId } as never)) as SlotDocument | null;
  }

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

  const serialized = serializeSlot(slot);
  const remaining = serialized.remainingSeats;
  const availabilityTone = serialized.status === "Archived" ? "neutral" : serialized.status === "Full" ? "danger" : serialized.status === "Expired" ? "warning" : "success";
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isBookable = serialized.status === "Available";

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
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">{serialized.description}</p>

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
