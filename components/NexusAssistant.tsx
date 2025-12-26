import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Plus, Network, Loader2, Sparkles, User, Bot, Trash2 } from 'lucide-react';
import { ChatMessage, GraphNode, AISuggestion, NodeType } from '../types';

interface NexusAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
    isProcessing: boolean;
    selectedNodes: GraphNode[];
    onProposeSeed: (suggestion: AISuggestion) => void;
    onClearChat: () => void;
}

const NexusAssistant: React.FC<NexusAssistantProps> = ({
    isOpen,
    onClose,
    messages,
    onSendMessage,
    isProcessing,
    selectedNodes,
    onProposeSeed,
    onClearChat
}) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isProcessing]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="fixed bottom-24 right-6 w-[450px] h-[600px] z-[100] flex flex-col bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                        <MessageSquare size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">Nexus Assistant</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {isProcessing ? 'Thinking...' : 'Ready'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClearChat}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Context Badge */}
            {selectedNodes.length > 0 && (
                <div className="px-4 py-2 bg-indigo-500/10 border-b border-white/5 flex items-center gap-2 overflow-hidden">
                    <Network size={12} className="text-indigo-400 flex-shrink-0" />
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider truncate">
                        Context: {selectedNodes.length} Node{selectedNodes.length > 1 ? 's' : ''} Selected ({selectedNodes.map(n => n.label).join(', ')})
                    </span>
                </div>
            )}

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
                {messages.length === 0 && !isProcessing && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                        <Bot size={48} className="text-slate-500 mb-4" />
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">
                            I am the Nexus. Select nodes on the graph to provide me context, or ask me for research guidance.
                        </p>
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in duration-300`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border 
              ${m.role === 'user'
                                ? 'bg-slate-800 border-white/10'
                                : 'bg-indigo-600/20 border-indigo-500/30'}`}
                        >
                            {m.role === 'user' ? <User size={14} className="text-slate-400" /> : <Bot size={14} className="text-indigo-400" />}
                        </div>

                        <div className="flex flex-col gap-2 max-w-[85%]">
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed transition-all
                ${m.role === 'user'
                                    ? 'bg-slate-800 text-slate-200 rounded-tr-none'
                                    : 'bg-slate-800/40 text-slate-300 border border-white/5 rounded-tl-none shadow-xl'}`}
                            >
                                {m.content}
                            </div>

                            {/* Proactive Suggestion Block */}
                            {m.suggestedNode && (
                                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-3 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Sparkles size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Research Insight</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white mb-1">{m.suggestedNode.label}</h4>
                                        <p className="text-[10px] text-slate-400 leading-normal">{m.suggestedNode.description}</p>
                                    </div>
                                    <button
                                        onClick={() => onProposeSeed(m.suggestedNode!)}
                                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={12} /> Add as Seed
                                    </button>
                                </div>
                            )}

                            <span className="text-[9px] text-slate-600 font-medium tracking-tighter self-end">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                            <Loader2 size={14} className="text-indigo-400 animate-spin" />
                        </div>
                        <div className="bg-slate-800/40 w-24 h-8 rounded-2xl border border-white/5 flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-slate-800/40">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isProcessing}
                        placeholder={selectedNodes.length > 0 ? "Ask about selected nodes..." : "Type a research inquiry..."}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all
              ${!input.trim() || isProcessing
                                ? 'bg-slate-800 text-slate-600'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NexusAssistant;
