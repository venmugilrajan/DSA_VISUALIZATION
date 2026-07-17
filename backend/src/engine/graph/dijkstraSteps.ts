import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateDijkstraSteps(
  structure: ParsedStructure,
  startNodeId?: string
): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  const startNode = startNodeId || nodes[0]?.id || "";
  
  // Build adjacency list with weights
  const adj: Record<string, { to: string; weight: number }[]> = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    const w = Number(e.weight ?? 1);
    adj[e.from]?.push({ to: e.to, weight: w });
    if (!e.directed) {
      adj[e.to]?.push({ from: e.from, to: e.from, weight: w } as any); // Wait, if undirected, reverse connection
      adj[e.to]?.push({ to: e.from, weight: w });
    }
  });

  const frames: StepFrame[] = [];
  let stepIndex = 0;

  // Distances table
  const distances: Record<string, number> = {};
  const parentMap: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parentMap[n.id] = null;
    unvisited.add(n.id);
  });

  if (startNode) {
    distances[startNode] = 0;
  }

  frames.push({
    step_index: stepIndex++,
    description: `Initializing Dijkstra's Algorithm from node ${startNode}. Setting distance of start node to 0, all others to Infinity.`,
    highlight: [],
    state_snapshot: { nodes, edges, distances: { ...distances }, visited: [] },
    pointer_labels: { start: startNode }
  });

  const visitedList: string[] = [];

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let curr: string | null = null;
    let minDist = Infinity;
    
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        curr = nodeId;
      }
    });

    // If remaining nodes are unreachable
    if (curr === null || minDist === Infinity) {
      frames.push({
        step_index: stepIndex++,
        description: `All remaining unvisited nodes are unreachable. Terminating search.`,
        highlight: [],
        state_snapshot: { nodes, edges, distances: { ...distances }, visited: [...visitedList] },
        pointer_labels: {}
      });
      break;
    }

    // Mark current node as visited
    unvisited.delete(curr);
    visitedList.push(curr);

    frames.push({
      step_index: stepIndex++,
      description: `Select unvisited node ${curr} with the minimum distance of ${minDist}. Mark as visited.`,
      highlight: [curr],
      state_snapshot: { nodes, edges, distances: { ...distances }, visited: [...visitedList] },
      pointer_labels: { curr }
    });

    const neighbors = adj[curr] || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.to)) continue;

      const alt = distances[curr] + neighbor.weight;
      frames.push({
        step_index: stepIndex++,
        description: `Checking neighbor ${neighbor.to} via edge ${curr} -> ${neighbor.to} (weight: ${neighbor.weight}). Calculated distance: ${distances[curr]} + ${neighbor.weight} = ${alt}. Current distance: ${distances[neighbor.to]}.`,
        highlight: [neighbor.to],
        state_snapshot: { nodes, edges, distances: { ...distances }, visited: [...visitedList] },
        pointer_labels: { curr, neighbor: neighbor.to }
      });

      if (alt < distances[neighbor.to]) {
        distances[neighbor.to] = alt;
        parentMap[neighbor.to] = curr;

        frames.push({
          step_index: stepIndex++,
          description: `Found shorter path to ${neighbor.to}! Updating distance of ${neighbor.to} to ${alt}.`,
          highlight: [neighbor.to],
          state_snapshot: { nodes, edges, distances: { ...distances }, visited: [...visitedList] },
          pointer_labels: { curr, neighbor: neighbor.to }
        });
      }
    }
  }

  frames.push({
    step_index: stepIndex++,
    description: `Dijkstra's Algorithm completed. Final shortest paths calculated.`,
    highlight: [],
    state_snapshot: { nodes, edges, distances: { ...distances }, visited: [...visitedList] },
    pointer_labels: {}
  });

  return {
    structure_type: "graph",
    operation: "dijkstra",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes, edges, distances, parentMap },
    summary: `Dijkstra shortest paths resolved from node ${startNode} in O((V+E) log V) time.`
  };
}
