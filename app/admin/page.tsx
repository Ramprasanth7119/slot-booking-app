import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-300/80">Admin</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Slot Management</h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
          Create, manage, and monitor your booking slots in a dedicated admin surface.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
          <h2 className="text-lg font-semibold text-white">Create New Slot</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Add a new time slot with venue, conductor, capacity, timing, and timezone.</p>
          <Link href="/admin/create-slot" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            Create Slot
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
          <h2 className="text-lg font-semibold text-white">Manage Slots</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Update slot details, archive or remove slots, and inspect live availability.</p>
          <Link href="/admin/slots" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            Open Slot Manager
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
          <h2 className="text-lg font-semibold text-white">Manage Bookings</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Review customer reservations and manage booking cancellations.</p>
          <Link href="/admin/bookings" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            View Bookings
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
          <h2 className="text-lg font-semibold text-white">Manage People</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Monitor booking holders, reschedules, and attendance across all slots.</p>
          <Link href="/admin/bookings" className={`${buttonClassName("primary")} mt-4 inline-flex`}>
            Open People View
          </Link>
        </article>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm font-medium text-white">Management overview</p>
        <p className="mt-2 text-sm leading-7 text-zinc-400">
          Slot CRUD, archive controls, booking management, and venue/conductor metadata are available from the dashboard and slot manager.
        </p>
      </div>
    </section>
  );
}
