import { HttpStatus } from "./http-status.enum";

export class HttpError extends Error {
  constructor(readonly message: string, readonly status: HttpStatus) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(readonly message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class InternalServerError extends HttpError {
  constructor(readonly message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(readonly message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
