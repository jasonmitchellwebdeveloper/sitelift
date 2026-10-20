export type WordPressErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_INPUT"
  | "INVALID_URL"
  | "URL_NOT_ALLOWED"
  | "AUTH_FAILED"
  | "UPSTREAM_REJECTED"
  | "INVALID_RESPONSE"
  | "TIMEOUT"
  | "NETWORK_ERROR";

export class WordPressError extends Error {
  constructor(public readonly code: WordPressErrorCode) {
    // Never attach input, upstream bodies, or the original exception as a cause.
    super(code);
    this.name = "WordPressError";
  }
}

export function toPublicError(error: unknown) {
  const code = error instanceof WordPressError ? error.code : undefined;

  switch (code) {
    case "INVALID_INPUT":
      return { status: 400, message: "All fields are required." };
    case "URL_NOT_ALLOWED":
      return { status: 403, message: "This WordPress URL is not allowed." };
    case "AUTH_FAILED":
      return {
        status: 401,
        message: "WordPress authentication failed. Check your credentials.",
      };
    case "UPSTREAM_REJECTED":
      return {
        status: 502,
        message: "WordPress did not accept the connection.",
      };
    default:
      // Preserve the existing catch-all mapping, including upstream failures.
      return {
        status: 400,
        message: "Unable to connect to WordPress. Check the site URL.",
      };
  }
}
