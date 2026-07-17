import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateLinkedListDeleteSteps(
  structure: ParsedStructure,
  targetValue: number | string
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
    description: `Initial list. Goal: Delete node with value ${targetValue}.`,
    highlight: [],
    state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
    pointer_labels: { head: headId || "" }
  });

  let prevNodeId: string | null = null;
  let targetNodeId: string | null = null;
  let nextNodeId: string | null = null;

  // Search for the target node
  for (let i = 0; i < order.length; i++) {
    const node = currentNodes.find(n => n.id === order[i]);
    
    frames.push({
      step_index: stepIndex++,
      description: `Checking node ${order[i]} (value: ${node?.value}) for target value ${targetValue}.`,
      highlight: [order[i]],
      state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
      pointer_labels: { curr: order[i] }
    });

    if (node?.value == targetValue || node?.id == targetValue) {
      targetNodeId = order[i];
      prevNodeId = i > 0 ? order[i - 1] : null;
      nextNodeId = adj[targetNodeId] || null;
      break;
    }
  }

  if (!targetNodeId) {
    frames.push({
      step_index: stepIndex++,
      description: `Node with value ${targetValue} not found in the list.`,
      highlight: [],
      state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
      pointer_labels: {}
    });
    return {
      structure_type: "linked_list",
      operation: "delete",
      initial_state: { nodes, edges },
      frames,
      final_state: { nodes, edges },
      summary: `Failed to delete node. Value ${targetValue} not found.`
    };
  }

  if (targetNodeId === headId) {
    // Delete head
    currentEdges = currentEdges.filter(e => e.from !== targetNodeId);
    currentNodes = currentNodes.filter(n => n.id !== targetNodeId);
    
    frames.push({
      step_index: stepIndex++,
      description: `Target is head node. Remove outgoing links and advance head pointer to next node: ${nextNodeId || "NULL"}.`,
      highlight: [targetNodeId],
      state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
      pointer_labels: { head: nextNodeId || "" }
    });
  } else {
    // Delete non-head
    // Remove edges connecting target, and bridge prevNodeId to nextNodeId
    currentEdges = currentEdges.filter(e => e.from !== targetNodeId && e.to !== targetNodeId);
    if (prevNodeId && nextNodeId) {
      currentEdges.push({ from: prevNodeId, to: nextNodeId, directed: true });
    }
    currentNodes = currentNodes.filter(n => n.id !== targetNodeId);

    frames.push({
      step_index: stepIndex++,
      description: `Bypassing node ${targetNodeId}. Connecting previous node ${prevNodeId} to next node ${nextNodeId || "NULL"}.`,
      highlight: prevNodeId ? [prevNodeId] : [],
      state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
      pointer_labels: { prev: prevNodeId || "", next: nextNodeId || "" }
    });
  }

  return {
    structure_type: "linked_list",
    operation: "delete",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes: currentNodes, edges: currentEdges },
    summary: `Deleted node with value ${targetValue} in O(n) time.`
  };
}
export function generateLinkedListDetectCycleSteps(structure: ParsedStructure): StepTrace {
  // Simple cycle detection (Floyd's Tortoise and Hare)
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  const adj: Record<string, string> = {};
  edges.forEach(e => {
    adj[e.from] = e.to;
  });

  const incoming = new Set(edges.map(e => e.to));
  let headId = nodes.find(n => !incoming.has(n.id))?.id || nodes[0]?.id;

  const frames: StepFrame[] = [];
  let stepIndex = 0;

  frames.push({
    step_index: stepIndex++,
    description: `Starting cycle detection using Floyd's Cycle-Finding Algorithm.`,
    highlight: [],
    state_snapshot: { nodes, edges },
    pointer_labels: { slow: headId || "", fast: headId || "" }
  });

  let slow: string | null = headId || null;
  let fast: string | null = headId || null;
  let hasCycle = false;
  let iterations = 0;

  while (slow && fast && adj[fast]) {
    iterations++;
    slow = adj[slow] || null;
    fast = adj[adj[fast]] || null;

    frames.push({
      step_index: stepIndex++,
      description: `Iteration ${iterations}: Slow pointer moves 1 step to ${slow}. Fast pointer moves 2 steps to ${fast}.`,
      highlight: [slow || "", fast || ""].filter(Boolean),
      state_snapshot: { nodes, edges },
      pointer_labels: { slow: slow || "NULL", fast: fast || "NULL" }
    });

    if (slow === fast && slow !== null) {
      hasCycle = true;
      frames.push({
        step_index: stepIndex++,
        description: `Slow pointer and Fast pointer met at node ${slow}! Cycle detected.`,
        highlight: [slow],
        state_snapshot: { nodes, edges },
        pointer_labels: { collision: slow }
      });
      break;
    }
  }

  if (!hasCycle) {
    frames.push({
      step_index: stepIndex++,
      description: `Fast pointer reached end of the list. No cycle detected.`,
      highlight: [],
      state_snapshot: { nodes, edges },
      pointer_labels: {}
    });
  }

  return {
    structure_type: "linked_list",
    operation: "detect_cycle",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes, edges },
    summary: hasCycle 
      ? `Cycle detected in list using Floyd's Tortoise & Hare — O(n) time, O(1) space.`
      : `No cycle detected in list — O(n) time, O(1) space.`
  };
}
