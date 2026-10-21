import { describe, expect, it, vi } from "vitest";
import { readBoundedJson } from "@/lib/content/read-json";

describe("bounded JSON reading", () => {
  it("counts UTF-8 bytes rather than characters without a length header", async () => {
    await expect(
      readBoundedJson(
        new Response('"ééé"'),
        7,
        "RESPONSE_TOO_LARGE",
        "INVALID_RESPONSE",
      ),
    ).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
  });

  it("accepts valid JSON exactly at the byte limit", async () => {
    await expect(
      readBoundedJson(
        new Response('"ééé"'),
        8,
        "RESPONSE_TOO_LARGE",
        "INVALID_RESPONSE",
      ),
    ).resolves.toBe("ééé");
  });

  it("rejects invalid UTF-8 instead of silently replacing bytes", async () => {
    await expect(
      readBoundedJson(
        new Response(new Uint8Array([34, 0xff, 34])),
        10,
        "RESPONSE_TOO_LARGE",
        "INVALID_RESPONSE",
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("cancels a stalled stream when its deadline expires", async () => {
    const controller = new AbortController();
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }));
    const result = readBoundedJson(
      response,
      100,
      "RESPONSE_TOO_LARGE",
      "INVALID_RESPONSE",
      controller.signal,
    );
    controller.abort(new DOMException("Synthetic deadline", "TimeoutError"));
    await expect(result).rejects.toMatchObject({ name: "TimeoutError" });
    expect(cancel).toHaveBeenCalledOnce();
  });
});
