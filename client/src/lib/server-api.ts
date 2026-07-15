import { apiUrl } from "./api";
import type { PaginatedProperties, Property, SearchParams } from "./types";

// Used from Server Components only: fetches go straight from the Next.js
// server to the Express API (no browser round-trip), which is what lets the
// property detail and search pages render with real content for SEO/crawlers.

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  return sp.toString();
}

export async function fetchProperties(params: SearchParams): Promise<PaginatedProperties> {
  const qs = buildQuery(params as Record<string, string | number | undefined>);
  const res = await fetch(apiUrl(`/api/properties?${qs}`), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

export async function fetchProperty(id: string): Promise<Property | null> {
  const res = await fetch(apiUrl(`/api/properties/${id}`), { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch property");
  const json = await res.json();
  return json.data as Property;
}

export async function fetchSimilarProperties(id: string): Promise<Property[]> {
  const res = await fetch(apiUrl(`/api/properties/${id}/similar`), { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data as Property[];
}
