export class HttpException extends Error {
  statusCode;
  message;

  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;

    // Maintain proper prototype chain (important for instanceof checks)
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
