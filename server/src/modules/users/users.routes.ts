import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as usersController from "./users.controller";

const router = Router();

router.get("/me/properties", authenticate, usersController.getMyPropertiesHandler);

export default router;
