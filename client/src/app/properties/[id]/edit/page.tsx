import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProperty } from "@/lib/server-api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OwnershipGuard } from "@/components/OwnershipGuard";
import { PropertyForm } from "@/components/PropertyForm";

export const metadata: Metadata = {
  title: "Edit listing",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { id } = await params;
  const property = await fetchProperty(id);
  if (!property) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit listing</h1>
      <ProtectedRoute>
        <OwnershipGuard ownerId={property.ownerId}>
          <PropertyForm mode="edit" initial={property} />
        </OwnershipGuard>
      </ProtectedRoute>
    </div>
  );
}
