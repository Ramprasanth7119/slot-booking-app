// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { AppProviders } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlotBook",
  description: "A clean UI foundation for a modern slot booking system.",
  icons: {
    icon: "/booking.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => { try { const key = 'slotbook-theme'; const saved = localStorage.getItem(key); const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; const theme = saved === 'light' || saved === 'dark' ? saved : preferred; document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; } catch (e) { document.documentElement.dataset.theme = 'dark'; document.documentElement.style.colorScheme = 'dark'; } })();`}
        </Script>
      </head>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>
          <div className="fixed right-4 top-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
