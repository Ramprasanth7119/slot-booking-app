"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/lib/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const syncFromDocument = useThemeStore((state) => state.syncFromDocument);

  useEffect(() => {
    syncFromDocument();
  }, [syncFromDocument]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "light"}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={`inline-flex h-12 cursor-pointer items-center gap-3 rounded-full border px-3 pr-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 ${
        theme === "dark"
          ? "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className={`flex h-7 w-12 items-center rounded-full border p-1 ${theme === "dark" ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-100"}`}>
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            theme === "dark" ? "translate-x-0" : "translate-x-5"
          }`}
        />
      </span>

      <span className="flex flex-col leading-none text-left">
        <span className={`text-[0.65rem] uppercase tracking-[0.28em] ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
          Theme
        </span>
        <span className="text-sm font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
      </span>
    </button>
  );
}