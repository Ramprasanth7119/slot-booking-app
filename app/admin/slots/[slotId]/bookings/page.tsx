import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { AdminSlotBookings } from "@/components/admin-slot-bookings";

type Params = { params: { slotId: string } };

export default async function SlotBookingsPage({ params }: Params) {
  const { slotId } = params;
  const db = await getMongoDb();
  let objectId: ObjectId | null = null;
  try {
    objectId = new ObjectId(slotId);
  } catch {
    objectId = null;
  }

  const filter = objectId ? { slotId: objectId } : { slotId };

  const bookings = await db.collection("bookings").find(filter).sort({ bookedAt: -1 }).toArray();

  const initialBookings = bookings.map((booking) => ({
    id: booking._id?.toString() ?? "",
    customerName: booking.customerName ?? "Anonymous",
    customerEmail: booking.customerEmail ?? "",
    bookedAt: booking.bookedAt?.toISOString?.() ?? new Date().toISOString(),
    status: booking.status,
  }));

  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-300/80">Admin / Slot Bookings</p>
          <h1 className="text-2xl font-semibold text-white">Bookings for slot</h1>
        </div>
        <Link href="/admin/slots" className={`${buttonClassName("secondary")} inline-flex`}>
          Back to slots
        </Link>
      </div>

      <AdminSlotBookings initialBookings={initialBookings} />
    </section>
  );
}
