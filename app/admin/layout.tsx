"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthorized(false);
    setPin("");
    setError(null);
  }

  function handleLeaveToPublic() {
    // clear auth so returning via history requires re-auth
    void fetch("/api/auth/logout", { method: "POST" });
    setIsAuthorized(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await response.json()) as { authenticated?: boolean };
        if (!isMounted) return;
        setIsAuthorized(Boolean(data.authenticated));
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    void checkSession();

    function onPageShow() {
      void checkSession();
    }

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPageShow);

    return () => {
      isMounted = false;
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPageShow);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
        credentials: "include",
      });

      const data = (await response.json()) as { success?: boolean };

      if (!response.ok || !data.success) {
        setError("Invalid PIN. Please try again.");
        return;
      }

      setIsAuthorized(true);
      setPin("");
    } catch {
      setError("Unable to verify PIN right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="relative min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center justify-center">
          <div className="w-full rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-300/80">Admin access</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Checking access</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">Loading the secure admin workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center justify-center">
          <div className="w-full rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-300/80">Admin access</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Enter PIN to continue</h1>
              <p className="text-sm leading-7 text-zinc-400">The admin area is protected with a lightweight demo PIN.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-200">PIN</span>
                <Input
                  inputMode="numeric"
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="Enter admin PIN"
                  autoComplete="one-time-code"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Continue"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.16),transparent_28%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1520px] flex-col gap-6">
        <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-5">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-sky-300/80">Admin area</p>
            <p className="mt-1 text-sm text-zinc-300">Protected slot management workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { handleLeaveToPublic(); void router.push("/"); }} className={`${buttonClassName("ghost")} inline-flex h-10 px-4`}>
              Public site
            </button>
            <div className="mr-24 flex items-center">
              <button type="button" onClick={() => { void handleLogout(); }} className={`${buttonClassName("secondary")} inline-flex h-10 px-4`}>
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
