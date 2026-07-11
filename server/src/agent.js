import { ChatAnthropic } from "@langchain/anthropic";
import { TavilySearch } from "@langchain/tavily";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { z } from "zod";

const model = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
  maxTokens: 4096,
});

const search = new TavilySearch({ maxResults: 5 });

const decisionSchema = z.object({
  verdict: z.enum(["INVEST", "PASS"]),
  confidence: z.number().min(0).max(100),
  thesis: z.string(),
  strengths: z.array(z.string()).min(2).max(5),
  risks: z.array(z.string()).min(2).max(5),
  horizon: z.string(),
});

const ResearchState = Annotation.Root({
  company: Annotation(),
  profile: Annotation(),
  financials: Annotation(),
  news: Annotation(),
  competition: Annotation(),
  analysis: Annotation(),
  decision: Annotation(),
});

async function runSearch(query) {
  const response = await search.invoke({ query });
  const parsed = typeof response === "string" ? JSON.parse(response) : response;
  const results = parsed.results || [];
  if (!results.length) return "No results found.";
  return results
    .map((r) => `Source: ${r.title} (${r.url})\n${r.content}`)
    .join("\n\n");
}

async function profileNode(state) {
  const profile = await runSearch(
    `${state.company} company overview business model products services`
  );
  return { profile };
}

async function financialsNode(state) {
  const financials = await runSearch(
    `${state.company} revenue profit financial results valuation funding`
  );
  return { financials };
}

async function newsNode(state) {
  const news = await runSearch(
    `${state.company} latest news risks controversies lawsuits layoffs`
  );
  return { news };
}

async function competitionNode(state) {
  const competition = await runSearch(
    `${state.company} competitors market share industry growth outlook`
  );
  return { competition };
}

async function analyzeNode(state) {
  const response = await model.invoke([
    {
      role: "system",
      content:
        "You are a rigorous equity research analyst. Write a grounded analysis based only on the research provided. Cover business model and moat, financial health, growth trajectory, competitive position, and key risks. Flag anything that looks stale, contradictory, or promotional in the sources. Be specific and cite figures from the research where available.",
    },
    {
      role: "user",
      content: `Company: ${state.company}\n\n[COMPANY PROFILE]\n${state.profile}\n\n[FINANCIALS]\n${state.financials}\n\n[RECENT NEWS AND RISKS]\n${state.news}\n\n[COMPETITIVE LANDSCAPE]\n${state.competition}`,
    },
  ]);
  return { analysis: response.content };
}

async function decideNode(state) {
  const decider = model.withStructuredOutput(decisionSchema, {
    name: "investment_decision",
  });
  const decision = await decider.invoke([
    {
      role: "system",
      content:
        "You are the investment committee making a final call on a company. Based on the analyst report, decide INVEST or PASS. Confidence is 0 to 100. The thesis must be 2 to 4 sentences and directly justify the verdict. Strengths and risks must be concrete points pulled from the report, not generic statements. Horizon is the suggested holding period or a note on when to revisit a PASS.",
    },
    {
      role: "user",
      content: `Company: ${state.company}\n\nAnalyst report:\n${state.analysis}`,
    },
  ]);
  return { decision };
}

export const graph = new StateGraph(ResearchState)
  .addNode("profileSearch", profileNode)
  .addNode("financialsSearch", financialsNode)
  .addNode("newsSearch", newsNode)
  .addNode("competitionSearch", competitionNode)
  .addNode("analyze", analyzeNode)
  .addNode("decide", decideNode)
  .addEdge(START, "profileSearch")
  .addEdge(START, "financialsSearch")
  .addEdge(START, "newsSearch")
  .addEdge(START, "competitionSearch")
  .addEdge(
    ["profileSearch", "financialsSearch", "newsSearch", "competitionSearch"],
    "analyze"
  )
  .addEdge("analyze", "decide")
  .addEdge("decide", END)
  .compile();
