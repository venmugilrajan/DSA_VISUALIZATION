import React from "react";
import { StepFrame } from "../../types/contracts";

interface ArrayRendererProps {
  frame: StepFrame;
}

export const ArrayRenderer: React.FC<ArrayRendererProps> = ({ frame }) => {
  const arr = (frame.state_snapshot as (number | string)[]) || [];
  const highlights = frame.highlight || [];
  const compares = (frame.compare || []) as string[];
  const swaps = (frame.swap || []) as string[];
  const pointers = frame.pointer_labels || {};

  // Find max value for scaling bar height if numeric
  const numericValues = arr.map(v => Number(v)).filter(v => !isNaN(v));
  const maxVal = numericValues.length > 0 ? Math.max(...numericValues, 1) : 10;

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-gray-800 shadow-2xl">
      {/* Narrative Label Pointers */}
      <div className="flex gap-2 mb-4 h-6 text-sm text-indigo-400">
        {Object.entries(pointers).map(([key, val]) => (
          <span key={key} className="bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
            <strong>{key}</strong>: index {val}
          </span>
        ))}
      </div>

      <div className="flex items-end justify-center gap-3 w-full max-w-2xl min-h-[220px] pb-8 pt-4">
        {arr.map((val, idx) => {
          const idxStr = idx.toString();
          const isCompare = compares.includes(idxStr);
          const isSwap = swaps.includes(idxStr);
          const isHighlight = highlights.includes(idxStr);

          let bgClass = "bg-slate-800 border-slate-700 text-slate-300";
          if (isSwap) {
            bgClass = "bg-danger border-red-500 text-white animate-pulseScale";
          } else if (isCompare) {
            bgClass = "bg-warning border-amber-500 text-slate-900";
          } else if (isHighlight) {
            bgClass = "bg-primary border-indigo-400 text-white";
          }

          // Compute height as a percentage of max value for bar-chart style
          const valNum = Number(val);
          const barHeight = !isNaN(valNum) 
            ? `${Math.max(25, Math.min(100, (valNum / maxVal) * 100))}%`
            : "50%";

          // Find pointers pointing to this index
          const activePointers = Object.entries(pointers)
            .filter(([_, valueIdx]) => valueIdx === idxStr)
            .map(([key]) => key);

          return (
            <div key={idx} className="flex flex-col items-center w-14 h-full justify-end relative">
              {/* Value Box/Bar */}
              <div
                style={{ height: barHeight }}
                className={`w-full flex items-center justify-center rounded-lg border-2 shadow-md transition-all duration-300 text-lg font-bold ${bgClass}`}
              >
                {val}
              </div>

              {/* Index Label */}
              <span className="text-xs text-gray-500 mt-2 font-mono">[{idx}]</span>

              {/* Pointer Arrows */}
              {activePointers.length > 0 && (
                <div className="absolute -bottom-8 flex flex-col items-center">
                  <span className="text-indigo-400 animate-bounce">▲</span>
                  <div className="flex gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950 px-1 py-0.5 rounded border border-indigo-800 uppercase">
                    {activePointers.join(", ")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
