import React from "react";
import { StepFrame } from "../../types/contracts";

interface LinkedListRendererProps {
  frame: StepFrame;
}

export const LinkedListRenderer: React.FC<LinkedListRendererProps> = ({ frame }) => {
  const state = frame.state_snapshot || {};
  const nodes = (state.nodes || []) as { id: string; value: number | string }[];
  const edges = (state.edges || []) as { from: string; to: string; directed?: boolean }[];
  const highlights = frame.highlight || [];
  const pointers = frame.pointer_labels || {};

  // Build sequential list layout: find start node (node with no incoming edge)
  const incoming = new Set(edges.map(e => e.to));
  let headId = nodes.find(n => !incoming.has(n.id))?.id || nodes[0]?.id;
  
  // Trace sequence in case of a valid path, or fallback to standard sorting
  const adjMap: Record<string, string> = {};
  edges.forEach(e => {
    adjMap[e.from] = e.to;
  });

  const orderedNodes: typeof nodes = [];
  const visited = new Set<string>();
  let currId = headId;
  
  while (currId && !visited.has(currId)) {
    visited.add(currId);
    const nodeObj = nodes.find(n => n.id === currId);
    if (nodeObj) {
      orderedNodes.push(nodeObj);
    }
    currId = adjMap[currId];
  }

  // Add any disconnected nodes just in case
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      orderedNodes.push(n);
    }
  });

  const width = 800;
  const height = 200;
  const nodeSpacing = width / Math.max(orderedNodes.length + 1, 6);
  const nodeY = height / 2;

  // Map nodes to coordinates
  const coords: Record<string, { x: number; y: number }> = {};
  orderedNodes.forEach((node, idx) => {
    coords[node.id] = {
      x: 50 + idx * nodeSpacing + (nodeSpacing / 2),
      y: nodeY
    };
  });

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-gray-800 shadow-2xl">
      {/* Pointers display */}
      <div className="flex gap-2 mb-4 h-6 text-sm text-indigo-400">
        {Object.entries(pointers).map(([key, val]) => (
          <span key={key} className="bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
            <strong>{key}</strong>: {val}
          </span>
        ))}
      </div>

      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[400px] mx-auto overflow-visible">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="26"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 10 5 L 0 8 z" fill="var(--border-hairline)" />
            </marker>
            <marker
              id="arrow-highlight"
              viewBox="0 0 10 10"
              refX="26"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 10 5 L 0 8 z" fill="var(--accent-signal)" />
            </marker>
          </defs>

          {/* Draw Edges */}
          {edges.map((edge, idx) => {
            const fromCoord = coords[edge.from];
            const toCoord = coords[edge.to];
            if (!fromCoord || !toCoord) return null;

            const isEdgeHighlighted = highlights.includes(edge.from) || highlights.includes(edge.to);

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={fromCoord.x}
                  y1={fromCoord.y}
                  x2={toCoord.x}
                  y2={toCoord.y}
                  stroke={isEdgeHighlighted ? "var(--accent-signal)" : "var(--border-hairline)"}
                  strokeWidth={isEdgeHighlighted ? 3 : 2}
                  markerEnd={isEdgeHighlighted ? "url(#arrow-highlight)" : "url(#arrow)"}
                  className="edge-line"
                />
              </g>
            );
          })}

          {/* Draw Nodes */}
          {orderedNodes.map((node, idx) => {
            const coord = coords[node.id];
            if (!coord) return null;

            const isHighlighted = highlights.includes(node.id);
            const activePointers = Object.entries(pointers)
              .filter(([_, valueId]) => valueId === node.id)
              .map(([key]) => key);

            return (
              <g key={node.id} className="transition-transform duration-300">
                {/* Node Box */}
                <rect
                  x={coord.x - 30}
                  y={coord.y - 25}
                  width={60}
                  height={50}
                  rx={8}
                  className={`node-circle cursor-pointer`}
                  fill={isHighlighted ? "var(--bg-elevated)" : "var(--bg-surface)"}
                  stroke={isHighlighted ? "var(--accent-signal)" : "var(--border-hairline)"}
                  strokeWidth={2}
                />
                
                {/* Value Text */}
                <text
                  x={coord.x}
                  y={coord.y + 5}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  className="font-bold text-sm select-none"
                >
                  {node.value}
                </text>

                {/* ID Label (small) */}
                <text
                  x={coord.x}
                  y={coord.y - 30}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  className="text-[10px] font-mono select-none"
                >
                  {node.id}
                </text>

                {/* Pointers pointing to this node */}
                {activePointers.length > 0 && (
                  <g transform={`translate(${coord.x}, ${coord.y + 45})`}>
                    <text
                      textAnchor="middle"
                      fill="var(--accent-signal)"
                      className="text-[10px] font-bold uppercase select-none animate-bounce"
                    >
                      ▲
                    </text>
                    <text
                      y={12}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      className="text-[10px] font-bold uppercase select-none bg-panel px-1 py-0.5 rounded"
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
