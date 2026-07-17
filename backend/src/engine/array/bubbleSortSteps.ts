import { StepFrame, StepTrace } from "../../types/contracts";

export function generateBubbleSortSteps(input: (number | string)[]): StepTrace {
  // Convert elements to numbers if possible for comparison
  const arr = [...input].map(val => (typeof val === 'string' ? parseFloat(val) || val : val)) as number[];
  const n = arr.length;
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  // Initial Frame
  frames.push({
    step_index: stepIndex++,
    description: `Initial array configuration: [${arr.join(", ")}]. Starting bubble sort.`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      // Comparison Frame
      comparisons++;
      frames.push({
        step_index: stepIndex++,
        description: `Comparing elements at index ${j} and ${j + 1}: (${arr[j]} vs ${arr[j + 1]})`,
        highlight: [j.toString(), (j + 1).toString()],
        compare: [j.toString(), (j + 1).toString()],
        state_snapshot: [...arr],
        pointer_labels: { i: i.toString(), j: j.toString() }
      });

      if (arr[j] > arr[j + 1]) {
        // Swap
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swaps++;
        swapped = true;

        // Swap Frame
        frames.push({
          step_index: stepIndex++,
          description: `Swap: ${arr[j + 1]} is greater than ${arr[j]}, swapping them.`,
          highlight: [j.toString(), (j + 1).toString()],
          swap: [j.toString(), (j + 1).toString()],
          state_snapshot: [...arr],
          pointer_labels: { i: i.toString(), j: j.toString() }
        });
      }
    }
    if (!swapped) {
      frames.push({
        step_index: stepIndex++,
        description: `No swaps occurred in this pass. Array is fully sorted.`,
        highlight: [],
        state_snapshot: [...arr],
        pointer_labels: { i: i.toString() }
      });
      break;
    }
  }

  // Final sorted frame
  frames.push({
    step_index: stepIndex++,
    description: `Sorted array: [${arr.join(", ")}]`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  return {
    structure_type: "array",
    operation: "bubble_sort",
    initial_state: [...input],
    frames,
    final_state: [...arr],
    summary: `Sorted in ${comparisons} comparisons and ${swaps} swaps using Bubble Sort — O(n²)`
  };
}
