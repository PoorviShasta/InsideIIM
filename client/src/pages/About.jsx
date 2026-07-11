const STEPS = [
  {
    n: "01",
    title: "Fan out research",
    body: "Four LangGraph nodes run Tavily web searches in parallel: company profile and business model, financial results and valuation, recent news and controversies, competitors and market outlook.",
  },
  {
    n: "02",
    title: "Analyst review",
    body: "Once all sources land, the LLM acts as an equity research analyst. It writes a grounded report covering moat, financial health, growth, competitive position and risks, and flags anything stale or promotional in the sources.",
  },
  {
    n: "03",
    title: "Investment committee",
    body: "A second LLM call reads only the analyst report and returns a structured decision: INVEST or PASS, confidence, a thesis that justifies the verdict, concrete strengths and risks, and a horizon.",
  },
  {
    n: "04",
    title: "Live streaming",
    body: "Every graph step is streamed to the browser over server sent events, so you watch the pipeline complete in real time instead of staring at a spinner.",
  },
];

const STACK = [
  ["Frontend", "React with Vite and React Router"],
  ["Backend", "Node.js with Express"],
  ["Agent", "LangGraph.js on LangChain.js"],
  ["LLM", "Groq, llama 3.3 70b on the free tier"],
  ["Search", "Tavily web search, free tier"],
];

export default function About() {
  return (
    <>
      <header>
        <h2>How it works</h2>
        <p className="tagline">
          One state graph, four parallel researchers, two LLM roles, zero paid
          APIs.
        </p>
      </header>

      <section className="steps-list">
        {STEPS.map((s) => (
          <div key={s.n} className="step-row">
            <span className="step-num">{s.n}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="stack">
        <h3>The stack</h3>
        <div className="stack-grid">
          {STACK.map(([label, value]) => (
            <div key={label} className="stack-item">
              <span className="stack-label">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
