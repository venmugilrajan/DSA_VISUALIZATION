import { StepFrame, StepTrace } from "../../types/contracts";

export function generateQueueSteps(
  values: (number | string)[],
  operation: "enqueue" | "dequeue",
  target?: number | string
): StepTrace {
  const currentValues = [...values];
  const frames: StepFrame[] = [];
  let stepIndex = 0;

  const getPointers = (vals: any[]): Record<string, string> => {
    if (vals.length === 0) return {};
    return {
      front: "0",
      rear: (vals.length - 1).toString()
    };
  };

  frames.push({
    step_index: stepIndex++,
    description: `Initial queue state: [${currentValues.join(", ")}] (Front is index 0, Rear is index ${currentValues.length - 1}).`,
    highlight: [],
    state_snapshot: [...currentValues],
    pointer_labels: getPointers(currentValues)
  });

  if (operation === "enqueue") {
    if (target === undefined) {
      target = 42;
    }

    frames.push({
      step_index: stepIndex++,
      description: `Enqueue: Preparing to add value ${target} at the rear.`,
      highlight: [],
      state_snapshot: [...currentValues],
      pointer_labels: { ...getPointers(currentValues), incoming: "rear" }
    });

    currentValues.push(target);
    frames.push({
      step_index: stepIndex++,
      description: `Enqueued value ${target} at index ${currentValues.length - 1}.`,
      highlight: [(currentValues.length - 1).toString()],
      state_snapshot: [...currentValues],
      pointer_labels: getPointers(currentValues)
    });
  } else {
    // dequeue
    if (currentValues.length === 0) {
      frames.push({
        step_index: stepIndex++,
        description: `Underflow: Cannot dequeue from an empty queue.`,
        highlight: [],
        state_snapshot: [...currentValues],
        pointer_labels: {}
      });
    } else {
      const dequeuedVal = currentValues[0];
      frames.push({
        step_index: stepIndex++,
        description: `Dequeue: Preparing to remove front value ${dequeuedVal} from index 0.`,
        highlight: ["0"],
        state_snapshot: [...currentValues],
        pointer_labels: getPointers(currentValues)
      });

      currentValues.shift();
      frames.push({
        step_index: stepIndex++,
        description: `Dequeued value ${dequeuedVal} from the front of the queue. Shifted remaining elements left.`,
        highlight: [],
        state_snapshot: [...currentValues],
        pointer_labels: getPointers(currentValues)
      });
    }
  }

  return {
    structure_type: "queue",
    operation,
    initial_state: [...values],
    frames,
    final_state: [...currentValues],
    summary: operation === "enqueue"
      ? `Enqueued ${target} into the queue — O(1) time.`
      : `Dequeued front element from the queue — O(1) time.`
  };
}
