import React, { useMemo } from "react";
import { StepFrame } from "../../types/contracts";

interface GraphRendererProps {
  frame: StepFrame;
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({ frame }) => {
  const state = frame.state_snapshot || {};
  const nodes = (state.nodes || []) as { id: string; value: number | string }[];
  const edges = (state.edges || []) as { from: string; to: string; weight?: number; directed?: boolean }[];
  const highlights = frame.highlight || [];
  const pointers = frame.pointer_labels || {};
  
  // Custom states like Dijkstra distances or BFS visited paths
  const visited = (state.visited || []) as string[];
  const distances = (state.distances || {}) as Record<string, number | string>;

  const width = 600;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 105; // radius of circular node placement

  // Layout of nodes
  const coords = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    const n = nodes.length;
    nodes.forEach((node: any, idx) => {
      if (node.x !== undefined && node.y !== undefined) {
        const padding = 40;
        map[node.id] = {
          x: padding + (node.x / 100) * (width - 2 * padding),
          y: padding + (node.y / 100) * (height - 2 * padding)
        };
      } else {
        const angle = (idx * 2 * Math.PI) / n - Math.PI / 2; // start at top
        map[node.id] = {
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle)
        };
      }
    });
    return map;
  }, [nodes, cx, cy, radius]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-gray-800 shadow-2xl">
      {/* Node status / visited list */}
      <div className="flex flex-col gap-2 mb-4 w-full text-center items-center justify-center">
        {Object.keys(pointers).length > 0 && (
          <div className="flex gap-2 text-xs text-indigo-400">
            {Object.entries(pointers).map(([key, val]) => (
              <span key={key} className="bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                <strong>{key}</strong>: {val}
              </span>
            ))}
          </div>
        )}
        {visited.length > 0 && (
          <div className="text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-900 max-w-lg truncate">
            <strong>Visited Order</strong>: {visited.join(" → ")}
          </div>
        )}
      </div>

      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[400px] mx-auto overflow-visible">
          <defs>
            <marker
              id="graph-arrow"
              viewBox="0 0 10 10"
              refX="23"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#6366f1" />
            </marker>
            <marker
              id="graph-arrow-highlight"
              viewBox="0 0 10 10"
              refX="23"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#a855f7" />
            </marker>
          </defs>

          {/* Draw Edges */}
          {edges.map((edge, idx) => {
            const fromCoord = coords[edge.from];
            const toCoord = coords[edge.to];
            if (!fromCoord || !toCoord) return null;

            const isFromVisited = visited.includes(edge.from);
            const isToVisited = visited.includes(edge.to);
            const isPathActive = isFromVisited && isToVisited;

            // Compute middle point of connection line for weight label
            const mx = (fromCoord.x + toCoord.x) / 2;
            const my = (fromCoord.y + toCoord.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={fromCoord.x}
                  y1={fromCoord.y}
                  x2={toCoord.x}
                  y2={toCoord.y}
                  stroke={isPathActive ? "#a855f7" : "#4b5563"}
                  strokeWidth={isPathActive ? 2.5 : 1.5}
                  markerEnd={edge.directed ? (isPathActive ? "url(#graph-arrow-highlight)" : "url(#graph-arrow)") : undefined}
                  className="edge-line"
                />
                
                {/* Weight Label */}
                {edge.weight !== undefined && (
                  <g transform={`translate(${mx}, ${my})`}>
                    <rect
                      x={-10}
                      y={-8}
                      width={20}
                      height={16}
                      fill="#161822"
                      rx={3}
                      stroke="#374151"
                      strokeWidth={0.5}
                    />
                    <text
                      dy=".35em"
                      textAnchor="middle"
                      fill="#9ca3af"
                      className="text-[9px] font-bold font-mono"
                    >
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Draw Nodes */}
          {nodes.map((node) => {
            const coord = coords[node.id];
            if (!coord) return null;

            const isHighlighted = highlights.includes(node.id);
            const isVisited = visited.includes(node.id);
            const activePointers = Object.entries(pointers)
              .filter(([_, valueId]) => valueId === node.id)
              .map(([key]) => key);

            // Determine display label (Value + Dijkstra distance if present)
            let displayVal = node.value || node.id;
            const dist = distances[node.id];
            if (dist !== undefined) {
              const distStr = dist === Infinity || dist === "Infinity" ? "∞" : dist;
              displayVal = `${node.id} (${distStr})`;
            }

            let fill = "#1e293b";
            let stroke = "#475569";
            if (isHighlighted) {
              fill = "#6366f1";
              stroke = "#a855f7";
            } else if (isVisited) {
              fill = "#064e3b";
              stroke = "#10b981";
            }

            return (
              <g key={node.id} transform={`translate(${coord.x}, ${coord.y})`} className="cursor-pointer">
                {/* Node circle */}
                <circle
                  r={20}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2}
                  className="node-circle"
                />

                {/* Node value/id text */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="#ffffff"
                  className="font-bold text-xs select-none"
                >
                  {displayVal}
                </text>

                {/* Pointer Label overlay */}
                {activePointers.length > 0 && (
                  <g transform="translate(0, 32)">
                    <text
                      textAnchor="middle"
                      fill="#818cf8"
                      className="text-[9px] font-bold uppercase select-none animate-bounce"
                    >
                      ▲
                    </text>
                    <text
                      y={10}
                      textAnchor="middle"
                      fill="#a5b4fc"
                      className="text-[9px] font-bold uppercase select-none bg-indigo-950 px-1 py-0.5 rounded border border-indigo-900"
                    >
                      {activePointers.join(", ")}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
