import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Validates and replaces req.body/query/params with the parsed (and coerced) values. */
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: { message: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() } });
      }
      req.body = result.data;
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: { message: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() } });
      }
      req.query = result.data as unknown as Request["query"];
    }
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({ error: { message: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() } });
      }
      req.params = result.data as unknown as Request["params"];
    }
    next();
  };
}
