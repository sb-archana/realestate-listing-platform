import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      property?: NonNullable<Awaited<ReturnType<typeof prisma.property.findUnique>>>;
    }
  }
}

/**
 * Loads the property named by req.params.id once, 404s if missing, 403s if the
 * authenticated user doesn't own it, and attaches it to req.property so the
 * controller doesn't need to re-fetch it.
 */
export const loadPropertyAndCheckOwnership = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!property) {
    throw AppError.notFound("Property not found");
  }
  if (property.ownerId !== req.user?.id) {
    throw AppError.forbidden("You do not own this property");
  }
  req.property = property;
  next();
});
