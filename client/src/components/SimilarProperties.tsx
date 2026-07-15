import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/lib/types";

export function SimilarProperties({ properties }: { properties: Property[] }) {
  if (properties.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Similar properties</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
