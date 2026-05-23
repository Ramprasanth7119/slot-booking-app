import { headers } from "next/headers";
import Link from "next/link";

import { SlotCard } from "@/components/slot-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SlotResponse = {
  id: string;
  title: string;
  description: string;
  timeRange: string;
  timezone: string;
  bookedCount: number;
  capacity: number;
  status: "Available" | "Full" | "Expired";
};

async function getSlots(): Promise<SlotResponse[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/slots`, { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { slots?: SlotResponse[] };
    return data.slots ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const slots = await getSlots();

  return (
    <section className="space-y-16 py-10 sm:py-14 lg:py-20">
      <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(460px,0.95fr)] xl:gap-10">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-300/80">
            Slot booking foundation
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[4.35rem] lg:leading-[1.02]">
              Book Your Time Slots Instantly
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              A clean booking interface for customers and owners, built with a calm SaaS-style layout and ready for future booking workflows.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input placeholder="Search by service, host, or date" aria-label="Search slots" />
            <Button className="px-6">
              Search
            </Button>
          </div>
          <p className="mt-3 text-xs leading-6 text-zinc-500">Search UI only for Day 1. Booking logic comes later.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-zinc-200 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
          Today
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
          Live availability preview
        </span>
        <Link
          href="/owner"
          className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/5 hover:text-white"
        >
          Owner tools
        </Link>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">Available Slots</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-400">Live slot data fetched from the API and ordered by the next upcoming time.</p>
          </div>
          <p className="text-sm text-zinc-500">{slots.length} slots shown</p>
        </div>

        {slots.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                title={slot.title}
                description={slot.description}
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
    </section>
  );
}
