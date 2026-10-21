import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/import/route";

const fetchMock = vi.fn<typeof fetch>();
function request(value: unknown) {
  return new Request("https://sitelift.example/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

describe("POST /api/import", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Synthetic network failure"));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a versioned, explicitly labelled sample import", async () => {
    const response = await POST(request({ source: "sample", limit: 6 }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      success: true,
      data: {
        schemaVersion: 1,
        source: { kind: "sample" },
        records: expect.any(Array),
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns normalized live records", async () => {
    fetchMock.mockResolvedValue(
      Response.json([{ id: 1, title: "Synthetic post", body: "Body" }]),
    );
    const response = await POST(
      request({ source: "jsonplaceholder", limit: 6 }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: {
        source: { kind: "live" },
        records: [{ id: "jsonplaceholder:1" }],
      },
    });
  });

  it.each([
    {},
    null,
    { source: "sample", limit: 25 },
    { source: "sample", limit: 6, url: "http://127.0.0.1" },
  ])("rejects invalid input before networking (case %#)", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      message: expect.any(String),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["", "{bad JSON"])("rejects malformed JSON %j", async (body) => {
    const response = await POST(
      new Request("https://sitelift.example/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-JSON requests", async () => {
    const response = await POST(
      new Request("https://sitelift.example/api/import", {
        method: "POST",
        body: "source=sample",
      }),
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits the actual request body to 1 KiB", async () => {
    const response = await POST(
      request({ source: "sample", limit: 6, padding: "é".repeat(600) }),
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty results as successful live imports", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    const response = await POST(
      request({ source: "jsonplaceholder", limit: 6 }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { records: [], source: { kind: "live" } },
    });
  });

  it("returns a safe error without substituting sample content", async () => {
    fetchMock.mockResolvedValue(
      new Response("synthetic-private-detail", { status: 503 }),
    );
    const response = await POST(
      request({ source: "jsonplaceholder", limit: 6 }),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      message:
        "The public API could not be reached. Try again or choose sample data.",
    });
    expect(JSON.stringify(body)).not.toContain("synthetic-private-detail");
  });

  it("returns 504 for upstream timeouts", async () => {
    fetchMock.mockRejectedValue(
      new DOMException("Synthetic timeout", "TimeoutError"),
    );
    const response = await POST(
      request({ source: "jsonplaceholder", limit: 6 }),
    );
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ success: false });
  });

  it("bounds request-reading time without contacting a source", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(
      AbortSignal.abort(new DOMException("Synthetic deadline", "TimeoutError")),
    );
    const response = await POST(request({ source: "sample", limit: 6 }));
    expect(response.status).toBe(408);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
