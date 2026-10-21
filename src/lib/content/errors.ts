export type ImportErrorCode =
  | "INVALID_REQUEST"
  | "REQUEST_TOO_LARGE"
  | "REQUEST_TIMEOUT"
  | "UPSTREAM_FAILED"
  | "INVALID_RESPONSE"
  | "RESPONSE_TOO_LARGE"
  | "TIMEOUT";

const publicErrors: Record<
  ImportErrorCode,
  { status: number; message: string }
> = {
  INVALID_REQUEST: {
    status: 400,
    message: "Choose a supported source and a record limit from 1 to 24.",
  },
  REQUEST_TOO_LARGE: {
    status: 413,
    message: "The import request is too large.",
  },
  REQUEST_TIMEOUT: {
    status: 408,
    message: "The import request took too long. Please try again.",
  },
  UPSTREAM_FAILED: {
    status: 502,
    message:
      "The public API could not be reached. Try again or choose sample data.",
  },
  INVALID_RESPONSE: {
    status: 502,
    message:
      "The public API returned unexpected data. Try again or choose sample data.",
  },
  RESPONSE_TOO_LARGE: {
    status: 502,
    message:
      "The public API response exceeded this import's limits. Choose sample data or try again later.",
  },
  TIMEOUT: {
    status: 504,
    message:
      "The public API took too long to respond. Try again or choose sample data.",
  },
};

export class ImportError extends Error {
  constructor(public readonly code: ImportErrorCode) {
    super(code);
    this.name = "ImportError";
  }
}

export function publicImportError(error: unknown) {
  return error instanceof ImportError
    ? publicErrors[error.code]
    : {
        status: 500,
        message: "The import could not be completed. Please try again.",
      };
}
