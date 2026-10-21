import "server-only";
import { ImportError } from "./errors";
import {
  MAX_RECORDS,
  SOURCES,
  type ImportResult,
  type SourceId,
} from "./model";
import { normalizePosts } from "./normalize";
import { readBoundedJson } from "./read-json";
import { samplePosts } from "./sample";

export const MAX_RESPONSE_BYTES = 256 * 1024;

export function validateImportRequest(value: unknown): {
  source: SourceId;
  limit: number;
} {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("source" in value) ||
    (value.source !== "sample" && value.source !== "jsonplaceholder") ||
    !("limit" in value) ||
    typeof value.limit !== "number" ||
    !Number.isInteger(value.limit) ||
    value.limit < 1 ||
    value.limit > MAX_RECORDS ||
    Object.keys(value).some((key) => key !== "source" && key !== "limit")
  )
    throw new ImportError("INVALID_REQUEST");

  return { source: value.source, limit: value.limit };
}

export async function importContent(
  input: unknown,
  fetchSource: typeof fetch = fetch,
): Promise<ImportResult> {
  const { source, limit } = validateImportRequest(input);
  let posts: unknown;

  if (source === "sample") {
    posts = samplePosts.slice(0, limit);
  } else {
    const endpoint = new URL("https://jsonplaceholder.typicode.com/posts");
    endpoint.searchParams.set("_limit", String(limit));
    try {
      const signal = AbortSignal.timeout(10_000);
      const response = await fetchSource(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        redirect: "manual",
        cache: "no-store",
        signal,
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new ImportError("UPSTREAM_FAILED");
      }
      if (
        !/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(
          response.headers.get("content-type") ?? "",
        )
      ) {
        await response.body?.cancel();
        throw new ImportError("INVALID_RESPONSE");
      }
      posts = await readBoundedJson(
        response,
        MAX_RESPONSE_BYTES,
        "RESPONSE_TOO_LARGE",
        "INVALID_RESPONSE",
        signal,
      );
    } catch (error) {
      if (error instanceof ImportError) throw error;
      throw new ImportError(
        error instanceof Error && error.name === "TimeoutError"
          ? "TIMEOUT"
          : "UPSTREAM_FAILED",
      );
    }
  }

  return {
    schemaVersion: 1,
    source: {
      id: source,
      label: SOURCES[source].label,
      kind: SOURCES[source].kind,
    },
    records: normalizePosts(posts, source, limit),
  };
}
