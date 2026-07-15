"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/types";

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (listingType) params.set("listingType", listingType);
    if (propertyType) params.set("propertyType", propertyType);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="text-xs font-semibold text-slate-600">City</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search by city, e.g. Bangalore"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Looking to</label>
        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Buy or Rent</option>
          {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Type</label>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Any type</option>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700">
        Search
      </button>
    </form>
  );
}
