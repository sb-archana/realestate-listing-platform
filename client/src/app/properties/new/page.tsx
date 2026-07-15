import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PropertyForm } from "@/components/PropertyForm";

export const metadata: Metadata = {
  title: "Add a new listing",
};

export default function NewPropertyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Add a new listing</h1>
      <ProtectedRoute>
        <PropertyForm mode="create" />
      </ProtectedRoute>
    </div>
  );
}
