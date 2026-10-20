import { describe, expect, it } from "vitest";
import {
  toPublicError,
  WordPressError,
  type WordPressErrorCode,
} from "../../src/lib/wordpress/errors";

describe("toPublicError", () => {
  it.each<WordPressErrorCode>([
    "INVALID_REQUEST",
    "INVALID_URL",
    "INVALID_RESPONSE",
    "TIMEOUT",
    "NETWORK_ERROR",
  ])("retains the generic 400 mapping for %s", (code) => {
    expect(toPublicError(new WordPressError(code))).toEqual({
      status: 400,
      message: "Unable to connect to WordPress. Check the site URL.",
    });
  });

  it("does not expose details from an unexpected exception", () => {
    expect(toPublicError(new Error("Sensitive synthetic exception details"))).toEqual({
      status: 400,
      message: "Unable to connect to WordPress. Check the site URL.",
    });
  });
});
