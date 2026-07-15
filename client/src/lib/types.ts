export type PropertyType = "APARTMENT" | "VILLA" | "INDEPENDENT_HOUSE" | "PLOT" | "COMMERCIAL" | "PG";
export type ListingType = "SALE" | "RENT";
export type PropertyStatusValue = "ACTIVE" | "INACTIVE" | "SOLD";
export type SortOption = "newest" | "oldest" | "price_asc" | "price_desc";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: string;
  areaSqft: number;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  address: string;
  status: PropertyStatusValue;
  ownerId: string;
  images: PropertyImage[];
  owner?: { id: string; name: string; phone: string | null; email: string };
  createdAt: string;
  updatedAt: string;
  _count?: { inquiries: number };
}

export interface Inquiry {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
}

export interface PaginatedProperties {
  data: Property[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SearchParams {
  city?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sort?: SortOption;
  cursor?: string;
  limit?: number;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  INDEPENDENT_HOUSE: "Independent House",
  PLOT: "Plot",
  COMMERCIAL: "Commercial",
  PG: "PG / Co-living",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: "For Sale",
  RENT: "For Rent",
};
