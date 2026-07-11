import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Parallel web research",
    body: "Four research tracks run at once: business model, financials, news and risks, competition. Fresh sources every run.",
  },
  {
    title: "Analyst grade reasoning",
    body: "An LLM analyst writes a grounded report from the raw sources before any decision is made, so the verdict is backed by evidence.",
  },
  {
    title: "A clear call, not a summary",
    body: "You get INVEST or PASS with a confidence score, a written thesis, concrete strengths and risks, and a suggested horizon.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          Should you invest in that company?
          <br />
          Ask the agent.
        </h1>
        <p>
          InvestScout takes a company name, researches the live web, weighs the
          evidence like an analyst and gives you a decision with the reasoning
          behind it. All in about a minute.
        </p>
        <Link to="/research" className="cta">
          Start researching
        </Link>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
