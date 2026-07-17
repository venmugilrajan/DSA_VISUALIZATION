import React from "react";
import { StepFrame } from "../../types/contracts";

interface StackQueueRendererProps {
  frame: StepFrame;
  type: "stack" | "queue";
}

export const StackQueueRenderer: React.FC<StackQueueRendererProps> = ({ frame, type }) => {
  const vals = (frame.state_snapshot as (number | string)[]) || [];
  const highlights = frame.highlight || [];
  const pointers = frame.pointer_labels || {};

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-gray-800 shadow-2xl">
      {/* Pointers indicator */}
      <div className="flex gap-2 mb-4 h-6 text-sm text-indigo-400">
        {Object.entries(pointers).map(([key, val]) => (
          <span key={key} className="bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
            <strong>{key}</strong>: {val}
          </span>
        ))}
      </div>

      {type === "stack" ? (
        /* Vertical Stack Rendering */
        <div className="flex flex-col items-center min-h-[300px] justify-end w-full max-w-sm pt-8">
          {/* Open top of stack */}
          <div className="w-40 border-l-4 border-r-4 border-b-4 border-slate-600 rounded-b-xl flex flex-col-reverse p-3 gap-2 bg-slate-900/40">
            {vals.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10 italic">Empty Stack</div>
            ) : (
              vals.map((val, idx) => {
                const idxStr = idx.toString();
                const isTop = idx === vals.length - 1;
                const isHighlighted = highlights.includes(idxStr);

                let bgClass = "bg-slate-800 border-slate-700 text-slate-300";
                if (isHighlighted) {
                  bgClass = "bg-primary border-indigo-400 text-white animate-pulseScale";
                } else if (isTop) {
                  bgClass = "bg-indigo-900 border-indigo-700 text-indigo-200";
                }

                return (
                  <div
                    key={idx}
                    className={`w-full py-3 px-4 rounded-lg border-2 text-center font-bold text-lg flex justify-between items-center transition-all duration-300 shadow-md ${bgClass}`}
                  >
                    <span className="text-xs text-slate-500 font-mono">[{idx}]</span>
                    <span>{val}</span>
                    <span className="text-xs text-indigo-400 font-semibold w-10 text-right">
                      {isTop ? "TOP" : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 text-sm text-slate-400 font-semibold">Stack (LIFO)</div>
        </div>
      ) : (
        /* Horizontal Queue Rendering */
        <div className="flex flex-col items-center justify-center min-h-[220px] w-full pt-4">
          <div className="flex items-center gap-2 border-t-4 border-b-4 border-slate-600 px-4 py-6 w-full max-w-2xl min-h-[100px] bg-slate-900/40 rounded-sm justify-start overflow-x-auto">
            {vals.length === 0 ? (
              <div className="text-center text-xs text-slate-500 w-full italic">Empty Queue</div>
            ) : (
              vals.map((val, idx) => {
                const idxStr = idx.toString();
                const isFront = idx === 0;
                const isRear = idx === vals.length - 1;
                const isHighlighted = highlights.includes(idxStr);

                let bgClass = "bg-slate-800 border-slate-700 text-slate-300";
                if (isHighlighted) {
                  bgClass = "bg-primary border-indigo-400 text-white animate-pulseScale";
                } else if (isFront) {
                  bgClass = "bg-emerald-950 border-emerald-800 text-emerald-300";
                } else if (isRear) {
                  bgClass = "bg-purple-950 border-purple-800 text-purple-300";
                }

                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center min-w-[80px] h-20 rounded-xl border-2 shadow-md transition-all duration-300 relative ${bgClass}`}
                  >
                    <span className="text-xs text-slate-500 font-mono absolute top-1 left-2">[{idx}]</span>
                    <span className="text-lg font-bold mt-2">{val}</span>
                    
                    {/* Front/Rear label inside box */}
                    <span className="text-[9px] font-bold uppercase mt-1 opacity-80">
                      {isFront && isRear ? "F / R" : isFront ? "FRONT" : isRear ? "REAR" : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 text-sm text-slate-400 font-semibold">Queue (FIFO)</div>
        </div>
      )}
    </div>
  );
};
