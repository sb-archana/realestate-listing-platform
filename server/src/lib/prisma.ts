import { PrismaClient } from "@prisma/client";

// Singleton to avoid exhausting Postgres connections across hot reloads / requests.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
