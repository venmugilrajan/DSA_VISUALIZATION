import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateGraphBFSSteps(
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
  const queue: string[] = [];

  frames.push({
    step_index: stepIndex++,
    description: `Starting Graph BFS traversal. Start node: ${startNode}`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: [], queue: [] },
    pointer_labels: {}
  });

  if (startNode) {
    queue.push(startNode);
    visited.add(startNode);
    frames.push({
      step_index: stepIndex++,
      description: `Enqueue starting node ${startNode} and mark it as visited.`,
      highlight: [startNode],
      state_snapshot: { nodes, edges, visited: Array.from(visited), queue: [...queue] },
      pointer_labels: { start: startNode }
    });
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    
    frames.push({
      step_index: stepIndex++,
      description: `Dequeue node ${curr} from the queue. Processing its neighbors.`,
      highlight: [curr],
      state_snapshot: { nodes, edges, visited: Array.from(visited), queue: [...queue] },
      pointer_labels: { curr }
    });

    const neighbors = adj[curr] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);

        frames.push({
          step_index: stepIndex++,
          description: `Neighbor ${neighbor} is unvisited. Mark visited and enqueue it.`,
          highlight: [neighbor],
          state_snapshot: { nodes, edges, visited: Array.from(visited), queue: [...queue] },
          pointer_labels: { curr, neighbor }
        });
      } else {
        frames.push({
          step_index: stepIndex++,
          description: `Neighbor ${neighbor} is already visited. Skipping.`,
          highlight: [neighbor],
          state_snapshot: { nodes, edges, visited: Array.from(visited), queue: [...queue] },
          pointer_labels: { curr, neighbor }
        });
      }
    }
  }

  frames.push({
    step_index: stepIndex++,
    description: `BFS finished. Visited order: [${Array.from(visited).join(", ")}]`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: Array.from(visited), queue: [] },
    pointer_labels: {}
  });

  return {
    structure_type: "graph",
    operation: "bfs",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes, edges, visited: Array.from(visited) },
    summary: `Graph BFS traversed ${visited.size} nodes starting from ${startNode} — O(V + E) time.`
  };
}
