class AppError extends Error {
  constructor(message, exitCode, cause) {
    super(message);
    this.name = "AppError";
    this.exitCode = exitCode;
    this.cause = cause;
  }
}

module.exports = { AppError };
