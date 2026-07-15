import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { fetchProperties } from "@/lib/server-api";

export default async function Home() {
  const featured = await fetchProperties({ sort: "newest", limit: 8 }).catch(() => ({ data: [], nextCursor: null, hasMore: false }));

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-gradient-to-b from-teal-700 to-teal-600 px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Find your next home, faster.</h1>
        <p className="mx-auto mt-3 max-w-xl text-teal-50">
          Search apartments, villas, plots and commercial properties for sale and rent across India.
        </p>
        <div className="mt-8">
          <HeroSearch />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Newest listings</h2>
          <Link href="/properties" className="text-sm font-medium text-teal-700 hover:underline">
            View all →
          </Link>
        </div>

        {featured.data.length === 0 ? (
          <EmptyState title="No listings yet" description="Be the first to add a property." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
