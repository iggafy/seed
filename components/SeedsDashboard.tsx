import React, { useState, useEffect } from 'react';
import { SeedFile, ExplorationMode } from '../types';
import { LayoutGrid, Plus, Trash2, Clock, FileText, Loader2, Share2 } from 'lucide-react';

interface SeedsDashboardProps {
    onLoadSeed: (id: string) => void;
    onNewSeed: () => void;
    onClose: () => void;
    currentSeedId?: string;
    askConfirm: (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info', confirmText?: string) => void;
    onSelectMode?: (mode: ExplorationMode) => void;
    initialMode?: ExplorationMode;
}

const SeedsDashboard: React.FC<SeedsDashboardProps> = ({ onLoadSeed, onNewSeed, onClose, currentSeedId, askConfirm, onSelectMode, initialMode }) => {
    const [seeds, setSeeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ExplorationMode>(initialMode || ExplorationMode.INNOVATION);

    const loadList = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const list = await window.api.db.listSeeds();
            setSeeds(list);
        } catch (e) {
            console.error("Failed to list seeds", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadList();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        askConfirm(
            "Delete Seed Space",
            "Are you sure you want to permanently delete this Seed Space? All research, connections, and metadata within it will be lost forever.",
            async () => {
                // @ts-ignore
                await window.api.db.deleteSeed(id);
                loadList();
            },
            'danger',
            "Delete Permanently"
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-[28px] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-500/20 rounded-xl border border-sky-500/30">
                                <LayoutGrid size={20} className="text-sky-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-100 leading-tight">Seed Spaces</h2>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Workspace Manager</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-white/5 ml-4">
                            <button
                                onClick={() => setActiveTab(ExplorationMode.INNOVATION)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === ExplorationMode.INNOVATION ? 'bg-sky-500 text-white shadow-lg shadow-sky-900/40' : 'text-slate-400 hover:text-white'}`}
                            >
                                Innovation
                            </button>
                            <button
                                onClick={() => setActiveTab(ExplorationMode.KNOWLEDGE)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === ExplorationMode.KNOWLEDGE ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:text-white'}`}
                            >
                                Knowledge
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <Plus className="rotate-45" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-slate-500 gap-2">
                            <Loader2 className="animate-spin" /> Loading seeds...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* New Seed Card */}
                            <button
                                onClick={() => onSelectMode ? onSelectMode(activeTab) : onNewSeed()}
                                className={`group flex flex-col items-center justify-center h-40 rounded-[20px] border-2 border-dashed transition-all gap-2 
                                    ${activeTab === ExplorationMode.INNOVATION ? 'border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/5' : 'border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}
                            >
                                <div className={`p-2.5 rounded-full group-hover:scale-110 transition-transform ${activeTab === ExplorationMode.INNOVATION ? 'bg-sky-500/10' : 'bg-indigo-500/10'}`}>
                                    <Plus size={20} className={activeTab === ExplorationMode.INNOVATION ? 'text-sky-400' : 'text-indigo-400'} />
                                </div>
                                <span className="text-sm font-bold text-slate-300">Create New {activeTab === ExplorationMode.INNOVATION ? 'Innovation' : 'Knowledge'} Space</span>
                            </button>

                            {/* Seed Cards */}
                            {seeds.filter(s => (s.mode || ExplorationMode.INNOVATION) === activeTab).map(seed => (
                                <div
                                    key={seed.id}
                                    onClick={() => onLoadSeed(seed.id)}
                                    className={`
                                relative group flex flex-col h-40 rounded-[20px] border p-4 cursor-pointer transition-all
                                ${currentSeedId === seed.id ? (activeTab === ExplorationMode.INNOVATION ? 'bg-sky-900/10 border-sky-500/50 ring-1 ring-sky-500/20' : 'bg-indigo-900/10 border-indigo-500/50 ring-1 ring-indigo-500/20') : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'}
                            `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-base text-slate-200 truncate pr-8 tracking-tight">{seed.name}</h3>
                                        {currentSeedId === seed.id && (
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${activeTab === ExplorationMode.INNOVATION ? 'bg-sky-500/20 text-sky-300 border-sky-500/20' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20'}`}>Active</span>
                                        )}
                                    </div>

                                    <p className="text-[11px] text-slate-500 mb-auto line-clamp-2 leading-relaxed">
                                        {seed.nodeCount} seed{seed.nodeCount !== 1 ? 's' : ''} in this space.
                                    </p>

                                    <div className="mt-2 flex justify-between items-end pt-3 border-t border-slate-700/50">
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                            <Clock size={10} />
                                            {new Date(seed.lastModified).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, seed.id)}
                                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Seed Space"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeedsDashboard;
