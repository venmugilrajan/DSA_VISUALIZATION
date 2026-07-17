import { Router, Request, Response } from "express";
import { interpretPrompt } from "../services/llm";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { prompt, structure_type } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt parameter" });
      return;
    }

    const intent = await interpretPrompt(prompt, structure_type);
    res.json(intent);
  } catch (error: any) {
    console.error("Error in interpret-prompt endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to interpret prompt" });
  }
});

export default router;
