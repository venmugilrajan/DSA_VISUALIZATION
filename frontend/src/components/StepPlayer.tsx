import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, FastForward } from "lucide-react";
import { StepTrace } from "../types/contracts";

// Renderers
import { ArrayRenderer } from "./renderers/ArrayRenderer";
import { LinkedListRenderer } from "./renderers/LinkedListRenderer";
import { StackQueueRenderer } from "./renderers/StackQueueRenderer";
import { TreeRenderer } from "./renderers/TreeRenderer";
import { GraphRenderer } from "./renderers/GraphRenderer";
import { TraceTimeline } from "./TraceTimeline";

interface StepPlayerProps {
  trace: StepTrace;
}

export const StepPlayer: React.FC<StepPlayerProps> = ({ trace }) => {
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 0.5x, 2x, etc.
  const intervalRef = useRef<any>(null);

  const frames = trace.frames || [];
  const currentFrame = frames[currentFrameIdx] || null;

  useEffect(() => {
    // Reset back to start frame if trace changes
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (isPlaying) {
      const baseDelay = 1200; // ms per step at 1x
      const delay = baseDelay / speed;

      intervalRef.current = setInterval(() => {
        setCurrentFrameIdx((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, frames.length]);

  const handlePlayPause = () => {
    if (currentFrameIdx >= frames.length - 1) {
      setCurrentFrameIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((prev) => Math.min(frames.length - 1, prev + 1));
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrameIdx(Number(e.target.value));
  };

  const renderActiveStructure = () => {
    if (!currentFrame) return null;
    const type = trace.structure_type;

    switch (type) {
      case "array":
        return <ArrayRenderer frame={currentFrame} />;
      case "linked_list":
        return <LinkedListRenderer frame={currentFrame} />;
      case "stack":
        return <StackQueueRenderer frame={currentFrame} type="stack" />;
      case "queue":
        return <StackQueueRenderer frame={currentFrame} type="queue" />;
      case "binary_tree":
        return <TreeRenderer frame={currentFrame} />;
      case "graph":
        return <GraphRenderer frame={currentFrame} />;
      default:
        return <div className="text-white text-center">Unsupported structure renderer: {type}</div>;
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Rail Trace Timeline */}
      <TraceTimeline
        frames={frames}
        currentFrameIdx={currentFrameIdx}
        onFrameSelect={setCurrentFrameIdx}
      />

      {/* Instrument Dashboard Player Box */}
      <div className="flex-1 w-full flex flex-col gap-6">
        <div className="w-full bg-surface border border-borderColor rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {/* Header metadata */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                {trace.structure_type.replace("_", " ")}
              </span>
              <h2 className="text-lg font-bold font-display text-textMain mt-1.5 capitalize">
                {trace.operation.replace("_", " ")}
              </h2>
            </div>
            <div className="text-right text-xs text-textMuted font-mono">
              STEP {(currentFrameIdx + 1).toString().padStart(2, "0")} / {frames.length.toString().padStart(2, "0")}
            </div>
          </div>

          {/* Structure Visualizer Canvas */}
          <div className="w-full min-h-[300px] flex items-center justify-center bg-background rounded-xl border border-borderColor p-4 relative">
            {renderActiveStructure()}
          </div>

          {/* Monospaced Precision Narrative Box */}
          <div className="mt-5 bg-panel border border-borderColor rounded-xl p-4 min-h-[80px] flex items-center justify-center text-center font-mono">
            <p className="text-textMain text-sm leading-relaxed">
              {currentFrame?.description || "Initializing execution trace..."}
            </p>
          </div>

          {/* Controls Bar */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-borderColor pt-6">
            {/* Scrubber slider */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] font-mono text-textMuted uppercase font-bold">Start</span>
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={currentFrameIdx}
                onChange={handleScrubChange}
                className="flex-1 accent-primary bg-panel h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-textMuted uppercase font-bold">End</span>
            </div>

            {/* Play/Step Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleRestart}
                title="Restart trace"
                className="p-2 bg-panel hover:bg-borderColor border border-borderColor rounded-xl text-textMuted hover:text-textMain transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleStepBack}
                disabled={currentFrameIdx === 0}
                title="Step Back"
                className="p-2 bg-panel hover:bg-borderColor disabled:opacity-40 border border-borderColor rounded-xl text-textMuted hover:text-textMain transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-3 bg-primary hover:bg-opacity-90 rounded-full text-white shadow-md hover:scale-105 transition-all duration-200"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
              </button>

              <button
                onClick={handleStepForward}
                disabled={currentFrameIdx === frames.length - 1}
                title="Step Forward"
                className="p-2 bg-panel hover:bg-borderColor disabled:opacity-40 border border-borderColor rounded-xl text-textMuted hover:text-textMain transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Speed selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted font-bold">Speed:</span>
              <div className="flex bg-panel p-0.5 rounded-lg border border-borderColor">
                {([0.5, 1, 2] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-all ${
                      speed === s
                        ? "bg-primary text-white"
                        : "text-textMuted hover:text-textMain"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Complexity Summary Card */}
        <div className="bg-surface border border-borderColor p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div>
            <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">
              Trace Statistics & Analysis
            </h4>
            <p className="text-sm font-mono font-bold text-primary">
              {trace.summary}
            </p>
          </div>
          <div className="bg-panel border border-borderColor px-4 py-2.5 rounded-xl text-right">
            <div className="text-[10px] font-bold text-textMuted uppercase">Total Steps</div>
            <div className="text-lg font-mono font-bold text-textMain mt-0.5">
              {frames.length.toString().padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
