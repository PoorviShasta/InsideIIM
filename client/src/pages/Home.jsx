import { Link } from "react-router-dom";

const STATS = [
  { value: "4", label: "research tracks run in parallel" },
  { value: "2", label: "stage reasoning, analyst then committee" },
  { value: "<60s", label: "from company name to verdict" },
  { value: "100%", label: "free APIs, nothing to pay for" },
];

const FEATURES = [
  {
    n: "01",
    title: "Live web research",
    body: "Every run pulls fresh sources on the business model, financials, news, risks and competition. No stale training data, no cached answers.",
  },
  {
    n: "02",
    title: "Analyst grade reasoning",
    body: "An LLM analyst writes a grounded report from the raw sources first. Only then does the investment committee make the call, so the verdict is backed by evidence.",
  },
  {
    n: "03",
    title: "A decision, not a summary",
    body: "INVEST or PASS with a confidence score, a written thesis, concrete strengths and risks, and a suggested holding period.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="badge">AI powered equity research</span>
        <h1>
          Institutional grade research.
          <br />
          <span className="grad">One company name away.</span>
        </h1>
        <p>
          InvestScout researches any company on the live web, weighs the
          evidence like an analyst, and hands you a clear call with the
          reasoning behind it.
        </p>
        <div className="hero-actions">
          <Link to="/research" className="cta">
            Start researching
          </Link>
          <Link to="/about" className="cta ghost">
            See how it works
          </Link>
        </div>

        <div className="preview">
          <div className="preview-bar">
            <span className="preview-dot" />
            <span className="preview-dot" />
            <span className="preview-dot" />
            <span className="preview-title">investscout / research</span>
          </div>
          <div className="preview-body">
            <div className="preview-head">
              <div>
                <span className="preview-company">Nvidia</span>
                <span className="preview-time">researched in 42s</span>
              </div>
              <span className="verdict small invest">INVEST</span>
            </div>
            <div className="confidence">
              <div className="confidence-label">Confidence 80%</div>
              <div className="confidence-track">
                <div className="confidence-fill" style={{ width: "80%" }} />
              </div>
            </div>
            <p className="preview-thesis">
              Dominant market share in the AI chip market, strong financial
              health and a growth trajectory that justify an investment
              decision. Growing competition and regulatory risk are concerns,
              but the moat mitigates them.
            </p>
          </div>
        </div>
      </section>

      <section className="stats">
        {STATS.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.n} className="feature-card">
            <span className="feature-num">{f.n}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="cta-band">
        <h2>Got a company in mind?</h2>
        <p>Type the name. Get the call and the reasoning in under a minute.</p>
        <Link to="/research" className="cta">
          Research it now
        </Link>
      </section>
    </>
  );
}
