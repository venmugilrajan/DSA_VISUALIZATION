import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateReverseListSteps(structure: ParsedStructure): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const originalEdges = structure.edges ? [...structure.edges] : [];
  
  // Reconstruct list order from edges
  const adj: Record<string, string> = {};
  originalEdges.forEach(e => {
    adj[e.from] = e.to;
  });

  // Find start node (node with no incoming edges)
  const incoming = new Set(originalEdges.map(e => e.to));
  let currId = nodes.find(n => !incoming.has(n.id))?.id || (nodes[0]?.id);

  const order: string[] = [];
  const visited = new Set<string>();
  while (currId && !visited.has(currId)) {
    visited.add(currId);
    order.push(currId);
    currId = adj[currId];
  }

  const frames: StepFrame[] = [];
  let stepIndex = 0;

  // Clone edges for state tracking
  let currentEdges = originalEdges.map(e => ({ ...e }));

  frames.push({
    step_index: stepIndex++,
    description: `Initial linked list structure. Starting list reverse.`,
    highlight: [],
    state_snapshot: { nodes, edges: [...currentEdges] },
    pointer_labels: { head: order[0] || "" }
  });

  let prev: string | null = null;
  let curr: string | null = order[0] || null;
  let next: string | null = null;

  while (curr !== null) {
    next = adj[curr] || null;

    // Describe next node identification
    frames.push({
      step_index: stepIndex++,
      description: `Current node is ${curr} (value: ${nodes.find(n => n.id === curr)?.value}). Next node is ${next || "NULL"}.`,
      highlight: [curr],
      state_snapshot: { nodes, edges: [...currentEdges] },
      pointer_labels: {
        prev: prev || "NULL",
        curr: curr,
        next: next || "NULL"
      }
    });

    // Flip the connection in the edges list
    // Remove edge from curr -> next, add edge from curr -> prev
    currentEdges = currentEdges.filter(e => !(e.from === curr && e.to === next));
    if (prev) {
      currentEdges.push({ from: curr, to: prev, directed: true });
    }

    frames.push({
      step_index: stepIndex++,
      description: `Reversing pointer: Make ${curr} point to previous node (${prev || "NULL"}).`,
      highlight: [curr],
      state_snapshot: { nodes, edges: [...currentEdges] },
      pointer_labels: {
        prev: prev || "NULL",
        curr: curr,
        next: next || "NULL"
      }
    });

    // Move pointers forward
    prev = curr;
    curr = next;
  }

  frames.push({
    step_index: stepIndex++,
    description: `Reverse completed. New head is ${prev}.`,
    highlight: prev ? [prev] : [],
    state_snapshot: { nodes, edges: [...currentEdges] },
    pointer_labels: { head: prev || "NULL" }
  });

  return {
    structure_type: "linked_list",
    operation: "reverse",
    initial_state: { nodes, edges: originalEdges },
    frames,
    final_state: { nodes, edges: currentEdges },
    summary: `Reversed linked list pointers in O(n) time and O(1) space complexity.`
  };
}
