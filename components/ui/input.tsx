import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-200 ease-out placeholder:text-zinc-500 focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    />
  );
}