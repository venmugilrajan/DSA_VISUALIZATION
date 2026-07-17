import { useState, useEffect } from "react";
import { UploadPanel } from "./components/UploadPanel";
import { ConfirmStructure } from "./components/ConfirmStructure";
import { PromptInput } from "./components/PromptInput";
import { StepPlayer } from "./components/StepPlayer";
import { ParsedStructure, StepTrace, StructureClassification } from "./types/contracts";
import { Sparkles, HelpCircle, Sun, Moon } from "lucide-react";
import { HeroMiniViz } from "./components/HeroMiniViz";

function App() {
  const [parsedClassification, setParsedClassification] = useState<StructureClassification | null>(null);
  const [confirmedStructure, setConfirmedStructure] = useState<ParsedStructure | null>(null);
  const [stepTrace, setStepTrace] = useState<StepTrace | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("");

  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleImageClassified = (classification: StructureClassification, base64: string, mime: string) => {
    setParsedClassification(classification);
    setImageBase64(base64);
    setMimeType(mime);
    setConfirmedStructure(null);
    setStepTrace(null);
    setError("");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "sandbox") {
      handleImageClassified({
        detected_type: "array",
        confidence: 1.0,
        visual_reasoning: "Manual structure sandbox initialization via URL."
      }, "manual", "image/png");
    }
  }, []);

  const handleStructureConfirmed = (confirmed: ParsedStructure) => {
    setConfirmedStructure(confirmed);
    setStepTrace(null);
    setError("");
  };

  const handleSubmitPrompt = async (promptText: string) => {
    if (!confirmedStructure) return;
    
    setIsLlmLoading(true);
    setError("");

    try {
      const interpretResponse = await fetch("http://localhost:5000/api/interpret-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          structure_type: confirmedStructure.type,
        }),
      });

      if (!interpretResponse.ok) {
        const errData = await interpretResponse.json();
        throw new Error(errData.error || "Failed to interpret prompt");
      }

      const intent = await interpretResponse.json();

      if (intent.clarification_needed) {
        throw new Error(`Ambiguous Request: ${intent.clarification_needed}`);
      }

      const stepsResponse = await fetch("http://localhost:5000/api/generate-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          structure: confirmedStructure,
          intent: intent,
        }),
      });

      if (!stepsResponse.ok) {
        const errData = await stepsResponse.json();
        throw new Error(errData.error || "Failed to generate animation steps");
      }

      const trace = await stepsResponse.json();
      setStepTrace(trace);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process algorithm request.");
    } finally {
      setIsLlmLoading(false);
    }
  };

  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleReset = () => {
    window.history.pushState({}, "", window.location.pathname);
    setParsedClassification(null);
    setConfirmedStructure(null);
    setStepTrace(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Header NavBar */}
      <header className="border-b border-borderColor bg-surface/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-[95%] xl:max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight font-display">
                DSA <span className="text-primary">VISION</span>
              </h1>
              <div className="text-[10px] text-textMuted font-semibold tracking-wider uppercase">
                AI-Powered Algorithm Engine
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-panel border border-borderColor hover:bg-borderColor transition-all"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <a
              href="?mode=sandbox"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "?mode=sandbox");
                handleImageClassified({
                  detected_type: "array",
                  confidence: 1.0,
                  visual_reasoning: "Manual structure sandbox initialization."
                }, "manual", "image/png");
              }}
              className="text-textMuted hover:text-textMain text-xs font-semibold flex items-center gap-1.5 transition-colors border border-borderColor rounded-xl px-3 py-2 bg-panel hover:bg-borderColor"
            >
              ✍ Custom Sandbox
            </a>

            <button
              onClick={() => setShowHelpModal(true)}
              className="text-textMuted hover:text-textMain text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              How it works
            </button>
            {confirmedStructure && (
              <button
                onClick={handleReset}
                className="text-xs bg-panel hover:bg-borderColor text-textMain font-bold px-3 py-1.5 rounded-lg border border-borderColor transition-all"
              >
                Reset App
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[95%] xl:max-w-[1600px] w-full mx-auto px-4 py-8 flex flex-col gap-8 animate-fadeIn">
        
        {/* Error notification banner */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-4 rounded-2xl text-sm font-semibold flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Phase 1: Upload */}
        {!parsedClassification && (
          <div className="w-full flex flex-col gap-8">
            <div className="bg-surface p-6 md:p-8 rounded-3xl border border-borderColor flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-2xl font-black mb-2 font-display">DSA Visualizations from a Sketch</h2>
                <p className="text-sm text-textMuted leading-relaxed">
                  Draw or snap an image of a data structure, let the vision AI decode it, and prompt any algorithm to watch it run step-by-step.
                </p>
              </div>
              {/* Mini sorting visualization hero feature */}
              <div className="shrink-0">
                <HeroMiniViz />
              </div>
            </div>
            {/* Create Custom Structure Section */}
            <div className="bg-surface p-6 rounded-3xl border border-borderColor shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-textMain mb-1">✍ Custom Sandbox Mode</h3>
                <p className="text-xs text-textMuted">
                  Create a custom array, tree, linked list, or graph manually and run algorithms on it without uploading an image.
                </p>
              </div>
              <button
                onClick={() => {
                  handleImageClassified({
                    detected_type: "array",
                    confidence: 1.0,
                    visual_reasoning: "Manual structure sandbox initialization."
                  }, "manual", "image/png");
                }}
                className="w-full sm:w-auto bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2"
              >
                Create Custom Structure
              </button>
            </div>

            <UploadPanel
              onImageClassified={handleImageClassified}
              isLoading={isLlmLoading}
              setIsLoading={setIsLlmLoading}
              setError={setError}
            />
          </div>
        )}

        {/* Phase 2: Verification */}
        {parsedClassification && !confirmedStructure && (
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
            <button
              onClick={handleReset}
              className="self-start text-xs font-bold text-textMuted hover:text-textMain transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-borderColor bg-panel shadow-sm"
            >
              ← Back to Upload
            </button>
            <ConfirmStructure
              classification={parsedClassification}
              imageBase64={imageBase64}
              mimeType={mimeType}
              onStructureConfirmed={handleStructureConfirmed}
            />
          </div>
        )}

        {/* Phase 3: Prompt & Play */}
        {confirmedStructure && (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => {
                setConfirmedStructure(null);
                setStepTrace(null);
                setError("");
              }}
              className="self-start text-xs font-bold text-textMuted hover:text-textMain transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-borderColor bg-panel shadow-sm"
            >
              ← Back to Edit Structure
            </button>
            <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Prompt Column */}
              <div className="w-full lg:w-[350px] flex flex-col gap-6">
                <PromptInput
                  structureType={confirmedStructure.type}
                  onSubmitPrompt={handleSubmitPrompt}
                  isLoading={isLlmLoading}
                />
                
                {/* Info checklist helper */}
                <div className="bg-surface border border-borderColor p-5 rounded-2xl text-xs text-textMuted shadow-sm">
                  <div className="font-bold text-textMain mb-2 uppercase tracking-wide">Status Check</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-success font-semibold">
                      <span>✓</span> Structure confirmed ({confirmedStructure.type})
                    </div>
                    <div className="flex items-center gap-2 text-success font-semibold">
                      <span>✓</span> Extraction complete
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={stepTrace ? "text-success font-semibold" : "text-textMuted"}>
                        {stepTrace ? "✓" : "○"}
                      </span>
                      <span className={stepTrace ? "text-textMain font-semibold" : ""}>
                        {stepTrace ? "Algorithm Trace Ready" : "Awaiting Prompt execution"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Trace Player Column */}
              <div className="flex-1 w-full">
                {stepTrace ? (
                  <StepPlayer trace={stepTrace} />
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-borderColor rounded-3xl p-8 bg-surface/50 text-center shadow-inner">
                    <div className="p-4 bg-panel border border-borderColor text-primary rounded-2xl animate-pulse">
                      ⚡
                    </div>
                    <h3 className="text-textMain font-bold mt-4">Select or type an action to visualize</h3>
                    <p className="text-xs text-textMuted mt-1 max-w-xs leading-relaxed">
                      Once you execute an action, a full deterministic animation playback timeline will load here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-borderColor py-6 bg-surface mt-12 transition-colors duration-300">
        <div className="max-w-[95%] xl:max-w-[1600px] mx-auto px-4 text-center text-xs text-textMuted font-semibold">
          &copy; {new Date().getFullYear()} DSA Vision — Antigravity Advanced Coding Agent
        </div>
      </footer>

      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-surface border border-borderColor rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-textMuted hover:text-textMain text-lg font-bold p-2 transition-all"
            >
              ✕
            </button>
            <h2 className="text-xl font-black mb-4 font-display flex items-center gap-2 text-textMain">
              <span className="p-1.5 bg-primary/10 text-primary rounded-lg">💡</span> How DSA Vision Works
            </h2>
            <div className="space-y-4 text-sm text-textMuted max-h-[60vh] overflow-y-auto pr-2">
              <div className="border-b border-borderColor pb-3">
                <h4 className="font-bold text-textMain text-sm mb-1">1. Capture & Upload</h4>
                <p className="text-xs leading-relaxed">
                  Draw any data structure on paper, snap a photo, and upload it. The app supports <strong>Arrays, Linked Lists, Stacks, Queues, Binary Trees, and Graphs</strong>.
                </p>
              </div>
              <div className="border-b border-borderColor pb-3">
                <h4 className="font-bold text-textMain text-sm mb-1">2. AI Vision Decoding (Primary)</h4>
                <p className="text-xs leading-relaxed">
                  The backend cascades your request through a powerful suite of vision models (<strong>Gemini, Claude, Groq, and OpenRouter</strong>). The AI detects coordinates, edge weights, and tree branch directions.
                </p>
              </div>
              <div className="border-b border-borderColor pb-3">
                <h4 className="font-bold text-textMain text-sm mb-1">3. Deterministic Offline Fallback (Local)</h4>
                <p className="text-xs leading-relaxed">
                  If you are offline or API keys are unavailable, the backend automatically activates a local CV engine:
                </p>
                <ul className="list-disc pl-5 mt-1 text-[11px] space-y-1">
                  <li><strong>Tesseract OCR:</strong> Segments the node bounding boxes and reads the text values inside them.</li>
                  <li><strong>Bresenham Pixel Tracer:</strong> Scans a 5x5 neighborhood along coordinate paths to identify connecting line strokes.</li>
                </ul>
              </div>
              <div className="border-b border-borderColor pb-3">
                <h4 className="font-bold text-textMain text-sm mb-1">4. Visual Editor & Sandbox Mode</h4>
                <p className="text-xs leading-relaxed">
                  Edit the parsed nodes and edges using our code-free <strong>Visual Form Editor</strong>. Alternatively, skip upload entirely by using <strong>✍ Custom Sandbox Mode</strong> to build structures manually.
                </p>
              </div>
              <div className="border-b border-borderColor pb-3">
                <h4 className="font-bold text-textMain text-sm mb-1">5. Run Predefined or Custom Algorithms</h4>
                <p className="text-xs leading-relaxed">
                  Execute standard procedures (like <em>Inorder Traversal, BFS, DFS, Dijkstra, Sorts</em>) or type custom requests (like <em>"reverse the array"</em> or <em>"O(N) search"</em>). The step trace player highlights active nodes, paths, and values in real-time.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-primary hover:bg-opacity-90 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/10"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
