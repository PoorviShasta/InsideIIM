# InvestScout, an AI Investment Research Agent

## Overview

Type in a company name and the agent does the rest. It fires off four web research tracks in parallel (company profile, financials, recent news and risks, competition), has an LLM write a grounded analyst report from the raw sources, and then makes a final call: INVEST or PASS, with a confidence score, a written thesis, concrete strengths and risks, and a suggested holding period. The whole pipeline streams to the browser live so you can watch each research step finish in real time.

The app has four pages: a landing page, the research workspace, a history page with your past calls saved in the browser, and a how it works page. Everything runs on free API tiers, there is nothing to pay for.

Built for the InsideIIM x Altuni AI Labs take home assignment.

## Tech Stack

- React (Vite) with React Router for the frontend, plain JavaScript
- Node.js with Express for the backend
- LangGraph.js for the agent orchestration, LangChain.js under the hood
- Groq (llama 3.3 70b) as the LLM, free tier
- Tavily for web search, free tier

## How to Run It

You need Node 18+ and two free API keys:

- `GROQ_API_KEY` from https://console.groq.com (free, no card needed)
- `TAVILY_API_KEY` from https://tavily.com (free tier, 1000 searches a month)

```bash
# 1. backend
cd server
npm install
cp .env.example .env   # paste your keys into .env
npm run dev            # starts on http://localhost:3001

# 2. frontend (second terminal)
cd client
npm install
npm run dev            # starts on http://localhost:5173
```

Open http://localhost:5173, go to Research, type a company name, hit Research.

`GROQ_MODEL` in `.env` is optional and defaults to `llama-3.3-70b-versatile`.

## How It Works

The agent is a LangGraph state graph on the server:

```
                 ┌─ profileSearch ──────┐
                 ├─ financialsSearch ───┤
START ── fan out ┤                      ├── analyze ── decide ── END
                 ├─ newsSearch ─────────┤
                 └─ competitionSearch ──┘
```

1. **Fan out research (parallel).** Four graph nodes run Tavily searches at the same time, each with a targeted query: business model, financial results and valuation, recent news and controversies, competitors and market outlook. Each node writes its formatted sources (title, url, content) into the shared graph state.
2. **Analyze.** Once all four searches complete, the LLM acts as an equity research analyst. It gets the raw sources and writes a report covering moat, financial health, growth, competitive position and risks. The prompt explicitly tells it to stay grounded in the provided sources and to flag anything stale or promotional.
3. **Decide.** A second LLM call acts as the investment committee. It reads the analyst report and returns a structured decision, enforced with a Zod schema through `withStructuredOutput`: verdict (INVEST or PASS), confidence 0 to 100, a 2 to 4 sentence thesis, concrete strengths and risks, and a horizon.

The Express endpoint `POST /api/research` runs the graph with `streamMode: "updates"` and forwards every node completion to the browser as a server sent event. The React client parses the stream and updates a live pipeline view, then renders the verdict card when the decision arrives. Finished runs are saved to localStorage and show up on the History page.

## Key Decisions and Trade-offs

- **LangGraph over a plain chain.** The fan out and join structure is exactly what a state graph is for. The four searches run concurrently, which cuts research time to roughly a quarter of running them in sequence.
- **Two LLM calls instead of one.** Separating "analyze the evidence" from "make the call" gives noticeably better decisions. The decision prompt only sees the distilled report, so the verdict is grounded in the analysis rather than raw search noise.
- **Structured output for the decision.** The verdict is a Zod validated object, not free text, so the UI never has to parse prose and the shape is guaranteed.
- **Groq as the LLM.** Free tier, very fast inference, and llama 3.3 70b handles tool calling well enough for the structured decision. The trade-off is a rate limit on the free tier, fine for a demo, and slightly weaker analysis than a frontier model.
- **Tavily for search.** Purpose built for LLM agents, returns cleaned page content instead of raw HTML, free tier covers a thousand runs a month. The trade-off is a second API key for whoever runs the project.
- **Server sent events over polling or websockets.** A research run takes under a minute, so live feedback matters. SSE gives streaming with plain HTTP and about ten lines of code on each side, no websocket infra needed.
- **History in localStorage, not a database.** Zero setup for whoever runs it, and per browser history is the right scope for a demo. The trade-off is no cross device history.
- **What I left out.** No authentication, no hard number crunching (P/E ratios, DCF). The agent reasons over reported figures found in text sources rather than a market data API, which keeps it working for private and unlisted companies too.

## Example Runs

> TODO: paste real outputs here after running locally with your keys.
> Suggested companies: one large cap (Nvidia), one Indian consumer company (Zomato), one troubled company (Byju's) to show a PASS.

**Company:**
**Verdict:**
**Confidence:**
**Thesis:**

## What I Would Improve With More Time

- Pull structured market data (price history, ratios) from a free finance API and blend it with the text research
- A verification pass where a second agent fact checks the analyst report against the sources before the decision
- Cache research per company for a few hours to save rate limit on repeated queries
- Move history to a small SQLite store so it survives across devices
- Deploy on Vercel (client) and Render (server) with a shared link
- Evaluate decisions against a small labelled set of known good and bad investments to tune the prompts

## AI Usage

AI usage was mandatory for this assignment and I leaned on it heavily: the project was built in a Claude Code session. The full chat transcript of the build session is included in `transcripts/` for the bonus points, it shows the thought process, the dead ends (a node naming clash with LangGraph state channels, Tavily returning error objects instead of throwing) and how they were fixed.

## Notes on Assumptions

- "Company" is taken as given, there is no disambiguation step. If two companies share a name, the search queries decide.
- The agent is intentionally conservative: the decision prompt requires the thesis to justify the verdict from the report, and a PASS comes with a note on when to revisit.
- This is a research demo, not financial advice.
