import React, { useState, useEffect } from 'react';
import { GraphNode, NodeType, ExplorationMode } from '../types';
import { BrainCircuit, X, Network, Lightbulb, Zap, Link as LinkIcon, ArrowRight, Edit2, Trash2, Save, RotateCcw, Check, MousePointerClick, RefreshCw, Dices, PlusCircle, Cpu, CheckCircle2, Heart, AlertCircle, ChevronRight, Binary, Sparkles, Orbit, Layers } from 'lucide-react';

interface SidebarProps {
  nodes: GraphNode[];
  onClose: () => void;
  onExpand: (node: GraphNode) => void;
  onExpandSingle: (node: GraphNode, relation: string, count: number, targetType?: NodeType) => void;
  onAnalyzeSynergy: (nodeA: GraphNode, nodeB: GraphNode) => void;
  onConnectNodes: (nodeA: GraphNode, nodeB: GraphNode, relation: string) => void;
  onUpdateLink: (sourceId: string, targetId: string, relation: string) => void;
  onDeleteLink: (sourceId: string, targetId: string) => void;
  onUpdateNode: (node: GraphNode) => void;
  onDeleteNodes: (nodeIds: string[]) => void;
  onKeepLucky: (nodeId: string) => void;
  onTryAgainLucky: (node: GraphNode) => void;
  onInnovate: (node: GraphNode) => void;
  onOptimize: (node: GraphNode) => void;
  onStressTest: (node: GraphNode) => void;
  onImplement: (node: GraphNode) => void;
  onSolve: (node: GraphNode) => void;
  onAnswer: (node: GraphNode) => void;
  onAssimilate: (nodeId: string) => void;
  onPrune: (nodeId: string) => void;
  onDirectedDiscovery: (node: GraphNode, instruction: string, count: number) => void;
  isProcessing: boolean;
  allLinks: any[];
  relationOptions: string[];
  expansionBlueprints: Array<{ label: string; relation: string; targetType: NodeType; sourceTypes: NodeType[] }>;
  mode: ExplorationMode;
}

const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  onClose,
  onExpand,
  onExpandSingle,
  onAnalyzeSynergy,
  onConnectNodes,
  onUpdateLink,
  onDeleteLink,
  onUpdateNode,
  onDeleteNodes,
  onKeepLucky,
  onTryAgainLucky,
  onInnovate,
  onOptimize,
  onStressTest,
  onImplement,
  onSolve,
  onAnswer,
  onAssimilate,
  onPrune,
  onDirectedDiscovery,
  isProcessing,
  allLinks,
  relationOptions,
  expansionBlueprints,
  mode
}) => {
  const [relationInput, setRelationInput] = useState(relationOptions[0]);
  const [expandBlueprintIndex, setExpandBlueprintIndex] = useState(0);
  const [targetCount, setTargetCount] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [customRelation, setCustomRelation] = useState("");

  const [discoveryInstruction, setDiscoveryInstruction] = useState("");
  const [showCustomDiscovery, setShowCustomDiscovery] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    label: "",
    description: "",
    type: NodeType.CONCEPT
  });

  // Reset edit state and pick appropriate default blueprint when selection changes
  useEffect(() => {
    setIsEditing(false);
    setIsConnecting(false);
    setTargetCount(1);

    if (nodes.length === 1) {
      const validIndex = expansionBlueprints.findIndex(bp => bp.sourceTypes.includes(nodes[0].type));
      if (validIndex !== -1) setExpandBlueprintIndex(validIndex);
    }
  }, [nodes, expansionBlueprints]);

  const handleStartEdit = (node: GraphNode) => {
    setEditForm({
      label: node.label,
      description: node.description || "",
      type: node.type
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (originalNode: GraphNode) => {
    onUpdateNode({
      ...originalNode,
      label: editForm.label,
      description: editForm.description,
      type: editForm.type
    });
    setIsEditing(false);
  };

  if (!nodes || nodes.length === 0) {
    // Hidden state
    return null;
  }

  // Common glass panel classes
  const panelClasses = "w-96 max-h-[calc(100vh-2rem)] border border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col absolute right-4 top-4 z-20 shadow-2xl transition-all rounded-3xl overflow-hidden ring-1 ring-white/5 animate-in slide-in-from-right-10 duration-300";

  // --- SINGLE NODE VIEW ---
  if (nodes.length === 1) {
    const node = nodes[0];

    const getTypeColor = (type: NodeType) => {
      switch (type) {
        case NodeType.CONCEPT: return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
        case NodeType.TECHNOLOGY: return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
        case NodeType.PROBLEM: return 'text-red-400 border-red-400/30 bg-red-400/10';
        case NodeType.QUESTION: return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
        case NodeType.ANALOGY: return 'text-pink-400 border-pink-400/30 bg-pink-400/10';
        case NodeType.REGULATION: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
        case NodeType.MARKET: return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
        case NodeType.ETHICS: return 'text-teal-400 border-teal-400/30 bg-teal-400/10';
        case NodeType.MENTAL_MODEL: return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
        default: return 'text-violet-400 border-violet-400/30 bg-violet-400/10';
      }
    };

    return (
      <div className={panelClasses}>

        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/5">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-3 animate-in fade-in">
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as NodeType })}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-sky-500/50 focus:outline-none"
                >
                  {Object.values(NodeType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xl font-bold text-white focus:border-sky-500/50 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md border ${getTypeColor(node.type)}`}>
                  {node.type}
                </span>
                <h2 className="text-2xl font-bold mt-3 text-white leading-tight">{node.label}</h2>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Cancel">
                  <RotateCcw size={16} />
                </button>
                <button onClick={() => handleSaveEdit(node)} className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors" title="Save">
                  <Check size={16} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleStartEdit(node)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors" title="Edit Seed">
                  <Edit2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Close">
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

          {/* Ghost Node Warning/Actions */}
          {node.isGhost && (
            <div className="mb-2 bg-sky-500/10 border border-sky-400/30 rounded-2xl p-5 animate-pulse-subtle">
              <div className="flex items-center gap-3 text-sky-400 mb-3">
                <BrainCircuit size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider text-sky-300">Hypothetical Seed</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                This seed was autonomously generated by the <span className="text-sky-400 font-semibold italic">{mode === ExplorationMode.INNOVATION ? 'Innovation Gardener' : 'Knowledge Curator'}</span>. It is currently in a hypothetical "ghost" state.
                Would you like to integrate it into your system or prune this branch?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onAssimilate(node.id)}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20"
                >
                  <CheckCircle2 size={14} /> Assimilate
                </button>
                <button
                  onClick={() => onPrune(node.id)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Prune Path
                </button>
              </div>
            </div>
          )}

          {/* Lucky Result Curation */}
          {node.isLuckyResult && (
            <div className="mb-2 bg-violet-500/10 border border-violet-400/30 rounded-2xl p-5 shadow-lg shadow-violet-500/5">
              <div className="flex items-center gap-3 text-violet-400 mb-3">
                <Sparkles size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider text-violet-300">Curation Mode</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                {mode === ExplorationMode.INNOVATION
                  ? "Does this technical challenge spark an innovation path? Choose to Keep it as your foundation or Try Again for a different perspective."
                  : "Does this topic spark your curiosity? Choose to Keep it as your foundation or Try Again for a different topic."
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onKeepLucky(node.id)}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
                >
                  <CheckCircle2 size={14} /> Keep Seed
                </button>
                <button
                  onClick={() => onTryAgainLucky(node)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-violet-500/20 text-slate-400 hover:text-violet-400 border border-white/5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5">
            <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Seed Description</h3>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none resize-none leading-relaxed"
              />
            ) : (
              <p className="text-slate-300 leading-relaxed text-sm font-light">
                {node.description || <span className="text-slate-600 italic">No description provided.</span>}
              </p>
            )}
          </div>

          {/* AI Tools (Only show if not editing) */}
          {!isEditing && (
            <div className="space-y-4">
              {/* Primary Node Actions */}
              {(node.type === NodeType.TECHNOLOGY ||
                node.type === NodeType.INNOVATION ||
                node.type === NodeType.IMPLEMENTATION ||
                (mode === ExplorationMode.KNOWLEDGE && (
                  node.type === NodeType.THEORY ||
                  node.type === NodeType.MOVEMENT ||
                  node.type === NodeType.DISCOVERY ||
                  node.type === NodeType.CONCEPT
                ))
              ) && (
                  <div className="space-y-3">
                    <div className="bg-violet-900/20 rounded-2xl p-5 border border-violet-500/20 relative overflow-hidden group">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-violet-400 mb-2 relative z-10">
                        {mode === ExplorationMode.INNOVATION ? <Cpu size={16} /> : <Sparkles size={16} />}
                        {mode === ExplorationMode.INNOVATION ? 'Structural Innovation' : 'Synthesized Insight'}
                      </h3>
                      <p className="text-xs text-slate-400 mb-4 relative z-10">
                        {mode === ExplorationMode.INNOVATION
                          ? 'Launch Autonomous Discovery to architect a breakthrough evolution and quest-line for this seed.'
                          : 'Launch Autonomous Discovery to synthesize a deep insight and trigger an autonomous exploration quest.'}
                      </p>
                      <button
                        onClick={() => onInnovate(node)}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                        ${isProcessing
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-500/30 hover:-translate-y-0.5'}`}
                      >
                        {isProcessing ? 'Thinking...' : mode === ExplorationMode.INNOVATION ? 'Innovate' : 'Synthesize'}
                      </button>
                    </div>

                    {mode === ExplorationMode.INNOVATION && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => onOptimize(node)}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                          Optimize
                        </button>
                        <button
                          onClick={() => onStressTest(node)}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <AlertCircle size={14} />
                          Stress Test
                        </button>
                      </div>
                    )}

                    {mode === ExplorationMode.INNOVATION && node.type !== NodeType.IMPLEMENTATION && (
                      <button
                        onClick={() => onImplement(node)}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Network size={14} />
                        Practical implementation
                      </button>
                    )}
                  </div>
                )}

              {(node.type === NodeType.PROBLEM ||
                node.type === NodeType.PAIN_POINT ||
                (mode === ExplorationMode.KNOWLEDGE && (
                  node.type === NodeType.EVENT ||
                  node.type === NodeType.CONTRADICTION
                ))
              ) && (
                  <div className="bg-emerald-900/20 rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden group">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-2 relative z-10">
                      {mode === ExplorationMode.INNOVATION ? <CheckCircle2 size={16} /> : <Layers size={16} />}
                      {mode === ExplorationMode.INNOVATION ? 'Solve Problem' : 'Knowledge Resolution'}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 relative z-10">
                      {mode === ExplorationMode.INNOVATION
                        ? 'Launch Autonomous Discovery to derive a structured solution and quest-line for this pain point.'
                        : 'Launch Autonomous Discovery to resolve contradictions and trigger an autonomous research quest.'}
                    </p>
                    <button
                      onClick={() => onSolve(node)}
                      disabled={isProcessing}
                      className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                      ${isProcessing
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5'}`}
                    >
                      {isProcessing ? 'Deriving...' : mode === ExplorationMode.INNOVATION ? 'Solve' : 'Resolve'}
                    </button>
                  </div>
                )}

              {node.type === NodeType.QUESTION && (
                <div className="bg-amber-900/20 rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden group">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2 relative z-10">
                    <Zap size={16} />
                    Answer Question
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 relative z-10">
                    Launch Autonomous Discovery to synthesize a definitive answer from evidence and trigger a follow-up quest.
                  </p>
                  <button
                    onClick={() => onAnswer(node)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                      ${isProcessing
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-500/30 hover:-translate-y-0.5'}`}
                  >
                    {isProcessing ? 'Synthesizing...' : 'Answer'}
                  </button>
                </div>
              )}


              {/* Discovery Tools */}
              <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                <h3 className="flex items-center gap-2 text-sm font-bold text-sky-400 mb-2 relative z-10">
                  <BrainCircuit size={16} />
                  {mode === ExplorationMode.INNOVATION ? 'Innovation Discovery' : 'Path Discovery'}
                </h3>
                <p className="text-xs text-slate-400 mb-4 relative z-10">
                  Generate a local cluster of related seeds to broaden the discovery field (creates 3-5 seeds).
                </p>
                <button
                  onClick={() => onExpand(node)}
                  disabled={isProcessing}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                    ${isProcessing
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20 hover:shadow-sky-500/30 hover:-translate-y-0.5'}`}
                >
                  {isProcessing ? 'Processing...' : <><Lightbulb size={16} /> Quick Expand</>}
                </button>
              </div>

              {/* Directed Discovery */}
              {/* Directed Discovery with Blueprints */}
              <div className="bg-slate-800/20 rounded-2xl p-5 border border-white/5 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <MousePointerClick size={16} />
                  Directed Branching
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Target Specific Path</label>
                  {(() => {
                    const validBlueprints = expansionBlueprints
                      .map((bp, idx) => ({ ...bp, originalIndex: idx }))
                      .filter(bp => bp.sourceTypes.includes(node.type));

                    if (validBlueprints.length === 0) {
                      return (
                        <div className="bg-slate-950/30 border border-white/5 rounded-xl px-3 py-2.5 text-[10px] text-slate-500 italic">
                          No specific branching paths available for this seed type.
                        </div>
                      );
                    }

                    return (
                      <div className="relative group/select">
                        <select
                          value={expandBlueprintIndex}
                          onChange={(e) => setExpandBlueprintIndex(parseInt(e.target.value))}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-colors pr-10"
                        >
                          {validBlueprints.map((bp) => (
                            <option key={bp.label} value={bp.originalIndex}>{bp.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/select:text-slate-300 transition-colors">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Seed Density</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map(val => (
                        <button
                          key={val}
                          onClick={() => setTargetCount(val)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${targetCount === val
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10'
                            }`}
                        >
                          {val}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const bp = expansionBlueprints[expandBlueprintIndex];
                      onExpandSingle(node, bp.relation, targetCount, bp.targetType);
                    }}
                    disabled={isProcessing}
                    className={`h-11 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-auto
                      ${isProcessing
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5'}`}
                  >
                    {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <><Zap size={16} /> Explore</>}
                  </button>
                </div>

                {/* Custom Instruction Section (Always Visible) */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">Custom Path Instruction</label>
                  </div>
                  <textarea
                    value={discoveryInstruction}
                    onChange={(e) => setDiscoveryInstruction(e.target.value)}
                    placeholder="e.g., 'What is the hardware bottleneck for this?' or 'Propose a social consequence of this event'"
                    className="w-full h-20 bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500/50 focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      if (discoveryInstruction.trim()) {
                        onDirectedDiscovery(node, discoveryInstruction, targetCount);
                        setDiscoveryInstruction("");
                      }
                    }}
                    disabled={isProcessing || !discoveryInstruction.trim()}
                    className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2
                          ${(isProcessing || !discoveryInstruction.trim())
                        ? 'bg-slate-800 text-slate-600'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30'}`}
                  >
                    {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : 'Launch Directed Discovery'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-slate-950/30">
          <div className="text-[10px] text-slate-600 font-mono">
            ID: {node.id.split('-')[0]}...
          </div>
          <button
            onClick={() => onDeleteNodes([node.id])}
            className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider group"
          >
            <Trash2 size={12} className="group-hover:scale-110 transition-transform" /> Delete
          </button>
        </div>
      </div>
    );
  }

  // --- MULTI NODE VIEW (2 nodes) ---
  if (nodes.length === 2) {
    const [nodeA, nodeB] = nodes;

    return (
      <div className={panelClasses}>
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/20 rounded-md">
                <LinkIcon size={16} className="text-violet-400" />
              </div>
              Relationship View
            </h2>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <span className="bg-slate-800/50 px-2 py-1 rounded border border-white/5 text-slate-200 font-medium truncate max-w-[100px]">{nodeA.label}</span>
              <ArrowRight size={12} className="text-slate-600" />
              <span className="bg-slate-800/50 px-2 py-1 rounded border border-white/5 text-slate-200 font-medium truncate max-w-[100px]">{nodeB.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Action: Manual Connect / Edit */}
          <div className="bg-slate-800/30 rounded-2xl p-5 border border-white/5">
            {(() => {
              // Find if there's an existing link
              const existingLink = allLinks.find(l => {
                const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
                const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
                return (sId === nodeA.id && tId === nodeB.id) || (sId === nodeB.id && tId === nodeA.id);
              });

              const isReversed = existingLink && (typeof existingLink.source === 'object' ? (existingLink.source as GraphNode).id : existingLink.source) === nodeB.id;

              return (
                <>
                  <h3 className="text-xs font-bold uppercase text-emerald-500 mb-3 tracking-wider">
                    {existingLink ? "Edit Relationship" : "Define Relationship"}
                  </h3>

                  {isConnecting ? (
                    <div className="space-y-3">
                      <select
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                        value={relationInput}
                        onChange={(e) => setRelationInput(e.target.value)}
                      >
                        {relationOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="CUSTOM_RELATION">Custom...</option>
                      </select>

                      {relationInput === "CUSTOM_RELATION" && (
                        <input
                          type="text"
                          placeholder="Describe relationship (e.g. influenced by)"
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none animate-in fade-in slide-in-from-top-1"
                          value={customRelation}
                          onChange={(e) => setCustomRelation(e.target.value)}
                          autoFocus
                        />
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsConnecting(false)}
                          className="flex-1 py-2 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const finalRelation = relationInput === "CUSTOM_RELATION" ? customRelation : relationInput;
                            if (finalRelation) {
                              if (existingLink) {
                                onUpdateLink(
                                  isReversed ? nodeB.id : nodeA.id,
                                  isReversed ? nodeA.id : nodeB.id,
                                  finalRelation
                                );
                              } else {
                                onConnectNodes(nodeA, nodeB, finalRelation);
                              }
                              setIsConnecting(false);
                              if (relationInput === "CUSTOM_RELATION") setCustomRelation("");
                            }
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20"
                        >
                          {existingLink ? "Update" : "Connect"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (existingLink) setRelationInput(existingLink.relation);
                          setIsConnecting(true);
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {existingLink ? <Edit2 size={14} /> : <PlusCircle size={14} />}
                        {existingLink ? "Change Relation" : "Add Edge"}
                      </button>

                      {existingLink && (
                        <button
                          onClick={() => {
                            const sId = typeof existingLink.source === 'object' ? (existingLink.source as GraphNode).id : existingLink.source;
                            const tId = typeof existingLink.target === 'object' ? (existingLink.target as GraphNode).id : existingLink.target;
                            onDeleteLink(sId, tId);
                          }}
                          className="w-full py-2 text-[10px] uppercase font-bold tracking-widest text-red-500/60 hover:text-red-400 transition-colors"
                        >
                          Remove Connection
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Action: AI Analysis */}
          <div className="bg-violet-900/20 rounded-2xl p-5 border border-violet-500/20 relative overflow-hidden group">
            <h3 className="flex items-center gap-2 text-sm font-bold text-violet-400 mb-2 relative z-10">
              <Sparkles size={16} />
              {mode === ExplorationMode.INNOVATION ? 'Synergy Analysis' : 'Interconnection Synthesis'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 relative z-10">
              {mode === ExplorationMode.INNOVATION
                ? 'Create a single bridge seed representing the technical synergy between these two areas.'
                : 'Create a single bridge seed representing the conceptual interconnection between these areas.'}
            </p>
            <button
              onClick={() => onAnalyzeSynergy(nodeA, nodeB)}
              disabled={isProcessing}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                ${isProcessing
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-500/30 hover:-translate-y-0.5'}`}
            >
              {isProcessing ? 'Analyzing...' : mode === ExplorationMode.INNOVATION ? 'Find Synergy' : 'Find Connection'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MANY NODES VIEW ---
  return (
    <div className={panelClasses}>
      <div className="p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
          <Network className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{nodes.length} Items Selected</h2>
        <p className="text-slate-400 text-sm max-w-[200px]">Select exactly 2 seeds to perform relationship analysis or linking.</p>
        <div className="flex flex-col gap-3 mt-8 w-full">
          <button
            onClick={() => onDeleteNodes(nodes.map(n => n.id))}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Delete {nodes.length} Seeds
          </button>
          <button onClick={onClose} className="w-full py-2 text-slate-500 hover:text-white flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest">
            <X size={14} /> Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;