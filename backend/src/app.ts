import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import classifyStructureRoute from "./routes/classifyStructure";
import extractStructureRoute from "./routes/extractStructure";
import interpretPromptRoute from "./routes/interpretPrompt";
import generateStepsRoute from "./routes/generateSteps";

dotenv.config({ override: true });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/classify-structure", classifyStructureRoute);
app.use("/api/extract-structure", extractStructureRoute);
app.use("/api/interpret-prompt", interpretPromptRoute);
app.use("/api/generate-steps", generateStepsRoute);

// Basic health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", mode: (process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY) ? "live" : "mock" });
});

// DSA Vision backend listening on port
app.listen(port, () => {
  console.log(`DSA Vision backend listening on port ${port}`);
});
