import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProperty, fetchSimilarProperties } from "@/lib/server-api";
import { formatDate, formatPrice, resolveImageUrl } from "@/lib/format";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/types";
import { ImageGallery } from "@/components/ImageGallery";
import { InquiryForm } from "@/components/InquiryForm";
import { OwnerActions } from "@/components/OwnerActions";
import { SimilarProperties } from "@/components/SimilarProperties";

interface PageProps {
  params: Promise<{ id: string }>;
}

// No generateStaticParams: with 50,000+ properties, pre-rendering every page
// at build time doesn't scale. Instead each page renders on first visit and
// is cached for `revalidate` seconds (see fetchProperty/fetchSimilarProperties
// in lib/server-api.ts) — the standard ISR pattern for large dynamic catalogs.

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);
  if (!property) return { title: "Property not found" };

  const description = `${PROPERTY_TYPE_LABELS[property.propertyType]} ${LISTING_TYPE_LABELS[property.listingType].toLowerCase()} in ${property.locality}, ${property.city} — ${formatPrice(property.price, property.listingType)}. ${property.areaSqft} sqft${property.bedrooms ? `, ${property.bedrooms} BHK` : ""}.`;
  const image = property.images[0]?.url ? resolveImageUrl(property.images[0].url) : undefined;

  return {
    title: property.title,
    description,
    alternates: { canonical: `/properties/${property.id}` },
    openGraph: {
      title: property.title,
      description,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [property, similar] = await Promise.all([fetchProperty(id), fetchSimilarProperties(id)]);

  if (!property) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description: property.description,
    image: property.images.map((img) => resolveImageUrl(img.url)),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "INR",
      availability: property.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.pincode,
      addressCountry: "IN",
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImageGallery images={property.images} title={property.title} />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
              <p className="mt-1 text-slate-500">
                {property.address}, {property.locality}, {property.city}, {property.state} {property.pincode}
              </p>
            </div>
            <OwnerActions propertyId={property.id} ownerId={property.ownerId} />
          </div>

          <p className="mt-3 text-2xl font-bold text-teal-700">{formatPrice(property.price, property.listingType)}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-4">
            <Stat label="Type" value={PROPERTY_TYPE_LABELS[property.propertyType]} />
            <Stat label="Listing" value={LISTING_TYPE_LABELS[property.listingType]} />
            <Stat label="Area" value={`${property.areaSqft} sqft`} />
            {property.bedrooms != null && <Stat label="Bedrooms" value={String(property.bedrooms)} />}
            {property.bathrooms != null && <Stat label="Bathrooms" value={String(property.bathrooms)} />}
            <Stat label="Posted" value={formatDate(property.createdAt)} />
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{property.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {property.owner && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Listed by</h3>
              <p className="mt-1 text-sm text-slate-600">{property.owner.name}</p>
              {property.owner.phone && <p className="text-sm text-slate-500">{property.owner.phone}</p>}
            </div>
          )}
          <InquiryForm propertyId={property.id} />
        </div>
      </div>

      <SimilarProperties properties={similar} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
