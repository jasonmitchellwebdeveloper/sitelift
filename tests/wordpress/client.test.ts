import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateWordPress } from "../../src/lib/wordpress/client";
import type { WordPressConnection } from "../../src/lib/wordpress/validation";

const connection: WordPressConnection = {
  baseUrl: new URL("https://wordpress.example/blog/"),
  username: "synthetic-user",
  applicationPassword: " synthetic app password only ",
};

const fetchMock = vi.fn<typeof fetch>();
const globalFetch = vi.fn<typeof fetch>();

describe("authenticateWordPress", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Unexpected injected fetch call"));
    globalFetch.mockReset();
    globalFetch.mockRejectedValue(new Error("Global fetch must not be used"));
    vi.stubGlobal("fetch", globalFetch);
  });

  afterEach(() => {
    expect(globalFetch).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses injected fetch with the validated subdirectory URL and existing safeguards", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ id: 42, name: "Synthetic Author", extra: "not returned" }),
    );
    const timeout = vi.spyOn(AbortSignal, "timeout");

    const displayName = await authenticateWordPress(connection, fetchMock);

    expect(displayName).toBe("Synthetic Author");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://wordpress.example/blog/wp-json/wp/v2/users/me"),
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${connection.username}:${connection.applicationPassword}`,
          ).toString("base64")}`,
          Accept: "application/json",
        },
        redirect: "manual",
        cache: "no-store",
        signal: expect.any(AbortSignal),
      },
    );
    expect(timeout).toHaveBeenCalledWith(10000);
  });

  it.each([{}, { name: "" }])("preserves the username fallback for %j", async (user) => {
    fetchMock.mockResolvedValue(Response.json(user));

    await expect(authenticateWordPress(connection, fetchMock)).resolves.toBe(
      connection.username,
    );
  });

  it.each([401, 403])("classifies upstream %i without exposing its body", async (status) => {
    fetchMock.mockResolvedValue(
      new Response(`Sensitive upstream detail: ${connection.applicationPassword}`, { status }),
    );

    const result = authenticateWordPress(connection, fetchMock);

    await expect(result).rejects.toMatchObject({
      name: "WordPressError",
      code: "AUTH_FAILED",
      message: "AUTH_FAILED",
    });
    await expect(result).rejects.not.toHaveProperty("cause");
  });

  it.each([302, 500])("classifies upstream %i without following redirects or retrying", async (status) => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status,
        headers: { Location: "https://other.example" },
      }),
    );

    await expect(authenticateWordPress(connection, fetchMock)).rejects.toMatchObject({
      name: "WordPressError",
      code: "UPSTREAM_REJECTED",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["not JSON", "null"])("classifies unusable JSON %j as INVALID_RESPONSE", async (body) => {
    fetchMock.mockResolvedValue(new Response(body));

    await expect(authenticateWordPress(connection, fetchMock)).rejects.toMatchObject({
      name: "WordPressError",
      code: "INVALID_RESPONSE",
      message: "INVALID_RESPONSE",
    });
  });

  it.each([
    [new DOMException("Synthetic timeout", "TimeoutError"), "TIMEOUT"],
    [new TypeError(`Synthetic failure: ${connection.applicationPassword}`), "NETWORK_ERROR"],
  ])("sanitizes fetch failures into %s / %s", async (error, code) => {
    fetchMock.mockRejectedValue(error);

    const result = authenticateWordPress(connection, fetchMock);

    await expect(result).rejects.toMatchObject({
      name: "WordPressError",
      code,
      message: code,
    });
    await expect(result).rejects.not.toHaveProperty("cause");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
