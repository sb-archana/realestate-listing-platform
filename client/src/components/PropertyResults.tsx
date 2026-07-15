"use client";

import { useState, useTransition } from "react";
import { PropertyCard } from "./PropertyCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { apiUrl } from "@/lib/api";
import type { PaginatedProperties, Property, SearchParams } from "@/lib/types";

export function PropertyResults({ initialData, query }: { initialData: PaginatedProperties; query: SearchParams }) {
  const [properties, setProperties] = useState<Property[]>(initialData.data);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    if (!nextCursor) return;
    setError(null);
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        Object.entries({ ...query, cursor: nextCursor }).forEach(([key, value]) => {
          if (value !== undefined && value !== "") params.set(key, String(value));
        });
        const res = await fetch(apiUrl(`/api/properties?${params.toString()}`));
        if (!res.ok) throw new Error("Failed to load more properties");
        const data: PaginatedProperties = await res.json();
        setProperties((prev) => [...prev, ...data.data]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError("Could not load more listings.");
      }
    });
  };

  if (properties.length === 0) {
    return (
      <EmptyState title="No properties match your filters" description="Try widening your search or clearing some filters." />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} onRetry={loadMore} />
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="rounded-lg border border-teal-600 px-6 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
