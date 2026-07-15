import type { Metadata } from "next";
import { fetchProperties } from "@/lib/server-api";
import { FilterBar } from "@/components/FilterBar";
import { SortSelect } from "@/components/SortSelect";
import { PropertyResults } from "@/components/PropertyResults";
import type { SearchParams } from "@/lib/types";

export const metadata: Metadata = {
  title: "Browse Properties",
  description: "Search and filter property listings by city, type, budget and bedrooms.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchParams {
  const get = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]);
  return {
    city: get("city") || undefined,
    propertyType: (get("propertyType") as SearchParams["propertyType"]) || undefined,
    listingType: (get("listingType") as SearchParams["listingType"]) || undefined,
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
    bedrooms: get("bedrooms") ? Number(get("bedrooms")) : undefined,
    sort: (get("sort") as SearchParams["sort"]) || "newest",
    limit: 21,
  };
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = parseSearchParams(sp);
  const initialData = await fetchProperties(query);
  const queryKey = JSON.stringify(query);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Browse Properties</h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 lg:flex-shrink-0">
          <FilterBar />
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {initialData.hasMore ? "Showing top matches" : `${initialData.data.length} result(s)`}
            </p>
            <SortSelect />
          </div>
          <PropertyResults key={queryKey} initialData={initialData} query={query} />
        </div>
      </div>
    </div>
  );
}
