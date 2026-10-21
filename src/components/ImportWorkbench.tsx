"use client";

import { useRef, useState } from "react";
import ContentPreview from "./ContentPreview";
import {
  DEFAULT_LIMIT,
  FIELD_MAPPING,
  MAX_RECORDS,
  SOURCES,
  type ImportResponse,
  type ImportResult,
  type SourceId,
} from "@/lib/content/model";

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ImportResult };

function Icon({
  name,
}: {
  name: "arrow" | "stack" | "check" | "code" | "globe";
}) {
  const paths = {
    arrow: "M4 12h15m-6-6 6 6-6 6",
    stack: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
    check: "m5 12 4 4L19 6",
    code: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16",
    globe:
      "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function ImportWorkbench() {
  const [source, setSource] = useState<SourceId>("sample");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [state, setState] = useState<ImportState>({ status: "idle" });
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState<"preview" | "json" | "mapping">("preview");
  const [query, setQuery] = useState("");
  const inFlight = useRef(false);
  const loading = state.status === "loading";
  const result = state.status === "success" ? state.data : null;
  const filtered =
    result?.records.filter((record) =>
      `${record.title} ${record.body}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ) ?? [];
  const selected =
    filtered.find((record) => record.id === selectedId) ?? filtered[0];

  async function runImport(selectedSource = source) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSource(selectedSource);
    setState({ status: "loading" });
    setQuery("");
    setView("preview");
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: selectedSource, limit }),
        signal: AbortSignal.timeout(15_000),
      });
      const payload: ImportResponse = await response.json();
      if (!response.ok || !payload.success) {
        setState({
          status: "error",
          message: !payload.success
            ? payload.message
            : "The import could not be completed. Please try again.",
        });
        return;
      }
      setSelectedId(payload.data.records[0]?.id ?? "");
      setState({ status: "success", data: payload.data });
    } catch {
      setState({
        status: "error",
        message:
          "SiteLift could not complete the request. Check your connection and try again.",
      });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="workbench">
      <aside className="source-panel" aria-label="Import configuration">
        <div className="panel-heading">
          <span className="step-number">01</span>
          <h2>Choose your source</h2>
        </div>
        <p className="panel-intro">
          Start with a collection. We’ll take care of the structure.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runImport();
          }}
        >
          <fieldset disabled={loading}>
            <legend className="label">CONTENT SOURCE</legend>
            {(["sample", "jsonplaceholder"] as const).map((id) => (
              <label
                className={`source-option ${source === id ? "is-selected" : ""}`}
                key={id}
              >
                <input
                  type="radio"
                  name="source"
                  value={id}
                  checked={source === id}
                  onChange={() => {
                    setSource(id);
                    setState({ status: "idle" });
                  }}
                />
                <span className="source-option-icon">
                  <Icon name={id === "sample" ? "stack" : "globe"} />
                </span>
                <span className="source-option-copy">
                  <strong>
                    {id === "sample" ? "Sample collection" : SOURCES[id].label}
                  </strong>
                  <small>
                    {id === "sample"
                      ? "Bundled · independent of API uptime"
                      : "Live API · example content"}
                  </small>
                </span>
                <span className="radio-indicator" />
              </label>
            ))}
            <div className="source-description">
              {SOURCES[source].description}
            </div>
            <label className="label" htmlFor="record-limit">
              RECORD LIMIT
            </label>
            <select
              id="record-limit"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setState({ status: "idle" });
              }}
            >
              <option value={6}>Up to 6 records</option>
              <option value={12}>Up to 12 records</option>
              <option value={24}>Up to 24 records</option>
            </select>
            <p className="field-hint">Small batches. Easier to inspect.</p>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Importing content…
                </>
              ) : (
                <>
                  Import content <Icon name="arrow" />
                </>
              )}
            </button>
          </fieldset>
        </form>
        <div className="source-note">
          <Icon name="check" />
          <span>
            No credentials. No saved content.
            <br />
            Your import stays in this browser tab.
          </span>
        </div>
        <div className="next-step">
          <span className="label">WHAT HAPPENS NEXT</span>
          <p>
            Source fields become consistent SiteLift records, ready for you to
            inspect.
          </p>
          <a href="#field-mapping">
            Explore the field mapping <span aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>

      <section
        className="results-panel"
        aria-labelledby="results-title"
        aria-busy={loading}
      >
        <div className="results-heading">
          <div>
            <div className="eyebrow">YOUR CONTENT, NORMALIZED</div>
            <h2 id="results-title">Content preview</h2>
          </div>
          <span className="schema-badge">
            <Icon name="code" /> Schema v1
          </span>
        </div>
        <div className="status-announcement" role="status" aria-live="polite">
          {loading
            ? "Importing and transforming content."
            : result
              ? `${result.records.length} records imported from ${result.source.label}. ${result.source.kind === "sample" ? "Bundled sample data." : "Live API results with synthetic example content."}`
              : ""}
        </div>

        {state.status === "idle" && (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="mock-record">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="empty-icon">
                <Icon name="stack" />
              </div>
            </div>
            <span className="eyebrow">A CLEAN START</span>
            <h3>
              Good content deserves
              <br />a smooth move.
            </h3>
            <p>
              Choose a source and import your first collection.
              <br />
              We’ll make the structure easy to see.
            </p>
            <button
              className="text-button"
              type="button"
              onClick={() => void runImport("sample")}
            >
              Try the sample collection <Icon name="arrow" />
            </button>
            <div className="empty-features">
              <span>
                <Icon name="check" /> Typed records
              </span>
              <span>
                <Icon name="check" /> Safe preview
              </span>
              <span>
                <Icon name="check" /> Clear mapping
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="empty-state loading-state">
            <span className="large-spinner" />
            <h3>Making room for your content.</h3>
            <p>
              Fetching records, validating fields,
              <br />
              and transforming them into a consistent model.
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className="empty-state error-state" role="alert">
            <div className="error-symbol" aria-hidden="true">
              !
            </div>
            <h3>The import needs another try.</h3>
            <p>{state.message}</p>
            <div className="error-actions">
              <button
                className="primary-button"
                onClick={() => void runImport()}
              >
                Try again <Icon name="arrow" />
              </button>
              {source !== "sample" && (
                <button
                  className="secondary-button"
                  onClick={() => void runImport("sample")}
                >
                  Use sample collection
                </button>
              )}
            </div>
            <small>No sample data was substituted for your request.</small>
          </div>
        )}

        {result && (
          <>
            <div className={`import-summary ${result.source.kind}`}>
              <span className="summary-check">
                <Icon name="check" />
              </span>
              <div>
                <strong>
                  {result.records.length}{" "}
                  {result.records.length === 1 ? "record" : "records"} imported
                  &amp; transformed
                </strong>
                <span>
                  {result.source.kind === "sample"
                    ? "Bundled sample collection · no external request"
                    : "Live JSONPlaceholder response · synthetic example posts"}
                </span>
              </div>
              <span className="provenance-badge">
                {result.source.kind === "sample" ? "SAMPLE DATA" : "LIVE API"}
              </span>
            </div>
            <div className="preview-toolbar">
              <div
                className="view-switch"
                role="group"
                aria-label="Preview view"
              >
                {(["preview", "json", "mapping"] as const).map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={view === mode}
                    onClick={() => setView(mode)}
                  >
                    {mode === "preview"
                      ? "Readable"
                      : mode === "json"
                        ? "JSON"
                        : "Field mapping"}
                  </button>
                ))}
              </div>
              <span className="record-count">
                {result.records.length} / {limit} records
              </span>
            </div>
            {result.records.length === 0 ? (
              <div className="empty-state compact">
                <Icon name="stack" />
                <h3>No records at this source.</h3>
                <p>
                  The request succeeded, but the source returned an empty
                  collection.
                  <br />
                  Try another source or load the samples.
                </p>
                <button
                  className="text-button"
                  onClick={() => void runImport("sample")}
                >
                  Load sample collection <Icon name="arrow" />
                </button>
              </div>
            ) : view === "mapping" ? (
              <Mapping />
            ) : (
              <div className="record-workspace">
                <div className="record-list">
                  <label className="sr-only" htmlFor="record-filter">
                    Filter imported records
                  </label>
                  <input
                    id="record-filter"
                    className="filter-input"
                    placeholder="Filter records…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="record-items" aria-label="Imported records">
                    {filtered.map((record, index) => (
                      <button
                        className={`record-item ${selected?.id === record.id ? "active" : ""}`}
                        key={record.id}
                        aria-pressed={selected?.id === record.id}
                        onClick={() => setSelectedId(record.id)}
                      >
                        <span className="record-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <strong>{record.title}</strong>
                          <small>
                            {record.body.split(/\s+/).filter(Boolean).length}{" "}
                            words · Plain text
                          </small>
                        </span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="no-matches">
                        No records match your filter.
                      </p>
                    )}
                  </div>
                </div>
                <div className="record-detail">
                  {selected ? (
                    view === "json" ? (
                      <div className="json-preview">
                        <div className="json-title">
                          <Icon name="code" />
                          <span>Normalized record</span>
                        </div>
                        <pre>{JSON.stringify(selected, null, 2)}</pre>
                      </div>
                    ) : (
                      <ContentPreview record={selected} />
                    )
                  ) : (
                    <div className="empty-state compact">
                      <p>Clear the filter to see your records.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div className="results-footer">
          <span>
            <span className="small-dot" /> Bounded imports, predictable results
          </span>
          <span>Up to {MAX_RECORDS} records per import</span>
        </div>
      </section>
      <section className="mapping-explainer" id="field-mapping">
        <div>
          <span className="eyebrow">A LITTLE STRUCTURE GOES A LONG WAY</span>
          <h2>
            Different fields.
            <br />
            One shared language.
          </h2>
          <p>
            The source keeps its identity. Your content gets a consistent shape.
            Every transformation is visible.
          </p>
        </div>
        <Mapping />
      </section>
    </div>
  );
}

function Mapping() {
  return (
    <div className="mapping-table">
      <table>
        <caption className="sr-only">
          Source fields mapped to the SiteLift content model
        </caption>
        <thead>
          <tr>
            <th>Source field</th>
            <th>SiteLift field</th>
            <th>Transformation</th>
          </tr>
        </thead>
        <tbody>
          {FIELD_MAPPING.map(([from, to, note]) => (
            <tr key={to}>
              <td>
                <code>{from}</code>
              </td>
              <td>
                <span className="mapping-arrow" aria-hidden="true">
                  →{" "}
                </span>
                <code>{to}</code>
              </td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
