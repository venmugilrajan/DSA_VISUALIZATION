import { StepFrame, StepTrace } from "../../types/contracts";

export function generateBinarySearchSteps(input: (number | string)[], target: number | string): StepTrace {
  // Binary search requires sorting first
  const original = [...input];
  const sorted = [...input].map(v => (typeof v === "string" ? parseFloat(v) || v : v));
  sorted.sort((a, b) => (a as any) - (b as any));

  const numericTarget = typeof target === 'string' && !isNaN(Number(target)) ? Number(target) : target;
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  frames.push({
    step_index: stepIndex++,
    description: `Binary Search requires a sorted array. Sorting original array to: [${sorted.join(", ")}]. Looking for target "${target}".`,
    highlight: [],
    state_snapshot: [...sorted],
    pointer_labels: {}
  });

  let low = 0;
  let high = sorted.length - 1;
  let foundIdx = -1;
  let stepsCount = 0;

  while (low <= high) {
    stepsCount++;
    const mid = Math.floor((low + high) / 2);
    const midVal = sorted[mid];

    frames.push({
      step_index: stepIndex++,
      description: `Step ${stepsCount}: Low=${low}, High=${high}. Calculating middle index: mid = (${low} + ${high}) / 2 = ${mid} (value: ${midVal}).`,
      highlight: [mid.toString(), low.toString(), high.toString()],
      state_snapshot: [...sorted],
      pointer_labels: { low: low.toString(), mid: mid.toString(), high: high.toString() }
    });

    if (midVal == numericTarget || midVal == target) {
      foundIdx = mid;
      frames.push({
        step_index: stepIndex++,
        description: `Target "${target}" matches middle value ${midVal} at index ${mid}!`,
        highlight: [mid.toString()],
        state_snapshot: [...sorted],
        pointer_labels: { found: mid.toString() }
      });
      break;
    } else if ((midVal as any) < (numericTarget as any)) {
      frames.push({
        step_index: stepIndex++,
        description: `Middle value ${midVal} is less than target ${target}. Searching right half: low = mid + 1 = ${mid + 1}.`,
        highlight: [mid.toString()],
        state_snapshot: [...sorted],
        pointer_labels: { low: (mid + 1).toString(), high: high.toString() }
      });
      low = mid + 1;
    } else {
      frames.push({
        step_index: stepIndex++,
        description: `Middle value ${midVal} is greater than target ${target}. Searching left half: high = mid - 1 = ${mid - 1}.`,
        highlight: [mid.toString()],
        state_snapshot: [...sorted],
        pointer_labels: { low: low.toString(), high: (mid - 1).toString() }
      });
      high = mid - 1;
    }
  }

  const summary = foundIdx !== -1 
    ? `Target "${target}" found at index ${foundIdx} in ${stepsCount} steps using Binary Search — O(log n)`
    : `Target "${target}" not found in the array after ${stepsCount} steps using Binary Search — O(log n)`;

  if (foundIdx === -1) {
    frames.push({
      step_index: stepIndex++,
      description: `Search complete. Target not found.`,
      highlight: [],
      state_snapshot: [...sorted],
      pointer_labels: {}
    });
  }

  return {
    structure_type: "array",
    operation: "binary_search",
    initial_state: original,
    frames,
    final_state: [...sorted],
    summary
  };
}
