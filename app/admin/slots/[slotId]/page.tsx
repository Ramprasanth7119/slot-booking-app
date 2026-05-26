import Link from "next/link";
import { ObjectId } from "mongodb";

import { CreateSlotForm } from "@/components/create-slot-form";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { getMongoDb } from "@/lib/mongodb";
import { serializeSlot, type SlotDocument } from "@/lib/slots";

type Params = { params: { slotId: string } };

type LooseSlotRecord = SlotDocument & {
  _id?: string | ObjectId;
  id?: string;
};

export default async function EditSlotPage({ params }: Params) {
  const { slotId } = params;
  const db = await getMongoDb();

  let slot: SlotDocument | null = null;

  try {
    slot = await db.collection<SlotDocument>("slots").findOne({ _id: new ObjectId(slotId) });
  } catch {
    // ignore invalid ObjectId format
  }

  if (!slot) {
    const looseSlots = db.collection<LooseSlotRecord>("slots");
    slot = (await looseSlots.findOne({ _id: slotId } as never)) as SlotDocument | null;
  }

  if (!slot) {
    const looseSlots = db.collection<LooseSlotRecord>("slots");
    slot = (await looseSlots.findOne({ id: slotId } as never)) as SlotDocument | null;
  }

  if (!slot) {
    return (
      <section className="mx-auto max-w-3xl space-y-8 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Slot Not Found</h1>
          <p className="text-sm text-zinc-400">The slot you&apos;re trying to edit doesn&apos;t exist or was deleted.</p>
        </div>

        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center space-y-4">
          <p className="text-sm text-zinc-400">Go back to the slot list to manage a different entry.</p>
          <Link href="/admin/slots" className={`${buttonClassName("primary")} inline-flex`}>
            Back to Slots
          </Link>
        </div>
      </section>
    );
  }

  const serialized = serializeSlot(slot);

  return (
    <section className="mx-auto max-w-4xl space-y-8 py-8 sm:py-12">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-300/80">Admin / Edit Slot</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Edit slot details</h1>
            <p className="text-sm leading-7 text-zinc-400 sm:text-base">Update the title, description, schedule, timezone, or capacity for this slot.</p>
          </div>
          <Link href="/admin/slots" className={`${buttonClassName("secondary")} inline-flex`}>
            Back to slots
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
          <CreateSlotForm
            initialValues={{
              title: serialized.title,
              description: serialized.description,
              startTime: serialized.startTime,
              endTime: serialized.endTime,
              timezone: serialized.timezone,
              capacity: String(serialized.capacity),
            }}
            endpoint={`/api/slots/${serialized.id}`}
            method="PATCH"
            submitLabel="Save Changes"
            successMessage="✓ Slot updated successfully. Returning to the slots list..."
            clearOnSuccess={false}
            redirectTo="/admin/slots"
          />
        </div>

        <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-200">Slot Summary</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</dt>
              <dd className="mt-1"><Badge tone={serialized.status === "Archived" ? "neutral" : serialized.status === "Expired" ? "danger" : serialized.status === "Full" ? "warning" : "success"}>{serialized.status}</Badge></dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Booked</dt>
              <dd className="mt-1 text-zinc-300">{serialized.bookedCount} / {serialized.capacity}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Remaining</dt>
              <dd className="mt-1 text-zinc-300">{serialized.remainingSeats}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Timezone</dt>
              <dd className="mt-1 text-zinc-300">{serialized.timezone}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
