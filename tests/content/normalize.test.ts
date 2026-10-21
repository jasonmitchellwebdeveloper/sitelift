import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ContentPreview from "@/components/ContentPreview";
import { normalizePosts } from "@/lib/content/normalize";

const post = {
  id: 7,
  userId: 3,
  title: "  Café & content!  ",
  body: "  First paragraph.\r\n\rSecond paragraph.  ",
};

describe("content normalization", () => {
  it("produces the canonical schema with stable identities and normalized text", () => {
    expect(normalizePosts([post], "jsonplaceholder", 12)).toEqual([
      {
        id: "jsonplaceholder:7",
        sourceRecordId: "7",
        title: "Café & content!",
        slug: "cafe-content",
        body: "First paragraph.\n\nSecond paragraph.",
        bodyFormat: "plain-text",
        authorId: "3",
        sourceUrl: "https://jsonplaceholder.typicode.com/posts/7",
      },
    ]);
  });

  it("uses null for missing optional metadata and a stable fallback for non-Latin slugs", () => {
    const [record] = normalizePosts(
      [{ id: 1, title: "日本語", body: "" }],
      "sample",
      1,
    );
    expect(record).toMatchObject({
      id: "sample:1",
      authorId: null,
      sourceUrl: null,
      slug: "record-1",
      body: "",
    });
  });

  it("preserves an empty collection", () => {
    expect(normalizePosts([], "sample", 6)).toEqual([]);
  });

  it.each([
    null,
    {},
    "text",
    [null],
    [[]],
    [{}],
    [{ ...post, id: 0 }],
    [{ ...post, id: -1 }],
    [{ ...post, id: 1.5 }],
    [{ ...post, id: "1" }],
    [{ ...post, id: true }],
    [{ ...post, id: Infinity }],
    [{ ...post, id: Number.MAX_SAFE_INTEGER + 1 }],
    [{ ...post, title: " " }],
    [{ ...post, title: 1 }],
    [{ ...post, title: "a".repeat(501) }],
    [{ ...post, body: null }],
    [{ ...post, body: "a".repeat(20_001) }],
    [{ ...post, userId: "3" }],
    [post, post],
  ])("rejects malformed records or duplicate identities (case %#)", (input) => {
    expect(() => normalizePosts(input, "sample", 24)).toThrow(
      "INVALID_RESPONSE",
    );
  });

  it("rejects excess records rather than silently discarding data", () => {
    expect(() =>
      normalizePosts([post, { ...post, id: 8 }], "sample", 1),
    ).toThrow("RESPONSE_TOO_LARGE");
  });

  it("ignores unrecognized source fields", () => {
    const [record] = normalizePosts(
      [
        {
          ...post,
          secret: "synthetic-private-field",
          url: "javascript:alert(1)",
        },
      ],
      "sample",
      1,
    );
    expect(JSON.stringify(record)).not.toContain("synthetic-private-field");
    expect(record.sourceUrl).toBeNull();
  });

  it("renders imported markup as inert text", () => {
    const [record] = normalizePosts(
      [
        {
          ...post,
          title: '<img src=x onerror="alert(1)">',
          body: '<script>alert("x")</script>',
        },
      ],
      "sample",
      1,
    );
    const html = renderToStaticMarkup(
      createElement(ContentPreview, { record }),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
  });
});
