import React, { useState } from 'react';
import { BrainCircuit, X, BookOpen, ArrowRight, Check } from 'lucide-react';

interface DiscoveryRecommendationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onReadDocs: () => void;
}

const DiscoveryRecommendation: React.FC<DiscoveryRecommendationProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onReadDocs
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (dontShowAgain) {
            localStorage.setItem('skipDiscoveryRecommendation', 'true');
        }
        onConfirm();
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="bg-slate-900/90 border border-white/10 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-300 relative">
                <div className="relative p-10 flex flex-col items-center text-center">
                    {/* Decorative glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-sky-500/20 blur-[80px] rounded-full pointer-events-none" />

                    <div className="w-20 h-20 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-sky-500/5 rounded-3xl animate-pulse" />
                        <BrainCircuit size={40} className="text-sky-400 relative z-10" />
                    </div>

                    <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase italic">Discovery Protocol</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 px-4">
                        The Discovery Brain is a powerful, policy-driven engine. We highly recommend exploring the documentation to understand how <span className="text-sky-400 font-bold">Laws</span> and <span className="text-emerald-400 font-bold">Main Goals</span> steer the AI toward your objective.
                    </p>

                    <div className="flex flex-col gap-3 w-full mb-8">
                        <button
                            onClick={onReadDocs}
                            className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-lg shadow-sky-500/20 active:scale-[0.98]"
                        >
                            <BookOpen size={18} />
                            Read Documentation
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="w-full py-5 bg-slate-800/50 hover:bg-slate-800 text-white border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                        >
                            Launch Anyway
                        </button>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                            />
                            <div className="w-5 h-5 rounded-md border-2 border-slate-700 peer-checked:bg-sky-500 peer-checked:border-sky-500 transition-all flex items-center justify-center">
                                {dontShowAgain && <Check size={14} className="text-slate-950" strokeWidth={4} />}
                            </div>
                        </div>
                        <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors font-medium select-none">Don't show this recommendation again</span>
                    </label>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscoveryRecommendation;
