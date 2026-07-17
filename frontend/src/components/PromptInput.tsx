import React, { useState, useEffect } from "react";
import { Play, Mic, MicOff, AlertCircle } from "lucide-react";
import { StructureType } from "../types/contracts";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface PromptInputProps {
  structureType: StructureType;
  onSubmitPrompt: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  structureType,
  onSubmitPrompt,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState("");
  const [showSpeechToast, setShowSpeechToast] = useState(false);

  const handleSpeechResult = (text: string) => {
    setPrompt(text);
  };

  const { isSupported, isListening, startListening, stopListening } =
    useSpeechRecognition(handleSpeechResult);

  // Auto-stop listening after 5 seconds of silence
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isListening) {
      timer = setTimeout(() => {
        stopListening();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isListening, prompt, stopListening]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSupported) {
      setShowSpeechToast(true);
      setTimeout(() => setShowSpeechToast(false), 3000);
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const presets: Record<StructureType, string[]> = {
    array: [
      "sort using bubble sort",
      "reverse the array",
      "binary search for 7",
      "linear search for 15",
      "sort using merge sort",
      "sort using quick sort"
    ],
    linked_list: [
      "reverse the list",
      "insert 42 at index 1",
      "delete node with value 99",
      "detect if cycle exists"
    ],
    stack: [
      "push 99 onto the stack",
      "pop the top element"
    ],
    queue: [
      "enqueue 88 into the queue",
      "dequeue the front element"
    ],
    binary_tree: [
      "do BFS traversal",
      "inorder traversal",
      "insert 45 into BST",
      "preorder traversal",
      "postorder traversal"
    ],
    graph: [
      "do BFS from node A",
      "do DFS from node A",
      "run dijkstra from node A"
    ],
  };

  const handlePresetClick = (preset: string) => {
    setPrompt(preset);
    onSubmitPrompt(preset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmitPrompt(prompt);
    }
  };

  return (
    <div className="w-full bg-surface p-6 rounded-2xl border border-borderColor shadow-sm relative">
      <h3 className="text-base font-bold text-textMain mb-1">3. Execute Algorithm Prompt</h3>
      <p className="text-xs text-textMuted mb-4">
        Type or speak what operation you want to run.
      </p>

      {showSpeechToast && (
        <div className="absolute -top-12 left-6 right-6 bg-danger/10 border border-danger/20 text-danger p-2 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Speech Recognition is not supported by your browser.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col gap-3">
          <div className="relative flex items-center w-full">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. sort this, run bfs from node A, check if the tree is a mirror of itself..."
              disabled={isLoading}
              rows={3}
              className="w-full bg-panel border border-borderColor rounded-xl pl-4 pr-11 py-3 text-sm text-textMain focus:outline-none focus:border-primary shadow-inner resize-none font-sans"
            />
            {/* Mic button right-aligned inside textarea */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-3 p-1.5 rounded-lg border transition-all ${
                  isListening
                    ? "bg-danger/10 border-danger text-danger animate-pulse"
                    : "bg-surface border-borderColor text-textMuted hover:text-textMain"
                }`}
                title={isListening ? "Stop listening" : "Speak command"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Algorithm
          </button>
        </div>
      </form>

      {/* Speech listening state indicator overlay */}
      {isListening && (
        <div className="mb-4 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary py-2 px-3 rounded-xl text-xs font-bold animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
          <span>Listening... Speak your command clearly (e.g. "sort the array ascending")</span>
        </div>
      )}

      {/* Presets List */}
      <div>
        <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">
          Suggested Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets[structureType]?.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handlePresetClick(preset)}
              className="text-xs bg-panel hover:bg-borderColor border border-borderColor px-3 py-1.5 rounded-lg text-textMuted font-bold transition-all"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
