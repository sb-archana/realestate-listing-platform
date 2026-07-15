import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { loadPropertyAndCheckOwnership } from "../../middleware/ownership";
import { validate } from "../../middleware/validate";
import { inquiryLimiter } from "../../middleware/rateLimiter";
import { createInquirySchema } from "./inquiries.schema";
import * as inquiriesController from "./inquiries.controller";

const router = Router();

router.post("/", inquiryLimiter, validate({ body: createInquirySchema }), inquiriesController.createInquiryHandler);

export default router;

// Mounted under /api/properties/:id/inquiries — owner-only view of leads for their listing.
export const nestedInquiryRouter = Router({ mergeParams: true });
nestedInquiryRouter.get("/", authenticate, loadPropertyAndCheckOwnership, inquiriesController.getLeadsForPropertyHandler);
