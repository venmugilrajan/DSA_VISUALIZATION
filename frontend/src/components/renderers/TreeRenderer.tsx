import React, { useMemo } from "react";
import * as d3 from "d3";
import { StepFrame } from "../../types/contracts";

interface TreeRendererProps {
  frame: StepFrame;
}

interface TreeNode {
  id: string;
  value: number | string;
  children?: TreeNode[];
}

export const TreeRenderer: React.FC<TreeRendererProps> = ({ frame }) => {
  const state = frame.state_snapshot || {};
  const nodes = (state.nodes || []) as { id: string; value: number | string }[];
  const edges = (state.edges || []) as { from: string; to: string }[];
  const highlights = frame.highlight || [];
  const pointers = frame.pointer_labels || {};
  const visited = (state.visited || []) as string[];

  const width = 600;
  const height = 300;

  // Build hierarchy
  const treeData = useMemo(() => {
    if (nodes.length === 0) return null;

    // Find root (node with no incoming edges)
    const incoming = new Set(edges.map(e => e.to));
    const rootNode = nodes.find(n => !incoming.has(n.id)) || nodes[0];
    if (!rootNode) return null;

    // Map of parent ID to child IDs
    const parentToChildren: Record<string, string[]> = {};
    edges.forEach(e => {
      if (!parentToChildren[e.from]) {
        parentToChildren[e.from] = [];
      }
      parentToChildren[e.from].push(e.to);
    });

    // Sort children left-to-right based on value
    Object.keys(parentToChildren).forEach(parent => {
      parentToChildren[parent].sort((a, b) => {
        const valA = nodes.find(n => n.id === a)?.value ?? 0;
        const valB = nodes.find(n => n.id === b)?.value ?? 0;
        return Number(valA) < Number(valB) ? -1 : 1;
      });
    });

    const buildNode = (id: string): TreeNode => {
      const nodeObj = nodes.find(n => n.id === id);
      const childrenIds = parentToChildren[id] || [];
      return {
        id,
        value: nodeObj?.value ?? id,
        children: childrenIds.map(buildNode)
      };
    };

    return buildNode(rootNode.id);
  }, [nodes, edges]);

  // Compute layout using D3
  const layout = useMemo(() => {
    if (!treeData) return null;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree<TreeNode>().size([width - 80, height - 80]);
    treeLayout(root);

    return root;
  }, [treeData]);

  if (!layout) {
    return (
      <div className="w-full flex items-center justify-center p-12 bg-surface rounded-xl border border-gray-800 text-slate-500 italic">
        Empty Tree
      </div>
    );
  }

  const desc = layout.descendants();
  const links = layout.links();

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-gray-800 shadow-2xl">
      {/* Narrative pointers / visited path */}
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
            <strong>Traversal Path</strong>: {visited.map(id => nodes.find(n => n.id === id)?.value ?? id).join(" → ")}
          </div>
        )}
      </div>

      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[400px] mx-auto overflow-visible">
          {/* Draw Links */}
          {links.map((link, idx) => {
            const isSourceVisited = visited.includes(link.source.data.id);
            const isTargetVisited = visited.includes(link.target.data.id);
            const isPathActive = isSourceVisited && isTargetVisited;

            const origSource = nodes.find(n => n.id === link.source.data.id) as any;
            const origTarget = nodes.find(n => n.id === link.target.data.id) as any;
            const hasSourceCoords = origSource && origSource.x !== undefined && origSource.y !== undefined;
            const hasTargetCoords = origTarget && origTarget.x !== undefined && origTarget.y !== undefined;

            const padding = 45;
            const sx = hasSourceCoords ? padding + (origSource.x / 100) * (width - 2 * padding) : (link.source.x ?? 0) + 40;
            const sy = hasSourceCoords ? padding + (origSource.y / 100) * (height - 2 * padding) : (link.source.y ?? 0) + 40;
            const tx = hasTargetCoords ? padding + (origTarget.x / 100) * (width - 2 * padding) : (link.target.x ?? 0) + 40;
            const ty = hasTargetCoords ? padding + (origTarget.y / 100) * (height - 2 * padding) : (link.target.y ?? 0) + 40;

            return (
              <path
                key={`link-${idx}`}
                d={`M ${sx} ${sy} L ${tx} ${ty}`}
                fill="none"
                stroke={isPathActive ? "var(--accent-signal)" : "var(--border-hairline)"}
                strokeWidth={isPathActive ? 3 : 2}
                className="edge-line"
              />
            );
          })}

          {/* Draw Nodes */}
          {desc.map((node) => {
            const isHighlighted = highlights.includes(node.data.id);
            const isVisited = visited.includes(node.data.id);
            const nodePointers = Object.entries(pointers)
              .filter(([_, val]) => val === node.data.id)
              .map(([k]) => k);

            let fill = "var(--bg-surface)";
            let stroke = "var(--border-hairline)";
            if (isHighlighted) {
              fill = "var(--bg-elevated)";
              stroke = "var(--accent-signal)";
            } else if (isVisited) {
              fill = "var(--bg-elevated)";
              stroke = "var(--accent-compare)";
            }

            const origNode = nodes.find(n => n.id === node.data.id) as any;
            const hasCoords = origNode && origNode.x !== undefined && origNode.y !== undefined;
            const padding = 45;
            const x = hasCoords ? padding + (origNode.x / 100) * (width - 2 * padding) : (node.x ?? 0) + 40;
            const y = hasCoords ? padding + (origNode.y / 100) * (height - 2 * padding) : (node.y ?? 0) + 40;

            return (
              <g key={node.data.id} transform={`translate(${x}, ${y})`} className="cursor-pointer">
                {/* Node Circle */}
                <circle
                  r={22}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2.5}
                  className="node-circle"
                />

                {/* Node Value */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="var(--text-primary)"
                  className="font-bold text-sm select-none"
                >
                  {node.data.value}
                </text>

                {/* Node ID label */}
                <text
                  y={-28}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  className="text-[10px] font-mono select-none"
                >
                  {node.data.id}
                </text>

                {/* Pointer Label overlay */}
                {nodePointers.length > 0 && (
                  <g transform="translate(0, 36)">
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
                      {nodePointers.join(", ")}
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
