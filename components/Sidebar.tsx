import React, { useState, useEffect } from 'react';
import { GraphNode, NodeType } from '../types';
import { RELATION_OPTIONS } from '../constants';
import { BrainCircuit, X, Network, Lightbulb, Zap, Link as LinkIcon, ArrowRight, Edit2, Trash2, Save, RotateCcw, Check, MousePointerClick, RefreshCw, Dices, PlusCircle } from 'lucide-react';

interface SidebarProps {
  nodes: GraphNode[];
  onClose: () => void;
  onExpand: (node: GraphNode) => void;
  onExpandSingle: (node: GraphNode, relation: string, count: number) => void;
  onAnalyzeSynergy: (nodeA: GraphNode, nodeB: GraphNode) => void;
  onConnectNodes: (nodeA: GraphNode, nodeB: GraphNode, relation: string) => void;
  onUpdateNode: (node: GraphNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onRegenerateNode: (node: GraphNode) => void;
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
  onRegenerateNode,
  isProcessing
}) => {
  const [relationInput, setRelationInput] = useState(RELATION_OPTIONS[0]);
  const [expandRelationInput, setExpandRelationInput] = useState("enables");
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
                    onChange={(e) => setEditForm({...editForm, type: e.target.value as NodeType})}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-sky-500/50 focus:outline-none"
                 >
                    {Object.values(NodeType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                 </select>
                 <input 
                    type="text" 
                    value={editForm.label}
                    onChange={(e) => setEditForm({...editForm, label: e.target.value})}
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
                 <button onClick={() => onRegenerateNode(node)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-violet-400 transition-colors" title="Regenerate Seed">
                   <Dices size={18} />
                 </button>
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
          
          {/* Description Section */}
          <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5">
            <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Seed Description</h3>
            {isEditing ? (
               <textarea 
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
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
              {/* Main AI Augmentation (Multiple) */}
              <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                <h3 className="flex items-center gap-2 text-sm font-bold text-sky-400 mb-2 relative z-10">
                  <BrainCircuit size={16} />
                  AI Augmentation
                </h3>
                <p className="text-xs text-slate-400 mb-4 relative z-10">
                  Ask the innovation engine to find adjacent concepts, technologies, or bottlenecks.
                </p>
                <button
                  onClick={() => onExpand(node)}
                  disabled={isProcessing}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all relative z-10
                    ${isProcessing 
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20 hover:shadow-sky-500/30 hover:-translate-y-0.5'}`}
                >
                  {isProcessing ? 'Processing...' : <><Lightbulb size={16} /> Expand Connections</>}
                </button>
              </div>

              {/* Single Targeted Expansion */}
              <div className="bg-slate-800/20 rounded-2xl p-5 border border-white/5">
                 <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-3">
                    <MousePointerClick size={16} />
                    Targeted Expansion
                 </h3>
                 <div className="flex gap-2">
                    <select
                      value={expandRelationInput}
                      onChange={(e) => setExpandRelationInput(e.target.value)}
                      className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                    >
                      {RELATION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        max="5"
                        value={targetCount}
                        onChange={(e) => setTargetCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                        className="w-12 bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none text-center"
                        title="Number of seeds to generate"
                    />
                    <button
                      onClick={() => onExpandSingle(node, expandRelationInput, targetCount)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors border border-white/5 hover:border-emerald-500/50"
                    >
                      Go
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
                    <LinkIcon size={16} className="text-violet-400"/>
                </div>
                Relationship View
             </h2>
             <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span className="bg-slate-800/50 px-2 py-1 rounded border border-white/5 text-slate-200 font-medium truncate max-w-[100px]">{nodeA.label}</span>
                <ArrowRight size={12} className="text-slate-600"/>
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
            <X size={14}/> Clear Selection
         </button>
      </div>
    </div>
  );
};

export default Sidebar;