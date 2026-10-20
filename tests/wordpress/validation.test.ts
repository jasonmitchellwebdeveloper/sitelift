import { describe, expect, it } from "vitest";
import { WordPressError } from "../../src/lib/wordpress/errors";
import { validateConnection } from "../../src/lib/wordpress/validation";

const input = {
  siteUrl: "https://wordpress.example",
  username: " synthetic-user ",
  applicationPassword: " synthetic app password only ",
};

describe("validateConnection", () => {
  it("uses the supplied hostname and preserves credential values", () => {
    const connection = validateConnection(input, "WORDPRESS.EXAMPLE");

    expect(connection).toEqual({
      baseUrl: new URL("https://wordpress.example/"),
      username: input.username,
      applicationPassword: input.applicationPassword,
    });
  });

  it.each([
    ["https://wordpress.example/blog", "https://wordpress.example/blog/"],
    ["https://wordpress.example/blog/", "https://wordpress.example/blog/"],
    // The URL parser removes an explicit default port before the existing check.
    ["https://wordpress.example:443", "https://wordpress.example/"],
  ])("normalizes %s to %s", (siteUrl, expectedUrl) => {
    const connection = validateConnection({ ...input, siteUrl }, "wordpress.example");

    expect(connection.baseUrl.href).toBe(expectedUrl);
  });

  it.each([
    {},
    { ...input, siteUrl: undefined },
    { ...input, username: "   " },
    { ...input, applicationPassword: "" },
    { ...input, username: 42 },
    "not an object",
  ])("returns INVALID_INPUT for missing or invalid fields in %j", (body) => {
    expect(() => validateConnection(body, "wordpress.example")).toThrow(
      new WordPressError("INVALID_INPUT"),
    );
  });

  it.each([null, undefined])("preserves generic error classification for %s", (body) => {
    expect(() => validateConnection(body, "wordpress.example")).toThrow(
      new WordPressError("INVALID_REQUEST"),
    );
  });

  it.each(["", "not a URL"])("returns a safe INVALID_URL error for %j", (siteUrl) => {
    expect(() => validateConnection({ ...input, siteUrl }, "wordpress.example")).toThrow(
      new WordPressError("INVALID_URL"),
    );
  });

  it.each([
    "https://other.example",
    "https://wordpress.example.other.example",
    "http://wordpress.example",
    "https://wordpress.example:8443",
    "https://synthetic-user:synthetic-password@wordpress.example",
    "https://wordpress.example/?query=value",
    "https://wordpress.example/#fragment",
  ])("returns URL_NOT_ALLOWED for %s", (siteUrl) => {
    expect(() => validateConnection({ ...input, siteUrl }, "wordpress.example")).toThrow(
      new WordPressError("URL_NOT_ALLOWED"),
    );
  });

  it.each([undefined, ""])("fails closed when allowed hostname is %j", (allowedHost) => {
    expect(() => validateConnection(input, allowedHost)).toThrow(
      new WordPressError("URL_NOT_ALLOWED"),
    );
  });
});
