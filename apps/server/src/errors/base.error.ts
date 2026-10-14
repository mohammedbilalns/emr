import { ErrorMessages, HttpStatus } from "../config/constants";

export interface FieldIssue { path: string; message: string; }

export abstract class BaseError extends Error {
  public abstract readonly statusCode: number;
  public readonly details?: FieldIssue[];

  protected constructor(message: string, public readonly code: string, details?: FieldIssue[]) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace(this, new.target);
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  constructor(message = ErrorMessages.VALIDATION, details?: FieldIssue[]) {
    super(message, "VALIDATION_ERROR", details);
  }
}
export class UnauthorizedError extends BaseError {
  readonly statusCode = HttpStatus.UNAUTHORIZED;
  constructor(message = ErrorMessages.UNAUTHORIZED) { super(message, "UNAUTHORIZED"); }
}
export class ForbiddenError extends BaseError {
  readonly statusCode = HttpStatus.FORBIDDEN;
  constructor(message = ErrorMessages.FORBIDDEN) { super(message, "FORBIDDEN"); }
}
export class NotFoundError extends BaseError {
  readonly statusCode = HttpStatus.NOT_FOUND;
  constructor(message = ErrorMessages.NOT_FOUND) { super(message, "NOT_FOUND"); }
}
export class ConflictError extends BaseError {
  readonly statusCode = HttpStatus.CONFLICT;
  constructor(message = ErrorMessages.CONFLICT) { super(message, "CONFLICT"); }
}
export class UnprocessableError extends BaseError {
  readonly statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
  constructor(message: string) { super(message, "UNPROCESSABLE"); }
}

