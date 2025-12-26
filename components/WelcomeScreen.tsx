import React from 'react';
import { Share2, BrainCircuit, Orbit, Sparkles, ArrowRight } from 'lucide-react';
import { ExplorationMode } from '../types';

interface WelcomeScreenProps {
    onSelectMode: (mode: ExplorationMode) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectMode }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
                {/* Logo & Branding - matches App.tsx style */}
                <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="bg-sky-500/10 p-4 rounded-3xl border border-sky-500/20 mb-6 shadow-2xl shadow-sky-500/10 overflow-hidden relative">
                        <img
                            src="/icon.png"
                            alt="SEED Logo"
                            className="w-20 h-20 object-contain relative z-10"
                        />
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter text-white mb-2 selection:bg-sky-500">SEED</h1>
                    <p className="text-[10px] text-sky-400 uppercase tracking-[0.4em] font-bold">Shared Exploration & Emergent Discovery</p>
                </div>

                {/* Minimalist Selection */}
                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">

                    {/* Innovation Mode */}
                    <button
                        onClick={() => onSelectMode(ExplorationMode.INNOVATION)}
                        className="group relative flex flex-col items-center p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:border-sky-500/40 transition-all duration-500 hover:bg-slate-900/60"
                    >
                        <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <BrainCircuit size={32} className="text-sky-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Innovation Mode</h2>
                        <p className="text-sm text-slate-400 text-center leading-relaxed mb-6 px-4">
                            Build technologies, solve problems, and map breakthrough solutions.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            Enter Workspace <ArrowRight size={12} />
                        </div>
                    </button>

                    {/* Knowledge Mode */}
                    <button
                        onClick={() => onSelectMode(ExplorationMode.KNOWLEDGE)}
                        className="group relative flex flex-col items-center p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:border-indigo-500/40 transition-all duration-500 hover:bg-slate-900/60"
                    >
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Orbit size={32} className="text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Knowledge Discovery</h2>
                        <p className="text-sm text-slate-400 text-center leading-relaxed mb-6 px-4">
                            Explore history, research theories, and discover global interconnections.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            Enter Workspace <ArrowRight size={12} />
                        </div>
                    </button>

                </div>

                {/* Footer hint */}
                <p className="mt-12 text-slate-600 text-[10px] uppercase tracking-widest font-bold animate-in fade-in duration-1000 delay-500">
                    Select exploration mode to get started
                </p>
            </div>

            {/* Subtle bottom corner accent */}
            <div className="absolute bottom-0 right-0 p-8 opacity-20 pointer-events-none">
                <Sparkles size={120} className="text-sky-500/20 rotate-12" />
            </div>
        </div>
    );
};

export default WelcomeScreen;
