import { StepFrame, StepTrace } from "../../types/contracts";

export function generateMergeSortSteps(input: (number | string)[]): StepTrace {
  const arr = [...input].map(val => (typeof val === 'string' ? parseFloat(val) || val : val)) as number[];
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  frames.push({
    step_index: stepIndex++,
    description: `Initial array: [${arr.join(", ")}]. Starting Merge Sort.`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  let comparisons = 0;

  async function mergeSort(l: number, r: number) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);

    frames.push({
      step_index: stepIndex++,
      description: `Splitting subarray [${l} to ${r}]: Left side [${l} to ${m}], Right side [${m + 1} to ${r}].`,
      highlight: Array.from({ length: r - l + 1 }, (_, k) => (l + k).toString()),
      state_snapshot: [...arr],
      pointer_labels: { left: l.toString(), mid: m.toString(), right: r.toString() }
    });

    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);
  }

  async function merge(l: number, m: number, r: number) {
    const leftArr = arr.slice(l, m + 1);
    const rightArr = arr.slice(m + 1, r + 1);

    let i = 0, j = 0, k = l;

    frames.push({
      step_index: stepIndex++,
      description: `Merging subarray [${l} to ${m}] (${leftArr.join(", ")}) and [${m + 1} to ${r}] (${rightArr.join(", ")})`,
      highlight: Array.from({ length: r - l + 1 }, (_, idx) => (l + idx).toString()),
      state_snapshot: [...arr],
      pointer_labels: { left: l.toString(), mid: m.toString(), right: r.toString() }
    });

    while (i < leftArr.length && j < rightArr.length) {
      comparisons++;
      frames.push({
        step_index: stepIndex++,
        description: `Comparing elements from left subarray (${leftArr[i]}) and right subarray (${rightArr[j]})`,
        highlight: [(l + i).toString(), (m + 1 + j).toString()],
        compare: [(l + i).toString(), (m + 1 + j).toString()],
        state_snapshot: [...arr],
        pointer_labels: { k: k.toString() }
      });

      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      k++;

      frames.push({
        step_index: stepIndex++,
        description: `Merged intermediate element into position. Current state: [${arr.join(", ")}]`,
        highlight: [ (k - 1).toString() ],
        state_snapshot: [...arr],
        pointer_labels: { k: (k - 1).toString() }
      });
    }

    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      i++;
      k++;
      frames.push({
        step_index: stepIndex++,
        description: `Appending remaining element from left subarray: ${arr[k - 1]}`,
        highlight: [(k - 1).toString()],
        state_snapshot: [...arr],
        pointer_labels: { k: (k - 1).toString() }
      });
    }

    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      j++;
      k++;
      frames.push({
        step_index: stepIndex++,
        description: `Appending remaining element from right subarray: ${arr[k - 1]}`,
        highlight: [(k - 1).toString()],
        state_snapshot: [...arr],
        pointer_labels: { k: (k - 1).toString() }
      });
    }
  }

  // Run the synchronous recursive function using a synchronous-like simulation
  // Since JavaScript doesn't support blocking, we just call the helper sync
  function mergeSortSync(l: number, r: number) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    
    frames.push({
      step_index: stepIndex++,
      description: `Splitting subarray: indices ${l} to ${r}.`,
      highlight: Array.from({ length: r - l + 1 }, (_, idx) => (l + idx).toString()),
      state_snapshot: [...arr],
      pointer_labels: { low: l.toString(), mid: m.toString(), high: r.toString() }
    });

    mergeSortSync(l, m);
    mergeSortSync(m + 1, r);
    mergeSync(l, m, r);
  }

  function mergeSync(l: number, m: number, r: number) {
    const leftArr = arr.slice(l, m + 1);
    const rightArr = arr.slice(m + 1, r + 1);

    let i = 0, j = 0, k = l;

    while (i < leftArr.length && j < rightArr.length) {
      comparisons++;
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      frames.push({
        step_index: stepIndex++,
        description: `Comparing elements from left side (${leftArr[i-1] ?? leftArr[i]}) and right side (${rightArr[j-1] ?? rightArr[j]}), inserting into position ${k}.`,
        highlight: [k.toString()],
        state_snapshot: [...arr],
        pointer_labels: { k: k.toString() }
      });
      k++;
    }

    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      i++;
      frames.push({
        step_index: stepIndex++,
        description: `Copying remaining element from left: ${arr[k]} to index ${k}.`,
        highlight: [k.toString()],
        state_snapshot: [...arr],
        pointer_labels: { k: k.toString() }
      });
      k++;
    }

    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      j++;
      frames.push({
        step_index: stepIndex++,
        description: `Copying remaining element from right: ${arr[k]} to index ${k}.`,
        highlight: [k.toString()],
        state_snapshot: [...arr],
        pointer_labels: { k: k.toString() }
      });
      k++;
    }
  }

  mergeSortSync(0, arr.length - 1);

  frames.push({
    step_index: stepIndex++,
    description: `Array fully sorted: [${arr.join(", ")}]`,
    highlight: [],
    state_snapshot: [...arr],
    pointer_labels: {}
  });

  return {
    structure_type: "array",
    operation: "merge_sort",
    initial_state: [...input],
    frames,
    final_state: [...arr],
    summary: `Sorted in ${comparisons} comparisons using Merge Sort — O(n log n)`
  };
}
