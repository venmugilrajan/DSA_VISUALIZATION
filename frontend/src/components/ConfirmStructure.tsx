import React, { useState, useEffect } from "react";
import { ParsedStructure, StructureType, StructureClassification } from "../types/contracts";
import { Check, Edit2, AlertCircle, ArrowRight, Loader } from "lucide-react";

interface ConfirmStructureProps {
  classification: StructureClassification;
  imageBase64: string;
  mimeType: string;
  onStructureConfirmed: (confirmed: ParsedStructure) => void;
}

export const ConfirmStructure: React.FC<ConfirmStructureProps> = ({
  classification,
  imageBase64,
  mimeType,
  onStructureConfirmed,
}) => {
  // Stage 1: Type Confirmation
  const [selectedType, setSelectedType] = useState<StructureType>(classification.detected_type);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  
  // Stage 2: Value Confirmation
  const [extractedStructure, setExtractedStructure] = useState<ParsedStructure | null>(null);
  const [valuesStr, setValuesStr] = useState<string>("");
  const [nodesJSON, setNodesJSON] = useState<string>("");
  const [edgesJSON, setEdgesJSON] = useState<string>("");
  const [isEditingValues, setIsEditingValues] = useState(false);

  // Visual Editor States
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [editMode, setEditMode] = useState<"visual" | "json">("visual");

  // Sync classification updates
  useEffect(() => {
    setSelectedType(classification.detected_type);
    setExtractedStructure(null);
    setIsEditingValues(imageBase64 === "manual");
    setExtractionError("");
    setNodes([]);
    setEdges([]);
    setEditMode("visual");
  }, [classification, imageBase64]);

  // Sync extracted values
  useEffect(() => {
    if (extractedStructure) {
      if (extractedStructure.values) {
        setValuesStr(extractedStructure.values.join(", "));
      } else {
        setValuesStr("");
      }
      
      const parsedNodes = extractedStructure.nodes || [];
      setNodes(parsedNodes);
      setNodesJSON(JSON.stringify(parsedNodes, null, 2));

      const parsedEdges = extractedStructure.edges || [];
      setEdges(parsedEdges);
      setEdgesJSON(JSON.stringify(parsedEdges, null, 2));
    }
  }, [extractedStructure]);

  const handleAddNode = () => {
    const nextIdStr = `n${nodes.length + 1}`;
    let finalId = nextIdStr;
    let counter = 1;
    while (nodes.some(n => n.id === finalId)) {
      finalId = `${nextIdStr}_${counter}`;
      counter++;
    }
    const newNode = {
      id: finalId,
      value: String(nodes.length + 1),
      x: 50,
      y: 50
    };
    setNodes([...nodes, newNode]);
  };

  const handleUpdateNode = (index: number, key: string, value: any) => {
    const updated = [...nodes];
    updated[index] = { ...updated[index], [key]: value };
    setNodes(updated);
  };

  const handleNodeIdChange = (index: number, newId: string) => {
    const oldId = nodes[index].id;
    const cleanId = newId.trim();
    if (!cleanId) return;

    const updatedNodes = [...nodes];
    updatedNodes[index] = { ...updatedNodes[index], id: cleanId };
    setNodes(updatedNodes);

    const updatedEdges = edges.map(e => {
      let updatedEdge = { ...e };
      if (e.from === oldId) updatedEdge.from = cleanId;
      if (e.to === oldId) updatedEdge.to = cleanId;
      return updatedEdge;
    });
    setEdges(updatedEdges);
  };

  const handleDeleteNode = (index: number) => {
    const nodeToDelete = nodes[index];
    const updatedNodes = nodes.filter((_, idx) => idx !== index);
    setNodes(updatedNodes);
    const updatedEdges = edges.filter(e => e.from !== nodeToDelete.id && e.to !== nodeToDelete.id);
    setEdges(updatedEdges);
  };

  const handleAddEdge = () => {
    if (nodes.length < 2) return;
    const newEdge = {
      from: nodes[0].id,
      to: nodes[1].id,
      directed: selectedType === "linked_list" || selectedType === "graph",
      side: selectedType === "binary_tree" ? "left" : undefined,
      weight: selectedType === "graph" ? 1 : undefined
    };
    setEdges([...edges, newEdge]);
  };

  const handleUpdateEdge = (index: number, key: string, value: any) => {
    const updated = [...edges];
    updated[index] = { ...updated[index], [key]: value };
    setEdges(updated);
  };

  const handleDeleteEdge = (index: number) => {
    const updated = edges.filter((_, idx) => idx !== index);
    setEdges(updated);
  };

  const handleExtractValues = async () => {
    setIsExtracting(true);
    setExtractionError("");
    try {
      if (imageBase64 === "manual") {
        await new Promise((r) => setTimeout(r, 400));
        let emptyState: ParsedStructure;
        if (["array", "stack", "queue"].includes(selectedType)) {
          emptyState = {
            type: selectedType,
            values: [10, 20, 30, 40],
            raw_confidence: 1.0
          };
        } else if (selectedType === "linked_list") {
          emptyState = {
            type: selectedType,
            nodes: [
              { id: "A", value: 10, x: 20, y: 50 },
              { id: "B", value: 20, x: 45, y: 50 },
              { id: "C", value: 30, x: 70, y: 50 }
            ],
            edges: [
              { from: "A", to: "B", directed: true },
              { from: "B", to: "C", directed: true }
            ],
            raw_confidence: 1.0
          };
        } else if (selectedType === "binary_tree") {
          emptyState = {
            type: selectedType,
            nodes: [
              { id: "n1", value: 1, x: 50, y: 20 },
              { id: "n2", value: 2, x: 30, y: 50 },
              { id: "n3", value: 3, x: 70, y: 50 }
            ],
            edges: [
              { from: "n1", to: "n2", side: "left" },
              { from: "n1", to: "n3", side: "right" }
            ],
            raw_confidence: 1.0
          };
        } else { // graph
          emptyState = {
            type: selectedType,
            nodes: [
              { id: "A", value: "A", x: 25, y: 30 },
              { id: "B", value: "B", x: 75, y: 30 },
              { id: "C", value: "C", x: 50, y: 75 }
            ],
            edges: [
              { from: "A", to: "B", weight: 5, directed: false },
              { from: "B", to: "C", weight: 3, directed: false },
              { from: "C", to: "A", weight: 2, directed: false }
            ],
            raw_confidence: 1.0
          };
        }
        setExtractedStructure(emptyState);
        return;
      }

      const response = await fetch("http://localhost:5000/api/extract-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: mimeType,
          type: selectedType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to extract structure values");
      }

      const result = await response.json();
      setExtractedStructure(result);
    } catch (e: any) {
      setExtractionError(e.message || "Failed to extract values.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmValues = () => {
    if (!extractedStructure) return;
    try {
      let finalValues: (number | string)[] | undefined = undefined;
      let finalNodes: any = undefined;
      let finalEdges: any = undefined;

      if (["array", "stack", "queue"].includes(selectedType)) {
        finalValues = valuesStr
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => (isNaN(Number(v)) ? v : Number(v)));
      } else {
        if (editMode === "json") {
          if (nodesJSON) {
            finalNodes = JSON.parse(nodesJSON);
          }
          if (edgesJSON) {
            finalEdges = JSON.parse(edgesJSON);
          }
        } else {
          finalNodes = nodes;
          finalEdges = edges;
        }
      }

      const confirmed: ParsedStructure = {
        type: selectedType,
        values: finalValues,
        nodes: finalNodes,
        edges: finalEdges,
        raw_confidence: extractedStructure.raw_confidence,
        warnings: extractedStructure.warnings,
      };

      onStructureConfirmed(confirmed);
    } catch (e: any) {
      alert("Invalid JSON format in Nodes or Edges. Please check syntax: " + e.message);
    }
  };

  const typesList: StructureType[] = ["array", "linked_list", "stack", "queue", "binary_tree", "graph"];

  // 1. Render Loading State during extraction
  if (isExtracting) {
    return (
      <div className="w-full bg-surface p-8 rounded-2xl border border-borderColor shadow-sm flex flex-col items-center justify-center min-h-[250px] text-center">
        <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
        <h4 className="text-base font-bold text-textMain">Extracting Values & Connections</h4>
        <p className="text-xs text-textMuted mt-1">Reading node elements and structural values for {selectedType}...</p>
      </div>
    );
  }

  // 2. Render Value Confirmation Panel if values are extracted
  if (extractedStructure) {
    return (
      <div className="w-full bg-surface p-6 rounded-2xl border border-borderColor shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-borderColor">
          <div>
            <h3 className="text-base font-bold text-textMain">
              {imageBase64 === "manual" ? "Configure Custom Structure" : "Confirm Parsed Values"}
            </h3>
            <p className="text-xs text-textMuted">
              {imageBase64 === "manual"
                ? "Define your nodes, edges, values, and coordinates directly below."
                : `Extraction confidence: ${(extractedStructure.raw_confidence * 100).toFixed(0)}%. Make any edits below.`}
            </p>
          </div>
          {imageBase64 !== "manual" && (
            <button
              onClick={() => setIsEditingValues(!isEditingValues)}
              className="flex items-center gap-1.5 bg-panel hover:bg-borderColor text-xs px-3 py-1.5 rounded-lg border border-borderColor text-textMain font-bold transition-all"
            >
              <Edit2 className="w-3 h-3" />
              {isEditingValues ? "Cancel" : "Edit Values"}
            </button>
          )}
        </div>

        {extractedStructure.warnings && extractedStructure.warnings.length > 0 && (
          <div className="mb-4 bg-danger/10 border border-danger/20 text-danger p-3 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold mb-0.5">Extraction Warnings:</div>
              <ul className="list-disc pl-4 space-y-0.5 font-mono">
                {extractedStructure.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {["array", "stack", "queue"].includes(selectedType) ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
                Values (comma-separated list)
              </label>
              <input
                type="text"
                value={valuesStr}
                onChange={(e) => setValuesStr(e.target.value)}
                disabled={!isEditingValues}
                className="w-full bg-panel disabled:opacity-75 disabled:text-textMuted border border-borderColor rounded-xl px-3 py-2 text-sm text-textMain font-mono focus:outline-none focus:border-primary transition-all"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Tab Selector */}
              <div className="flex gap-2 border-b border-borderColor pb-2">
                <button
                  type="button"
                  onClick={() => setEditMode("visual")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    editMode === "visual"
                      ? "bg-primary text-white border-primary"
                      : "bg-panel text-textMuted border-borderColor hover:bg-borderColor"
                  }`}
                >
                  Visual Form Editor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNodesJSON(JSON.stringify(nodes, null, 2));
                    setEdgesJSON(JSON.stringify(edges, null, 2));
                    setEditMode("json");
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    editMode === "json"
                      ? "bg-primary text-white border-primary"
                      : "bg-panel text-textMuted border-borderColor hover:bg-borderColor"
                  }`}
                >
                  Advanced JSON Editor
                </button>
              </div>

              {editMode === "visual" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nodes List Form */}
                  <div className="bg-panel/40 p-4 rounded-xl border border-borderColor flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-textMuted">
                        Nodes
                      </label>
                      <button
                        type="button"
                        onClick={handleAddNode}
                        disabled={!isEditingValues}
                        className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-1 rounded hover:bg-primary/20 disabled:opacity-50 transition-all"
                      >
                        + Add Node
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar">
                      {nodes.map((node, idx) => (
                        <div key={node.id} className="flex items-center gap-1.5 bg-surface p-2 rounded-lg border border-borderColor text-xs">
                          <div className="flex-1 flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-textMuted font-bold">ID:</span>
                              <input
                                type="text"
                                value={node.id}
                                disabled={!isEditingValues}
                                onChange={(e) => handleNodeIdChange(idx, e.target.value)}
                                className="w-10 bg-panel border border-borderColor rounded px-1.5 py-0.5 text-center font-bold font-mono text-textMain"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-textMuted font-bold">Val:</span>
                              <input
                                type="text"
                                value={node.value}
                                disabled={!isEditingValues}
                                onChange={(e) => handleUpdateNode(idx, "value", e.target.value)}
                                className="w-12 bg-panel border border-borderColor rounded px-1.5 py-0.5 text-center text-textMain"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-textMuted font-bold">X:</span>
                              <input
                                type="number"
                                value={node.x ?? 50}
                                disabled={!isEditingValues}
                                onChange={(e) => handleUpdateNode(idx, "x", parseInt(e.target.value) || 0)}
                                className="w-10 bg-panel border border-borderColor rounded px-1 py-0.5 text-center text-textMain"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-textMuted font-bold">Y:</span>
                              <input
                                type="number"
                                value={node.y ?? 50}
                                disabled={!isEditingValues}
                                onChange={(e) => handleUpdateNode(idx, "y", parseInt(e.target.value) || 0)}
                                className="w-10 bg-panel border border-borderColor rounded px-1 py-0.5 text-center text-textMain"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteNode(idx)}
                            disabled={!isEditingValues}
                            className="text-danger hover:bg-danger/10 px-1.5 py-0.5 rounded font-bold disabled:opacity-50 transition-all text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {nodes.length === 0 && (
                        <div className="text-center py-4 text-xs text-textMuted italic">No nodes added. Click "+ Add Node".</div>
                      )}
                    </div>
                  </div>

                  {/* Edges List Form */}
                  <div className="bg-panel/40 p-4 rounded-xl border border-borderColor flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-textMuted">
                        Connections (Edges)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddEdge}
                        disabled={!isEditingValues || nodes.length < 2}
                        className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-1 rounded hover:bg-primary/20 disabled:opacity-50 transition-all"
                      >
                        + Add Edge
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar">
                      {edges.map((edge, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-surface p-2 rounded-lg border border-borderColor text-xs">
                          <div className="flex-1 flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-textMuted font-bold">From:</span>
                              <select
                                value={edge.from}
                                disabled={!isEditingValues}
                                onChange={(e) => handleUpdateEdge(idx, "from", e.target.value)}
                                className="bg-panel border border-borderColor rounded px-1 py-0.5 text-textMain font-bold font-mono"
                              >
                                {nodes.map((n) => (
                                  <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-textMuted font-bold">To:</span>
                              <select
                                value={edge.to}
                                disabled={!isEditingValues}
                                onChange={(e) => handleUpdateEdge(idx, "to", e.target.value)}
                                className="bg-panel border border-borderColor rounded px-1 py-0.5 text-textMain font-bold font-mono"
                              >
                                {nodes.map((n) => (
                                  <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                              </select>
                            </div>

                            {selectedType === "binary_tree" && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-textMuted font-bold">Side:</span>
                                <select
                                  value={edge.side || "left"}
                                  disabled={!isEditingValues}
                                  onChange={(e) => handleUpdateEdge(idx, "side", e.target.value)}
                                  className="bg-panel border border-borderColor rounded px-1 py-0.5 text-textMain font-bold"
                                >
                                  <option value="left">Left</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            )}

                            {selectedType === "graph" && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-textMuted font-bold">Weight:</span>
                                <input
                                  type="number"
                                  value={edge.weight ?? 1}
                                  disabled={!isEditingValues}
                                  onChange={(e) => handleUpdateEdge(idx, "weight", parseInt(e.target.value) || 0)}
                                  className="w-10 bg-panel border border-borderColor rounded px-1 py-0.5 text-center text-textMain"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEdge(idx)}
                            disabled={!isEditingValues}
                            className="text-danger hover:bg-danger/10 px-1.5 py-0.5 rounded font-bold disabled:opacity-50 transition-all text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {edges.length === 0 && (
                        <div className="text-center py-4 text-xs text-textMuted italic">No edges added. Click "+ Add Edge".</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
                      Nodes Configuration (JSON)
                    </label>
                    <textarea
                      value={nodesJSON}
                      onChange={(e) => setNodesJSON(e.target.value)}
                      disabled={!isEditingValues}
                      rows={6}
                      className="w-full bg-panel disabled:opacity-75 disabled:text-textMuted border border-borderColor rounded-xl px-3 py-2 text-xs text-textMain font-mono focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
                      Edges Configuration (JSON)
                    </label>
                    <textarea
                      value={edgesJSON}
                      onChange={(e) => setEdgesJSON(e.target.value)}
                      disabled={!isEditingValues}
                      rows={6}
                      className="w-full bg-panel disabled:opacity-75 disabled:text-textMuted border border-borderColor rounded-xl px-3 py-2 text-xs text-textMain font-mono focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleConfirmValues}
            className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-opacity-90 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all"
          >
            <Check className="w-4 h-4" />
            Proceed to Algorithm Prompt
          </button>
        </div>
      </div>
    );
  }

  // 3. Render Type Confirmation Panel (Stage 2b)
  return (
    <div className="w-full bg-surface p-6 rounded-2xl border border-borderColor shadow-sm">
      <h3 className="text-base font-bold text-textMain mb-1">
        {imageBase64 === "manual" ? "Create Custom Structure Sandbox" : "Confirm Structure Classification"}
      </h3>
      <p className="text-xs text-textMuted mb-4">
        {imageBase64 === "manual"
          ? "Select the type of structure you want to create and customize."
          : "Verify that the AI correctly classified the diagram type. Change if necessary."}
      </p>

      {extractionError && (
        <div className="mb-4 bg-danger/10 border border-danger/20 text-danger p-3 rounded-xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{extractionError}</span>
        </div>
      )}

      {/* Visual reasoning display */}
      {imageBase64 !== "manual" && (
        <div className="bg-panel border border-borderColor p-4 rounded-xl mb-4 text-xs">
          <span className="font-bold text-textMain block mb-1">AI Classification Logic:</span>
          <span className="text-textMuted italic">"{classification.visual_reasoning}"</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Chips selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-2">
            Structure Type
          </label>
          <div className="flex flex-wrap gap-2">
            {typesList.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  selectedType === t
                    ? "bg-primary border-primary text-white"
                    : "bg-panel border-borderColor hover:bg-borderColor text-textMuted"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Alternate Guess Option */}
        {imageBase64 !== "manual" && classification.alternate_guess && classification.alternate_guess !== selectedType && (
          <div className="bg-panel/40 p-3 rounded-xl border border-borderColor flex justify-between items-center text-xs">
            <span className="text-textMuted">Not quite right? AI also guessed it could be a:</span>
            <button
              onClick={() => setSelectedType(classification.alternate_guess!)}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold px-2.5 py-1 rounded"
            >
              Switch to {classification.alternate_guess.replace("_", " ")}
            </button>
          </div>
        )}

        <button
          onClick={handleExtractValues}
          className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-opacity-90 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all"
        >
          {imageBase64 === "manual" ? "Initialize Sandbox Structure" : "Extract Node Values & Links"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
