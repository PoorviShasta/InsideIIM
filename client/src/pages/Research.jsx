import { useEffect, useRef, useState } from "react";
import { COMPANIES } from "../data/companies.js";

const SEARCH_STEPS = [
  { id: "profileSearch", label: "Company profile", log: "Profile research complete" },
  { id: "financialsSearch", label: "Financials", log: "Financials research complete" },
  { id: "newsSearch", label: "News and risks", log: "News and risk scan complete" },
  { id: "competitionSearch", label: "Competition", log: "Competitive landscape mapped" },
];

const PIPELINE = [
  ...SEARCH_STEPS,
  { id: "analyze", label: "Analyst review" },
  { id: "decide", label: "Final decision" },
];

const ALL_COMPANIES = Object.entries(COMPANIES).flatMap(([sector, list]) =>
  list.map((c) => ({ ...c, sector }))
);

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
  const [log, setLog] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState(Object.keys(COMPANIES)[0]);
  const [filter, setFilter] = useState("");
  const [shownConfidence, setShownConfidence] = useState(0);
  const consoleRef = useRef(null);

  useEffect(() => {
    if (status !== "running") return;
    const started = Date.now();
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    if (!decision) return;
    let value = 0;
    const target = decision.confidence;
    const id = setInterval(() => {
      value += Math.max(1, Math.round(target / 40));
      if (value >= target) {
        value = target;
        clearInterval(id);
      }
      setShownConfidence(value);
    }, 20);
    return () => clearInterval(id);
  }, [decision]);

  function pushLog(msg) {
    setLog((prev) => [
      ...prev,
      { at: new Date().toLocaleTimeString(), msg, key: Date.now() + msg },
    ]);
  }

  async function startResearch(rawName) {
    const name = (rawName || "").trim();
    if (!name || status === "running") return;

    setCompany(name);
    setStatus("running");
    setCompleted(new Set());
    setAnalysis("");
    setDecision(null);
    setError("");
    setShowReport(false);
    setLog([]);
    setElapsed(0);
    setShownConfidence(0);

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
    if (event.type === "start") {
      pushLog(`Dispatching four research agents for ${name}`);
    } else if (event.type === "step") {
      const step = SEARCH_STEPS.find((s) => s.id === event.step);
      if (step) pushLog(step.log);
      setCompleted((prev) => {
        const next = new Set(prev).add(event.step);
        if (SEARCH_STEPS.every((s) => next.has(s.id))) {
          pushLog("All sources gathered, analyst drafting the report");
        }
        return next;
      });
    } else if (event.type === "analysis") {
      setAnalysis(event.analysis);
      setCompleted((prev) => new Set(prev).add("analyze"));
      pushLog("Analyst report ready, investment committee is voting");
    } else if (event.type === "decision") {
      setDecision(event.decision);
      setCompleted((prev) => new Set(prev).add("decide"));
      pushLog(`Committee verdict: ${event.decision.verdict}`);
      saveRun(name, event.decision);
    } else if (event.type === "error") {
      throw new Error(event.message);
    }
  }

  const progress = Math.round((completed.size / PIPELINE.length) * 100);

  return (
    <>
      <header className="page-head">
        <div>
          <h2>Research workspace</h2>
          <p className="tagline">
            Pick a company or type one. Watch the agents work in real time.
          </p>
        </div>
        {status !== "idle" && (
          <span className={`timer-chip ${status}`}>
            {status === "running" ? "Analyzing" : status === "done" ? "Complete" : "Failed"}
            <em>{elapsed}s</em>
          </span>
        )}
      </header>

      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          startResearch(company);
        }}
      >
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Type any company, listed or private"
          disabled={status === "running"}
        />
        <button type="submit" disabled={status === "running" || !company.trim()}>
          {status === "running" ? "Researching..." : "Run analysis"}
        </button>
      </form>

      {status === "idle" && (
        <section className="universe anim">
          <div className="universe-head">
            <input
              className="universe-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={`Filter ${ALL_COMPANIES.length} companies...`}
            />
            <span className="universe-count">
              {filter.trim()
                ? `${ALL_COMPANIES.filter((c) =>
                    c.name.toLowerCase().includes(filter.trim().toLowerCase())
                  ).length} matches`
                : `${ALL_COMPANIES.length} companies across ${
                    Object.keys(COMPANIES).length
                  } sectors`}
            </span>
          </div>

          {!filter.trim() && (
            <div className="tabs">
              {Object.keys(COMPANIES).map((sector) => (
                <button
                  key={sector}
                  type="button"
                  className={`tab ${tab === sector ? "active" : ""}`}
                  onClick={() => setTab(sector)}
                >
                  {sector}
                </button>
              ))}
            </div>
          )}

          <div className="company-grid">
            {(filter.trim()
              ? ALL_COMPANIES.filter((c) =>
                  c.name.toLowerCase().includes(filter.trim().toLowerCase())
                )
              : COMPANIES[tab].map((c) => ({ ...c, sector: tab }))
            ).map((c, i) => (
              <button
                key={`${c.sector}-${c.name}`}
                type="button"
                className="company-card anim"
                style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                onClick={() => startResearch(c.name)}
              >
                <span className="company-avatar">{c.name[0]}</span>
                <span className="company-info">
                  <strong>{c.name}</strong>
                  <small>{filter.trim() ? `${c.tag} | ${c.sector}` : c.tag}</small>
                </span>
                <span className="company-go">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {status !== "idle" && (
        <section className="run anim">
          <div className="progress-wrap">
            <div className="progress-meta">
              <span>Pipeline progress</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="run-grid">
            <div className="timeline">
              {PIPELINE.map((step) => {
                const state = stepState(step.id, completed, status);
                return (
                  <div key={step.id} className={`tstep ${state}`}>
                    <span className="tstep-dot" />
                    <span className="tstep-label">{step.label}</span>
                    <span className="tstep-state">
                      {state === "done" ? "done" : state === "running" ? "running" : "queued"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="console" ref={consoleRef}>
              {log.map((line) => (
                <div key={line.key} className="console-line">
                  <span className="console-time">{line.at}</span>
                  <span>{line.msg}</span>
                </div>
              ))}
              {status === "running" && (
                <div className="console-line">
                  <span className="console-time">now</span>
                  <span className="cursor">working</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {error && <div className="error anim">{error}</div>}

      {decision && (
        <section className="result reveal">
          <div className="verdict-row">
            <span className={`verdict pop ${decision.verdict.toLowerCase()}`}>
              {decision.verdict}
            </span>
            <div className="confidence">
              <div className="confidence-label">
                Confidence {shownConfidence}%
              </div>
              <div className="confidence-track">
                <div
                  className="confidence-fill"
                  style={{ width: `${shownConfidence}%` }}
                />
              </div>
            </div>
          </div>

          <div className="meta-row anim" style={{ animationDelay: "120ms" }}>
            <span className="meta-chip">{elapsed}s total</span>
            <span className="meta-chip">{PIPELINE.length}/6 checks passed</span>
            <span className="meta-chip">
              {decision.strengths.length} strengths, {decision.risks.length} risks
            </span>
          </div>

          <p className="thesis anim" style={{ animationDelay: "200ms" }}>
            {decision.thesis}
          </p>

          <div className="columns anim" style={{ animationDelay: "300ms" }}>
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

          <p className="horizon anim" style={{ animationDelay: "380ms" }}>
            <strong>Horizon:</strong> {decision.horizon}
          </p>

          {analysis && (
            <div className="report anim" style={{ animationDelay: "440ms" }}>
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

      {status === "done" && (
        <button
          className="ghost-btn again anim"
          onClick={() => {
            setStatus("idle");
            setCompany("");
            setDecision(null);
            setAnalysis("");
            setLog([]);
          }}
        >
          Research another company
        </button>
      )}
    </>
  );
}
