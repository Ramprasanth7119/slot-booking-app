"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

const storageKey = "slotbook-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.body.dataset.theme = theme;
}

function getThemeFromDocument(): ThemeMode | null {
  if (typeof document === "undefined") {
    return null;
  }

  const domTheme = document.documentElement.dataset.theme;

  if (domTheme === "dark" || domTheme === "light") {
    return domTheme;
  }

  return null;
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  syncFromDocument: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = get().theme === "dark" ? "light" : "dark";
        get().setTheme(nextTheme);
      },
      syncFromDocument: () => {
        const nextTheme = getThemeFromDocument() ?? getSystemTheme();
        applyTheme(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: storageKey,
      storage: createJSONStorage(() => localStorage),
    }
  )
);