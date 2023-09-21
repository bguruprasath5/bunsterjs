import { HttpStatus } from "./http-status.enum";

export class HttpError extends Error {
  constructor(readonly message: string, readonly status: HttpStatus) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
