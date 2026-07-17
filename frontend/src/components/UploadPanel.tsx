import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { StructureType } from "../types/contracts";

interface UploadPanelProps {
  onImageClassified: (classification: any, imageBase64: string, mimeType: string) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  setError: (val: string) => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onImageClassified,
  isLoading,
  setIsLoading,
  setError,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG/JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    setError("");

    try {
      const base64String = await fileToBase64(file);
      const mimeType = file.type;

      const response = await fetch("http://localhost:5000/api/classify-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64String.split(",")[1] || base64String,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to classify structure from image");
      }

      const result = await response.json();
      onImageClassified(result, base64String.split(",")[1] || base64String, mimeType);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during image classification.");
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const loadMock = async (type: "array" | "tree" | "graph" | "linked_list") => {
    setIsLoading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 600));
      
      const mockClass = {
        detected_type: type === "tree" ? "binary_tree" : type,
        confidence: 0.95,
        visual_reasoning: `Mock classification loaded for ${type}.`,
        alternate_guess: type === "array" ? "linked_list" : undefined
      };
      
      onImageClassified(mockClass, "mock-base64", "image/png");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      {/* Upload Zone */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-textMain mb-3">1. Upload Image of Data Structure</h3>
        <form
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
          onClick={triggerInput}
          className={`flex-1 min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-borderColor bg-surface hover:border-primary/50 hover:shadow-md"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={isLoading}
          />
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-primary font-semibold animate-pulse">AI is parsing your image...</p>
              <p className="text-xs text-textMuted mt-1">Transcribing structures & connections</p>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6 text-center">
              <div className="p-4 bg-primaryLight rounded-full border border-primary/20 text-primary mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-textMain font-semibold mb-1">
                Drag & Drop or <span className="text-primary hover:underline">Browse</span>
              </p>
              <p className="text-xs text-textMuted max-w-xs">
                Supports PNG, JPG, or JPEG. Works with handwritten lists, arrays, trees, and graphs.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Pre-sets / Quick sandbox panel */}
      <div className="w-full md:w-80 flex flex-col justify-between bg-surface p-5 rounded-2xl border border-borderColor shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-textMain mb-3 uppercase tracking-wider">No Image? Try Sandbox Presets</h4>
          <p className="text-xs text-textMuted mb-4">
            Directly populate structure presets to test visualizers and custom prompts immediately.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => loadMock("array")}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-panel hover:bg-borderColor px-3 py-2.5 rounded-xl border border-borderColor text-xs font-bold text-textMain transition-all"
            >
              Array [9,3,15...]
            </button>
            <button
              onClick={() => loadMock("linked_list")}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-panel hover:bg-borderColor px-3 py-2.5 rounded-xl border border-borderColor text-xs font-bold text-textMain transition-all"
            >
              Linked List
            </button>
            <button
              onClick={() => loadMock("tree")}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-panel hover:bg-borderColor px-3 py-2.5 rounded-xl border border-borderColor text-xs font-bold text-textMain transition-all"
            >
              Binary Tree
            </button>
            <button
              onClick={() => loadMock("graph")}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-panel hover:bg-borderColor px-3 py-2.5 rounded-xl border border-borderColor text-xs font-bold text-textMain transition-all"
            >
              Weighted Graph
            </button>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-4 pt-4 border-t border-borderColor flex items-center gap-3">
            <div className="w-12 h-12 bg-panel rounded-lg overflow-hidden border border-borderColor flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
            </div>
            <div>
              <div className="text-xs text-textMain font-bold truncate max-w-[180px]">Uploaded Image</div>
              <div className="text-[10px] text-primary font-semibold">Loaded successfully</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
