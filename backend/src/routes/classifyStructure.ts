import { Router, Request, Response } from "express";
import multer from "multer";
import { classifyStructureFromImage } from "../services/llm";
import { classifyStructureLocally } from "../services/localCV";

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  try {
    let imageBase64: string;
    let mimeType: string;

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype;
    } else if (req.body.image && req.body.mimeType) {
      imageBase64 = req.body.image;
      mimeType = req.body.mimeType;
    } else {
      res.status(400).json({ error: "Missing image file or base64 data" });
      return;
    }

    let classification;
    try {
      classification = await classifyStructureFromImage(imageBase64, mimeType);
    } catch (llmError) {
      console.warn("LLM structure classification failed, trying local Tesseract parser...", llmError);
      classification = await classifyStructureLocally(imageBase64);
    }
    res.json(classification);
  } catch (error: any) {
    console.error("Error in classify-structure endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to classify structure" });
  }
});

export default router;
