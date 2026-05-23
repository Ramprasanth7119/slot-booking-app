import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "success" | "danger" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const badgeStyles: Record<BadgeTone, string> = {
  neutral: "border-white/10 bg-white/[0.05] text-zinc-200",
  success: "border-emerald-400/20 bg-emerald-400/12 text-emerald-300",
  danger: "border-rose-400/20 bg-rose-400/12 text-rose-300",
  warning: "border-amber-400/20 bg-amber-400/12 text-amber-300",
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${badgeStyles[tone]} ${className}`.trim()}
      {...props}
    />
  );
}