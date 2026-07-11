import { useState } from "react";
import { Link } from "react-router-dom";

function loadRuns() {
  try {
    return JSON.parse(localStorage.getItem("investscout_runs") || "[]");
  } catch {
    return [];
  }
}

export default function History() {
  const [runs, setRuns] = useState(loadRuns);

  function clearAll() {
    localStorage.removeItem("investscout_runs");
    setRuns([]);
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h2>Research history</h2>
          <p className="tagline">
            Your past calls, saved locally in this browser.
          </p>
        </div>
        {runs.length > 0 && (
          <button className="ghost-btn" onClick={clearAll}>
            Clear all
          </button>
        )}
      </header>

      {runs.length === 0 ? (
        <div className="empty">
          <p>No research yet.</p>
          <Link to="/research" className="cta">
            Run your first one
          </Link>
        </div>
      ) : (
        <section className="history-list">
          {runs.map((run) => (
            <div key={run.at} className="history-card">
              <div className="history-top">
                <div>
                  <h3>{run.company}</h3>
                  <span className="history-date">
                    {new Date(run.at).toLocaleString()}
                  </span>
                </div>
                <div className="history-meta">
                  <span
                    className={`verdict small ${run.decision.verdict.toLowerCase()}`}
                  >
                    {run.decision.verdict}
                  </span>
                  <span className="history-confidence">
                    {run.decision.confidence}%
                  </span>
                </div>
              </div>
              <p className="history-thesis">{run.decision.thesis}</p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
