// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ⚡️ UPDATED: Added the icons property here
export const metadata: Metadata = {
  title: "SlotBook",
  description: "A clean UI foundation for a modern slot booking system.",
  icons: {
    icon: "/booking.png", // Places a favicon in the /public folder
    // You can also add other formats if needed:
    // apple: "/apple-touch-icon.png", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1520px] flex-col px-4 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[radial-gradient(circle_at_18%_0%,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(168,85,247,0.16),transparent_26%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_26%)]" />
          <header className="sticky top-0 z-40 border-b border-white/8 bg-zinc-950/50 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-6 py-5">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white transition-opacity hover:opacity-90">
                SlotBook
              </Link>
              <nav className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 text-sm text-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <Link
                  href="/"
                  className="rounded-full px-4 py-2 transition-all duration-200 hover:bg-white/6 hover:text-white"
                >
                  Home
                </Link>
                <Link
                  href="/my-bookings"
                  className="rounded-full px-4 py-2 transition-all duration-200 hover:bg-white/6 hover:text-white"
                >
                  My Bookings
                </Link>
                <Link
                  href="/owner"
                  className="rounded-full px-4 py-2 transition-all duration-200 hover:bg-white/6 hover:text-white"
                >
                  Owner
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-white/8 py-6 text-sm text-zinc-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>SlotBook. Built as a clean booking foundation for Day 1.</p>
              <p>Minimal UI, scalable structure, ready for backend work later.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
