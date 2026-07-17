import { Router, Request, Response } from "express";
import multer from "multer";
import { extractStructureFromImage } from "../services/llm";
import { parseStructureLocally } from "../services/localCV";
import { StructureType } from "../types/contracts";

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  try {
    let imageBase64: string;
    let mimeType: string;
    let type: StructureType;

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype;
      type = req.body.type as StructureType;
    } else if (req.body.image && req.body.mimeType && req.body.type) {
      imageBase64 = req.body.image;
      mimeType = req.body.mimeType;
      type = req.body.type as StructureType;
    } else {
      res.status(400).json({ error: "Missing image, mimeType, or confirmed type" });
      return;
    }

    if (!type) {
      res.status(400).json({ error: "Structure type must be confirmed before extraction" });
      return;
    }

    let structure;
    try {
      structure = await extractStructureFromImage(imageBase64, mimeType, type);
    } catch (llmError) {
      console.warn("LLM value extraction failed, falling back to local OCR CV parser...", llmError);
      structure = await parseStructureLocally(imageBase64, type);
    }
    res.json(structure);
  } catch (error: any) {
    console.error("Error in extract-structure endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to extract structure values" });
  }
});

export default router;
