import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/types";
import { formatPrice, resolveImageUrl } from "@/lib/format";

export function PropertyCard({ property }: { property: Property }) {
  const primaryImage = property.images.find((img) => img.isPrimary) ?? property.images[0];

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {primaryImage ? (
          <Image
            src={resolveImageUrl(primaryImage.url)}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow">
          {LISTING_TYPE_LABELS[property.listingType]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-lg font-bold text-teal-700">{formatPrice(property.price, property.listingType)}</p>
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-800">{property.title}</h3>
        <p className="line-clamp-1 text-sm text-slate-500">
          {property.locality}, {property.city}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-slate-500">
          <span>{PROPERTY_TYPE_LABELS[property.propertyType]}</span>
          {property.bedrooms != null && <span>{property.bedrooms} BHK</span>}
          <span>{property.areaSqft} sqft</span>
        </div>
      </div>
    </Link>
  );
}
