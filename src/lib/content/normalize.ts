import { ImportError } from "./errors";
import { MAX_RECORDS, type ContentRecord, type SourceId } from "./model";

function positiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function normalizePosts(
  value: unknown,
  source: SourceId,
  limit: number,
): ContentRecord[] {
  if (!Array.isArray(value)) throw new ImportError("INVALID_RESPONSE");
  if (value.length > Math.min(limit, MAX_RECORDS))
    throw new ImportError("RESPONSE_TOO_LARGE");

  const seen = new Set<number>();
  return value.map((post: unknown) => {
    if (
      typeof post !== "object" ||
      post === null ||
      Array.isArray(post) ||
      !("id" in post) ||
      !positiveId(post.id) ||
      seen.has(post.id) ||
      !("title" in post) ||
      typeof post.title !== "string" ||
      !post.title.trim() ||
      post.title.length > 500 ||
      !("body" in post) ||
      typeof post.body !== "string" ||
      post.body.length > 20_000 ||
      ("userId" in post && post.userId !== null && !positiveId(post.userId))
    )
      throw new ImportError("INVALID_RESPONSE");

    seen.add(post.id);
    const title = post.title.trim();
    const slug = title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 80)
      .replace(/^-|-$/g, "");

    return {
      id: `${source}:${post.id}`,
      sourceRecordId: String(post.id),
      title,
      slug: slug || `record-${post.id}`,
      body: post.body.replace(/\r\n?/g, "\n").trim(),
      bodyFormat: "plain-text",
      authorId:
        "userId" in post && positiveId(post.userId)
          ? String(post.userId)
          : null,
      sourceUrl:
        source === "jsonplaceholder"
          ? `https://jsonplaceholder.typicode.com/posts/${post.id}`
          : null,
    };
  });
}
