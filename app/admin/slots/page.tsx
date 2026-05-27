import Link from "next/link";

import { getMongoDb } from "@/lib/mongodb";
import { serializeSlot, type SlotDocument } from "@/lib/slots";
import { AdminSlotManager } from "@/components/admin-slot-manager";
import { buttonClassName } from "@/components/ui/button";

export default async function AdminSlotsPage() {
  const db = await getMongoDb();
  const slots = await db.collection<SlotDocument>("slots").find({}).sort({ startTime: 1, createdAt: -1 }).toArray();
  const serializedSlots = slots.map(serializeSlot);

  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-300/80">Admin / Slots</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Manage Slots</h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Review every slot, update details, archive inactive ones, or remove entries you no longer need.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/create-slot" className={`${buttonClassName("primary")} inline-flex`}>
            Create Slot
          </Link>
          <Link href="/admin" className={`${buttonClassName("secondary")} inline-flex`}>
            Back to admin
          </Link>
        </div>
      </div>

      <AdminSlotManager initialSlots={serializedSlots} />
    </section>
  );
}
