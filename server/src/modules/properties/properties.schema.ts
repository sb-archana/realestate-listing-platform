import { z } from "zod";

export const propertyTypeEnum = z.enum(["APARTMENT", "VILLA", "INDEPENDENT_HOUSE", "PLOT", "COMMERCIAL", "PG"]);
export const listingTypeEnum = z.enum(["SALE", "RENT"]);
export const propertyStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SOLD"]);
export const sortEnum = z.enum(["newest", "oldest", "price_asc", "price_desc"]);

// Multipart/form-data always arrives as strings, hence z.coerce for numerics/enums-in-string form.
export const createPropertySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  propertyType: propertyTypeEnum,
  listingType: listingTypeEnum,
  price: z.coerce.number().positive().max(1_000_000_000),
  areaSqft: z.coerce.number().int().positive().max(1_000_000),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  city: z.string().trim().min(2).max(100),
  locality: z.string().trim().min(2).max(150),
  state: z.string().trim().min(2).max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{4,10}$/, "Invalid pincode"),
  address: z.string().trim().min(5).max(300),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: propertyStatusEnum.optional(),
  removeImageIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
});

export const searchQuerySchema = z.object({
  city: z.string().trim().min(1).max(100).optional(),
  propertyType: propertyTypeEnum.optional(),
  listingType: listingTypeEnum.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  sort: sortEnum.default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
