import React, { useState } from 'react';
import { X, Check, Network, Type, FileText, Link as LinkIcon } from 'lucide-react';
import { AISuggestion, NodeType, GraphNode } from '../types';
import { NODE_COLORS } from '../constants';

interface NexusConfirmDialogProps {
    suggestion: AISuggestion;
    parentNodes: GraphNode[];
    onConfirm: (finalNode: AISuggestion, parentId: string) => void;
    onCancel: () => void;
}

const NexusConfirmDialog: React.FC<NexusConfirmDialogProps> = ({
    suggestion,
    parentNodes,
    onConfirm,
    onCancel
}) => {
    const [form, setForm] = useState<AISuggestion>({ ...suggestion });
    const [selectedParentId, setSelectedParentId] = useState(parentNodes[0]?.id || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(form, selectedParentId);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                            <Check size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-tight">Nexus Proposal</h2>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Configure Seed Attachment</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Label */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            <Type size={12} /> Seed Label
                        </label>
                        <input
                            type="text"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Type Selection as a grid or dropdown */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Category
                        </label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value as NodeType })}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer"
                        >
                            {Object.values(NodeType).filter(t => t !== NodeType.TRACE).map(type => (
                                <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            <FileText size={12} /> Strategic Intent
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium resize-none leading-relaxed"
                        />
                    </div>

                    {/* Connection Source */}
                    {parentNodes.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-white/5">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    <Network size={12} /> Anchor to Node
                                </label>
                                <select
                                    value={selectedParentId}
                                    onChange={(e) => setSelectedParentId(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer"
                                >
                                    {parentNodes.map(n => (
                                        <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    <LinkIcon size={12} /> Relationship Type
                                </label>
                                <input
                                    type="text"
                                    value={form.relationToParent}
                                    onChange={(e) => setForm({ ...form, relationToParent: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-all"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                        >
                            Assimilate into Graph
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NexusConfirmDialog;
