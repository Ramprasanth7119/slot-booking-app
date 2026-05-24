import { MyBookingsClient } from "@/components/my-bookings";

export default function MyBookingsPage() {
  return (
    <section className="py-10">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">My Bookings</h1>
        <p className="text-sm text-zinc-400">Enter your email to view and manage your bookings.</p>
      </div>

      <div className="mt-6">
        <MyBookingsClient />
      </div>
    </section>
  );
}
