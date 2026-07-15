"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/types";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const debouncedCity = useDebouncedValue(city, 500);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("cursor");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    const current = searchParams.get("city") ?? "";
    if (debouncedCity !== current) {
      updateParam("city", debouncedCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCity]);

  const propertyType = searchParams.get("propertyType") ?? "";
  const listingType = searchParams.get("listingType") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const bedrooms = searchParams.get("bedrooms") ?? "";

  const clearAll = () => {
    setCity("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label className="text-xs font-semibold text-slate-600">City</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Mumbai"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600">Listing Type</label>
        <select
          value={listingType}
          onChange={(e) => updateParam("listingType", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Any</option>
          {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600">Property Type</label>
        <select
          value={propertyType}
          onChange={(e) => updateParam("propertyType", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Any</option>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600">Bedrooms</label>
        <select
          value={bedrooms}
          onChange={(e) => updateParam("bedrooms", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} BHK
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-slate-600">Min Price</label>
          <input
            type="number"
            defaultValue={minPrice}
            onBlur={(e) => updateParam("minPrice", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Max Price</label>
          <input
            type="number"
            defaultValue={maxPrice}
            onBlur={(e) => updateParam("maxPrice", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button onClick={clearAll} className="self-start text-sm font-medium text-teal-700 hover:underline">
        Clear all filters
      </button>
    </div>
  );
}
