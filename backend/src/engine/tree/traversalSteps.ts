import { StepFrame, StepTrace, ParsedStructure } from "../../types/contracts";

export function generateTreeTraversalSteps(
  structure: ParsedStructure,
  type: "inorder" | "preorder" | "postorder"
): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  // Build tree index structure (left/right children)
  // Determine children based on side if available, fallback to value sorting
  const parentToChildren: Record<string, string[]> = {};
  edges.forEach(e => {
    if (!parentToChildren[e.from]) {
      parentToChildren[e.from] = [];
    }
    parentToChildren[e.from].push(e.to);
  });

  Object.keys(parentToChildren).forEach(parent => {
    const parentEdges = edges.filter(e => e.from === parent);
    parentToChildren[parent].sort((a, b) => {
      const edgeA = parentEdges.find(e => e.to === a);
      const edgeB = parentEdges.find(e => e.to === b);
      if (edgeA?.side && edgeB?.side) {
        return edgeA.side === "left" ? -1 : 1;
      }
      if (edgeA?.side && !edgeB?.side) {
        return edgeA.side === "left" ? -1 : 1;
      }
      if (!edgeA?.side && edgeB?.side) {
        return edgeB.side === "left" ? 1 : -1;
      }
      const valA = nodes.find(n => n.id === a)?.value ?? "";
      const valB = nodes.find(n => n.id === b)?.value ?? "";
      return (valA as any) < (valB as any) ? -1 : 1;
    });
  });

  // Find root
  const incoming = new Set(edges.map(e => e.to));
  const rootId = nodes.find(n => !incoming.has(n.id))?.id || nodes[0]?.id || "";

  const frames: StepFrame[] = [];
  let stepIndex = 0;
  const visited: string[] = [];

  frames.push({
    step_index: stepIndex++,
    description: `Starting ${type} traversal on the binary tree. Root is ${rootId}.`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: [] },
    pointer_labels: { root: rootId }
  });

  function traverse(nodeId: string | undefined) {
    if (!nodeId) return;

    const nodeVal = nodes.find(n => n.id === nodeId)?.value ?? nodeId;
    const children = parentToChildren[nodeId] || [];
    const leftChild = children[0];
    const rightChild = children[1];

    if (type === "preorder") {
      visited.push(nodeId);
      frames.push({
        step_index: stepIndex++,
        description: `Preorder Visit: Process node ${nodeId} (value: ${nodeVal}) first.`,
        highlight: [nodeId],
        state_snapshot: { nodes, edges, visited: [...visited] },
        pointer_labels: { curr: nodeId }
      });
    } else {
      frames.push({
        step_index: stepIndex++,
        description: `Visiting node ${nodeId} (value: ${nodeVal}). Traversing left subtree.`,
        highlight: [nodeId],
        state_snapshot: { nodes, edges, visited: [...visited] },
        pointer_labels: { curr: nodeId }
      });
    }

    if (leftChild) {
      traverse(leftChild);
    }

    if (type === "inorder") {
      visited.push(nodeId);
      frames.push({
        step_index: stepIndex++,
        description: `Inorder Visit: Process node ${nodeId} (value: ${nodeVal}) after left subtree.`,
        highlight: [nodeId],
        state_snapshot: { nodes, edges, visited: [...visited] },
        pointer_labels: { curr: nodeId }
      });
    } else if (type === "postorder") {
      frames.push({
        step_index: stepIndex++,
        description: `Returned to node ${nodeId} (value: ${nodeVal}). Traversing right subtree.`,
        highlight: [nodeId],
        state_snapshot: { nodes, edges, visited: [...visited] },
        pointer_labels: { curr: nodeId }
      });
    }

    if (rightChild) {
      traverse(rightChild);
    }

    if (type === "postorder") {
      visited.push(nodeId);
      frames.push({
        step_index: stepIndex++,
        description: `Postorder Visit: Process node ${nodeId} (value: ${nodeVal}) after both subtrees.`,
        highlight: [nodeId],
        state_snapshot: { nodes, edges, visited: [...visited] },
        pointer_labels: { curr: nodeId }
      });
    }
  }

  if (rootId) {
    traverse(rootId);
  }

  frames.push({
    step_index: stepIndex++,
    description: `${type.toUpperCase()} traversal completed. Order of visited nodes: [${visited.map(id => nodes.find(n => n.id === id)?.value ?? id).join(", ")}]`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: [...visited] },
    pointer_labels: {}
  });

  return {
    structure_type: "binary_tree",
    operation: type,
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes, edges, visited },
    summary: `${type.toUpperCase()} Traversal visited all ${nodes.length} nodes in O(n) time.`
  };
}
export function generateTreeBFSSteps(structure: ParsedStructure): StepTrace {
  const nodes = structure.nodes ? [...structure.nodes] : [];
  const edges = structure.edges ? [...structure.edges] : [];

  const parentToChildren: Record<string, string[]> = {};
  edges.forEach(e => {
    if (!parentToChildren[e.from]) parentToChildren[e.from] = [];
    parentToChildren[e.from].push(e.to);
  });

  // Sort children left-to-right based on side, fallback to value
  Object.keys(parentToChildren).forEach(parent => {
    const parentEdges = edges.filter(e => e.from === parent);
    parentToChildren[parent].sort((a, b) => {
      const edgeA = parentEdges.find(e => e.to === a);
      const edgeB = parentEdges.find(e => e.to === b);
      if (edgeA?.side && edgeB?.side) {
        return edgeA.side === "left" ? -1 : 1;
      }
      if (edgeA?.side && !edgeB?.side) {
        return edgeA.side === "left" ? -1 : 1;
      }
      if (!edgeA?.side && edgeB?.side) {
        return edgeB.side === "left" ? 1 : -1;
      }
      const valA = nodes.find(n => n.id === a)?.value ?? "";
      const valB = nodes.find(n => n.id === b)?.value ?? "";
      return (valA as any) < (valB as any) ? -1 : 1;
    });
  });

  const incoming = new Set(edges.map(e => e.to));
  const rootId = nodes.find(n => !incoming.has(n.id))?.id || nodes[0]?.id || "";

  const frames: StepFrame[] = [];
  let stepIndex = 0;
  const visited: string[] = [];
  const queue: string[] = [];

  frames.push({
    step_index: stepIndex++,
    description: `Starting BFS (Level Order Traversal) on binary tree.`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: [], queue: [] },
    pointer_labels: {}
  });

  if (rootId) {
    queue.push(rootId);
    frames.push({
      step_index: stepIndex++,
      description: `Push root node ${rootId} into queue.`,
      highlight: [rootId],
      state_snapshot: { nodes, edges, visited: [], queue: [...queue] },
      pointer_labels: { root: rootId }
    });
  }

  while (queue.length > 0) {
    const currId = queue.shift()!;
    visited.push(currId);

    const nodeVal = nodes.find(n => n.id === currId)?.value ?? currId;
    frames.push({
      step_index: stepIndex++,
      description: `Dequeue node ${currId} (value: ${nodeVal}) and mark as visited.`,
      highlight: [currId],
      state_snapshot: { nodes, edges, visited: [...visited], queue: [...queue] },
      pointer_labels: { curr: currId }
    });

    const children = parentToChildren[currId] || [];
    for (const child of children) {
      queue.push(child);
      frames.push({
        step_index: stepIndex++,
        description: `Enqueue child node ${child} of parent ${currId}.`,
        highlight: [child],
        state_snapshot: { nodes, edges, visited: [...visited], queue: [...queue] },
        pointer_labels: { child }
      });
    }
  }

  frames.push({
    step_index: stepIndex++,
    description: `BFS traversal completed. Traversal Order: [${visited.map(id => nodes.find(n => n.id === id)?.value ?? id).join(", ")}]`,
    highlight: [],
    state_snapshot: { nodes, edges, visited: [...visited], queue: [] },
    pointer_labels: {}
  });

  return {
    structure_type: "binary_tree",
    operation: "bfs",
    initial_state: { nodes, edges },
    frames,
    final_state: { nodes, edges, visited },
    summary: `BFS Traversal completed in O(n) time.`
  };
}
