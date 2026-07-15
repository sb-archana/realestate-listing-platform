"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

export function OwnerActions({ propertyId, ownerId }: { propertyId: string; ownerId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!user || user.id !== ownerId) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiClient.del(`/api/properties/${propertyId}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Failed to delete listing. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Link
        href={`/properties/${propertyId}/edit`}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
