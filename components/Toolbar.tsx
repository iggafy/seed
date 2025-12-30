import React from 'react';
import { Plus, Network, Filter, Info, GitMerge, Cpu, LayoutGrid, Save, BrainCircuit, Sparkles, MessageSquare, Undo2, Redo2, HelpCircle, Home } from 'lucide-react';

interface ToolbarProps {
  onAddNode: () => void;
  onStructureView: () => void;
  onToggleSettings: () => void;
  onToggleFilterMenu: () => void;
  onToggleContextMode: () => void;
  onDashboard: () => void;
  onSave: () => void;
  onToggleDiscovery: () => void;
  onToggleSynergy: () => void;
  onToggleChat: () => void;
  onToggleManual: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHome: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isFilterActive: boolean;
  isContextMode: boolean;
  isDiscoveryActive: boolean;
  isSynergyActive: boolean;
  isChatOpen: boolean;
  isProcessing: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onStructureView,
  onToggleSettings,
  onToggleFilterMenu,
  onToggleContextMode,
  onDashboard,
  onSave,
  onToggleDiscovery,
  onToggleSynergy,
  onToggleChat,
  onToggleManual,
  onUndo,
  onRedo,
  onHome,
  canUndo,
  canRedo,
  isFilterActive,
  isContextMode,
  isDiscoveryActive,
  isSynergyActive,
  isChatOpen,
  isProcessing
}) => {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex flex-col items-center gap-3 z-50 group/toolbar">

      {/* 
        UTILITY RAIL (Horizontal - appears on hover above main dock)
        Contains system-level tools. 
        Slightly smaller, more minimal.
      */}

      <div className="flex items-center bg-slate-950/40 backdrop-blur-3xl rounded-full border border-white/10 px-2 py-1.5 gap-1 shadow-2xl transition-all duration-500 hover:bg-slate-950/60 opacity-0 group-hover/toolbar:opacity-100 translate-y-4 group-hover/toolbar:translate-y-0 pointer-events-none group-hover/toolbar:pointer-events-auto">
        <button
          onClick={onHome}
          className="p-3 rounded-full text-sky-400 hover:text-white hover:bg-sky-500/10 transition-all"
          title="Back to Welcome Screen"
        >
          <Home size={18} />
        </button>
        <button
          onClick={onDashboard}
          className="p-3 rounded-full text-fuchsia-400 hover:text-white hover:bg-fuchsia-500/10 transition-all"
          title="Seed Spaces"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={onSave}
          className="p-3 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          title="Save Current Seed"
        >
          <Save size={18} />
        </button>
        <button
          onClick={onStructureView}
          className="p-3 rounded-full text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
          title="Structure View"
        >
          <Network size={18} />
        </button>
        <button
          onClick={onToggleFilterMenu}
          className={`p-3 rounded-full transition-all ${isFilterActive
            ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
            : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
          title="Filter Seed Types"
        >
          <Filter size={18} />
        </button>
        <button
          onClick={onToggleSettings}
          className="p-3 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          title="AI Settings"
        >
          <Cpu size={18} />
        </button>
        <button
          onClick={onToggleManual}
          className="p-3 rounded-full text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)]"
          title="SEED Manual"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* 
        ACTION DOCK (Horizontal)
        Contains high-frequency creation/exploration tools.
      */}
      <div className={`flex items-center gap-2 p-1.5 rounded-full border transition-all duration-500 shadow-2xl ${isDiscoveryActive
        ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)] backdrop-blur-3xl'
        : 'bg-slate-950/40 border-white/10 backdrop-blur-2xl hover:bg-slate-950/60'
        }`}>

        {/* The Anchor: Add Node */}
        <button
          onClick={onAddNode}
          className="bg-sky-500 text-white p-3.5 rounded-full shadow-lg shadow-sky-900/20 hover:bg-sky-400 hover:scale-110 active:scale-95 transition-all group/add"
          title="Add Custom Seed"
        >
          <Plus size={22} className="group-hover/add:rotate-90 transition-transform duration-300" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Contextual Lineage Toggle */}
        <button
          onClick={onToggleContextMode}
          className={`p-3.5 rounded-full transition-all group/context ${isContextMode
            ? 'bg-violet-500 text-white shadow-lg shadow-violet-900/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          title="Contextual Lineage"
        >
          <GitMerge size={20} className={isContextMode ? 'animate-pulse-subtle' : ''} />
        </button>

        {/* Autonomous Discovery Toggle */}
        <button
          onClick={onToggleDiscovery}
          className={`relative group/discovery p-3.5 rounded-full transition-all duration-500 ${isDiscoveryActive
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40'
            : 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 shadow-inner'
            }`}
          title={isDiscoveryActive ? "Stop Autonomous Discovery" : "Start Autonomous Discovery"}
        >
          {isDiscoveryActive && (
            <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-25" />
          )}
          <BrainCircuit size={20} className={`${isDiscoveryActive ? 'animate-spin-slow' : 'group-hover/discovery:rotate-12'} transition-transform`} />

          {/* Active Status Badge */}
          {isDiscoveryActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-red-500 animate-bounce" />
          )}
        </button>

        {/* Synergy Finder Toggle */}
        <button
          onClick={onToggleSynergy}
          className={`relative group/synergy p-3.5 rounded-full transition-all duration-500 ${isSynergyActive
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40'
            : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 shadow-inner'
            }`}
          title={isSynergyActive ? "Stop Synergy Finder" : "Start Synergy Finder"}
        >
          {isSynergyActive && (
            <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-25" />
          )}
          <Sparkles size={20} className={`${isSynergyActive ? 'animate-pulse' : 'group-hover/synergy:scale-110'} transition-all`} />

          {/* Active Status Badge */}
          {isSynergyActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-amber-500 animate-bounce" />
          )}
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Nexus Assistant Toggle */}
        <button
          onClick={onToggleChat}
          className={`p-3.5 rounded-full transition-all group/nexus ${isChatOpen
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
            : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
            }`}
          title="Nexus Research Assistant"
        >
          <MessageSquare className={isChatOpen ? 'animate-pulse' : ''} size={20} />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-3.5 rounded-full transition-all ${canUndo
              ? 'text-slate-200 hover:text-amber-400 hover:bg-amber-500/10 active:scale-90'
              : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-3.5 rounded-full transition-all ${canRedo
              ? 'text-slate-200 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90'
              : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Toolbar;