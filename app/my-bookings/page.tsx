import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

export default function MyBookingsPage() {
  return (
    <section className="mx-auto max-w-3xl py-8 sm:py-12">
      <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-300/80">My Bookings</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your upcoming bookings</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
        This screen is reserved for the customer booking experience. The UI is ready, while the booking data and account logic will come in a later phase.
      </p>

      <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-zinc-200">
            Empty state ready
          </div>
          <h2 className="text-xl font-semibold text-white">No bookings yet</h2>
          <p className="text-sm leading-6 text-zinc-400">
            When booking data is connected, this area will show confirmed appointments, reminders, and quick actions.
          </p>
          <Link href="/" className={`${buttonClassName("primary")} inline-flex`}>
            Browse slots
          </Link>
        </div>
      </div>
    </section>
  );
}