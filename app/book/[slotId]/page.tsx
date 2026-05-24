import { getMongoDb } from "@/lib/mongodb";
import { serializeSlot, type SlotDocument } from "@/lib/slots";
import { ObjectId } from "mongodb";
import { BookForm } from "@/components/book-form";
import Link from "next/link";
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
  const remaining = Math.max(0, serialized.capacity - serialized.bookedCount);

  return (
    <section className="space-y-8 py-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">{serialized.title}</h1>
        <p className="text-sm text-zinc-400">{serialized.timeRange} · {serialized.timezone}</p>
        <p className="mt-4 text-sm leading-7 text-zinc-300">{serialized.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Book this slot</h2>
          <p className="mt-2 text-sm text-zinc-400">Enter your details to confirm your booking.</p>

          <div className="mt-4">
            {serialized.status === "Expired" ? (
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
        </div>

        <aside className="rounded-[1.25rem] border border-white/6 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-zinc-200">Slot Details</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Timezone</dt>
              <dd className="mt-1 text-zinc-300">{serialized.timezone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Capacity</dt>
              <dd className="mt-1 text-zinc-300">{serialized.capacity} spot{serialized.capacity !== 1 ? 's' : ''}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Already Booked</dt>
              <dd className="mt-1 text-zinc-300">{serialized.bookedCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Spots Available</dt>
              <dd className="mt-1 font-semibold text-emerald-400">{remaining}</dd>
            </div>
            {serialized.status !== "Available" && (
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</dt>
                <dd className="mt-1 capitalize text-amber-300">{serialized.status}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              ← Back to all slots
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
