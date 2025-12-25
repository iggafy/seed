import React, { useEffect, useState } from 'react';
import { SeedFile } from '../types';
import { LayoutGrid, Plus, Trash2, Clock, FileText, Loader2 } from 'lucide-react';

interface SeedsDashboardProps {
    onLoadSeed: (id: string) => void;
    onNewSeed: () => void;
    onClose: () => void;
    currentSeedId?: string;
}

const SeedsDashboard: React.FC<SeedsDashboardProps> = ({ onLoadSeed, onNewSeed, onClose, currentSeedId }) => {
    const [seeds, setSeeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (confirm("Are you sure you want to delete this seed?")) {
            // @ts-ignore
            await window.api.db.deleteSeed(id);
            loadList();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <LayoutGrid size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">Seeds Dashboard</h2>
                            <p className="text-sm text-slate-400">Manage your exploration graphs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        Esc
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
                                onClick={onNewSeed}
                                className="group flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all gap-3"
                            >
                                <div className="p-3 rounded-full bg-slate-800 group-hover:scale-110 transition-transform">
                                    <Plus size={24} className="text-indigo-400" />
                                </div>
                                <span className="font-medium text-slate-300">Create New Seed</span>
                            </button>

                            {/* Seed Cards */}
                            {seeds.map(seed => (
                                <div
                                    key={seed.id}
                                    onClick={() => onLoadSeed(seed.id)}
                                    className={`
                                relative group flex flex-col h-48 rounded-xl border p-5 cursor-pointer transition-all
                                ${currentSeedId === seed.id ? 'bg-indigo-900/10 border-indigo-500/50 ring-1 ring-indigo-500/20' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'}
                            `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-slate-200 truncate pr-8">{seed.name}</h3>
                                        {currentSeedId === seed.id && (
                                            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">Active</span>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-500 mb-auto line-clamp-2">
                                        {seed.nodeCount} node{seed.nodeCount !== 1 ? 's' : ''} in this graph.
                                    </p>

                                    <div className="mt-4 flex justify-between items-end pt-4 border-t border-slate-700/50">
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {new Date(seed.lastModified).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, seed.id)}
                                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Seed"
                                        >
                                            <Trash2 size={16} />
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
