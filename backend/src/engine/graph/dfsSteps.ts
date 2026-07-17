import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateGraphDFSSteps(
  structure: ParsedStructure,
  startNodeId?: string
): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  const startNode = startNodeId || nodes[0]?.id || "";
  
  // Build adjacency list
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    adj[e.from]?.push(e.to);
    if (!e.directed) {
      adj[e.to]?.push(e.from);
    }
  });

  // Sort neighbors for deterministic traversal
  Object.keys(adj).forEach(k => {
    adj[k].sort();
  });

  const frames: StepFrame[] = [];
  let stepIndex = 0;
  const visited = new Set<string>();
  const stack: string[] = [];

  frames.push({
    step_index: stepIndex++,
    description: `Starting Graph DFS traversal. Start node: ${startNode}`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: [], stack: [] },
    pointer_labels: {}
  });

  function dfs(curr: string) {
    visited.add(curr);
    stack.push(curr);

    frames.push({
      step_index: stepIndex++,
      description: `Visit node ${curr}. Push to stack and mark as visited. Stack: [${stack.join(", ")}]`,
      highlight: [curr],
      state_snapshot: { nodes, edges, visited: Array.from(visited), stack: [...stack] },
      pointer_labels: { curr }
    });

    const neighbors = adj[curr] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        frames.push({
          step_index: stepIndex++,
          description: `Neighbor ${neighbor} is unvisited. Recurse into ${neighbor}.`,
          highlight: [neighbor],
          state_snapshot: { nodes, edges, visited: Array.from(visited), stack: [...stack] },
          pointer_labels: { curr, neighbor }
        });
        dfs(neighbor);
      } else {
        frames.push({
          step_index: stepIndex++,
          description: `Neighbor ${neighbor} is already visited. Skipping.`,
          highlight: [neighbor],
          state_snapshot: { nodes, edges, visited: Array.from(visited), stack: [...stack] },
          pointer_labels: { curr, neighbor }
        });
      }
    }

    stack.pop();
    frames.push({
      step_index: stepIndex++,
      description: `Backtracking from node ${curr}. Pop from stack. Stack: [${stack.join(", ")}]`,
      highlight: [curr],
      state_snapshot: { nodes, edges, visited: Array.from(visited), stack: [...stack] },
      pointer_labels: { curr }
    });
  }

  if (startNode) {
    dfs(startNode);
  }

  frames.push({
    step_index: stepIndex++,
    description: `DFS finished. Visited order: [${Array.from(visited).join(", ")}]`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: Array.from(visited), stack: [] },
    pointer_labels: {}
  });

  return {
    structure_type: "graph",
    operation: "dfs",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes, edges, visited: Array.from(visited) },
    summary: `Graph DFS traversed ${visited.size} nodes starting from ${startNode} — O(V + E) time.`
  };
}
