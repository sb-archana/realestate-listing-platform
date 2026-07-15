import type { Metadata } from "next";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardClient } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "My Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
        <Link href="/properties/new" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          Add Listing
        </Link>
      </div>
      <ProtectedRoute>
        <DashboardClient />
      </ProtectedRoute>
    </div>
  );
}
