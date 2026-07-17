export type StructureType = "array" | "linked_list" | "stack" | "queue" | "binary_tree" | "graph";

export interface ParsedStructure {
  type: StructureType;
  values?: (number | string)[];        // for array/stack/queue
  nodes?: { id: string; value: number | string; x?: number; y?: number }[];       // for tree/graph/linked_list
  edges?: { from: string; to: string; weight?: number; directed?: boolean; side?: "left" | "right" }[]; // for graph/tree/linked_list
  raw_confidence: number;              // 0-1, how confident the vision model was
  warnings?: string[];                 // e.g. "3rd digit unclear, assumed 8"
}

export interface StructureClassification {
  detected_type: StructureType;
  confidence: number;
  alternate_guess?: StructureType;
  visual_reasoning: string;
}


export interface OperationIntent {
  structure: StructureType;
  operation: string;      // e.g. "bubble_sort", "reverse", "bfs", "insert", "binary_search"
  params?: {
    target?: number | string;        // for search/insert
    start_node?: string;    // for graph/tree traversal
    order?: "asc" | "desc";
    index?: number;
    custom_prompt?: string;
  };
  clarification_needed?: string; // if ambiguous, ask user instead of guessing
}

export interface StepFrame {
  step_index: number;
  description: string;        // human-readable step description
  highlight: string[];        // ids/indices of elements to highlight this frame
  compare?: [string, string]; // pair being compared, if applicable
  swap?: [string, string];
  state_snapshot: any;        // full structure state AFTER this step (array values, tree shape, etc.)
  pointer_labels?: Record<string, string>; // e.g. { "i": "2", "j": "3" }
}

export interface StepTrace {
  structure_type: StructureType;
  operation: string;
  initial_state: any;
  frames: StepFrame[];
  final_state: any;
  summary: string;
}
