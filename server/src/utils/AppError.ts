export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(400, message, code);
  }
  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new AppError(401, message, code);
  }
  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new AppError(403, message, code);
  }
  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new AppError(404, message, code);
  }
  static conflict(message: string, code = "CONFLICT") {
    return new AppError(409, message, code);
  }
  static tooMany(message = "Too many requests", code = "RATE_LIMITED") {
    return new AppError(429, message, code);
  }
}
