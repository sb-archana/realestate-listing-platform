import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as usersService from "./users.service";

export const getMyPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const properties = await usersService.getMyProperties(req.user!.id);
  res.json({ data: properties });
});
