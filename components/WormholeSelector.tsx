import React, { useEffect, useState } from 'react';
import { SeedFile, GraphNode } from '../types';
import { Orbit, X, Search, Globe, Link2, Loader2, Sparkles, ChevronDown, Zap, LayoutGrid, List, Filter } from 'lucide-react';
import { NodeType } from '../types';

interface WormholeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (sessionId: string, sessionName: string, nodeId: string, nodeLabel: string, relation: string) => void;
    currentSeedId?: string;
    relationOptions: string[];
}

const WormholeSelector: React.FC<WormholeSelectorProps> = ({ isOpen, onClose, onSelect, currentSeedId, relationOptions }) => {
    const [seeds, setSeeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<{ id: string, label: string } | null>(null);
    const [selectedRelation, setSelectedRelation] = useState(relationOptions[0]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedType, setSelectedType] = useState<NodeType | 'all'>('all');

    useEffect(() => {
        if (isOpen) {
            loadSeedList();
        }
    }, [isOpen]);

    const loadSeedList = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const list = await window.api.db.listSeeds();
            setSeeds(list.filter((s: any) => s.id !== currentSeedId));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadNodesForSeed = async (id: string) => {
        setLoading(true);
        try {
            // @ts-ignore
            const seed = await window.api.db.loadSeed(id);
            if (seed && seed.data) {
                // Flatten all nodes from all sessions in the stack or just the root? 
                // Usually linking to the primary nodes of that session is best.
                setNodes(seed.data.nodes || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSeed = (id: string) => {
        setSelectedSeed(id);
        setSelectedNode(null);
        loadNodesForSeed(id);
    };

    if (!isOpen) return null;

    const filteredNodes = nodes.filter(n => {
        const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || n.type === selectedType;
        return matchesSearch && matchesType;
    });

    const nodeTypes = Array.from(new Set(nodes.map(n => n.type)));

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-4xl h-[75vh] rounded-[28px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">

                {/* Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                            <Sparkles className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Establish Wormhole</h2>
                            <p className="text-[10px] text-slate-400 font-medium">Link this session to a seed in another Seed Space</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Session List */}
                    <div className="w-1/3 border-r border-white/5 flex flex-col bg-black/20">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Target Seed Spaces</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                            {seeds.map(seed => (
                                <button
                                    key={seed.id}
                                    onClick={() => handleSelectSeed(seed.id)}
                                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2.5
                                        ${selectedSeed === seed.id
                                            ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                                            : 'hover:bg-white/5 text-slate-400 border border-transparent'}`}
                                >
                                    <Globe size={14} className={selectedSeed === seed.id ? 'text-indigo-400' : 'text-slate-600'} />
                                    <div className="flex-1 truncate">
                                        <div className="text-xs font-bold truncate">{seed.name}</div>
                                        <div className="text-[9px] text-slate-500">{new Date(seed.lastModified).toLocaleDateString()}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Seed Selector or Relation Selector */}
                    <div className="flex-1 flex flex-col p-6 space-y-4">
                        {!selectedSeed ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                <Globe size={64} className="text-slate-600 mb-4" />
                                <p className="text-sm font-medium text-slate-400">Select a target Seed Space from the left to browse its seeds</p>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        ) : selectedNode ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 bg-slate-950/40 border border-indigo-500/30 rounded-[24px] max-w-sm w-full text-center shadow-2xl backdrop-blur-sm ring-1 ring-white/5">
                                    <div className="text-indigo-400 mb-2 font-bold uppercase tracking-[0.2em] text-[10px]">Target Seed Selected</div>
                                    <div className="text-xl font-bold text-white mb-4 leading-tight">{selectedNode.label}</div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
                                    <div className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest font-bold">Nature of Connection</div>
                                    <div className="flex flex-col gap-4">
                                        <div className="relative group">
                                            <select
                                                value={selectedRelation}
                                                onChange={(e) => setSelectedRelation(e.target.value)}
                                                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer hover:bg-black/60 capitalize"
                                            >
                                                {relationOptions.map(rel => (
                                                    <option key={rel} value={rel} className="bg-slate-900 text-slate-200">{rel}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-indigo-400 transition-colors">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onSelect(selectedSeed, seeds.find(s => s.id === selectedSeed)?.name || 'Unknown Space', selectedNode.id, selectedNode.label, selectedRelation)}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <Zap size={18} />
                                            Establish Wormhole
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className="mt-6 text-[10px] text-slate-500 hover:text-indigo-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto pb-1 border-b border-transparent hover:border-indigo-400/30"
                                    >
                                        <X size={12} /> Change Selection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-4 py-2 focus-within:border-indigo-500/50 transition-colors">
                                        <Search size={14} className="text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Search seeds..."
                                            className="bg-transparent border-none outline-none text-xs text-white flex-1 placeholder:text-slate-600"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex bg-black/40 border border-white/5 rounded-xl p-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            title="Grid View"
                                        >
                                            <LayoutGrid size={14} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            title="List View"
                                        >
                                            <List size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Type Filters */}
                                <div className="flex flex-wrap gap-2 py-1 overflow-x-auto scrollbar-none">
                                    <button
                                        onClick={() => setSelectedType('all')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${selectedType === 'all'
                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                            : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/10'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {nodeTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${selectedType === type
                                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                                : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/10'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className={`flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/10 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-1.5'}`}>
                                    {filteredNodes.map(node => (
                                        <button
                                            key={node.id}
                                            onClick={() => setSelectedNode({ id: node.id, label: node.label })}
                                            className={`
                                                group text-left transition-all relative overflow-hidden border
                                                ${viewMode === 'grid'
                                                    ? 'p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-indigo-500/40 rounded-2xl'
                                                    : 'p-3 flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-indigo-500/40 rounded-xl'
                                                }
                                            `}
                                        >
                                            {viewMode === 'grid' ? (
                                                <>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{node.type}</span>
                                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0">
                                                            <Link2 size={12} className="text-indigo-400" />
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-200 line-clamp-1 mb-1 group-hover:text-white transition-colors">{node.label}</div>
                                                    <div className="text-[9px] text-slate-500 line-clamp-1 font-light leading-relaxed group-hover:text-slate-400 transition-colors uppercase tracking-tight">{node.description || 'No description available.'}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 transition-colors">
                                                        <Link2 size={14} className="text-indigo-400 group-hover:text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">{node.label}</div>
                                                        <div className="text-[9px] text-slate-500 line-clamp-1 font-medium max-w-[80%]">{node.description || 'No description available.'}</div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-indigo-400 transition-colors whitespace-nowrap">{node.type}</span>
                                                </>
                                            )}
                                        </button>
                                    ))}
                                    {filteredNodes.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-600">
                                            <Search size={32} className="mb-3 opacity-20" />
                                            <div className="text-xs font-bold uppercase tracking-widest opacity-40">No matching seeds</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WormholeSelector;
