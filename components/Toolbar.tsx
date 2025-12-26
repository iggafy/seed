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
    <div className="absolute left-6 bottom-6 flex gap-3 z-10 items-center">

      {/* Primary Action: Add Node */}
      <button
        onClick={onAddNode}
        className="bg-sky-600 hover:bg-sky-500 text-white p-3.5 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.3)] border border-sky-400/50 transition-all hover:scale-110 hover:-translate-y-1 group"
        title="Add Custom Seed"
      >
        <Plus size={22} className="group-hover:rotate-90 transition-transform" />
      </button>

      {/* Persistence Group */}
      <div className="flex bg-slate-900/60 backdrop-blur-md rounded-full shadow-lg border border-white/10 p-1 gap-1">
        <button
          onClick={onDashboard}
          className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          title="Seeds Dashboard"
        >
          <LayoutGrid size={20} />
        </button>
        <button
          onClick={onSave}
          className="p-2.5 rounded-full text-slate-300 hover:text-green-400 hover:bg-slate-800 transition-all"
          title="Save Current Seed"
        >
          <Save size={20} />
        </button>
      </div>

      <div className="h-8 w-px bg-white/10 self-center mx-1" />

      {/* Mode Toggle */}
      <div className="flex bg-slate-900/60 backdrop-blur-md rounded-full shadow-lg border border-white/10 p-1 gap-2">
        <button
          onClick={onToggleContextMode}
          className={`p-2.5 rounded-full transition-all ${isContextMode
            ? 'bg-violet-600 text-white border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
            : 'text-slate-400 hover:text-slate-300'
            }`}
          title={`Contextual Lineage Mode: ${isContextMode ? 'ON' : 'OFF'}`}
        >
          <GitMerge size={20} />
        </button>

        <button
          onClick={onToggleDiscovery}
          className={`p-2.5 rounded-full transition-all ${isDiscoveryActive
            ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
            : 'text-slate-400 hover:text-slate-300'
            }`}
          title={`Autonomous Discovery Mode: ${isDiscoveryActive ? 'ON' : 'OFF'}`}
        >
          <div className="relative">
            {isDiscoveryActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />}
            <BrainCircuit size={20} />
          </div>
        </button>
      </div>

      <div className="h-8 w-px bg-white/10 self-center mx-1" />

      {/* View Controls */}
      <button
        onClick={onStructureView}
        className="bg-slate-900/60 hover:bg-slate-800 backdrop-blur-md text-slate-300 p-3.5 rounded-full shadow-lg border border-white/10 hover:border-white/20 transition-all hover:scale-110"
        title="Structure View"
      >
        <Network size={20} />
      </button>
      <button
        onClick={onToggleFilterMenu}
        className={`p-3.5 rounded-full shadow-lg border transition-all hover:scale-110 ${isFilterActive
          ? 'bg-sky-600 text-white border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
          : 'bg-slate-900/60 hover:bg-slate-800 backdrop-blur-md text-slate-300 border-white/10 hover:border-white/20'}`}
        title="Filter Seed Types"
      >
        <Filter size={20} />
      </button>
      <button
        onClick={onToggleInfo}
        className={`p-3.5 rounded-full shadow-lg border transition-all hover:scale-110 ${isInfoOpen
          ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
          : 'bg-slate-900/60 hover:bg-slate-800 backdrop-blur-md text-slate-300 border-white/10 hover:border-white/20'}`}
        title="Legend & Info"
      >
        <Info size={20} />
      </button>

      {/* Settings */}
      <button
        onClick={onToggleSettings}
        className="bg-slate-900/60 hover:bg-slate-800 backdrop-blur-md text-slate-300 p-3.5 rounded-full shadow-lg border border-white/10 hover:border-white/20 transition-all hover:scale-110"
        title="AI Settings"
      >
        <Cpu size={20} />
      </button>
    </div>
  );
};

export default Toolbar;