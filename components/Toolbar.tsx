import React from 'react';
import { Plus, Network, Filter, Info, GitMerge, Cpu, LayoutGrid, Save, BrainCircuit } from 'lucide-react';

interface ToolbarProps {
  onAddNode: () => void;
  onStructureView: () => void;
  onToggleSettings: () => void;
  onToggleFilterMenu: () => void;
  onToggleInfo: () => void;
  onToggleContextMode: () => void;
  onDashboard: () => void;
  onSave: () => void;
  onToggleDiscovery: () => void;
  isFilterActive: boolean;
  isInfoOpen: boolean;
  isContextMode: boolean;
  isDiscoveryActive: boolean;
  isProcessing: boolean;
  activeTypeCount: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onStructureView,
  onToggleSettings,
  onToggleFilterMenu,
  onToggleInfo,
  onToggleContextMode,
  onDashboard,
  onSave,
  onToggleDiscovery,
  isFilterActive,
  isInfoOpen,
  isContextMode,
  isDiscoveryActive,
  isProcessing
}) => {
  return (
    <div className="absolute left-6 bottom-6 flex flex-col items-start gap-3 z-50 group/toolbar">

      {/* 
        UTILITY RAIL (Vertical)
        Contains system-level tools. 
        Slightly smaller, more minimal.
      */}
      <div className="flex flex-col bg-slate-950/40 backdrop-blur-3xl rounded-[24px] border border-white/10 p-1.5 gap-1 shadow-2xl transition-all duration-500 hover:bg-slate-950/60 group-hover/toolbar:translate-y-0 translate-y-2 opacity-0 group-hover/toolbar:opacity-100 pointer-events-none group-hover/toolbar:pointer-events-auto">
        <button
          onClick={onDashboard}
          className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Seeds Dashboard"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={onSave}
          className="p-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          title="Save Current Seed"
        >
          <Save size={18} />
        </button>
        <button
          onClick={onStructureView}
          className="p-3 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
          title="Structure View"
        >
          <Network size={18} />
        </button>
        <button
          onClick={onToggleFilterMenu}
          className={`p-3 rounded-xl transition-all ${isFilterActive
            ? 'text-sky-400 bg-sky-500/10'
            : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Filter Seed Types"
        >
          <Filter size={18} />
        </button>
        <button
          onClick={onToggleInfo}
          className={`p-3 rounded-xl transition-all ${isInfoOpen
            ? 'text-indigo-400 bg-indigo-500/10'
            : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Legend & Info"
        >
          <Info size={18} />
        </button>
        <button
          onClick={onToggleSettings}
          className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="AI Settings"
        >
          <Cpu size={18} />
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
            ? 'bg-red-500 text-white shadow-lg shadow-red-900/40'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          title={isDiscoveryActive ? "Stop Discovery" : "Start Discovery"}
        >
          {isDiscoveryActive && (
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
          )}
          <BrainCircuit size={20} className={`${isDiscoveryActive ? 'animate-spin-slow' : 'group-hover/discovery:rotate-12'} transition-transform`} />

          {/* Active Status Badge */}
          {isDiscoveryActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-red-500 animate-bounce" />
          )}
        </button>
      </div>

    </div>
  );
};

export default Toolbar;