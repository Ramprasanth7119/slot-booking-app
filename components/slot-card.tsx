import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SlotStatus = "Available" | "Full" | "Expired";

type SlotCardProps = {
  title: string;
  description: string;
  timeRange: string;
  timezone: string;
  bookedCount: number;
  capacity: number;
  status: SlotStatus;
};

export function SlotCard({ title, description, timeRange, timezone, bookedCount, capacity, status }: SlotCardProps) {
  const isUnavailable = status !== "Available";
  const actionLabel = status === "Expired" ? "Expired" : status === "Full" ? "Full" : "Book Now";
  const badgeTone = status === "Expired" ? "warning" : status === "Full" ? "danger" : "success";

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_20px_52px_rgba(0,0,0,0.28)] ${isUnavailable ? "opacity-90" : ""}`.trim()}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.35),transparent)] opacity-80" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.28em] text-zinc-500">Time Slot</p>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{title}</h3>
        </div>
        <Badge tone={badgeTone}>{status}</Badge>
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-200">{timeRange}</p>
      <p className="mt-2 text-sm leading-7 text-zinc-400">{description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{timezone}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
          {bookedCount}/{capacity} booked
        </span>
      </div>

      <Button className="mt-6 w-full rounded-2xl transition-transform duration-200 active:scale-95" disabled={isUnavailable}>
        {actionLabel}
      </Button>
    </article>
  );
}