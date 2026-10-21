import type { ContentRecord } from "@/lib/content/model";

export default function ContentPreview({ record }: { record: ContentRecord }) {
  return (
    <article className="content-preview">
      <div className="article-eyebrow">
        <span className="tag">PLAIN TEXT</span>
        <span>{record.id}</span>
      </div>
      <h3>{record.title}</h3>
      <div className="article-meta">
        <span>Author ID {record.authorId ?? "not provided"}</span>
        <span>/{record.slug}</span>
      </div>
      <div className="article-body">
        {record.body || "This record has an empty body."}
      </div>
      <div className="article-footnote">
        Content is displayed as plain text. Embedded HTML and scripts are never
        executed.
      </div>
    </article>
  );
}
