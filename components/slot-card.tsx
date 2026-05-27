import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type SlotStatus = "Available" | "Full" | "Expired" | "Archived";

type SlotCardProps = {
  title: string;
  description: string;
  venueName: string;
  conductorName: string;
  timeRange: string;
  timezone: string;
  bookedCount: number;
  capacity: number;
  status: SlotStatus;
  id?: string;
};

export function SlotCard({ 
  title, 
  description, 
  venueName,
  conductorName,
  timeRange, 
  timezone, 
  bookedCount, 
  capacity, 
  status, 
  id 
}: SlotCardProps) {
  const isUnavailable = status !== "Available";
  const remaining = Math.max(0, capacity - bookedCount);
  const percentageFull = Math.round((bookedCount / capacity) * 100);

  const badgeTone = status === "Archived" ? "neutral" : status === "Expired" ? "warning" : status === "Full" ? "danger" : "success";

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_20px_52px_rgba(0,0,0,0.28)] ${isUnavailable ? "opacity-90" : ""}`.trim()}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.35),transparent)] opacity-80" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[0.7rem] uppercase tracking-[0.28em] text-zinc-500">Time Slot</p>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{title}</h3>
        </div>
        <Badge tone={badgeTone}>{status}</Badge>
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-200">{timeRange}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">{venueName} · {conductorName}</p>
      <p className="mt-2 text-sm leading-7 text-zinc-400 line-clamp-2">{description}</p>

      <div className="mt-auto pt-4 space-y-3">
        {/* Capacity Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Capacity</span>
            <span>{bookedCount}/{capacity} booked</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                status === "Available"
                  ? "bg-emerald-500/70"
                  : status === "Full"
                  ? "bg-rose-500/70"
                  : status === "Archived"
                  ? "bg-zinc-500/70"
                  : "bg-amber-500/70"
              }`}
              style={{ width: `${percentageFull}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{timezone}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            {remaining} spot{remaining !== 1 ? 's' : ''} left
          </span>
        </div>
      </div>

      {id && !isUnavailable ? (
        <Link href={`/book/${id}`} className="mt-6 block w-full">
          <Button className="w-full rounded-2xl transition-transform duration-200 active:scale-95">
            Book Now
          </Button>
        </Link>
      ) : (
        <Button 
          className="mt-6 w-full rounded-2xl transition-transform duration-200 active:scale-95" 
          disabled={isUnavailable}
        >
          {status === "Archived" ? "Archived" : status === "Expired" ? "Expired" : status === "Full" ? "Full" : "Book Now"}
        </Button>
      )}
    </article>
  );
}