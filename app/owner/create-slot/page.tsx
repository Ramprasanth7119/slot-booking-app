"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CreateSlotForm } from "@/components/create-slot-form";
import { buttonClassName } from "@/components/ui/button";

const OWNER_PIN_KEY = "owner-pin";

export default function CreateSlotPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const pin = window.sessionStorage.getItem(OWNER_PIN_KEY);
    const timer = window.setTimeout(() => {
      if (!pin) {
        router.push("/owner");
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <section className="space-y-8 py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="space-y-8 py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-rose-300">Redirecting to owner login...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-8 py-8 sm:py-12">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-300/80">Owner / Create Slot</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Create a new slot</h1>
            <p className="text-sm leading-7 text-zinc-400 sm:text-base">
              Define your availability by creating time slots. Set the capacity, duration, and timezone for each slot. Once created, slots appear immediately on the booking page.
            </p>
          </div>
          <Link href="/owner" className={`${buttonClassName("secondary")} inline-flex`}>
            Back to owner
          </Link>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
        <CreateSlotForm />
      </div>
    </section>
  );
}