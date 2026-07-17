import { createWorker } from "tesseract.js";
import { ParsedStructure, StructureType } from "../types/contracts";

const { Jimp } = require("jimp");

export async function parseStructureLocally(
  imageBase64: string,
  type: StructureType
): Promise<ParsedStructure> {
  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const image = await Jimp.read(imageBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const data = image.bitmap.data;

    // 1. Detect enclosed white components (node circles / cells) using flood fill
    const threshold = 180;
    const grid: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        grid[y][x] = brightness >= threshold; // true for white
      }
    }

    // Mark border-connected background white pixels
    const visited = Array.from({ length: height }, () => new Uint8Array(width));
    const queue: [number, number][] = [];

    for (let x = 0; x < width; x++) {
      if (grid[0][x]) { queue.push([x, 0]); visited[0][x] = 1; }
      if (grid[height - 1][x]) { queue.push([x, height - 1]); visited[height - 1][x] = 1; }
    }
    for (let y = 0; y < height; y++) {
      if (grid[y][0]) { queue.push([0, y]); visited[y][0] = 1; }
      if (grid[y][width - 1]) { queue.push([width - 1, y]); visited[y][width - 1] = 1; }
    }

    let head = 0;
    const dx = [0, 0, 1, -1];
    const dy = [1, -1, 0, 0];
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      for (let i = 0; i < 4; i++) {
        const nx = cx + dx[i];
        const ny = cy + dy[i];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (!visited[ny][nx] && grid[ny][nx]) {
            visited[ny][nx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    // Extract enclosed white components
    const components: any[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] && !visited[y][x]) {
          const compQueue: [number, number][] = [[x, y]];
          visited[y][x] = 2;
          let compHead = 0;
          let minX = x, maxX = x, minY = y, maxY = y;

          while (compHead < compQueue.length) {
            const [cx, cy] = compQueue[compHead++];
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            for (let i = 0; i < 4; i++) {
              const nx = cx + dx[i];
              const ny = cy + dy[i];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (!visited[ny][nx] && grid[ny][nx]) {
                  visited[ny][nx] = 2;
                  compQueue.push([nx, ny]);
                }
              }
            }
          }

          const w = maxX - minX + 1;
          const h = maxY - minY + 1;
          if (compQueue.length > 150 && w > 12 && h > 12 && w < width * 0.6 && h < height * 0.6) {
            components.push({ minX, maxX, minY, maxY, size: compQueue.length });
          }
        }
      }
    }

    // 2. Initialize Tesseract to read text inside crops
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      tessedit_pageseg_mode: "10" as any
    });

    const nodes: any[] = [];
    for (let idx = 0; idx < components.length; idx++) {
      const comp = components[idx];
      const w = comp.maxX - comp.minX + 1;
      const h = comp.maxY - comp.minY + 1;

      const pad = 2;
      const cropX = Math.max(0, comp.minX + pad);
      const cropY = Math.max(0, comp.minY + pad);
      const cropW = Math.max(5, w - pad * 2);
      const cropH = Math.max(5, h - pad * 2);

      const cropped = image.clone().crop({ x: cropX, y: cropY, w: cropW, h: cropH });

      // Erase outer border pixels to eliminate circle boundary arcs
      const borderSize = Math.max(1, Math.round(Math.min(cropW, cropH) * 0.15));
      for (let cy = 0; cy < cropH; cy++) {
        for (let cx = 0; cx < cropW; cx++) {
          if (cx < borderSize || cx >= cropW - borderSize || cy < borderSize || cy >= cropH - borderSize) {
            cropped.setPixelColor(0xFFFFFFFF, cx, cy);
          }
        }
      }

      cropped.resize({ w: cropW * 3, h: cropH * 3 });
      const croppedBuffer = await cropped.getBuffer("image/png");

      const { data } = await worker.recognize(croppedBuffer);
      const text = (data.text || "").trim();
      const value = text ? (isNaN(Number(text)) ? text : Number(text)) : String(idx + 1);

      nodes.push({
        id: `n${idx + 1}`,
        value,
        x: Math.round(((comp.minX + comp.maxX) / 2 / width) * 100),
        y: Math.round(((comp.minY + comp.maxY) / 2 / height) * 100),
        pixelX: (comp.minX + comp.maxX) / 2,
        pixelY: (comp.minY + comp.maxY) / 2
      });
    }
    await worker.terminate();

    // 3. Post-process formats according to type
    if (["array", "stack", "queue"].includes(type)) {
      if (type === "stack") {
        nodes.sort((a, b) => b.y - a.y);
      } else {
        nodes.sort((a, b) => a.x - b.x);
      }

      const values = nodes.map(n => n.value);
      return {
        type,
        values: values.length > 0 ? values : [1, 2, 3],
        raw_confidence: 0.8,
        warnings: ["Parsed locally offline using Tesseract OCR fallback."],
      };
    }

    const edges: any[] = [];

    if (type === "linked_list") {
      nodes.sort((a, b) => a.x - b.x);
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          from: nodes[i].id,
          to: nodes[i + 1].id,
          directed: true,
        });
      }
    } else if (type === "binary_tree") {
      nodes.sort((a, b) => a.y - b.y);

      // Map child node ID to all detected parent connections
      const parentConnections: Record<string, { parentId: string; dist: number; side: "left" | "right" }[]> = {};

      for (let i = 0; i < nodes.length; i++) {
        const parent = nodes[i];
        const potentialChildren = nodes.filter((c) => c.y > parent.y + 10 && c.id !== parent.id);

        for (const child of potentialChildren) {
          if (isConnected(image, parent, child)) {
            const dist = Math.hypot(child.pixelX - parent.pixelX, child.pixelY - parent.pixelY);
            const side = child.x < parent.x ? "left" : "right";

            if (!parentConnections[child.id]) {
              parentConnections[child.id] = [];
            }
            parentConnections[child.id].push({ parentId: parent.id, dist, side });
          }
        }
      }

      // Each node in a binary tree can have at most one parent. Keep only the closest parent connection.
      for (const childId of Object.keys(parentConnections)) {
        const connections = parentConnections[childId];
        connections.sort((a, b) => a.dist - b.dist);
        const best = connections[0];

        edges.push({
          from: best.parentId,
          to: childId,
          side: best.side
        });
      }
    } else {
      // Graph
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (isConnected(image, nodes[i], nodes[j])) {
            edges.push({
              from: nodes[i].id,
              to: nodes[j].id,
              weight: 1,
              directed: false,
            });
          }
        }
      }
    }

    return {
      type,
      nodes: nodes.length > 0 ? nodes : [{ id: "n1", value: 1, x: 50, y: 50 }],
      edges,
      raw_confidence: 0.75,
      warnings: ["Parsed locally offline using Tesseract shape & connection trace analyzer."],
    };
  } catch (error: any) {
    console.error("Local CV Parser failed:", error);
    throw error;
  }
}

function isConnected(
  image: any,
  u: { id?: string; pixelX: number; pixelY: number },
  v: { id?: string; pixelX: number; pixelY: number }
): boolean {
  const x0 = Math.round(u.pixelX);
  const y0 = Math.round(u.pixelY);
  const x1 = Math.round(v.pixelX);
  const y1 = Math.round(v.pixelY);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const data = image.bitmap.data;

  const dist = Math.hypot(x1 - x0, y1 - y0);
  if (dist < 15) return false;

  // Sample every 4 pixels
  const steps = Math.max(10, Math.round(dist / 4));
  // Scan middle 70% to avoid parent/child circle borders
  const startStep = Math.max(2, Math.round(steps * 0.15));
  const endStep = Math.min(steps - 3, Math.round(steps * 0.85));
  let darkPixels = 0;
  let scanned = 0;

  for (let i = startStep; i <= endStep; i++) {
    const t = i / (steps - 1);
    const sx = Math.round(x0 + t * (x1 - x0));
    const sy = Math.round(y0 + t * (y1 - y0));
    scanned++;

    // Check 5x5 neighborhood around sample point to tolerate curves/slants/precision
    let foundDarkInNeighborhood = false;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const px = sx + dx;
        const py = sy + dy;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;
          if (brightness < 215) {
            foundDarkInNeighborhood = true;
            break;
          }
        }
      }
      if (foundDarkInNeighborhood) break;
    }

    if (foundDarkInNeighborhood) {
      darkPixels++;
    }
  }

  if (scanned === 0) return false;
  const connected = darkPixels >= 1; // Require at least 1 dark sample in the middle gap
  console.log(`[Local CV Edge Check] ${u.id} -> ${v.id} | dist: ${Math.round(dist)}px | dark samples: ${darkPixels}/${scanned} | connected: ${connected}`);
  return connected;
}

export async function classifyStructureLocally(
  imageBase64: string
): Promise<{ detected_type: StructureType; confidence: number; alternate_guess?: StructureType; visual_reasoning: string }> {
  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const image = await Jimp.read(imageBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const data = image.bitmap.data;

    // Run same flood fill to count components and alignments
    const threshold = 180;
    const grid: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        grid[y][x] = brightness >= threshold;
      }
    }

    const visited = Array.from({ length: height }, () => new Uint8Array(width));
    const queue: [number, number][] = [];

    for (let x = 0; x < width; x++) {
      if (grid[0][x]) { queue.push([x, 0]); visited[0][x] = 1; }
      if (grid[height - 1][x]) { queue.push([x, height - 1]); visited[height - 1][x] = 1; }
    }
    for (let y = 0; y < height; y++) {
      if (grid[y][0]) { queue.push([0, y]); visited[y][0] = 1; }
      if (grid[y][width - 1]) { queue.push([width - 1, y]); visited[y][width - 1] = 1; }
    }

    let head = 0;
    const dx = [0, 0, 1, -1];
    const dy = [1, -1, 0, 0];
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      for (let i = 0; i < 4; i++) {
        const nx = cx + dx[i];
        const ny = cy + dy[i];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (!visited[ny][nx] && grid[ny][nx]) {
            visited[ny][nx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    const components: any[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] && !visited[y][x]) {
          const compQueue: [number, number][] = [[x, y]];
          visited[y][x] = 2;
          let compHead = 0;
          let minX = x, maxX = x, minY = y, maxY = y;

          while (compHead < compQueue.length) {
            const [cx, cy] = compQueue[compHead++];
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            for (let i = 0; i < 4; i++) {
              const nx = cx + dx[i];
              const ny = cy + dy[i];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (!visited[ny][nx] && grid[ny][nx]) {
                  visited[ny][nx] = 2;
                  compQueue.push([nx, ny]);
                }
              }
            }
          }

          const w = maxX - minX + 1;
          const h = maxY - minY + 1;
          if (compQueue.length > 150 && w > 12 && h > 12 && w < width * 0.6 && h < height * 0.6) {
            components.push({ minX, maxX, minY, maxY });
          }
        }
      }
    }

    if (components.length === 0) {
      return {
        detected_type: "array",
        confidence: 0.5,
        visual_reasoning: "No circular nodes detected. Defaulting to Array."
      };
    }

    const xs = components.map(c => (c.minX + c.maxX) / 2);
    const ys = components.map(c => (c.minY + c.maxY) / 2);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const xRange = maxX - minX;
    const yRange = maxY - minY;

    if (xRange > yRange * 1.8) {
      return {
        detected_type: "array",
        confidence: 0.7,
        alternate_guess: "linked_list",
        visual_reasoning: "Horizontal alignment detected locally. Classified as Array."
      };
    } else if (yRange > xRange * 1.8) {
      return {
        detected_type: "stack",
        confidence: 0.7,
        alternate_guess: "queue",
        visual_reasoning: "Vertical alignment detected locally. Classified as Stack."
      };
    }

    return {
      detected_type: "binary_tree",
      confidence: 0.6,
      alternate_guess: "graph",
      visual_reasoning: "Hierarchical or branching layout detected locally. Classified as Binary Tree."
    };
  } catch (e) {
    return {
      detected_type: "array",
      confidence: 0.5,
      visual_reasoning: "Local CV classification failed. Defaulted to Array."
    };
  }
}
