import { prisma } from "../../lib/prisma";

export async function getMyProperties(userId: string) {
  return prisma.property.findMany({
    where: { ownerId: userId },
    include: { images: { orderBy: { sortOrder: "asc" } }, _count: { select: { inquiries: true } } },
    orderBy: { createdAt: "desc" },
  });
}
