export const MAX_RECORDS = 24;
export const DEFAULT_LIMIT = 12;

export const SOURCES = {
  jsonplaceholder: {
    label: "JSONPlaceholder",
    kind: "live",
    description:
      "Fetch example posts from a public REST API. No API key needed.",
  },
  sample: {
    label: "SiteLift sample collection",
    kind: "sample",
    description:
      "Six bundled articles. Repeatable results, with no external request.",
  },
} as const;

export type SourceId = keyof typeof SOURCES;

export type ContentRecord = {
  id: string;
  sourceRecordId: string;
  title: string;
  slug: string;
  body: string;
  bodyFormat: "plain-text";
  authorId: string | null;
  sourceUrl: string | null;
};

export type ImportResult = {
  schemaVersion: 1;
  source: { id: SourceId; label: string; kind: "live" | "sample" };
  records: ContentRecord[];
};

export type ImportResponse =
  | { success: true; data: ImportResult }
  | { success: false; message: string };

export const FIELD_MAPPING = [
  ["id", "sourceRecordId", "Converted to a string"],
  ["title", "title", "Whitespace trimmed"],
  ["title", "slug", "Generated URL-friendly text"],
  ["body", "body", "Plain text; line endings normalized"],
  ["userId", "authorId", "String, or null when absent"],
] as const;
