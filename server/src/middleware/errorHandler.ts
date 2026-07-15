import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: "ROUTE_NOT_FOUND" } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: { message: "A record with this value already exists", code: "DUPLICATE" } });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { message: "Record not found", code: "NOT_FOUND" } });
    }
  }

  console.error(err);
  res.status(500).json({
    error: {
      message: env.NODE_ENV === "production" ? "Internal server error" : (err as Error)?.message ?? "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
}
