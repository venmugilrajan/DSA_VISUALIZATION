import { Router, Request, Response } from "express";
import { generateStepTrace } from "../engine/index";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { structure, intent } = req.body;
    if (!structure || !intent) {
      res.status(400).json({ error: "Missing structure or intent parameters" });
      return;
    }

    const trace = await generateStepTrace(structure, intent);
    res.json(trace);
  } catch (error: any) {
    console.error("Error in generate-steps endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to generate steps" });
  }
});

export default router;
