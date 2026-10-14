import type { NextFunction, Request, Response } from "express";
import  { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ErrorMessages, HttpStatus } from "../config/constants";
import { BaseError } from "../errors/base.error";
import logger from "../logging/logger";

const { MongoServerError } = mongoose.mongo;

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // 1. Domain errors 
  if (err instanceof BaseError) {
    err.statusCode < 500 ? logger.warn({ code: err.code }, err.message)
      : logger.error({ code: err.code }, err.message);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details?.length && { errors: err.details }),
    });
    return;
  }

  // Express body-parser http-errors style errors 
  if (err instanceof Error && "status" in err && typeof (err as { status?: number }).status === "number") {
    const status = (err as { status: number }).status;
    if (status >= 400 && status < 500) {
      res.status(status).json({ success: false, message: "Malformed request" });
      return;
    }
  }
  // 2. Zod safety net 
  if (err instanceof ZodError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: err.issues[0]?.message ?? ErrorMessages.VALIDATION,
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  // 3. JWT errors thrown from auth middleware
  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Session expired or invalid" });
    return;
  }

  // 4. Duplicate key 
  if (err instanceof MongoServerError && err.code === 11000) {
    const fields = Object.keys(err.keyValue ?? {}).join(", ");
    logger.warn({ keyValue: err.keyValue }, "Duplicate key");
    res.status(HttpStatus.CONFLICT).json({ success: false, message: `Duplicate value for: ${fields}` });
    return;
  }

  // 5. Invalid ObjectId in :params
  if (err instanceof mongoose.Error.CastError) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: `Invalid ${err.path}` });
    return;
  }

  // 6. Everything else 
  logger.error({ err }, "Unhandled error");
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: ErrorMessages.INTERNAL_SERVER_ERROR });
}
