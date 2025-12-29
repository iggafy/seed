import React, { useState } from 'react';
import {
    X, HelpCircle, BrainCircuit, Orbit, Layers, Sparkles,
    Map, Zap, AlertCircle, Cpu, MessageSquare, Search,
    MousePointerClick, History, Binary, RefreshCw, ChevronRight,
    BookOpen, Lightbulb, CheckCircle2, ShieldCheck, GitMerge,
    History as HistoryIcon, Keyboard, Terminal, Globe,
    Activity, ArrowUpRight, Target, Shield, Fingerprint, Lock,
    Maximize2, Plus, CornerDownRight, Microscope, Scan, MessageCircle, Info
} from 'lucide-react';
import { ExplorationMode, NodeType, AISettings } from '../types';
import { NODE_COLORS } from '../constants';

interface SEEDManualProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ExplorationMode;
    isPreSelection?: boolean;
    aiSettings?: AISettings;
    initialTab?: 'welcome' | 'autonomous' | 'protocols' | 'ontology' | 'shortcuts' | 'about';
}

const SEEDManual: React.FC<SEEDManualProps> = ({ isOpen, onClose, mode, isPreSelection, aiSettings, initialTab }) => {
    const [activeTab, setActiveTab] = useState<'welcome' | 'autonomous' | 'protocols' | 'ontology' | 'shortcuts' | 'about'>('welcome');

    React.useEffect(() => {
        if (isOpen && initialTab) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    // System Status Logic
    const getSystemStatus = () => {
        if (!aiSettings) return "UNLINKED";
        const provider = aiSettings.provider;
        const key = aiSettings.providers[provider]?.apiKey;
        return key ? "READY" : "OFFLINE";
    };

    const isInnovation = mode === ExplorationMode.INNOVATION;

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

                        <nav className="flex items-center gap-1 overflow-x-hidden overflow-y-visible pointer-events-auto p-1">
                            {[
                                { id: 'welcome', label: 'Overview', icon: <Globe size={14} /> },
                                { id: 'autonomous', label: 'Discovery', icon: <BrainCircuit size={14} /> },
                                { id: 'protocols', label: 'Protocols', icon: <Zap size={14} /> },
                                { id: 'ontology', label: 'Ontology', icon: <BookOpen size={14} /> },
                                { id: 'shortcuts', label: 'Keyboard', icon: <Keyboard size={14} /> },
                                { id: 'about', label: 'About', icon: <Info size={14} /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id
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
                                {!isPreSelection && (
                                    <span className={`px-3 py-1 border rounded-full text-[10px] font-black tracking-[0.3em] uppercase mb-6 inline-block ${isInnovation ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                        {isInnovation ? 'Innovation Mode Active' : 'Knowledge Mode Active'}
                                    </span>
                                )}
                                {isPreSelection && (
                                    <span className="px-3 py-1 border border-white/20 bg-white/5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase mb-6 inline-block text-slate-400">
                                        Exploration Architecture: Multi-Mode
                                    </span>
                                )}
                                <h1 className="text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                                    Map the <span className={!isPreSelection ? (isInnovation ? 'text-sky-500' : 'text-indigo-500') : 'text-white'}>Unseen</span>.<br />
                                    Bypass the <span className="text-rose-500">Known</span>.
                                </h1>
                                <p className="text-xl text-slate-400 font-light leading-relaxed mb-12 max-w-2xl">
                                    {renderBoldText("SEED is an interactive engine for **emergent discovery**. It transforms complex research into a visual journey, helping you grasp the big picture and discover connections the moment they happen.")}
                                </p>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className={`group bg-slate-800/30 border p-8 rounded-[3.5rem] transition-all hover:bg-slate-800/50 ${isInnovation || isPreSelection ? 'border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.1)]' : 'border-white/5 opacity-60'}`}>
                                        <div className={`p-4 rounded-2xl w-fit mb-6 ${isInnovation || isPreSelection ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-900 text-slate-500'}`}>
                                            <BrainCircuit size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">Innovation Mode</h3>
                                        <p className="text-slate-400 leading-relaxed text-sm">
                                            {renderBoldText("Experience **emergent innovation** as the AI proactively suggests breakthroughs and strategic paths, helping you brainstorm solutions to complex problems in real-time.")}
                                        </p>
                                    </div>
                                    <div className={`group bg-slate-800/30 border p-8 rounded-[3.5rem] transition-all hover:bg-slate-800/50 ${!isInnovation || isPreSelection ? 'border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-white/5 opacity-60'}`}>
                                        <div className={`p-4 rounded-2xl w-fit mb-6 ${!isInnovation || isPreSelection ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-500'}`}>
                                            <Orbit size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">Knowledge Mode</h3>
                                        <p className="text-slate-400 leading-relaxed text-sm">
                                            {renderBoldText("Master **emergent learning** by connecting the dots visually. Grasp and memorize complex topics through a gamified, interactive experience that reveals hidden interdisciplinary links.")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. DISCOVERY & AUTONOMOUS CORE */}
                    {activeTab === 'autonomous' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">The Autonomous Pulse</h2>
                                <p className="text-slate-400 text-lg max-w-3xl font-light">
                                    {renderBoldText("SEEDS are not static data. They are **Living Intelligence**. The Autonomous Engine uses a policy-driven cycle to map your workspace without constant supervision.")}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                                {[
                                    { title: 'Path Discovery', label: 'EXPLOIT', desc: 'The engine walks the existing graph to find missing links and inferred relationships between your Seeds.', icon: <Target className="text-emerald-400" /> },
                                    { title: 'Fog Expansion', label: 'EXPLORE', desc: 'The AI pushes into the "unknown" to suggest entirely new categories of information you haven\'t considered.', icon: <Sparkles className="text-sky-400" /> },
                                    { title: 'Constraint Probe', label: 'PROBE', desc: 'A stress-test pulse that hunts for frictions, bottlenecks, or logical contradictions in your theory.', icon: <Shield className="text-rose-400" /> },
                                    { title: 'North Star', label: 'RE-ANCHOR', desc: 'If active, the engine pulls all new discoveries toward your primary Goal Node.', icon: <RefreshCw className="text-amber-400" /> },
                                ].map((step, i) => (
                                    <div key={i} className="bg-slate-800/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-slate-800/60 transition-all">
                                        <div className="p-3 bg-slate-900 rounded-2xl mb-4 shadow-xl group-hover:scale-110 transition-transform">
                                            {step.icon}
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1">{step.label}</h4>
                                        <h4 className="text-sm font-bold text-white mb-2">{step.title}</h4>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Steering Section */}
                            <div className="mb-12 pt-8 border-t border-white/5">
                                <h3 className="text-2xl font-black text-white mb-6 tracking-tighter italic">Steering the Discovery</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-slate-800/20 border border-white/5 p-8 rounded-[3rem]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Target className="text-amber-400" size={24} />
                                            <h4 className="text-lg font-bold text-white uppercase tracking-tighter">Main Goal</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            {renderBoldText("Setting a Seed as your **Main Goal** defines the orbital center of your research. The Autonomous Discovery will prioritize paths that lead toward this objective, transforming a broad search into a high-precision quest.")}
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/20 border border-white/5 p-8 rounded-[3rem]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShieldCheck className="text-emerald-400" size={24} />
                                            <h4 className="text-lg font-bold text-white uppercase tracking-tighter">Laws (Constraints)</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed mb-4">
                                            {renderBoldText("Seeds explicitly marked with the **Law** type (Constraint) serve as global boundary conditions. We recommend creating them as **unlinked** nodes to maintain a clean 'policy layer' for the AI:")}
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="text-[11px] text-slate-500 leading-relaxed italic">
                                                <span className="text-rose-400 font-bold not-italic">Negative Constraints:</span> "A Law like 'Exclude Blockchain' or 'Exclude Quantum Mechanics' tells the AI to steer out of those territories."
                                            </li>
                                            <li className="text-[11px] text-slate-500 leading-relaxed italic">
                                                <span className="text-sky-400 font-bold not-italic">Positive Constraints:</span> "Laws like 'Focus on low-cost materials' or 'Only mobile-first technology' force the AI to filter all findings through those framework lenses."
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-8 mb-4 p-6 bg-slate-950/40 border border-white/5 rounded-3xl">
                                    <p className="text-slate-400 text-xs leading-relaxed text-center">
                                        {renderBoldText("**Strategic Note**: In **Innovation Mode**, applying Laws and a Main Goal ensures practical feasibility. Removing them enables unbounded **Blue-Sky Exploration**, though the engine may surface theoretical or futuristic technologies. In **Knowledge Mode**, we recommend no constraints to enable **Unconstrained Serendipity**, following natural lineages of history and concepts wherever they lead.")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="col-span-1 md:col-span-1 bg-slate-800/20 border border-white/5 p-8 rounded-[3rem]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Target className="text-sky-400" size={24} />
                                        <h3 className="text-xl font-bold text-white italic tracking-tight">Active Discovery</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                        {renderBoldText("Toggle the **Discovery Brain** in the toolbar. Once active, the AI will autonomously generate new nodes based on the **Gravity** of your current graph.")}
                                    </p>
                                    <div className="space-y-6 mt-4">
                                        <div className="border-l-2 border-sky-500/30 pl-4">
                                            <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2">Automated Policy Engine</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                {renderBoldText("The Discovery Brain is **Policy-Driven**. It dynamically oscillates between **Exploiting** your current ideas to find deep logic and **Exploring** lateral categories to prevent echo chambers.")}
                                            </p>
                                        </div>
                                        <div className="border-l-2 border-emerald-500/30 pl-4">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Contextual Personalization</h4>
                                            <div className="space-y-4">
                                                {(isInnovation || isPreSelection) && (
                                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                                        {renderBoldText("**Innovation Persona**: Acts as a **Pragmatic Architect**, prioritizing technical feasibility, market friction, and implementation bottlenecks.")}
                                                    </p>
                                                )}
                                                {(!isInnovation || isPreSelection) && (
                                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                                        {renderBoldText("**Knowledge Persona**: Acts as a **Forensic Historian**, prioritizing causal depth, primary source logic, and interdisciplinary weaving.")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/10 p-10 rounded-[3.5rem] flex flex-col justify-center">
                                    <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">The "Quest" Protocol</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        {renderBoldText("When Discovery is active and a node is **Selected**, the engine enters **Quest Mode**. It focuses all its parallel processing power on that single Seed, branching it out until it finds a breakthrough or meets a constraint.")}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border border-slate-900 bg-indigo-500/30 flex items-center justify-center text-[10px] text-white font-bold">{i}</div>)}
                                        </div>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Parallel Processing Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. ADVANCED PROTOCOLS (Action Suite) */}
                    {activeTab === 'protocols' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">SEED Protocols</h2>
                                <p className="text-slate-400 text-lg max-w-3xl font-light">
                                    {renderBoldText("Manually trigger high-intent AI actions to solve specific research problems or architect complex systems.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                                {[
                                    { icon: <Plus size={24} />, title: "The Expand", desc: "Select a node and click 'Expand' to generate 3-5 logically connected neighbors. Perfect for fast brainstorming." },
                                    { icon: <CornerDownRight size={24} />, title: "Directed Branching", desc: "Use the Sidebar 'Ask' field. Type a specific direction (e.g., 'How does this scale?') to force the AI to branch in that direction." },
                                    { icon: <GitMerge size={24} />, title: "Contextual Lineage", desc: "Toggle Lineage view to see a node's full family tree. Understand exactly which parent Seed triggered this discovery." },
                                    { icon: <Binary size={24} />, title: "Wormhole Seeds", desc: "Double-click any node to 'Seed In'. This creates a nested sub-graph inside that node, allowing for infinite depth." },
                                    { icon: <Globe size={24} />, title: "Wikipedia Nexus", desc: "Enter a URL or search term to harvest live web knowledge. SEED will summarize and ground new nodes in real-world facts." },
                                    { icon: <Scan size={24} />, title: "Trace Seed", desc: "A deep analysis that calculates the 'Epistemic Value' of a node, tracing its lineage back to the root theory." },
                                    { icon: <MessageCircle size={24} />, title: "Co-Research Chat", desc: "The sidebar chat isn't just for talking. Ask it to 'Add a node about X' or 'Optimize this connection' to update the graph directly." },
                                    { icon: <Microscope size={24} />, title: "Stress Test", desc: "Attempts to break your concept. Identifies failure modes, market risks, or historical inconsistencies." },
                                    { icon: <Zap size={24} />, title: "Synergy Analysis", desc: "Shift-click 2+ nodes and trigger Synergy. The AI will hunt for a 'Third Way' or a hidden connection between them." },
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-800/30 border border-white/5 p-8 rounded-[2.5rem] hover:bg-slate-800/50 hover:border-white/20 transition-all group">
                                        <div className="text-sky-400 mb-6 group-hover:scale-110 group-hover:text-white transition-all">{item.icon}</div>
                                        <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic mb-4">"{item.desc}"</p>
                                    </div>
                                ))}
                            </div>

                            {/* Wikipedia & Web Harvest Highlight */}
                            <div className="bg-gradient-to-br from-fuchsia-600/10 to-transparent border border-fuchsia-500/20 p-10 rounded-[3.5rem] flex flex-col md:flex-row gap-8 items-center">
                                <div className="p-6 bg-fuchsia-600/10 rounded-3xl text-fuchsia-400">
                                    <Globe size={48} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-white mb-3 italic tracking-tight underline decoration-fuchsia-500/50 decoration-4">The Wikipedia Nexus</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {renderBoldText("Bypass the search engine. Use the **Wiki Browser** inside SEED to find grounded information. Highlighting text in the browser allows you to instantly **Harvest** that context into new Seeds, complete with source metadata.")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. ONTOLOGY SECTION */}
                    {activeTab === 'ontology' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Seed Ontology</h2>
                                <p className="text-slate-400 text-lg max-w-2xl font-light italic">
                                    {isPreSelection ? "Showing all potential Seed types across both modes" : `Current Perspective: ${isInnovation ? "Innovation Mode" : "Knowledge Mode"}`}
                                </p>
                            </div>

                            <div className="space-y-12">
                                {/* Group 1: Innovation Suite */}
                                {(isPreSelection || isInnovation) && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400"><BrainCircuit size={20} /></div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Innovation Suite <span className="text-[10px] text-slate-500 not-italic ml-2 font-black tracking-widest">PRAGMATIC PRIMITIVES</span></h3>
                                        </div>
                                        <div className="grid md:grid-cols-4 gap-4">
                                            {[
                                                { title: "Concept", desc: "Theoretical breakthroughs.", type: NodeType.CONCEPT },
                                                { title: "Technology", desc: "Existing tools or frameworks.", type: NodeType.TECHNOLOGY },
                                                { title: "Problem", desc: "Technical bottlenecks.", type: NodeType.PROBLEM },
                                                { title: "Pain Point", desc: "User frustrations and needs.", type: NodeType.PAIN_POINT },
                                                { title: "Innovation", desc: "Novel bridging solutions.", type: NodeType.INNOVATION },
                                                { title: "Implementation", desc: "Practical product applications.", type: NodeType.IMPLEMENTATION },
                                                { title: "User Segment", desc: "Target audiences & personas.", type: NodeType.USER_SEGMENT },
                                                { title: "Constraint", desc: "System/Systemic boundaries.", type: NodeType.CONSTRAINT },
                                                { title: "Friction", desc: "Adoption or efficiency drag.", type: NodeType.FRICTION },
                                                { title: "Market", desc: "Economic & business drivers.", type: NodeType.MARKET },
                                                { title: "Regulation", desc: "Policy and legal context.", type: NodeType.REGULATION },
                                                { title: "Ethics", desc: "Moral & societal impact.", type: NodeType.ETHICS },
                                                { title: "Mental Model", desc: "Assumptions being challenged.", type: NodeType.MENTAL_MODEL },
                                                { title: "Analogy", desc: "Cross-disciplinary parallels.", type: NodeType.ANALOGY },
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col gap-4 bg-slate-800/20 border border-white/5 p-6 rounded-[2.5rem] hover:bg-slate-800/40 transition-all group">
                                                    <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${NODE_COLORS[item.type]}20`, color: NODE_COLORS[item.type] }}>
                                                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: NODE_COLORS[item.type] }}></div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                                                        <p className="text-[10px] text-slate-500 leading-normal uppercase font-black tracking-widest">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Group 2: Knowledge Suite */}
                                {(isPreSelection || !isInnovation) && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-700">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><Orbit size={20} /></div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Knowledge Suite <span className="text-[10px] text-slate-500 not-italic ml-2 font-black tracking-widest">EPISTEMIC PRIMITIVES</span></h3>
                                        </div>
                                        <div className="grid md:grid-cols-4 gap-4">
                                            {[
                                                { title: "Theory", desc: "Philosophies & frameworks.", type: NodeType.THEORY },
                                                { title: "Event", desc: "Historical occurrences.", type: NodeType.EVENT },
                                                { title: "Person", desc: "Influential figures.", type: NodeType.PERSON },
                                                { title: "Place", desc: "Geography & civilizations.", type: NodeType.PLACE },
                                                { title: "Artifact", desc: "Physical objects or records.", type: NodeType.ARTIFACT },
                                                { title: "Movement", desc: "Cultural or social shifts.", type: NodeType.MOVEMENT },
                                                { title: "Discovery", desc: "Scientific revelations.", type: NodeType.DISCOVERY },
                                                { title: "Contradiction", desc: "Conflicting accounts & debates.", type: NodeType.CONTRADICTION },
                                                { title: "Relationship", desc: "Inter-entity connections.", type: NodeType.RELATIONSHIP },
                                                { title: "Question", desc: "Open research inquiries.", type: NodeType.QUESTION },
                                                { title: "Entity", desc: "Organizations or groups.", type: NodeType.ENTITY },
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col gap-4 bg-slate-800/20 border border-white/5 p-6 rounded-[2.5rem] hover:bg-slate-800/40 transition-all group">
                                                    <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${NODE_COLORS[item.type]}20`, color: NODE_COLORS[item.type] }}>
                                                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: NODE_COLORS[item.type] }}></div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                                                        <p className="text-[10px] text-slate-500 leading-normal uppercase font-black tracking-widest">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. SHORTCUTS SECTION */}
                    {activeTab === 'shortcuts' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="mb-12">
                                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">High-Bandwidth Control</h2>
                                <p className="text-slate-400 text-lg max-w-2xl font-light">
                                    Standardized keyboard interaction for the professional explorer.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 bg-slate-950/40 border border-white/5 p-12 rounded-[4rem]">
                                {[
                                    { key: 'I', action: isInnovation ? 'Trigger Innovation Pulse' : 'Synthesize research' },
                                    { key: 'S', action: isInnovation ? 'Solve Bottleneck' : 'Resolve tension' },
                                    { key: 'A', action: 'Answer Node Question' },
                                    { key: 'E', action: 'Quick Expand (1 Depth)' },
                                    { key: 'T', action: 'Trace Full Lineage' },
                                    { key: 'M', action: 'Toggle Manual' },
                                    { key: 'SHIFT+CLICK', action: 'Multi-select for Analysis' },
                                    { key: 'DBL CLICK', action: 'Seed In (Sub-Graph View)' },
                                    { key: 'DEL', action: 'Prune / Delete' },
                                    { key: 'CTRL+Z', action: 'Undo Protocol' },
                                    { key: 'SPACE', action: 'Recenter Graph' },
                                ].map((shortcut, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center">
                                                <Target size={12} className="text-sky-500" />
                                            </div>
                                            <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">{shortcut.action}</span>
                                        </div>
                                        <kbd className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs font-mono text-sky-400 shadow-[0_4px_0_rgba(0,0,0,0.3)] min-w-[40px] text-center">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 6. ABOUT / SYSTEM SECTION */}
                    {activeTab === 'about' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="max-w-4xl text-center mx-auto py-12">
                                <div className="mb-12 flex justify-center">
                                    <div className="p-8 bg-sky-500/10 rounded-[3rem] border border-sky-500/20 shadow-2xl shadow-sky-500/10 group hover:scale-105 transition-transform duration-500">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full animate-pulse"></div>
                                            <img
                                                src="icon.png"
                                                alt="SEED Logo"
                                                className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter italic">SEED</h2>
                                <p className="text-sky-400 font-bold tracking-[0.4em] uppercase text-xs mb-8">Shared Exploration & Emergent Discovery</p>

                                <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-800/50 border border-white/10 rounded-full text-slate-400 mb-12">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] uppercase font-black tracking-widest">Version 1.0.0 (Stable)</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
                                    <div className="bg-slate-950/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center group hover:bg-slate-900/60 transition-all">
                                        <div className="p-3 bg-slate-900 rounded-xl mb-4 text-sky-400 group-hover:scale-110 transition-transform">
                                            <Fingerprint size={24} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1">Author</h4>
                                        <p className="text-lg font-bold text-white tracking-tight">Igga Fitzsimons</p>
                                    </div>
                                    <div className="bg-slate-950/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center group hover:bg-slate-900/60 transition-all">
                                        <div className="p-3 bg-slate-900 rounded-xl mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                                            <Globe size={24} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1">Updates</h4>
                                        <a
                                            href="https://github.com/iggafy/seed/releases"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-lg font-bold text-white tracking-tight hover:text-sky-400 transition-colors"
                                        >
                                            Github
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Status Bar */}
                <div className="px-12 py-5 bg-slate-950/40 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-mono tracking-widest uppercase font-black">
                    <div className="flex items-center gap-4">
                        <Activity size={12} className={getSystemStatus() === 'OFFLINE' ? 'text-rose-500' : 'text-emerald-500'} />
                        <span>STATUS: {getSystemStatus() === 'READY' ? `READY [${aiSettings?.provider}]` : getSystemStatus()}</span>
                    </div>
                    <span>Shared Exploration & Emergent Discovery</span>
                </div>
            </div >
        </div >
    );
};

export default SEEDManual;
