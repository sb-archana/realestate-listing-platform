import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { loadPropertyAndCheckOwnership } from "../../middleware/ownership";
import { uploadPropertyImages } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import { createPropertySchema, updatePropertySchema, searchQuerySchema, idParamSchema } from "./properties.schema";
import * as propertiesController from "./properties.controller";
import { nestedInquiryRouter } from "../inquiries/inquiries.routes";

const router = Router();

router.get("/", validate({ query: searchQuerySchema }), propertiesController.listPropertiesHandler);

router.post(
  "/",
  authenticate,
  uploadPropertyImages,
  validate({ body: createPropertySchema }),
  propertiesController.createPropertyHandler
);

router.get("/:id", validate({ params: idParamSchema }), propertiesController.getPropertyHandler);

router.get("/:id/similar", validate({ params: idParamSchema }), propertiesController.getSimilarPropertiesHandler);

router.put(
  "/:id",
  validate({ params: idParamSchema }),
  authenticate,
  loadPropertyAndCheckOwnership,
  uploadPropertyImages,
  validate({ body: updatePropertySchema }),
  propertiesController.updatePropertyHandler
);

router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  authenticate,
  loadPropertyAndCheckOwnership,
  propertiesController.deletePropertyHandler
);

// Leads for a given property are owner-only, nested under /properties/:id/inquiries
router.use("/:id/inquiries", validate({ params: idParamSchema }), nestedInquiryRouter);

export default router;
