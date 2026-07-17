import React from "react";
import { StepFrame } from "../types/contracts";

interface TraceTimelineProps {
  frames: StepFrame[];
  currentFrameIdx: number;
  onFrameSelect: (idx: number) => void;
}

export const TraceTimeline: React.FC<TraceTimelineProps> = ({
  frames,
  currentFrameIdx,
  onFrameSelect,
}) => {
  return (
    <div className="w-full lg:w-20 bg-surface border border-borderColor rounded-2xl p-4 flex flex-row lg:flex-col items-center gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto max-h-[120px] lg:max-h-[500px] shadow-sm select-none">
      <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider hidden lg:block mb-2 text-center border-b border-borderColor pb-2 w-full">
        Trace
      </div>
      
      <div className="flex flex-row lg:flex-col gap-1.5 w-full">
        {frames.map((frame, idx) => {
          const isActive = idx === currentFrameIdx;
          const hasCompare = !!frame.compare;
          const hasSwap = !!frame.swap;

          let indicatorColor = "bg-textMuted/40";
          if (hasSwap) {
            indicatorColor = "bg-danger";
          } else if (hasCompare) {
            indicatorColor = "bg-accent";
          } else if (frame.highlight.length > 0) {
            indicatorColor = "bg-primary";
          }

          return (
            <button
              key={idx}
              onClick={() => onFrameSelect(idx)}
              className={`flex lg:flex-col items-center justify-between gap-1 w-12 lg:w-full p-2 rounded-lg border transition-all ${
                isActive
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-panel border-borderColor hover:bg-borderColor text-textMuted"
              }`}
              title={`Jump to step ${idx + 1}: ${frame.description}`}
            >
              {/* Step Num */}
              <span className="text-[10px] font-mono font-bold leading-none">
                {(idx + 1).toString().padStart(2, "0")}
              </span>

              {/* Mini Dot Indicator */}
              <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} shrink-0`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
