import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

const ownerPanels = [
  {
    title: "Availability calendar",
    text: "Plan daily time windows and keep future booking controls in one place.",
  },
  {
    title: "Booking insights",
    text: "Track capacity, fill rate, and demand once analytics data is added.",
  },
];

export default function OwnerPage() {
  return (
    <section className="space-y-8 py-8 sm:py-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-300/80">Owner</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Owner workspace foundation</h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
          A minimal shell for slot management, structured now so future admin and scheduling features can slot in without a redesign.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {ownerPanels.map((panel) => (
          <article
            key={panel.title}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">{panel.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{panel.text}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Ready for the next phase</p>
            <p className="mt-1 text-sm text-zinc-400">
              This page will later hold calendar, slot creation, and booking management tools.
            </p>
          </div>
          <Link href="/" className={`${buttonClassName("secondary")} inline-flex`}>
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}