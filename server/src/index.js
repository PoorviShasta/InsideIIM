import "dotenv/config";
import express from "express";
import cors from "cors";
import { graph } from "./agent.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/research", async (req, res) => {
  const company = (req.body?.company || "").trim();
  if (!company) {
    return res.status(400).json({ error: "company name is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  try {
    send({ type: "start", company });
    const stream = await graph.stream({ company }, { streamMode: "updates" });
    for await (const update of stream) {
      for (const [node, value] of Object.entries(update)) {
        if (node === "decide") {
          send({ type: "decision", decision: value.decision });
        } else if (node === "analyze") {
          send({ type: "analysis", analysis: value.analysis });
        } else {
          send({ type: "step", step: node });
        }
      }
    }
    send({ type: "done" });
  } catch (err) {
    send({ type: "error", message: err.message || "research failed" });
  } finally {
    res.end();
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
