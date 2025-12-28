import React, { useState, useEffect } from 'react';
import { Share2, BrainCircuit, Orbit, Sparkles, ArrowRight, Shield, ShieldCheck, Lock, Activity, ChevronDown, ChevronUp, FolderOpen, Settings2 } from 'lucide-react';
import { ExplorationMode, AISettings, AIProvider } from '../types';

interface WelcomeScreenProps {
    onSelectMode: (mode: ExplorationMode) => void;
    settings: AISettings;
    onUpdateSettings: (settings: AISettings) => void;
    onShowManual: () => void;
    onShowDashboard: () => void;
    hasSavedSeeds: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectMode, settings, onUpdateSettings, onShowManual, onShowDashboard, hasSavedSeeds }) => {
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [tempKey, setTempKey] = useState(settings.providers[settings.provider].apiKey);
    const [activeProvider, setActiveProvider] = useState<AIProvider>(settings.provider);

    // Deep sync state with props to prevent stale UI after loads
    useEffect(() => {
        setActiveProvider(settings.provider);
        setTempKey(settings.providers[settings.provider].apiKey);
    }, [settings.provider, settings.providers]);

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newKey = e.target.value;
        setTempKey(newKey);

        const newSettings = {
            ...settings,
            provider: activeProvider,
            providers: {
                ...settings.providers,
                [activeProvider]: {
                    ...settings.providers[activeProvider],
                    apiKey: newKey
                }
            }
        };
        onUpdateSettings(newSettings);
    };

    const handleProviderChange = (provider: AIProvider) => {
        setActiveProvider(provider);
        setTempKey(settings.providers[provider].apiKey);

        const newSettings = {
            ...settings,
            provider: provider
        };
        onUpdateSettings(newSettings);
    };

    const isKeyReady = settings.providers[activeProvider].apiKey.length > 5;

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 overflow-y-auto">
            {/* Subtle background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center p-8 md:p-12">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20 mb-4 shadow-2xl shadow-sky-500/10 overflow-hidden relative group">
                        <img
                            src="icon.png"
                            alt="SEED Logo"
                            className="w-12 h-12 md:w-16 md:h-16 object-contain relative z-10"
                        />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-1 selection:bg-sky-500">SEED</h1>
                    <p className="text-[9px] md:text-[10px] text-sky-400 uppercase tracking-[0.4em] font-black text-center">Shared Exploration & Emergent Discovery</p>
                </div>

                {/* Primary Actions: Navigation & Mode Selection */}
                <div className="w-full max-w-4xl flex flex-col items-center gap-8 md:gap-12">

                    {/* Dashboard Shortcut - Secondary Action */}
                    {hasSavedSeeds && (
                        <div className="w-full max-w-sm animate-in fade-in duration-1000 delay-200">
                            <button
                                onClick={onShowDashboard}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/10 transition-all group shadow-xl"
                            >
                                <FolderOpen size={16} className="text-sky-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Open Saved SeedSpace</span>
                            </button>
                        </div>
                    )}

                    {/* Mode Selection Grid - Primary Action */}
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">

                        {/* Innovation Mode Card */}
                        <button
                            onClick={() => onSelectMode(ExplorationMode.INNOVATION)}
                            className={`group relative flex flex-col items-center p-8 md:p-12 bg-slate-900/40 backdrop-blur-xl border rounded-[2.5rem] transition-all duration-500 hover:bg-slate-900/60 hover:-translate-y-1 shadow-2xl shadow-black/40 ${isKeyReady ? 'border-white/10 hover:border-sky-500/40 opacity-100' : 'border-white/5 opacity-50 grayscale pointer-events-none'}`}
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-sky-500/10 rounded-xl flex items-center justify-center mb-6 border border-sky-500/20 group-hover:scale-110 transition-transform duration-500">
                                <BrainCircuit size={28} className="text-sky-400" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight">Innovation Mode</h2>
                            <p className="text-xs md:text-sm text-slate-400 text-center leading-relaxed mb-6 px-4 font-light">
                                Build technologies and map potential product solutions.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 px-4 py-2 rounded-full border border-sky-500/20">
                                New Workspace <ArrowRight size={12} />
                            </div>
                        </button>

                        {/* Knowledge Mode Card */}
                        <button
                            onClick={() => onSelectMode(ExplorationMode.KNOWLEDGE)}
                            className={`group relative flex flex-col items-center p-8 md:p-12 bg-slate-900/40 backdrop-blur-xl border rounded-[2.5rem] transition-all duration-500 hover:bg-slate-900/60 hover:-translate-y-1 shadow-2xl shadow-black/40 ${isKeyReady ? 'border-white/10 hover:border-indigo-500/40 opacity-100' : 'border-white/5 opacity-50 grayscale pointer-events-none'}`}
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Orbit size={28} className="text-indigo-400" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight">Knowledge Mode</h2>
                            <p className="text-xs md:text-sm text-slate-400 text-center leading-relaxed mb-6 px-4 font-light">
                                Master emergent learning and discover hidden interdisciplinary links.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                                New Workspace <ArrowRight size={12} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Configuration & Meta - Footer Area */}
                <div className="mt-16 flex flex-col items-center gap-6 animate-in fade-in duration-1000 delay-700">

                    {/* AI Configuration Section */}
                    <div className="w-full max-w-sm">
                        {!showKeyInput ? (
                            <button
                                onClick={() => setShowKeyInput(true)}
                                className={`flex items-center gap-3 px-4 py-2 transition-all group rounded-full border ${isKeyReady ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}
                            >
                                <div className={`p-1 rounded-full transition-colors ${isKeyReady ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isKeyReady ? <ShieldCheck size={14} /> : <Lock size={14} />}
                                </div>
                                <span className="text-[9px] uppercase tracking-[0.2em] font-black">
                                    {isKeyReady ? `${activeProvider} Engine Configured` : 'Set Up AI Provider'}
                                </span>
                                <Settings2 size={12} className="opacity-40 group-hover:rotate-90 transition-transform" />
                            </button>
                        ) : (
                            <div className="bg-slate-900 border border-white/10 p-5 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/5 min-w-[320px]">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</span>
                                    <button onClick={() => setShowKeyInput(false)} className="text-slate-600 hover:text-white transition-colors">
                                        <ChevronUp size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {[AIProvider.GEMINI, AIProvider.OPENAI, AIProvider.DEEPSEEK].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => handleProviderChange(p)}
                                            className={`py-2 rounded-lg text-[9px] font-bold tracking-wider transition-all border ${activeProvider === p
                                                ? 'bg-white text-slate-950 border-white shadow-lg'
                                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={tempKey}
                                        onChange={handleKeyChange}
                                        placeholder={`Enter API Key`}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-mono"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {isKeyReady ? (
                                            <Activity size={16} className="text-emerald-500 animate-pulse" />
                                        ) : (
                                            <Shield size={16} className="text-slate-700" />
                                        )}
                                    </div>
                                </div>

                                <p className="mt-3 text-[8px] text-slate-600 text-center uppercase tracking-widest leading-relaxed">
                                    Your keys are strictly local and never leave your machine.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Manual Link */}
                    <button
                        onClick={onShowManual}
                        className="text-slate-500 hover:text-sky-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-colors group"
                    >
                        <span>SEED Documentation</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>

            {/* Subtle bottom corner accent */}
            <div className="fixed bottom-0 right-0 p-8 opacity-20 pointer-events-none">
                <Sparkles size={120} className="text-sky-500/20 rotate-12" />
            </div>
        </div>
    );
};

export default WelcomeScreen;
