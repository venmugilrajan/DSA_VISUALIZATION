import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateLinkedListInsertSteps(
  structure: ParsedStructure,
  value: number | string,
  index: number = 0
): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  // Parse current list order
  const adj: Record<string, string> = {};
  edges.forEach(e => {
    adj[e.from] = e.to;
  });

  const incoming = new Set(edges.map(e => e.to));
  let headId = nodes.find(n => !incoming.has(n.id))?.id || nodes[0]?.id;

  const order: string[] = [];
  let currId = headId;
  const visited = new Set<string>();
  while (currId && !visited.has(currId)) {
    visited.add(currId);
    order.push(currId);
    currId = adj[currId];
  }

  const frames: StepFrame[] = [];
  let stepIndex = 0;
  let currentEdges = edges.map(e => ({ ...e }));
  let currentNodes = nodes.map(n => ({ ...n }));

  frames.push({
    step_index: stepIndex++,
    description: `Initial list before insertion. Goal: Insert node with value ${value} at index ${index}.`,
    highlight: [],
    state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
    pointer_labels: { head: headId || "" }
  });

  const newNodeId = `N_${Date.now()}_${Math.floor(Math.random() * 100)}`;
  
  // Highlight creation of new node
  const nodesWithNew = [...currentNodes, { id: newNodeId, value }];
  frames.push({
    step_index: stepIndex++,
    description: `Create new node ${newNodeId} with value ${value}.`,
    highlight: [newNodeId],
    state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
    pointer_labels: { "new": newNodeId }
  });

  if (index <= 0 || order.length === 0) {
    // Insert at head
    if (headId) {
      currentEdges.push({ from: newNodeId, to: headId, directed: true });
    }
    frames.push({
      step_index: stepIndex++,
      description: `Point new node to current head node ${headId || "NULL"}.`,
      highlight: [newNodeId],
      state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
      pointer_labels: { "new": newNodeId, head: headId || "" }
    });

    headId = newNodeId;
    frames.push({
      step_index: stepIndex++,
      description: `Update head pointer to new node. Insertion complete.`,
      highlight: [newNodeId],
      state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
      pointer_labels: { head: headId }
    });
  } else {
    // Insert at index
    let prevIdx = Math.min(index - 1, order.length - 1);
    let prevNodeId = order[prevIdx];
    let nextNodeId = adj[prevNodeId] || null;

    // Traverse to index
    for (let i = 0; i <= prevIdx; i++) {
      frames.push({
        step_index: stepIndex++,
        description: `Traversing: at index ${i}, node ${order[i]}.`,
        highlight: [order[i]],
        state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
        pointer_labels: { curr: order[i], "new": newNodeId }
      });
    }

    // Connect new node to next node
    if (nextNodeId) {
      currentEdges.push({ from: newNodeId, to: nextNodeId, directed: true });
      frames.push({
        step_index: stepIndex++,
        description: `Point new node's next pointer to ${nextNodeId}.`,
        highlight: [newNodeId, nextNodeId],
        state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
        pointer_labels: { prev: prevNodeId, "new": newNodeId, next: nextNodeId }
      });
    }

    // Remove old connection from prev to next, point prev to new node
    currentEdges = currentEdges.filter(e => !(e.from === prevNodeId && e.to === nextNodeId));
    currentEdges.push({ from: prevNodeId, to: newNodeId, directed: true });

    frames.push({
      step_index: stepIndex++,
      description: `Point previous node ${prevNodeId}'s next to new node ${newNodeId}.`,
      highlight: [prevNodeId, newNodeId],
      state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
      pointer_labels: { prev: prevNodeId, "new": newNodeId }
    });
  }

  return {
    structure_type: "linked_list",
    operation: "insert",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes: nodesWithNew, edges: currentEdges },
    summary: `Inserted value ${value} at index ${index} in O(n) worst-case time complexity.`
  };
}
