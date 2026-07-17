import { StepFrame, StepTrace } from "../../types/contracts";

export function generateStackSteps(
  values: (number | string)[],
  operation: "push" | "pop",
  target?: number | string
): StepTrace {
  const currentValues = [...values];
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  frames.push({
    step_index: stepIndex++,
    description: `Initial stack state: [${currentValues.join(", ")}] (Top is rightmost element).`,
    highlight: [],
    state_snapshot: [...currentValues],
    pointer_labels: currentValues.length > 0 ? { top: (currentValues.length - 1).toString() } : {}
  });

  if (operation === "push") {
    if (target === undefined) {
      target = 42; // default fallback
    }
    
    // Highlight push
    frames.push({
      step_index: stepIndex++,
      description: `Pushing new value ${target} onto the stack.`,
      highlight: [],
      state_snapshot: [...currentValues],
      pointer_labels: { incoming: "new" }
    });

    currentValues.push(target);
    frames.push({
      step_index: stepIndex++,
      description: `Value ${target} added to the top of the stack.`,
      highlight: [(currentValues.length - 1).toString()],
      state_snapshot: [...currentValues],
      pointer_labels: { top: (currentValues.length - 1).toString() }
    });
  } else {
    // Pop operation
    if (currentValues.length === 0) {
      frames.push({
        step_index: stepIndex++,
        description: `Underflow: Cannot pop from an empty stack.`,
        highlight: [],
        state_snapshot: [...currentValues],
        pointer_labels: {}
      });
    } else {
      const topIdx = currentValues.length - 1;
      const poppedVal = currentValues[topIdx];
      
      frames.push({
        step_index: stepIndex++,
        description: `Preparing to pop top value: ${poppedVal} from index ${topIdx}.`,
        highlight: [topIdx.toString()],
        state_snapshot: [...currentValues],
        pointer_labels: { top: topIdx.toString() }
      });

      currentValues.pop();
      frames.push({
        step_index: stepIndex++,
        description: `Popped value ${poppedVal} from the stack.`,
        highlight: [],
        state_snapshot: [...currentValues],
        pointer_labels: currentValues.length > 0 ? { top: (currentValues.length - 1).toString() } : {}
      });
    }
  }

  return {
    structure_type: "stack",
    operation,
    initial_state: [...values],
    frames,
    final_state: [...currentValues],
    summary: operation === "push" 
      ? `Pushed ${target} onto the stack — O(1) time.`
      : `Popped top element from the stack — O(1) time.`
  };
}
