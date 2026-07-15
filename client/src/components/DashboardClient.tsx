"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { formatPrice, formatDate, resolveImageUrl } from "@/lib/format";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { PropertyGridSkeleton } from "./Skeletons";
import type { Inquiry, Property } from "@/lib/types";

export function DashboardClient() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Record<string, Inquiry[]>>({});
  const [leadsLoading, setLeadsLoading] = useState<string | null>(null);

  const fetchMyProperties = () => apiClient.get<{ data: Property[] }>("/api/users/me/properties").then((res) => res.data);

  useEffect(() => {
    let cancelled = false;
    fetchMyProperties()
      .then((data) => {
        if (!cancelled) setProperties(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load your listings.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    setError(null);
    setProperties(null);
    fetchMyProperties()
      .then(setProperties)
      .catch(() => setError("Failed to load your listings."));
  };

  const toggleLeads = async (propertyId: string) => {
    if (expandedId === propertyId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(propertyId);
    if (!leads[propertyId]) {
      setLeadsLoading(propertyId);
      try {
        const res = await apiClient.get<{ data: Inquiry[] }>(`/api/properties/${propertyId}/inquiries`);
        setLeads((prev) => ({ ...prev, [propertyId]: res.data }));
      } catch {
        setLeads((prev) => ({ ...prev, [propertyId]: [] }));
      } finally {
        setLeadsLoading(null);
      }
    }
  };

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!properties) return <PropertyGridSkeleton count={4} />;

  if (properties.length === 0) {
    return (
      <EmptyState
        title="You haven't listed any properties yet"
        description="Create your first listing to start receiving inquiries."
        action={
          <Link href="/properties/new" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
            Add a listing
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {properties.map((property) => {
        const primaryImage = property.images.find((img) => img.isPrimary) ?? property.images[0];
        const isExpanded = expandedId === property.id;
        return (
          <div key={property.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {primaryImage && (
                  <Image src={resolveImageUrl(primaryImage.url)} alt={property.title} fill sizes="112px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/properties/${property.id}`} className="font-semibold text-slate-900 hover:text-teal-700">
                  {property.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {property.city} · {formatPrice(property.price, property.listingType)} · {property.status}
                </p>
                <p className="text-xs text-slate-400">Posted {formatDate(property.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLeads(property.id)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Leads ({property._count?.inquiries ?? 0})
                </button>
                <Link
                  href={`/properties/${property.id}/edit`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Edit
                </Link>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {leadsLoading === property.id ? (
                  <p className="text-sm text-slate-400">Loading leads…</p>
                ) : leads[property.id]?.length ? (
                  <ul className="flex flex-col gap-3">
                    {leads[property.id].map((lead) => (
                      <li key={lead.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-800">
                          {lead.name} · {lead.email}
                          {lead.phone ? ` · ${lead.phone}` : ""}
                        </p>
                        <p className="mt-1 text-slate-600">{lead.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(lead.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No inquiries yet.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
