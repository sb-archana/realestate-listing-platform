import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as inquiriesService from "./inquiries.service";

export const createInquiryHandler = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await inquiriesService.createInquiry(req.body, req.ip);
  res.status(201).json({ data: inquiry });
});

export const getLeadsForPropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const leads = await inquiriesService.getLeadsForProperty(req.property!.id);
  res.json({ data: leads });
});
