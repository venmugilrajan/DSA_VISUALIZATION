import { StepFrame, StepTrace } from "../../types/contracts";

export function generateReverseSteps(input: (number | string)[]): StepTrace {
  const arr = [...input];
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  frames.push({
    step_index: stepIndex++,
    description: `Initial array: [${arr.join(", ")}]. Starting reverse operation.`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    frames.push({
      step_index: stepIndex++,
      description: `Pointers at left=${left} (val: ${arr[left]}) and right=${right} (val: ${arr[right]}). Preparing to swap.`,
      highlight: [left.toString(), right.toString()],
      compare: [left.toString(), right.toString()],
      state_snapshot: [...arr],
      pointer_labels: { left: left.toString(), right: right.toString() }
    });

    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;

    frames.push({
      step_index: stepIndex++,
      description: `Swapped indices ${left} and ${right}. Moving pointers inward.`,
      highlight: [left.toString(), right.toString()],
      swap: [left.toString(), right.toString()],
      state_snapshot: [...arr],
      pointer_labels: { left: left.toString(), right: right.toString() }
    });

    left++;
    right--;
  }

  frames.push({
    step_index: stepIndex++,
    description: `Array fully reversed: [${arr.join(", ")}]`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  return {
    structure_type: "array",
    operation: "reverse",
    initial_state: [...input],
    frames,
    final_state: [...arr],
    summary: `Reversed array in O(n) time complexity.`
  };
}
