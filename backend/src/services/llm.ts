import Anthropic from "@anthropic-ai/sdk";
import { ParsedStructure, OperationIntent, StructureType, StepTrace } from "../types/contracts";

export interface StructureClassification {
  detected_type: StructureType;
  confidence: number;
  alternate_guess?: StructureType;
  visual_reasoning: string;
}

async function callGemini(
  prompt: string,
  image?: { base64: string; mimeType: string }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    let retries = 3;
    while (retries > 0) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const parts: any[] = [{ text: prompt }];
        if (image) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.base64,
            },
          });
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 503 && retries > 1) {
            console.warn(`Model ${model} returned 503. Retrying in 1s (${retries - 1} left)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
            continue;
          }
          throw new Error(`Gemini API error for ${model}: ${response.status} - ${errorText}`);
        }

        const data: any = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error(`Empty response from Gemini API for ${model}`);
        }
        return text;
      } catch (err: any) {
        if (retries > 1 && (err.message?.includes("503") || err.message?.includes("UNAVAILABLE"))) {
          console.warn(`Model ${model} failed with 503/UNAVAILABLE. Retrying in 1s (${retries - 1} left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
          continue;
        }
        console.warn(`Model ${model} failed:`, err.message || err);
        lastError = err;
        break; // Go to next model
      }
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

async function callGroq(
  prompt: string,
  image?: { base64: string; mimeType: string }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables.");
  }

  const model = image ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const messages: any[] = [];
  if (image) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${image.mimeType};base64,${image.base64}`
          }
        }
      ]
    });
  } else {
    messages.push({
      role: "user",
      content: prompt
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      response_format: prompt.includes("JSON") ? { type: "json_object" } : undefined
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data: any = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from Groq API");
  }
  return text;
}

async function callOpenRouter(
  prompt: string,
  image?: { base64: string; mimeType: string }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
  }

  const model = "google/gemini-2.5-flash";
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const messages: any[] = [];
  if (image) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${image.mimeType};base64,${image.base64}`
          }
        }
      ]
    });
  } else {
    messages.push({
      role: "user",
      content: prompt
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5000",
      "X-Title": "DSA Vision Visualizer",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      response_format: prompt.includes("JSON") ? { type: "json_object" } : undefined
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: any = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from OpenRouter API");
  }
  return text;
}

async function requestLLM(
  prompt: string,
  image?: { base64: string; mimeType: string }
): Promise<string> {
  const errors: string[] = [];

  // 1. Try Anthropic (Claude)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.trim() !== "") {
    try {
      console.log("Attempting LLM call via Anthropic...");
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      let messagesContent: any[] = [];
      if (image) {
        messagesContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: image.mimeType as any,
            data: image.base64,
          },
        });
      }
      messagesContent.push({
        type: "text",
        text: prompt,
      });

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1500,
        messages: [{ role: "user", content: messagesContent }],
      });

      const text = response.content
        .filter((c) => c.type === "text")
        .map((c: any) => c.text)
        .join("");

      if (text) return text;
    } catch (e: any) {
      console.warn("Anthropic API failed:", e.message || e);
      errors.push(`Anthropic: ${e.message}`);
    }
  }

  // 2. Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    try {
      console.log("Attempting LLM call via Gemini...");
      const text = await callGemini(prompt, image);
      if (text) return text;
    } catch (e: any) {
      console.warn("Gemini API failed:", e.message || e);
      errors.push(`Gemini: ${e.message}`);
    }
  }

  // 3. Try Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim() !== "") {
    try {
      console.log("Attempting LLM call via Groq...");
      const text = await callGroq(prompt, image);
      if (text) return text;
    } catch (e: any) {
      console.warn("Groq API failed:", e.message || e);
      errors.push(`Groq: ${e.message}`);
    }
  }

  // 4. Try OpenRouter
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey && openRouterKey.trim() !== "") {
    try {
      console.log("Attempting LLM call via OpenRouter...");
      const text = await callOpenRouter(prompt, image);
      if (text) return text;
    } catch (e: any) {
      console.warn("OpenRouter API failed:", e.message || e);
      errors.push(`OpenRouter: ${e.message}`);
    }
  }

  throw new Error(`All LLM models and fallbacks failed. Errors:\n${errors.join("\n")}`);
}

export async function classifyStructureFromImage(
  imageBase64: string,
  mimeType: string
): Promise<StructureClassification> {
  if (imageBase64 === "mock-base64") {
    return getMockClassification();
  }

  const prompt = `You are a data-structure TYPE classifier. You will be shown an image of a
hand-drawn or printed data structure. Your ONLY job in this step is to decide
which of these six types it is — do NOT extract any values, node contents, or
labels yet.

Types: array, linked_list, stack, queue, binary_tree, graph

Use these visual cues to decide:
- array: a single row of adjacent boxes/cells, no arrows between them, no branching
- linked_list: boxes connected in a single chain by directional arrows, may show a
  "next" pointer or NULL at the end
- stack: a vertical column of boxes, typically labeled "top" or drawn narrower/taller
- queue: a horizontal row with distinct "front"/"rear" labels or entry/exit arrows
  on opposite ends
- binary_tree: circular or boxed nodes in a hierarchical/branching layout, each
  node connecting DOWNWARD to at most two children, root at top
- graph: nodes connected by edges in a non-hierarchical, possibly cyclic layout;
  edges may or may not have arrows/weights, connections don't follow a strict
  parent-child hierarchy

Respond with ONLY valid JSON, no markdown, no preamble:

{
  "detected_type": "array | linked_list | stack | queue | binary_tree | graph",
  "confidence": 0.0-1.0,
  "alternate_guess": "one of the six types, only if confidence < 0.85, else omit",
  "visual_reasoning": "one sentence describing the specific visual layout you saw that led to this decision"
}`;

  try {
    const textContent = await requestLLM(prompt, { base64: imageBase64, mimeType });
    return parseJSONResponse<StructureClassification>(textContent);
  } catch (error) {
    console.error("Error communicating with LLM (Classify):", error);
    throw error;
  }
}

// Stage 2c - Type-Specific Extraction
export async function extractStructureFromImage(
  imageBase64: string,
  mimeType: string,
  type: StructureType
): Promise<ParsedStructure> {
  if (imageBase64 === "mock-base64") {
    return getMockExtraction(type);
  }

  // Type-specific narrow prompts
  const prompts: Record<StructureType, string> = {
    array: `You are an array extractor. The image is confirmed to contain an array.
Extract the sequence of elements from left to right.
Respond with ONLY valid JSON matching this schema:
{
  "type": "array",
  "values": [number or string],
  "raw_confidence": 0.0-1.0,
  "warnings": ["warning notes if any text is unclear"]
}`,
    linked_list: `You are a linked list extractor. The image is confirmed to contain a linked list.
Extract nodes and edges. Assign each node a unique id (e.g. A, B, C).
Respond with ONLY valid JSON matching this schema:
{
  "type": "linked_list",
  "nodes": [{"id": "A", "value": number or string}],
  "edges": [{"from": "A", "to": "B", "directed": true}],
  "raw_confidence": 0.0-1.0,
  "warnings": []
}`,
    stack: `You are a stack extractor. The image is confirmed to contain a stack.
Extract elements from bottom to top.
Respond with ONLY valid JSON matching this schema:
{
  "type": "stack",
  "values": [number or string],
  "raw_confidence": 0.0-1.0,
  "warnings": []
}`,
    queue: `You are a queue extractor. The image is confirmed to contain a queue.
Extract elements from front to rear.
Respond with ONLY valid JSON matching this schema:
{
  "type": "queue",
  "values": [number or string],
  "raw_confidence": 0.0-1.0,
  "warnings": []
}`,
    binary_tree: `You are a binary tree extractor. The image has already been confirmed to
contain a binary tree — do not second-guess or change the type. Your only
job is to read the node values, estimate their relative 2D coordinate positions in the image, and reconstruct the parent-child edges.

Assign each node a short id (n1, n2, n3...) top-to-bottom, left-to-right.
For each node, identify its value, its relative coordinate position in the image (x and y as integers from 0 to 100, where 0,0 is the top-left corner and 100,100 is the bottom-right corner), and if present, its left and right children.

Respond with ONLY valid JSON, no markdown, no preamble:
{
  "type": "binary_tree",
  "nodes": [{ "id": "n1", "value": 8, "x": number, "y": number }, ...],
  "edges": [{ "from": "n1", "to": "n2", "side": "left" | "right" }, { "from": "n1", "to": "n3", "side": "left" | "right" }, ...],
  "raw_confidence": 0.0-1.0,
  "warnings": ["e.g. right child of n3 partially cut off in image, best guess used"]
}`,
    graph: `You are a graph node/edge extractor. The image contains a general graph.
Assign each node a unique short id. Extract node values, their relative coordinate position in the image (x and y as integers from 0 to 100, where 0,0 is the top-left corner and 100,100 is the bottom-right corner), and edges (from/to, weight if present, directed true/false).
Respond with ONLY valid JSON matching this schema:
{
  "type": "graph",
  "nodes": [{"id": "n1", "value": number or string, "x": number, "y": number}],
  "edges": [{"from": "n1", "to": "n2", "weight": number, "directed": boolean}],
  "raw_confidence": 0.0-1.0,
  "warnings": []
}`
  };

  const currentPrompt = prompts[type];

  try {
    const textContent = await requestLLM(currentPrompt, { base64: imageBase64, mimeType });
    return parseJSONResponse<ParsedStructure>(textContent);
  } catch (error) {
    console.error("Error communicating with LLM (Extract):", error);
    throw error;
  }
}

export async function interpretPrompt(
  prompt: string,
  structureType?: StructureType
): Promise<OperationIntent> {
  const systemPrompt = `You are an intent classifier for a DSA visualizer. Given a user's plain-English
request and the current data structure type, output ONLY JSON matching:

{
  "structure": "array | linked_list | stack | queue | binary_tree | graph",
  "operation": "bubble_sort | merge_sort | quick_sort | reverse | linear_search |
                binary_search | push | pop | enqueue | dequeue | insert | delete |
                bfs | dfs | inorder | preorder | postorder | dijkstra | custom",
  "params": {
    "target": number | string (optional),
    "start_node": "string" (optional),
    "order": "asc" | "desc" (optional),
    "index": number (optional),
    "custom_prompt": "string (the user's detailed description of the custom operation/method/complexity constraints, if operation is 'custom')"
  },
  "clarification_needed": "string, only if truly ambiguous, else omit"
}

Map casual language to the closest supported operation if it fits one of the predefined algorithms.
If the request is for a custom operation (e.g. "reverse only first half", "invert binary tree", "bubble sort in descending", or any other custom method, time complexity like O(n) specific steps), set "operation" to "custom" and set "custom_prompt" to the user's request.`;

  try {
    const textContent = await requestLLM(`${systemPrompt}\n\nUser Request: "${prompt}"\nCurrent Structure: "${structureType || "unknown"}"`);
    return parseJSONResponse<OperationIntent>(textContent);
  } catch (error) {
    console.error("Error communicating with LLM (Intent):", error);
    return getMockOperationIntent(prompt, structureType);
  }
}

export async function generateCustomStepsViaLLM(
  structure: ParsedStructure,
  intent: OperationIntent
): Promise<StepTrace> {
  const currentPrompt = `You are a DSA step-by-step trace generator.
The user wants to execute a custom operation on the following data structure:
Structure Type: ${structure.type}
Initial State: ${JSON.stringify(structure)}
Custom Operation Description: "${intent.params?.custom_prompt || intent.operation}"

Your job is to generate a step-by-step visual execution trace of this custom algorithm.
For each step of the algorithm (e.g. comparing elements, swapping, traversing nodes, updating pointers, changing node values), you must produce a StepFrame.

Respond with ONLY valid JSON matching this schema:
{
  "structure_type": "${structure.type}",
  "operation": "${intent.operation}",
  "initial_state": ${JSON.stringify(structure)},
  "frames": [
    {
      "step_index": number,
      "description": "string (Human-readable description of what this step does, e.g. 'Comparing element 1 and 2')",
      "highlight": ["string"], // array of element IDs or indices currently being focused/processed in this step
      "compare": ["string", "string"], // (optional) pair of element IDs/indices being compared
      "swap": ["string", "string"], // (optional) pair of element IDs/indices being swapped
      "pointer_labels": { "string": "string" }, // (optional) pointers e.g., {"curr": "n1", "runner": "n2"} or {"i": "0"}
      "state_snapshot": {
        // The complete state of the data structure AFTER this step is completed.
        // It must match the structure type schema:
        // - For array: { "values": [1, 2, 3] }
        // - For stack/queue: { "values": [1, 2, 3] }
        // - For linked_list: { "nodes": [{"id": "A", "value": 1, "x": 10, "y": 20}], "edges": [{"from": "A", "to": "B", "directed": true}] }
        // - For binary_tree: { "nodes": [{"id": "n1", "value": 1, "x": 50, "y": 20}], "edges": [{"from": "n1", "to": "n2"}] }
        // - For graph: { "nodes": [{"id": "n1", "value": 1, "x": 10, "y": 20}], "edges": [{"from": "n1", "to": "n2", "weight": 5, "directed": false}], "visited": ["n1"], "distances": {"n1": 0} }
      }
    }
  ],
  "final_state": {
    // The final state of the data structure
  },
  "summary": "Short summary of the algorithm execution, complexity (e.g. O(n)), etc."
}

CRITICAL RULES:
1. Ensure all node IDs, edge fields, and coordinates (x, y) match exactly the nodes and edges from the initial state, unless the operation explicitly inserts/deletes nodes or updates their values/positions.
2. In the "state_snapshot" of each frame, you must return the ENTIRE current state of the structure, not just the changes. If it is a binary_tree or graph, keep the coordinates ("x" and "y" fields) of the nodes so the frontend knows where to render them!
3. The response must be ONLY valid JSON, no markdown formatting (no \`\`\`json block), no text before or after the JSON.`;

  try {
    const textContent = await requestLLM(currentPrompt);
    return parseJSONResponse<StepTrace>(textContent);
  } catch (error) {
    console.error("Error communicating with LLM (Custom Steps):", error);
    throw error;
  }
}

function parseJSONResponse<T>(text: string): T {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();
  return JSON.parse(cleanText) as T;
}

// Fallback Mock values
function getMockClassification(): StructureClassification {
  return {
    detected_type: "array",
    confidence: 0.95,
    alternate_guess: "linked_list",
    visual_reasoning: "Running in Mock Mode. A row of elements resembling a sequential array of values was identified."
  };
}

function getMockExtraction(type: StructureType): ParsedStructure {
  const defaults: Record<StructureType, ParsedStructure> = {
    array: {
      type: "array",
      values: [12, 7, 9, 3, 15, 6],
      raw_confidence: 0.96,
      warnings: ["Offline sandbox mock data loaded for array structure."]
    },
    linked_list: {
      type: "linked_list",
      nodes: [
        { id: "A", value: 12 },
        { id: "B", value: 99 },
        { id: "C", value: 37 },
        { id: "D", value: 50 },
      ],
      edges: [
        { from: "A", to: "B", directed: true },
        { from: "B", to: "C", directed: true },
        { from: "C", to: "D", directed: true },
      ],
      raw_confidence: 0.94,
      warnings: ["Offline sandbox mock data loaded for linked list."]
    },
    stack: {
      type: "stack",
      values: [5, 10, 15, 20],
      raw_confidence: 0.95,
      warnings: ["Offline sandbox mock data loaded for stack."]
    },
    queue: {
      type: "queue",
      values: [10, 20, 30, 40],
      raw_confidence: 0.95,
      warnings: ["Offline sandbox mock data loaded for queue."]
    },
    binary_tree: {
      type: "binary_tree",
      nodes: [
        { id: "n1", value: 50 },
        { id: "n2", value: 30 },
        { id: "n3", value: 70 },
        { id: "n4", value: 20 },
        { id: "n5", value: 40 },
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n1", to: "n3" },
        { from: "n2", to: "n4" },
        { from: "n2", to: "n5" },
      ],
      raw_confidence: 0.92,
      warnings: ["Offline sandbox mock data loaded for binary tree."]
    },
    graph: {
      type: "graph",
      nodes: [
        { id: "A", value: "A" },
        { id: "B", value: "B" },
        { id: "C", value: "C" },
        { id: "D", value: "D" },
        { id: "E", value: "E" },
      ],
      edges: [
        { from: "A", to: "B", weight: 4, directed: false },
        { from: "A", to: "C", weight: 2, directed: false },
        { from: "B", to: "C", weight: 1, directed: false },
        { from: "B", to: "D", weight: 5, directed: false },
        { from: "C", to: "E", weight: 8, directed: false },
        { from: "D", to: "E", weight: 2, directed: false },
      ],
      raw_confidence: 0.90,
      warnings: ["Offline sandbox mock data loaded for graph."]
    }
  };

  return defaults[type];
}

function getMockOperationIntent(prompt: string, structureType?: StructureType): OperationIntent {
  const lowerPrompt = prompt.toLowerCase();
  let structure: StructureType = structureType || "array";
  let operation = "bubble_sort";
  let params: any = {};

  if (lowerPrompt.includes("reverse") || lowerPrompt.includes("flip") || lowerPrompt.includes("invert")) {
    operation = "reverse";
  } else if (lowerPrompt.includes("sort")) {
    if (lowerPrompt.includes("merge")) {
      operation = "merge_sort";
    } else if (lowerPrompt.includes("quick")) {
      operation = "quick_sort";
    } else {
      operation = "bubble_sort";
    }
  } else if (lowerPrompt.includes("search") || lowerPrompt.includes("find")) {
    const match = lowerPrompt.match(/\d+/);
    const target = match ? parseInt(match[0], 10) : 9;
    if (lowerPrompt.includes("binary")) {
      operation = "binary_search";
    } else {
      operation = "linear_search";
    }
    params.target = target;
  } else if (lowerPrompt.includes("push")) {
    operation = "push";
    const match = lowerPrompt.match(/\d+/);
    params.target = match ? parseInt(match[0], 10) : 42;
  } else if (lowerPrompt.includes("pop")) {
    operation = "pop";
  } else if (lowerPrompt.includes("enqueue")) {
    operation = "enqueue";
    const match = lowerPrompt.match(/\d+/);
    params.target = match ? parseInt(match[0], 10) : 42;
  } else if (lowerPrompt.includes("dequeue")) {
    operation = "dequeue";
  } else if (lowerPrompt.includes("insert")) {
    operation = "insert";
    const match = lowerPrompt.match(/\d+/);
    params.target = match ? parseInt(match[0], 10) : 42;
  } else if (lowerPrompt.includes("delete")) {
    operation = "delete";
    const match = lowerPrompt.match(/\d+/);
    params.target = match ? parseInt(match[0], 10) : 42;
  } else if (lowerPrompt.includes("bfs")) {
    operation = "bfs";
    params.start_node = "n1";
  } else if (lowerPrompt.includes("dfs")) {
    operation = "dfs";
    params.start_node = "n1";
  } else if (lowerPrompt.includes("dijkstra")) {
    operation = "dijkstra";
    params.start_node = "A";
  } else if (lowerPrompt.includes("inorder")) {
    operation = "inorder";
  } else if (lowerPrompt.includes("preorder")) {
    operation = "preorder";
  } else if (lowerPrompt.includes("postorder")) {
    operation = "postorder";
  }

  return {
    structure,
    operation,
    params
  };
}
