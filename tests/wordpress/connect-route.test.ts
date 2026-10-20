import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/wordpress/connect/route";

// Synthetic values only. The handler is invoked directly; fetch never uses the network.
const input = {
  siteUrl: "https://wordpress.example",
  username: "synthetic-user",
  applicationPassword: "synthetic app password only",
};

const fetchMock = vi.fn<typeof fetch>();

function request(body: unknown = input) {
  return new NextRequest("https://sitelift.example/api/wordpress/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/wordpress/connect (current behavior)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Unexpected mocked fetch call"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("WORDPRESS_ALLOWED_HOST", "wordpress.example");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("authenticates with the current request safeguards and returns the display name", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ id: 42, name: "Synthetic Author" }),
    );
    const timeout = vi.spyOn(AbortSignal, "timeout");

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Connected successfully as Synthetic Author!",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://wordpress.example/wp-json/wp/v2/users/me"),
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${input.username}:${input.applicationPassword}`,
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

  it.each([
    "https://wordpress.example/blog",
    "https://wordpress.example/blog/",
  ])("preserves a WordPress subdirectory in %s", async (siteUrl) => {
    fetchMock.mockResolvedValue(Response.json({ name: "Synthetic Author" }));

    const response = await POST(request({ ...input, siteUrl }));

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      new URL("https://wordpress.example/blog/wp-json/wp/v2/users/me"),
    );
  });

  it("currently accepts a JSON object without user fields and falls back to the submitted username", async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: `Connected successfully as ${input.username}!`,
    });
  });

  it.each([
    ["siteUrl", undefined],
    ["username", undefined],
    ["applicationPassword", undefined],
    ["username", ""],
    ["applicationPassword", "   "],
    ["siteUrl", 42],
    ["username", 42],
    ["applicationPassword", 42],
  ])("rejects invalid or missing %s (%s) before fetching", async (field, value) => {
    const response = await POST(request({ ...input, [field]: value }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      message: "All fields are required.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "https://other.example",
    "https://wordpress.example.other.example",
    "http://wordpress.example",
    "https://wordpress.example:8443",
    "https://synthetic-user:synthetic-password@wordpress.example",
    "https://wordpress.example/?query=value",
    "https://wordpress.example/#fragment",
  ])("rejects disallowed URL %s before fetching", async (siteUrl) => {
    const response = await POST(request({ ...input, siteUrl }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      success: false,
      message: "This WordPress URL is not allowed.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects the URL when the allowed hostname is not configured", async () => {
    vi.stubEnv("WORDPRESS_ALLOWED_HOST", undefined);

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      success: false,
      message: "This WordPress URL is not allowed.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 403])("maps upstream %i to a 401 authentication failure", async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      message: "WordPress authentication failed. Check your credentials.",
    });
  });

  it.each([302, 500])("maps upstream %i to a 502 connection failure", async (status) => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status,
        headers: { Location: "https://other.example" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      success: false,
      message: "WordPress did not accept the connection.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps malformed upstream JSON to the current generic 400", async () => {
    fetchMock.mockResolvedValue(new Response("not JSON", { status: 200 }));

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      message: "Unable to connect to WordPress. Check the site URL.",
    });
  });

  it.each(["", "{not JSON"])("maps malformed incoming JSON %j to the current generic 400", async (body) => {
    const malformedRequest = new NextRequest(
      "https://sitelift.example/api/wordpress/connect",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      },
    );

    const response = await POST(malformedRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      message: "Unable to connect to WordPress. Check the site URL.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["timeout", new DOMException("Synthetic timeout", "TimeoutError")],
    ["network failure", new TypeError("Synthetic network failure")],
  ])("maps a %s to the current generic 400", async (_description, error) => {
    fetchMock.mockRejectedValue(error);

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      message: "Unable to connect to WordPress. Check the site URL.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["", "not a URL"])("maps invalid URL %j to the current generic 400", async (siteUrl) => {
    const response = await POST(request({ ...input, siteUrl }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      message: "Unable to connect to WordPress. Check the site URL.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
