import { StepFrame, StepTrace } from "../../types/contracts";

export function generateLinearSearchSteps(input: (number | string)[], target: number | string): StepTrace {
  const arr = [...input];
  const frames: StepFrame[] = [];
  let stepIndex = 0;
  
  // Convert target to number if it is numeric
  const numericTarget = typeof target === 'string' && !isNaN(Number(target)) ? Number(target) : target;

  frames.push({
    step_index: stepIndex++,
    description: `Starting linear search for target "${target}" in array: [${arr.join(", ")}]`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  let foundIndex = -1;
  for (let i = 0; i < arr.length; i++) {
    const currentVal = arr[i];
    const match = currentVal == numericTarget || currentVal == target;

    frames.push({
      step_index: stepIndex++,
      description: `Checking index ${i}: Value ${currentVal} ${match ? "matches" : "does not match"} target ${target}.`,
      highlight: [i.toString()],
      state_snapshot: [...arr],
      pointer_labels: { idx: i.toString() }
    });

    if (match) {
      foundIndex = i;
      break;
    }
  }

  const summary = foundIndex !== -1 
    ? `Target "${target}" found at index ${foundIndex} using Linear Search — O(n)`
    : `Target "${target}" not found in the array using Linear Search — O(n)`;

  frames.push({
    step_index: stepIndex++,
    description: foundIndex !== -1 
      ? `Search success: Target found at index ${foundIndex}.`
      : `Search complete: Target not found.`,
    highlight: foundIndex !== -1 ? [foundIndex.toString()] : [],
    state_snapshot: [...arr],
    pointer_labels: foundIndex !== -1 ? { found: foundIndex.toString() } : {}
  });

  return {
    structure_type: "array",
    operation: "linear_search",
    initial_state: [...input],
    frames,
    final_state: [...arr],
    summary
  };
}
