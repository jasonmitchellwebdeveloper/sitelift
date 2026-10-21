import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importContent, MAX_RESPONSE_BYTES } from "@/lib/content/import";
import { publicImportError } from "@/lib/content/errors";

const post = {
  id: 1,
  userId: 1,
  title: "Synthetic post",
  body: "Synthetic content.",
};
const input = { source: "jsonplaceholder", limit: 6 };
const fetchMock = vi.fn<typeof fetch>();
const globalFetch = vi.fn<typeof fetch>();

describe("controlled content imports", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Unexpected synthetic fetch"));
    globalFetch.mockReset();
    globalFetch.mockRejectedValue(new Error("Network must not be used"));
    vi.stubGlobal("fetch", globalFetch);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    expect(globalFetch).not.toHaveBeenCalled();
  });

  it("imports deterministic, explicitly labelled samples without fetching", async () => {
    const first = await importContent(
      { source: "sample", limit: 2 },
      fetchMock,
    );
    expect(first).toEqual(
      await importContent({ source: "sample", limit: 2 }, fetchMock),
    );
    expect(first.source).toEqual({
      id: "sample",
      kind: "sample",
      label: "SiteLift sample collection",
    });
    expect(first.records).toHaveLength(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches only the fixed HTTPS endpoint with bounded parameters and safeguards", async () => {
    fetchMock.mockResolvedValue(Response.json([post]));
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const result = await importContent(input, fetchMock);
    expect(result.source).toMatchObject({
      id: "jsonplaceholder",
      kind: "live",
    });
    expect(result.records[0]).toMatchObject({
      id: "jsonplaceholder:1",
      title: post.title,
    });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      new URL("https://jsonplaceholder.typicode.com/posts?_limit=6"),
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        redirect: "manual",
        signal: expect.any(AbortSignal),
      },
    );
    expect(timeout).toHaveBeenCalledWith(10_000);
  });

  it.each([
    null,
    [],
    {},
    { source: "sample" },
    { ...input, source: "https://localhost" },
    { ...input, url: "http://127.0.0.1" },
    { ...input, limit: 0 },
    { ...input, limit: -1 },
    { ...input, limit: 25 },
    { ...input, limit: 1.5 },
    { ...input, limit: "6" },
    { ...input, limit: Infinity },
  ])("rejects unsupported requests before fetching (case %#)", async (body) => {
    await expect(importContent(body, fetchMock)).rejects.toMatchObject({
      code: "INVALID_REQUEST",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves empty live results instead of replacing them with samples", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    const result = await importContent(input, fetchMock);
    expect(result.records).toEqual([]);
    expect(result.source.kind).toBe("live");
  });

  it.each([301, 302, 401, 429, 500])(
    "rejects upstream HTTP %i without retrying",
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response("synthetic-private-detail", {
          status,
          headers: { Location: "http://127.0.0.1" },
        }),
      );
      await expect(importContent(input, fetchMock)).rejects.toMatchObject({
        code: "UPSTREAM_FAILED",
        message: "UPSTREAM_FAILED",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["not JSON", "null", "{}", '[{"id":1}]'])(
    "rejects invalid upstream JSON or schema %j",
    async (body) => {
      fetchMock.mockResolvedValue(
        new Response(body, { headers: { "Content-Type": "application/json" } }),
      );
      await expect(importContent(input, fetchMock)).rejects.toMatchObject({
        code: "INVALID_RESPONSE",
      });
    },
  );

  it("rejects a non-JSON response before reading its contents", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>synthetic-private-detail</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    );
    await expect(importContent(input, fetchMock)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("rejects a declared oversized body", async () => {
    fetchMock.mockResolvedValue(
      new Response("[]", {
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(MAX_RESPONSE_BYTES + 1),
        },
      }),
    );
    await expect(importContent(input, fetchMock)).rejects.toMatchObject({
      code: "RESPONSE_TOO_LARGE",
    });
  });

  it("counts actual streamed bytes and cancels oversized bodies even with a false length header", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_RESPONSE_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    fetchMock.mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "application/json", "Content-Length": "1" },
      }),
    );
    await expect(importContent(input, fetchMock)).rejects.toMatchObject({
      code: "RESPONSE_TOO_LARGE",
    });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each([
    [new DOMException("Synthetic timeout", "TimeoutError"), "TIMEOUT"],
    [new TypeError("Synthetic network details"), "UPSTREAM_FAILED"],
  ])("sanitizes network failures (case %#)", async (error, code) => {
    fetchMock.mockRejectedValue(error);
    const result = importContent(input, fetchMock);
    await expect(result).rejects.toMatchObject({ code, message: code });
    await expect(result).rejects.not.toHaveProperty("cause");
  });

  it("sanitizes unexpected errors", () => {
    expect(publicImportError(new Error("synthetic-private-detail"))).toEqual({
      status: 500,
      message: "The import could not be completed. Please try again.",
    });
  });
});
