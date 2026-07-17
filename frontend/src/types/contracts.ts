export type StructureType = "array" | "linked_list" | "stack" | "queue" | "binary_tree" | "graph";

export interface ParsedStructure {
  type: StructureType;
  values?: (number | string)[];        // for array/stack/queue
  nodes?: { id: string; value: number | string; x?: number; y?: number }[];       // for tree/graph/linked_list
  edges?: { from: string; to: string; weight?: number; directed?: boolean; side?: "left" | "right" }[]; // for graph/tree/linked_list
  raw_confidence: number;              // 0-1
  warnings?: string[];
}

export interface StructureClassification {
  detected_type: StructureType;
  confidence: number;
  alternate_guess?: StructureType;
  visual_reasoning: string;
}


export interface OperationIntent {
  structure: StructureType;
  operation: string;      // bubble_sort, reverse, bfs, etc.
  params?: {
    target?: number | string;
    start_node?: string;
    order?: "asc" | "desc";
    index?: number;
    custom_prompt?: string;
  };
  clarification_needed?: string;
}

export interface StepFrame {
  step_index: number;
  description: string;
  highlight: string[];
  compare?: [string, string];
  swap?: [string, string];
  state_snapshot: any;
  pointer_labels?: Record<string, string>;
}

export interface StepTrace {
  structure_type: StructureType;
  operation: string;
  initial_state: any;
  frames: StepFrame[];
  final_state: any;
  summary: string;
}
