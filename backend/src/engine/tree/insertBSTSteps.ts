import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateBSTInsertSteps(
  structure: ParsedStructure,
  newValue: number | string
): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  const parentToChildren: Record<string, string[]> = {};
  edges.forEach(e => {
    if (!parentToChildren[e.from]) parentToChildren[e.from] = [];
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

  const incoming = new Set(edges.map(e => e.to));
  const rootId = nodes.find(n => !incoming.has(n.id))?.id || nodes[0]?.id || "";

  const frames: StepFrame[] = [];
  let stepIndex = 0;
  
  const currentNodes = nodes.map(n => ({ ...n }));
  const currentEdges = edges.map(e => ({ ...e }));

  const newNodeId = `T_${Date.now()}_${Math.floor(Math.random() * 100)}`;
  const valNum = typeof newValue === 'string' ? parseFloat(newValue) || 0 : newValue;

  frames.push({
    step_index: stepIndex++,
    description: `Goal: Insert value ${newValue} into the Binary Search Tree.`,
    highlight: [],
    state_snapshot: { nodes: [...currentNodes], edges: [...currentEdges] },
    pointer_labels: {}
  });

  // Show creation of node
  const nodesWithNew = [...currentNodes, { id: newNodeId, value: newValue }];
  frames.push({
    step_index: stepIndex++,
    description: `Created new leaf node ${newNodeId} with value ${newValue}. Starting search for correct insertion point.`,
    highlight: [newNodeId],
    state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
    pointer_labels: { "new": newNodeId }
  });

  if (!rootId) {
    // Empty tree, insert as root
    frames.push({
      step_index: stepIndex++,
      description: `Tree is empty. Setting new node ${newNodeId} as root.`,
      highlight: [newNodeId],
      state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
      pointer_labels: { root: newNodeId }
    });

    return {
      structure_type: "binary_tree",
      operation: "insert",
      initial_state: { nodes, edges },
      frames,
      final_state: { nodes: nodesWithNew, edges: currentEdges },
      summary: `Inserted ${newValue} as root of empty BST.`
    };
  }

  // Traverse BST
  let curr = rootId;
  let parent: string | null = null;
  let direction: "left" | "right" | null = null;

  while (curr) {
    const nodeObj = currentNodes.find(n => n.id === curr);
    const currVal = Number(nodeObj?.value ?? 0);

    frames.push({
      step_index: stepIndex++,
      description: `Comparing value ${valNum} with current node ${curr} (value: ${currVal}).`,
      highlight: [curr, newNodeId],
      state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
      pointer_labels: { curr, "new": newNodeId }
    });

    parent = curr;
    const children = parentToChildren[curr] || [];
    
    // Determine children
    let leftChild = children.find(c => {
      const childVal = currentNodes.find(n => n.id === c)?.value ?? 0;
      return Number(childVal) < currVal;
    });
    let rightChild = children.find(c => {
      const childVal = currentNodes.find(n => n.id === c)?.value ?? 0;
      return Number(childVal) >= currVal;
    });

    if (valNum < currVal) {
      direction = "left";
      frames.push({
        step_index: stepIndex++,
        description: `${valNum} < ${currVal}. Traversing to the left child.`,
        highlight: [curr],
        state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
        pointer_labels: { curr, "new": newNodeId }
      });
      curr = leftChild || "";
    } else {
      direction = "right";
      frames.push({
        step_index: stepIndex++,
        description: `${valNum} >= ${currVal}. Traversing to the right child.`,
        highlight: [curr],
        state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
        pointer_labels: { curr, "new": newNodeId }
      });
      curr = rightChild || "";
    }
  }

  // Insert under parent
  if (parent && direction) {
    currentEdges.push({ from: parent, to: newNodeId, directed: true });
    
    frames.push({
      step_index: stepIndex++,
      description: `Found empty spot! Attaching new node ${newNodeId} as the ${direction} child of parent node ${parent}.`,
      highlight: [parent, newNodeId],
      state_snapshot: { nodes: nodesWithNew, edges: [...currentEdges] },
      pointer_labels: { parent, "new": newNodeId }
    });
  }

  return {
    structure_type: "binary_tree",
    operation: "insert",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes: nodesWithNew, edges: currentEdges },
    summary: `Successfully inserted ${newValue} into BST in O(log n) average time complexity.`
  };
}
