import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as propertiesService from "./properties.service";
import type { SearchQueryInput } from "./properties.schema";

export const listPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await propertiesService.listProperties(req.query as unknown as SearchQueryInput);
  res.json(result);
});

export const getPropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertiesService.getPropertyById(req.params.id);
  res.json({ data: property });
});

export const getSimilarPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertiesService.getPropertyById(req.params.id);
  const similar = await propertiesService.getSimilarProperties(property);
  res.json({ data: similar });
});

export const createPropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const property = await propertiesService.createProperty(req.user!.id, req.body, files);
  res.status(201).json({ data: property });
});

export const updatePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const property = await propertiesService.updateProperty(req.property!, req.body, files);
  res.json({ data: property });
});

export const deletePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  await propertiesService.deleteProperty(req.property!);
  res.status(204).send();
});
