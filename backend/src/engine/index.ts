import { ParsedStructure, OperationIntent, StepTrace } from "../types/contracts";

// Array generators
import { generateBubbleSortSteps } from "./array/bubbleSortSteps";
import { generateMergeSortSteps } from "./array/mergeSortSteps";
import { generateQuickSortSteps } from "./array/quickSortSteps";
import { generateReverseSteps } from "./array/reverseSteps";
import { generateLinearSearchSteps } from "./array/linearSearchSteps";
import { generateBinarySearchSteps } from "./array/binarySearchSteps";

// Linked List generators
import { generateReverseListSteps } from "./linkedList/reverseListSteps";
import { generateLinkedListDeleteSteps, generateLinkedListDetectCycleSteps } from "./linkedList/deleteSteps";
import { generateLinkedListInsertSteps as insertListSteps } from "./linkedList/insertSteps";

// Stack/Queue generators
import { generateStackSteps } from "./stackQueue/pushPopSteps";
import { generateQueueSteps } from "./stackQueue/enqueueDequeueSteps";

// Tree generators
import { generateBSTInsertSteps } from "./tree/insertBSTSteps";
import { generateTreeTraversalSteps, generateTreeBFSSteps } from "./tree/traversalSteps";

// Graph generators
import { generateGraphBFSSteps } from "./graph/bfsSteps";
import { generateGraphDFSSteps } from "./graph/dfsSteps";
import { generateDijkstraSteps } from "./graph/dijkstraSteps";

import { generateCustomStepsViaLLM } from "../services/llm";

export async function generateStepTrace(structure: ParsedStructure, intent: OperationIntent): Promise<StepTrace> {
  const structureType = intent.structure || structure.type;
  const op = intent.operation;
  const params = intent.params || {};

  if (op === "custom") {
    return await generateCustomStepsViaLLM(structure, intent);
  }

  try {
    switch (structureType) {
      case "array":
        if (op === "bubble_sort") return generateBubbleSortSteps(structure.values || []);
        if (op === "merge_sort") return generateMergeSortSteps(structure.values || []);
        if (op === "quick_sort") return generateQuickSortSteps(structure.values || []);
        if (op === "reverse") return generateReverseSteps(structure.values || []);
        if (op === "linear_search") return generateLinearSearchSteps(structure.values || [], params.target ?? "");
        if (op === "binary_search") return generateBinarySearchSteps(structure.values || [], params.target ?? "");
        break;

      case "linked_list":
        if (op === "reverse") return generateReverseListSteps(structure);
        if (op === "insert") return insertListSteps(structure, params.target ?? 42, params.index ?? 0);
        if (op === "delete") return generateLinkedListDeleteSteps(structure, params.target ?? "");
        if (op === "detect_cycle") return generateLinkedListDetectCycleSteps(structure);
        break;

      case "stack":
        if (op === "push" || op === "pop") return generateStackSteps(structure.values || [], op, params.target);
        break;

      case "queue":
        if (op === "enqueue" || op === "dequeue") return generateQueueSteps(structure.values || [], op, params.target);
        break;

      case "binary_tree":
        if (op === "insert") return generateBSTInsertSteps(structure, params.target ?? 42);
        if (op === "inorder" || op === "preorder" || op === "postorder") return generateTreeTraversalSteps(structure, op);
        if (op === "bfs") return generateTreeBFSSteps(structure);
        break;

      case "graph":
        if (op === "bfs") return generateGraphBFSSteps(structure, params.start_node);
        if (op === "dfs") return generateGraphDFSSteps(structure, params.start_node);
        if (op === "dijkstra") return generateDijkstraSteps(structure, params.start_node);
        break;
    }
  } catch (localError) {
    console.warn("Local generator failed, falling back to LLM step generation:", localError);
  }

  // Fallback to LLM if operation is not supported locally
  return await generateCustomStepsViaLLM(structure, intent);
}
