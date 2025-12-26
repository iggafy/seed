import React, { useState, useEffect } from 'react';
import { GraphNode, NodeType } from '../types';
import { RELATION_OPTIONS, EXPANSION_BLUEPRINTS } from '../constants';
import { BrainCircuit, X, Network, Lightbulb, Zap, Link as LinkIcon, ArrowRight, Edit2, Trash2, Save, RotateCcw, Check, MousePointerClick, RefreshCw, Dices, PlusCircle, Cpu, CheckCircle2, Heart, AlertCircle, ChevronRight, Binary, Sparkles } from 'lucide-react';

interface SidebarProps {
  nodes: GraphNode[];
  onClose: () => void;
  onExpand: (node: GraphNode) => void;
  onExpandSingle: (node: GraphNode, relation: string, count: number) => void;
  onAnalyzeSynergy: (nodeA: GraphNode, nodeB: GraphNode) => void;
  onConnectNodes: (nodeA: GraphNode, nodeB: GraphNode, relation: string) => void;
  onUpdateNode: (node: GraphNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onKeepLucky: (nodeId: string) => void;
  onTryAgainLucky: (node: GraphNode) => void;
  onInnovate: (node: GraphNode) => void;
  onSolve: (node: GraphNode) => void;
  onAnswer: (node: GraphNode) => void;
  onAssimilate: (nodeId: string) => void;
  onPrune: (nodeId: string) => void;
  isProcessing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  onClose,
  onExpand,
  onExpandSingle,
  onAnalyzeSynergy,
  onConnectNodes,
  onUpdateNode,
  onDeleteNode,
  onKeepLucky,
  onTryAgainLucky,
  onInnovate,
  onSolve,
  onAnswer,
  onAssimilate,
  onPrune,
  isProcessing
}) => {
  const [relationInput, setRelationInput] = useState(RELATION_OPTIONS[0]);
  const [expandBlueprintIndex, setExpandBlueprintIndex] = useState(0);
  const [targetCount, setTargetCount] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    label: "",
    description: "",
    type: NodeType.CONCEPT
  });

  // Reset edit state when selection changes
  useEffect(() => {
    setIsEditing(false);
    setIsConnecting(false);
    setTargetCount(1);
  }, [nodes]);

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
                This seed was autonomously generated by the <span className="text-sky-400 font-semibold italic">Innovation Gardener</span>. It is currently in a hypothetical "ghost" state.
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
                Does this technical challenge spark an innovation path?
                Choose to <span className="text-violet-400 font-semibold">Keep</span> it as your foundation or <span className="text-violet-400 font-semibold">Try Again</span> for a different perspective.
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
              {(node.type === NodeType.TECHNOLOGY || node.type === NodeType.INNOVATION) && (
                <div className="bg-violet-900/20 rounded-2xl p-5 border border-violet-500/20 relative overflow-hidden group">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-violet-400 mb-2 relative z-10">
                    <Cpu size={16} />
                    Structural Innovation
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 relative z-10">
                    Propel this technology into its next architectural evolution.
                  </p>
                  <button
                    onClick={() => onInnovate(node)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                      ${isProcessing
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-500/30 hover:-translate-y-0.5'}`}
                  >
                    {isProcessing ? 'Thinking...' : 'Innovate'}
                  </button>
                </div>
              )}

              {(node.type === NodeType.PROBLEM || node.type === NodeType.PAIN_POINT) && (
                <div className="bg-emerald-900/20 rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden group">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-2 relative z-10">
                    <CheckCircle2 size={16} />
                    Solve Problem
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 relative z-10">
                    Analyze graph context to derive a technical solution for this pain point.
                  </p>
                  <button
                    onClick={() => onSolve(node)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                      ${isProcessing
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5'}`}
                  >
                    {isProcessing ? 'Deriving...' : 'Solve'}
                  </button>
                </div>
              )}

              {node.type === NodeType.QUESTION && (
                <div className="bg-amber-900/20 rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden group">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2 relative z-10">
                    <Zap size={16} />
                    Functional Answer
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 relative z-10">
                    Synthesize an evidence-based answer using the current graph lineage.
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
                  Innovation Discovery
                </h3>
                <p className="text-xs text-slate-400 mb-4 relative z-10">
                  Expand this seed to find adjacent discovery opportunities.
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
                  Directed Discovery
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Inquire Adjacent Possibility</label>
                  <select
                    value={expandBlueprintIndex}
                    onChange={(e) => setExpandBlueprintIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-colors"
                  >
                    {EXPANSION_BLUEPRINTS.map((bp, idx) => (
                      <option key={bp.label} value={idx}>{bp.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Node Density</label>
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
                      const bp = EXPANSION_BLUEPRINTS[expandBlueprintIndex];
                      onExpandSingle(node, bp.relation, targetCount);
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
            onClick={() => onDeleteNode(node.id)}
            className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider group"
          >
            <Trash2 size={12} className="group-hover:scale-110 transition-transform" /> Delete
          </button>
        </div>
      </div >
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

          {/* Action: Manual Connect */}
          <div className="bg-slate-800/30 rounded-2xl p-5 border border-white/5">
            <h3 className="text-xs font-bold uppercase text-emerald-500 mb-3 tracking-wider">Define Relationship</h3>
            {isConnecting ? (
              <div className="space-y-3">
                <select
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                  value={relationInput}
                  onChange={(e) => setRelationInput(e.target.value)}
                >
                  {RELATION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsConnecting(false)}
                    className="flex-1 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (relationInput) {
                        onConnectNodes(nodeA, nodeB, relationInput);
                        setIsConnecting(false);
                      }
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsConnecting(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <PlusCircle size={14} /> Add Edge
              </button>
            )}
          </div>

          {/* Action: AI Analyze */}
          <div className="bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30 rounded-2xl p-5 border border-violet-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-violet-300 mb-2 relative z-10">
              <Zap size={16} />
              Synergy & Conflict AI
            </h3>
            <p className="text-xs text-violet-200/70 mb-5 relative z-10 leading-relaxed">
              Generates a new seed representing the synthesis, conflict, or emergent property of these two concepts.
            </p>

            <button
              onClick={() => onAnalyzeSynergy(nodeA, nodeB)}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all relative z-10
                  ${isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40 hover:shadow-violet-500/30 hover:-translate-y-0.5'}`}
            >
              {isProcessing ? 'Generating...' : 'Generate Synergy Seed'}
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
        <button onClick={onClose} className="mt-6 text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <X size={14} /> Clear Selection
        </button>
      </div>
    </div>
  );
};

export default Sidebar;