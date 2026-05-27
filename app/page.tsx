import { getMongoDb } from "@/lib/mongodb";
import { getDemoSlots, shouldUseDemoData } from "@/lib/demo-data";
import { HomeFeatureShowcase } from "@/components/home-feature-showcase";
import { SlotCard } from "@/components/slot-card";
import { serializeSlot, type SlotDocument, type SerializedSlot } from "@/lib/slots";

const fastHomeTimeoutMs = 300;

async function getSlots(): Promise<SerializedSlot[]> {
  try {
    const dbPromise = getMongoDb();
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), fastHomeTimeoutMs);
    });

    const db = await Promise.race([dbPromise, timeoutPromise]);

    if (!db) {
      return getDemoSlots();
    }

    const slots = await db
      .collection<SlotDocument>("slots")
      .find({ isArchived: false })
      .sort({ startTime: 1, createdAt: -1 })
      .toArray();

    return slots.map(serializeSlot);
  } catch (error) {
    if (shouldUseDemoData(error)) {
      return getDemoSlots();
    }

    return [];
  }
}

export default async function Home() {
  const slots = await getSlots();
  const availableSlots = slots.filter((slot) => slot.status === "Available");
  const fullSlots = slots.filter((slot) => slot.status === "Full");
  const totalRemainingSeats = slots.reduce((total, slot) => total + slot.remainingSeats, 0);

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8">
        <div className="space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-300/80">
            Slot booking platform
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[4.35rem] lg:leading-[1.02]">
              Book Your Time Slots Instantly
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              Browse available slots, reserve your preferred time, and manage your bookings in one place. Secure, reliable, and easy to use.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Available</p>
              <p className="mt-2 text-2xl font-semibold text-white">{availableSlots.length}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Full</p>
              <p className="mt-2 text-2xl font-semibold text-white">{fullSlots.length}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Remaining Seats</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalRemainingSeats}</p>
            </div>
          </div>
        </div>

        <HomeFeatureShowcase initialSlots={slots} />

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">Available Slots</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-400">Browse all available time slots and book what works for you.</p>
            </div>
            <p className="text-sm text-zinc-500">{slots.length} slot{slots.length !== 1 ? "s" : ""} available</p>
          </div>

          {slots.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  id={slot.id}
                  title={slot.title}
                  description={slot.description}
                  venueName={slot.venueName}
                  conductorName={slot.conductorName}
                  timeRange={slot.timeRange}
                  timezone={slot.timezone}
                  bookedCount={slot.bookedCount}
                  capacity={slot.capacity}
                  status={slot.status}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
              No live slots yet. Use the owner create form to add the first slot.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
