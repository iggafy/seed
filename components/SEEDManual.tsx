import React, { useState } from 'react';
import {
    X, HelpCircle, BrainCircuit, Orbit, Layers, Sparkles,
    Map, Zap, AlertCircle, Cpu, MessageSquare, Search,
    MousePointerClick, History, Binary, RefreshCw, ChevronRight,
    BookOpen, Lightbulb, CheckCircle2, ShieldCheck, GitMerge,
    History as HistoryIcon, Keyboard, Terminal, Globe,
    Activity, ArrowUpRight, Target, Shield, Fingerprint, Lock
} from 'lucide-react';
import { ExplorationMode, NodeType, AISettings } from '../types';
import { NODE_COLORS } from '../constants';

interface SEEDManualProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ExplorationMode;
    aiSettings?: AISettings;
}

const SEEDManual: React.FC<SEEDManualProps> = ({ isOpen, onClose, mode, aiSettings }) => {
    const [activeTab, setActiveTab] = useState<'welcome' | 'autonomous' | 'actions' | 'ontology' | 'shortcuts'>('welcome');

    if (!isOpen) return null;

    // System Status Logic
    const getSystemStatus = () => {
        if (!aiSettings) return "UNLINKED";
        const provider = aiSettings.provider;
        const key = aiSettings.providers[provider]?.apiKey;
        return key ? "READY" : "OFFLINE";
    };

    const isInnovation = mode === ExplorationMode.INNOVATION;

    // Content tailored by mode
    const modeSpecificTitle = isInnovation ? "Innovation Lattice" : "Knowledge Horizon";
    const modeDescription = isInnovation
        ? "Architect breakthrough solutions by mapping Technologies, Pain Points, and Risks. The AI acts as a **Pragmatic Strategist**, focusing on grounded feasibility and product synthesis."
        : "Connect historical events, people, and theories. The AI acts as a **Forensic Researcher**, uncovering hidden causalities and multidisciplinary interconnections across time.";

    const renderBoldText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            {/* Backdrop with heavy blur */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Main Container */}
            <div className="relative w-full max-w-6xl h-[85vh] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500">

                {/* Top Navigation Bar */}
                <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-sky-500/20 rounded-xl text-sky-400">
                                <Search size={20} />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">SEED Manual</h2>
                        </div>

                        <div className="h-4 w-px bg-white/10" />

                        <nav className="flex items-center gap-1">
                            {[
                                { id: 'welcome', label: 'Overview', icon: <Globe size={14} /> },
                                { id: 'autonomous', label: 'Autonomous', icon: <BrainCircuit size={14} /> },
                                { id: 'actions', label: 'AI Actions', icon: <Zap size={14} /> },
                                { id: 'ontology', label: 'Ontology', icon: <BookOpen size={14} /> },
                                { id: 'shortcuts', label: 'Keyboard', icon: <Keyboard size={14} /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id
                                        ? 'bg-white text-slate-950 shadow-lg shadow-white/10 scale-105'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all border border-white/5"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">

                    {/* 1. WELCOME / OVERVIEW SECTION */}
                    {activeTab === 'welcome' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="max-w-4xl">
                                <span className={`px-3 py-1 border rounded-full text-[10px] font-black tracking-[0.3em] uppercase mb-6 inline-block ${isInnovation ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                    {isInnovation ? 'Innovation Lattice Access' : 'Knowledge Horizon Access'}
                                </span>
                                <h1 className="text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                                    Map the <span className={isInnovation ? 'text-sky-500' : 'text-indigo-500'}>Unseen</span>.<br />
                                    Bypass the <span className="text-rose-500">Known</span>.
                                </h1>
                                <p className="text-xl text-slate-400 font-light leading-relaxed mb-12 max-w-2xl">
                                    {renderBoldText("SEED is a graph-based co-exploration engine designed for deep-tech research and **knowledge synthesis**. It combines autonomous AI agents with high-fidelity visual mapping to navigate complex possibility spaces.")}
                                </p>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className={`group bg-slate-800/30 border p-8 rounded-[3rem] transition-all ${isInnovation ? 'border-sky-500/30' : 'border-white/5 opacity-60'}`}>
                                        <div className={`p-4 rounded-2xl w-fit mb-6 ${isInnovation ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-900 text-slate-500'}`}>
                                            <BrainCircuit size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">Innovation Mode</h3>
                                        <p className="text-slate-400 leading-relaxed text-sm">
                                            {renderBoldText("Architect breakthrough solutions by mapping Technologies, Pain Points, and Risks. The AI acts as a **Pragmatic Strategist**, focusing on grounded feasibility and product synthesis.")}
                                        </p>
                                    </div>
                                    <div className={`group bg-slate-800/30 border p-8 rounded-[3rem] transition-all ${!isInnovation ? 'border-indigo-500/30' : 'border-white/5 opacity-60'}`}>
                                        <div className={`p-4 rounded-2xl w-fit mb-6 ${!isInnovation ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-500'}`}>
                                            <Orbit size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">Knowledge Discovery</h3>
                                        <p className="text-slate-400 leading-relaxed text-sm">
                                            {renderBoldText("Connect historical events, people, and theories. The AI acts as a **Forensic Researcher**, uncovering hidden causalities and multidisciplinary interconnections across time.")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. AUTONOMOUS CORE SECTION */}
                    {activeTab === 'autonomous' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">The Autonomous Pulse</h2>
                                <p className="text-slate-400 text-lg max-w-2xl font-light">
                                    {isInnovation
                                        ? "In Innovation Mode, the engine hunts for architectural breakthroughs and market gaps by balancing technical rigor with product intuition."
                                        : "In Knowledge Mode, the engine acts as an epistemic forensic tool, cross-referencing events to find deep causal relationships."}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-4 gap-4 mb-12">
                                {[
                                    { title: 'EXPLOIT', desc: isInnovation ? 'Refine existing nodes to maximize feasibility.' : 'Deepen current research path for primary facts.', icon: <Target className="text-emerald-400" /> },
                                    { title: 'EXPLORE', desc: isInnovation ? 'Push into the "Innovation Fog" for analogies.' : 'Scan for distant historical correlations.', icon: <Sparkles className="text-sky-400" /> },
                                    { title: 'PROBE', desc: isInnovation ? 'Stress-test constraints to find breaking points.' : 'Hunt for contradictions in historical accounts.', icon: <Shield className="text-rose-400" /> },
                                    { title: 'RE-ANCHOR', desc: 'Realignment pulse toward the North Star.', icon: <RefreshCw className="text-amber-400" /> },
                                ].map((step, i) => (
                                    <div key={i} className="bg-slate-800/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center text-center">
                                        <div className="p-3 bg-slate-900 rounded-2xl mb-4 shadow-xl">
                                            {step.icon}
                                        </div>
                                        <h4 className="text-sm font-black text-white tracking-widest uppercase mb-2">{step.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-8 rounded-[3rem]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Orbit className="text-amber-400 animate-spin-slow" size={24} />
                                        <h3 className="text-xl font-bold text-white">The North Star (Goal)</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        {renderBoldText("Select any node and **Set as Goal** to anchor the AI. Every discovery path will eventually be pulled toward this objective by the Re-Anchor pulse.")}
                                    </p>
                                    <div className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest border border-amber-500/20 rounded-xl p-3 bg-amber-500/5">
                                        SYSTEM EFFECT: PERSISTENT GRAVITY WELL
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 p-8 rounded-[3rem]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <ShieldCheck className="text-rose-400" size={24} />
                                        <h3 className="text-xl font-bold text-white">Laws of Physics (Constraints)</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        {renderBoldText(isInnovation
                                            ? "Mark nodes as **Laws** to define global boundaries (Budget, Energy, Regulation). The AI treats these as unbreakable rules during navigation."
                                            : "Mark nodes as **Laws** to enforce epistemic rigor (Primary Sources Only, Academic Fact, Temporal Contiguity).")}
                                    </p>
                                    <div className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest border border-rose-500/20 rounded-xl p-3 bg-rose-500/5">
                                        SYSTEM EFFECT: CONSTRAINT FIELD ACTIVE
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. AI ACTION SUITE SECTION */}
                    {activeTab === 'actions' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">AI Action Protocols</h2>
                                <p className="text-slate-400 text-lg max-w-2xl font-light">
                                    {renderBoldText(`Execute high-intent intelligence actions tailored for **${isInnovation ? 'Engineering' : 'Historical Analysis'}**.`)}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { title: isInnovation ? 'Synthesize' : 'Resolve Contradiction', desc: isInnovation ? 'Finds the "Third Option" to move past a contradiction.' : 'Reconciles conflicting accounts into a causal theory.', color: 'text-emerald-400', icon: <Fingerprint size={24} /> },
                                    { title: isInnovation ? 'Stress Test' : 'Reliability Check', desc: isInnovation ? 'Calculates the failure modes and hidden risks.' : 'Hunts for logical fallacies or missing evidence.', color: 'text-rose-400', icon: <AlertCircle size={24} /> },
                                    { title: isInnovation ? 'Optimization' : 'Pattern Recognition', desc: isInnovation ? 'Refines a technology for cost, speed, or sustainability.' : 'Identifies recurring motifs across different timelines.', color: 'text-sky-400', icon: <Cpu size={24} /> },
                                    { title: 'Directed Discovery', desc: 'Force the AI toward a specific question via the Sidebar.', color: 'text-amber-400', icon: <Target size={24} /> },
                                    { title: 'Lineage Trace', desc: 'Visualizes the deep causality path and parents.', color: 'text-violet-400', icon: <HistoryIcon size={24} /> },
                                    { title: 'Wiki Harvest', desc: 'Scrapes live Wikipedia to generate a grounding seed.', color: 'text-fuchsia-400', icon: <Search size={24} /> },
                                ].map((action, i) => (
                                    <div key={i} className="bg-slate-800/30 border border-white/5 p-8 rounded-[2.5rem] hover:bg-slate-800/50 transition-all">
                                        <div className={`${action.color} mb-6`}>{action.icon}</div>
                                        <h4 className="text-lg font-bold text-white mb-2">{action.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{action.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. ONTOLOGY SECTION */}
                    {activeTab === 'ontology' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Seed Ontology</h2>
                                <p className="text-slate-400 text-lg max-w-2xl font-light italic">
                                    Current Perspective: {modeSpecificTitle}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-4 gap-4">
                                {(isInnovation ? [
                                    { title: "Concept", desc: "Abstract ideas and theoretical breakthroughs.", type: NodeType.CONCEPT },
                                    { title: "Technology", desc: "Existing tools, hardware, or platforms.", type: NodeType.TECHNOLOGY },
                                    { title: "Problem", desc: "Technical bottlenecks or engineering gaps.", type: NodeType.PROBLEM },
                                    { title: "Pain Point", desc: "Real-world friction or market needs.", type: NodeType.PAIN_POINT },
                                    { title: "Innovation", desc: "Novel solutions that bridge needs.", type: NodeType.INNOVATION },
                                    { title: "Implementation", desc: "Practical products and applications.", type: NodeType.IMPLEMENTATION },
                                    { title: "User Segment", desc: "Personas and target audiences.", type: NodeType.USER_SEGMENT },
                                    { title: "Constraint/Law", desc: "Boundaries of the system's physics.", type: NodeType.CONSTRAINT },
                                ] : [
                                    { title: "Theory", desc: "Philosophies, laws, and frameworks.", type: NodeType.THEORY },
                                    { title: "Event", desc: "Historical occurrences and milestones.", type: NodeType.EVENT },
                                    { title: "Person", desc: "Influential historical figures.", type: NodeType.PERSON },
                                    { title: "Place", desc: "Geographic locations or civilizations.", type: NodeType.PLACE },
                                    { title: "Artifact", desc: "Physical objects or documents.", type: NodeType.ARTIFACT },
                                    { title: "Movement", desc: "Broad cultural or social shifts.", type: NodeType.MOVEMENT },
                                    { title: "Discovery", desc: "Scientific revelations.", type: NodeType.DISCOVERY },
                                    { title: "Context Law", desc: "Epistemic rules and source rigor.", type: NodeType.CONSTRAINT },
                                ]).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-slate-800/20 border border-white/5 p-5 rounded-[2rem] hover:bg-slate-800/40 transition-all">
                                        <div
                                            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10"
                                            style={{ backgroundColor: `${NODE_COLORS[item.type]}20`, color: NODE_COLORS[item.type] }}
                                        >
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: NODE_COLORS[item.type] }}></div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5. SHORTCUTS SECTION */}
                    {activeTab === 'shortcuts' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Command Center</h2>
                                <p className="text-slate-400 text-lg max-w-2xl font-light">
                                    Standardized interaction shortcuts for high-bandwidth exploration.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 bg-slate-950/40 border border-white/5 p-10 rounded-[3rem]">
                                {[
                                    { key: 'I', action: isInnovation ? 'Innovate Technology' : 'Synthesize theory' },
                                    { key: 'S', action: isInnovation ? 'Solve Problem' : 'Resolve tension' },
                                    { key: 'A', action: 'Answer Question' },
                                    { key: 'E', action: 'Quick Expand' },
                                    { key: 'T', action: 'Trace Lineage' },
                                    { key: 'SHIFT+CLICK', action: 'Multi-select for Synergy Analysis' },
                                    { key: 'DBL CLICK', action: 'Seed In (Nesting View)' },
                                    { key: 'DEL', action: 'Prune / Delete Seed' },
                                    { key: 'CTRL+Z / Y', action: 'Undo / Redo Action' },
                                    { key: 'SPACE', action: 'Reset Camera View' },
                                ].map((shortcut, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="text-sm text-slate-400 font-medium">{shortcut.action}</span>
                                        <kbd className="px-2.5 py-1 bg-slate-800 border-2 border-white/10 rounded-xl text-xs font-mono text-sky-400 shadow-inner">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Bottom Status Bar */}
                <div className="px-12 py-5 bg-slate-950/40 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-mono tracking-widest uppercase font-black">
                    <div className="flex items-center gap-4">
                        <Activity size={12} className={getSystemStatus() === 'OFFLINE' ? 'text-rose-500' : 'text-emerald-500'} />
                        <span>CORE_ENGINE_STATUS: {getSystemStatus() === 'READY' ? `READY [${aiSettings?.provider}]` : getSystemStatus()}</span>
                    </div>
                    <span>Shared Exploration & Emergent Discovery</span>
                </div>
            </div>
        </div>
    );
};

export default SEEDManual;
