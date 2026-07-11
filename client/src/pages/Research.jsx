import { useState } from "react";

const SEARCH_STEPS = [
  { id: "profileSearch", label: "Company profile" },
  { id: "financialsSearch", label: "Financials" },
  { id: "newsSearch", label: "News and risks" },
  { id: "competitionSearch", label: "Competition" },
];

const PIPELINE = [
  ...SEARCH_STEPS,
  { id: "analyze", label: "Analyst review" },
  { id: "decide", label: "Final decision" },
];

function stepState(id, completed, status) {
  if (completed.has(id)) return "done";
  if (status !== "running") return "pending";
  const searchesDone = SEARCH_STEPS.every((s) => completed.has(s.id));
  if (SEARCH_STEPS.some((s) => s.id === id)) return "running";
  if (id === "analyze") return searchesDone ? "running" : "pending";
  if (id === "decide") return completed.has("analyze") ? "running" : "pending";
  return "pending";
}

function saveRun(company, decision) {
  const runs = JSON.parse(localStorage.getItem("investscout_runs") || "[]");
  runs.unshift({ company, decision, at: new Date().toISOString() });
  localStorage.setItem("investscout_runs", JSON.stringify(runs.slice(0, 50)));
}

export default function Research() {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("idle");
  const [completed, setCompleted] = useState(new Set());
  const [analysis, setAnalysis] = useState("");
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  async function runResearch(event) {
    event.preventDefault();
    const name = company.trim();
    if (!name || status === "running") return;

    setStatus("running");
    setCompleted(new Set());
    setAnalysis("");
    setDecision(null);
    setError("");
    setShowReport(false);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: name }),
      });
      if (!res.ok || !res.body) throw new Error("request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          handleEvent(JSON.parse(line.slice(5)), name);
        }
      }
      setStatus("done");
    } catch (err) {
      setError(err.message || "something went wrong");
      setStatus("error");
    }
  }

  function handleEvent(event, name) {
    if (event.type === "step") {
      setCompleted((prev) => new Set(prev).add(event.step));
    } else if (event.type === "analysis") {
      setAnalysis(event.analysis);
      setCompleted((prev) => new Set(prev).add("analyze"));
    } else if (event.type === "decision") {
      setDecision(event.decision);
      setCompleted((prev) => new Set(prev).add("decide"));
      saveRun(name, event.decision);
    } else if (event.type === "error") {
      throw new Error(event.message);
    }
  }

  return (
    <>
      <header>
        <h2>Research a company</h2>
        <p className="tagline">
          Give it a name. It researches the web, weighs the evidence, and calls
          invest or pass.
        </p>
      </header>

      <form className="search-form" onSubmit={runResearch}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Zomato, Nvidia, Ola Electric"
          disabled={status === "running"}
        />
        <button type="submit" disabled={status === "running" || !company.trim()}>
          {status === "running" ? "Researching..." : "Research"}
        </button>
      </form>

      {status !== "idle" && (
        <section className="pipeline">
          {PIPELINE.map((step) => {
            const state = stepState(step.id, completed, status);
            return (
              <div key={step.id} className={`step ${state}`}>
                <span className="dot" />
                <span>{step.label}</span>
              </div>
            );
          })}
        </section>
      )}

      {error && <div className="error">{error}</div>}

      {decision && (
        <section className="result">
          <div className="verdict-row">
            <span className={`verdict ${decision.verdict.toLowerCase()}`}>
              {decision.verdict}
            </span>
            <div className="confidence">
              <div className="confidence-label">
                Confidence {decision.confidence}%
              </div>
              <div className="confidence-track">
                <div
                  className="confidence-fill"
                  style={{ width: `${decision.confidence}%` }}
                />
              </div>
            </div>
          </div>

          <p className="thesis">{decision.thesis}</p>

          <div className="columns">
            <div>
              <h3>Strengths</h3>
              <ul>
                {decision.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Risks</h3>
              <ul>
                {decision.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="horizon">
            <strong>Horizon:</strong> {decision.horizon}
          </p>

          {analysis && (
            <div className="report">
              <button
                className="report-toggle"
                onClick={() => setShowReport((v) => !v)}
              >
                {showReport ? "Hide full analyst report" : "Show full analyst report"}
              </button>
              {showReport && <pre className="report-body">{analysis}</pre>}
            </div>
          )}
        </section>
      )}
    </>
  );
}
