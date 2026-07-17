import { StepFrame, StepTrace } from "../../types/contracts";

export function generateQuickSortSteps(input: (number | string)[]): StepTrace {
  const arr = [...input].map(val => (typeof val === 'string' ? parseFloat(val) || val : val)) as number[];
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  frames.push({
    step_index: stepIndex++,
    description: `Initial array: [${arr.join(", ")}]. Starting Quick Sort.`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  let comparisons = 0;
  let swaps = 0;

  function quickSortSync(low: number, high: number) {
    if (low < high) {
      const pi = partitionSync(low, high);
      quickSortSync(low, pi - 1);
      quickSortSync(pi + 1, high);
    }
  }

  function partitionSync(low: number, high: number): number {
    const pivot = arr[high];
    
    frames.push({
      step_index: stepIndex++,
      description: `Choosing pivot: ${pivot} at index ${high} for subarray [${low} to ${high}]`,
      highlight: [high.toString()],
      state_snapshot: [...arr],
      pointer_labels: { pivot: high.toString(), low: low.toString(), high: high.toString() }
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      comparisons++;
      frames.push({
        step_index: stepIndex++,
        description: `Comparing elements: arr[${j}] (${arr[j]}) with pivot (${pivot})`,
        highlight: [j.toString(), high.toString()],
        compare: [j.toString(), high.toString()],
        state_snapshot: [...arr],
        pointer_labels: { pivot: high.toString(), i: i.toString(), j: j.toString() }
      });

      if (arr[j] < pivot) {
        i++;
        // Swap
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        swaps++;

        frames.push({
          step_index: stepIndex++,
          description: `arr[${j}] (${arr[j]}) is smaller than pivot. Swapping with arr[${i}] (${arr[i]}).`,
          highlight: [i.toString(), j.toString()],
          swap: [i.toString(), j.toString()],
          state_snapshot: [...arr],
          pointer_labels: { pivot: high.toString(), i: i.toString(), j: j.toString() }
        });
      }
    }

    // Place pivot in correct position
    const temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    swaps++;

    frames.push({
      step_index: stepIndex++,
      description: `Placing pivot ${pivot} at its correct sorted position index ${i + 1} by swapping with arr[${i + 1}] (${arr[high]})`,
      highlight: [(i + 1).toString(), high.toString()],
      swap: [(i + 1).toString(), high.toString()],
      state_snapshot: [...arr],
      pointer_labels: { pivot: (i + 1).toString() }
    });

    return i + 1;
  }

  quickSortSync(0, arr.length - 1);

  frames.push({
    step_index: stepIndex++,
    description: `Array fully sorted: [${arr.join(", ")}]`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  return {
    structure_type: "array",
    operation: "quick_sort",
    initial_state: [...input],
    frames,
    final_state: [...arr],
    summary: `Sorted in ${comparisons} comparisons and ${swaps} swaps using Quick Sort — O(n log n) average`
  };
}
