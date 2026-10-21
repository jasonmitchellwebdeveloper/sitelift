import ImportWorkbench from "@/components/ImportWorkbench";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <a href="#workspace" className="skip-link">
        Skip to workspace
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="SiteLift home">
            <span className="brand-mark" aria-hidden="true">
              ↗
            </span>
            SiteLift<span className="brand-label">WORKSPACE</span>
          </Link>
          <nav aria-label="Main navigation">
            <a href="#workspace" className="nav-active">
              Workbench
            </a>
            <a
              href="https://github.com/jasonmitchellwebdeveloper/sitelift"
              target="_blank"
              rel="noreferrer"
            >
              View source <span aria-hidden="true">↗</span>
            </a>
          </nav>
          <span className="header-status">
            <span /> CONTENT, IN MOTION
          </span>
        </div>
      </header>
      <main id="workspace" className="page-shell">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="accent-line" /> BUILT FOR YOUR NEXT CONTENT MOVE
            </div>
            <h1>
              Your content.
              <br />
              <span>Ready to move.</span>
            </h1>
            <p>
              Import from an API. Bring every record into shape.
              <br />
              See exactly what you’re taking with you.
            </p>
          </div>
          <ol className="workflow" aria-label="Content workflow">
            <li className="current">
              <span>01</span>
              <strong>Import</strong>
              <small>Choose a source</small>
            </li>
            <li>
              <span>02</span>
              <strong>Transform</strong>
              <small>Find a common shape</small>
            </li>
            <li>
              <span>03</span>
              <strong>Preview</strong>
              <small>Inspect every detail</small>
            </li>
            <li className="upcoming">
              <span>04</span>
              <strong>Export</strong>
              <small>Coming next</small>
            </li>
          </ol>
        </section>
        <ImportWorkbench />
      </main>
      <footer className="site-footer">
        <Link className="brand footer-brand" href="/">
          SiteLift
          <span className="footer-tagline">
            A clearer path for your content.
          </span>
        </Link>
        <span>
          Import. Transform. Preview.{" "}
          <span className="muted">Export is next.</span>
        </span>
      </footer>
    </>
  );
}
