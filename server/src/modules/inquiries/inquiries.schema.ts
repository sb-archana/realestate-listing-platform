import { z } from "zod";

export const createInquirySchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional(),
  message: z.string().trim().min(5).max(1000),
  // Honeypot: a hidden field real users never fill in; bots typically do.
  // Deliberately not constrained to empty-string here — the service layer
  // decides what to do with it (silently no-op) so a filled honeypot doesn't
  // tip the bot off with a validation error.
  website: z.string().optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
