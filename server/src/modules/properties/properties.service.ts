import fs from "node:fs/promises";
import path from "node:path";
import { Prisma, type Property } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import { encodeCursor, decodeCursor } from "./cursor";
import type { CreatePropertyInput, SearchQueryInput, UpdatePropertyInput } from "./properties.schema";

const DETAIL_INCLUDE = {
  images: { orderBy: { sortOrder: "asc" as const } },
  owner: { select: { id: true, name: true, phone: true, email: true } },
};

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

function sortSpec(sort: SearchQueryInput["sort"]): { column: '"price"' | '"createdAt"'; direction: "ASC" | "DESC" } {
  switch (sort) {
    case "oldest":
      return { column: '"createdAt"', direction: "ASC" };
    case "price_asc":
      return { column: '"price"', direction: "ASC" };
    case "price_desc":
      return { column: '"price"', direction: "DESC" };
    case "newest":
    default:
      return { column: '"createdAt"', direction: "DESC" };
  }
}

export async function listProperties(query: SearchQueryInput) {
  const { column, direction } = sortSpec(query.sort);
  const limit = query.limit;

  const filters: Prisma.Sql[] = [Prisma.sql`"status" = 'ACTIVE'`];

  if (query.city) filters.push(Prisma.sql`"city" ILIKE ${"%" + query.city + "%"}`);
  if (query.propertyType) filters.push(Prisma.sql`"propertyType" = ${query.propertyType}::"PropertyType"`);
  if (query.listingType) filters.push(Prisma.sql`"listingType" = ${query.listingType}::"ListingType"`);
  if (query.minPrice !== undefined) filters.push(Prisma.sql`"price" >= ${query.minPrice}`);
  if (query.maxPrice !== undefined) filters.push(Prisma.sql`"price" <= ${query.maxPrice}`);
  if (query.bedrooms !== undefined) filters.push(Prisma.sql`"bedrooms" = ${query.bedrooms}`);

  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      const cursorValue = column === '"price"' ? new Prisma.Decimal(decoded.sortValue) : new Date(decoded.sortValue);
      const op = direction === "DESC" ? Prisma.sql`<` : Prisma.sql`>`;
      // Expanded keyset condition rather than a row-constructor comparison
      // ("(a,b) < (x,y)"): Postgres can't always resolve parameter types
      // through a row constructor over the extended/parameterized query
      // protocol, which silently produced a no-op filter. This form binds
      // each parameter against a single typed column, so inference is
      // unambiguous.
      const colRaw = Prisma.raw(column);
      filters.push(
        Prisma.sql`(${colRaw} ${op} ${cursorValue} OR (${colRaw} = ${cursorValue} AND "id" ${op} ${decoded.id}))`
      );
    }
  }

  const whereClause = Prisma.join(filters, " AND ");
  const orderClause = Prisma.raw(`${column} ${direction}, "id" ${direction}`);

  // Keyset (cursor) query: index range scan via idx_status_created_id / idx_status_price_id,
  // no OFFSET, so cost stays flat regardless of how deep the page is.
  const idRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "properties"
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT ${limit + 1}
  `);

  const hasMore = idRows.length > limit;
  const pageIds = idRows.slice(0, limit).map((r) => r.id);

  const properties = await prisma.property.findMany({
    where: { id: { in: pageIds } },
    include: DETAIL_INCLUDE,
  });
  const byId = new Map(properties.map((p) => [p.id, p]));
  const ordered = pageIds.map((id) => byId.get(id)!).filter(Boolean);

  let nextCursor: string | null = null;
  if (hasMore && ordered.length > 0) {
    const last = ordered[ordered.length - 1];
    const sortValue = column === '"price"' ? last.price.toString() : last.createdAt.toISOString();
    nextCursor = encodeCursor({ sortValue, id: last.id });
  }

  return { data: ordered, nextCursor, hasMore };
}

export async function getPropertyById(id: string) {
  const property = await prisma.property.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!property) throw AppError.notFound("Property not found");
  return property;
}

/**
 * Same city + same property type, price within +-20%, ordered by closeness of
 * price then bedrooms. Deliberately a simple, explainable, index-backed query
 * (reuses idx_city_type_price) rather than a collaborative-filtering/ML
 * approach, which would need interaction history this app doesn't collect.
 */
export async function getSimilarProperties(property: Property, limit = 6) {
  const priceNum = Number(property.price);
  const minPrice = priceNum * 0.8;
  const maxPrice = priceNum * 1.2;

  return prisma.$queryRaw<Property[]>(Prisma.sql`
    SELECT * FROM "properties"
    WHERE "status" = 'ACTIVE'
      AND "id" != ${property.id}
      AND "city" = ${property.city}
      AND "propertyType" = ${property.propertyType}::"PropertyType"
      AND "price" BETWEEN ${minPrice} AND ${maxPrice}
    ORDER BY ABS("price" - ${priceNum}) ASC, ABS(COALESCE("bedrooms", 0) - ${property.bedrooms ?? 0}) ASC
    LIMIT ${limit}
  `).then(async (rows) => {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const withImages = await prisma.property.findMany({
      where: { id: { in: ids } },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    const byId = new Map(withImages.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)!).filter(Boolean);
  });
}

function toImageUrl(filename: string) {
  return `/uploads/${filename}`;
}

export async function createProperty(ownerId: string, input: CreatePropertyInput, files: Express.Multer.File[]) {
  return prisma.property.create({
    data: {
      ...input,
      ownerId,
      images: {
        create: files.map((file, index) => ({
          url: toImageUrl(file.filename),
          isPrimary: index === 0,
          sortOrder: index,
        })),
      },
    },
    include: DETAIL_INCLUDE,
  });
}

export async function updateProperty(property: Property, input: UpdatePropertyInput, files: Express.Multer.File[]) {
  const { removeImageIds, ...fields } = input;

  if (removeImageIds && removeImageIds.length > 0) {
    const imagesToRemove = await prisma.propertyImage.findMany({
      where: { id: { in: removeImageIds }, propertyId: property.id },
    });
    await prisma.propertyImage.deleteMany({ where: { id: { in: removeImageIds }, propertyId: property.id } });
    await Promise.all(
      imagesToRemove.map((img) => fs.unlink(path.join(uploadRoot, path.basename(img.url))).catch(() => undefined))
    );
  }

  const existingImageCount = await prisma.propertyImage.count({ where: { propertyId: property.id } });

  return prisma.property.update({
    where: { id: property.id },
    data: {
      ...fields,
      images:
        files.length > 0
          ? {
              create: files.map((file, index) => ({
                url: toImageUrl(file.filename),
                isPrimary: existingImageCount === 0 && index === 0,
                sortOrder: existingImageCount + index,
              })),
            }
          : undefined,
    },
    include: DETAIL_INCLUDE,
  });
}

export async function deleteProperty(property: Property) {
  const images = await prisma.propertyImage.findMany({ where: { propertyId: property.id } });
  await prisma.property.delete({ where: { id: property.id } });
  await Promise.all(
    images.map((img) => fs.unlink(path.join(uploadRoot, path.basename(img.url))).catch(() => undefined))
  );
}
