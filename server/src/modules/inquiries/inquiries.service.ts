import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { CreateInquiryInput } from "./inquiries.schema";

const DUPLICATE_WINDOW_HOURS = 24;

export async function createInquiry(input: CreateInquiryInput, ipAddress: string | undefined) {
  const { website, ...data } = input;

  // Honeypot tripped: silently pretend success so the bot doesn't learn anything, without inserting a row.
  if (website) {
    return { id: "ignored", propertyId: data.propertyId, name: data.name, email: data.email, phone: data.phone ?? null, message: data.message, createdAt: new Date() };
  }

  const property = await prisma.property.findUnique({ where: { id: data.propertyId }, select: { id: true } });
  if (!property) {
    throw AppError.notFound("Property not found");
  }

  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);
  const duplicate = await prisma.inquiry.findFirst({
    where: { propertyId: data.propertyId, email: data.email, createdAt: { gte: since } },
    select: { id: true },
  });
  if (duplicate) {
    throw AppError.conflict("You already sent an inquiry for this property recently", "DUPLICATE_INQUIRY");
  }

  return prisma.inquiry.create({ data: { ...data, ipAddress } });
}

export async function getLeadsForProperty(propertyId: string) {
  return prisma.inquiry.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" } });
}
