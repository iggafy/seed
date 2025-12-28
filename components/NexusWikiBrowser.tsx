import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ArrowLeft, ArrowRight, ExternalLink, Plus, Loader2, Maximize2, Minimize2, Move } from 'lucide-react';
import { getWikiFullHtml, searchWikipedia, WikiSearchResult } from '../services/wikipediaService';

interface NexusWikiBrowserProps {
    isOpen: boolean;
    initialTitle: string;
    onClose: () => void;
    onAddSeed: (snippet: string, pageTitle: string) => void;
    isProcessing: boolean;
}

const NexusWikiBrowser: React.FC<NexusWikiBrowserProps> = ({
    isOpen,
    initialTitle,
    onClose,
    onAddSeed,
    isProcessing
}) => {
    const [currentTitle, setCurrentTitle] = useState(initialTitle);
    const [html, setHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<WikiSearchResult[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showHint, setShowHint] = useState(true);

    // Draggable position
    const [pos, setPos] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 600, height: 700 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const contentRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && initialTitle) {
            loadPage(initialTitle);
        }
    }, [isOpen, initialTitle]);

    const loadPage = async (title: string, addToHistory = true) => {
        setIsLoading(true);
        setSelection(null);
        try {
            const content = await getWikiFullHtml(title);
            setHtml(content);
            setCurrentTitle(title);
            if (addToHistory) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(title);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            if (contentRef.current) contentRef.current.scrollTop = 0;
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        const results = await searchWikipedia(searchQuery);
        setSearchResults(results);
        setShowSearch(true);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            loadPage(prev, false);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            loadPage(next, false);
        }
    };

    // Handle internal link clicks
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link && contentRef.current?.contains(link)) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('/wiki/') && !href.includes(':')) {
                    const title = decodeURIComponent(href.replace('/wiki/', '')).replace(/_/g, ' ');
                    loadPage(title);
                } else if (href && href.startsWith('http')) {
                    window.open(href, '_blank');
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [history, historyIndex]);

    // Handle Text Selection
    const handleMouseUp = () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 5) {
            setShowHint(false);
            let text = sel.toString().trim();
            if (text.length > 300) {
                text = text.slice(0, 300) + "...";
            }
            setSelection(text);
        } else {
            setSelection(null);
        }
    };

    // Dragging Logic
    const startDrag = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    };

    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (isDragging) {
                setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
        };
        const stop = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', stop);
        }
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', stop);
        };
    }, [isDragging, dragStart]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed z-[300] bg-slate-900/90 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300"
            style={{
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height
            }}
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={startDrag}
                className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 cursor-move select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <button
                            onClick={handleBack}
                            disabled={historyIndex <= 0}
                            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 text-slate-400"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <button
                            onClick={handleForward}
                            disabled={historyIndex >= history.length - 1}
                            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 text-slate-400"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <h2 className="text-sm font-bold text-slate-200 truncate max-w-[200px]">
                        {isLoading ? "Loading..." : currentTitle}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search Wikipedia..."
                            className="bg-slate-950/50 border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-xs text-white w-48 focus:w-64 focus:border-sky-500/50 transition-all outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <Search size={14} />
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {/* Search Overlay */}
                {showSearch && (
                    <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Search Results</h3>
                            <button onClick={() => setShowSearch(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {searchResults.map(result => (
                                <button
                                    key={result.pageid}
                                    onClick={() => {
                                        loadPage(result.title);
                                        setShowSearch(false);
                                    }}
                                    className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all group"
                                >
                                    <h4 className="font-bold text-sky-400 group-hover:text-sky-300 mb-1">{result.title}</h4>
                                    <p className="text-xs text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: result.snippet }} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                        <Loader2 size={32} className="text-sky-500 animate-spin mb-4" />
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Accessing Knowledge...</span>
                    </div>
                )}

                {/* Wiki Content */}
                <div
                    ref={contentRef}
                    onMouseUp={handleMouseUp}
                    className="flex-1 overflow-y-auto p-8 prose prose-invert prose-sky max-w-none scrollbar-thin scrollbar-thumb-white/10"
                >
                    <div dangerouslySetInnerHTML={{ __html: html }} className="wiki-content" />
                </div>

                {/* Selection Drawer (Slides from header) */}
                <div
                    className={`absolute top-0 left-0 right-0 z-[40] transition-all duration-500 ease-out transform ${selection && !isProcessing ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
                >
                    <div className="bg-sky-600/90 backdrop-blur-xl border-b border-sky-400/30 px-6 py-3 flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Plus size={18} className="text-white" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] uppercase font-bold text-sky-100 tracking-widest flex items-center gap-1.5">
                                    Selected Insight {selection?.endsWith('...') && <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded uppercase font-black overflow-visible whitespace-nowrap">(Max 300 chars)</span>}
                                </span>
                                <p className="text-xs text-white truncate italic opacity-90">
                                    "{selection}"
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelection(null)}
                                className="px-3 py-2 text-sky-100 hover:text-white text-xs font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selection) onAddSeed(selection, currentTitle);
                                    setSelection(null);
                                }}
                                className="bg-white text-sky-600 px-5 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-sky-50 transition-all hover:-translate-y-0.5"
                            >
                                Grow Seed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Research Hint Banner */}
                {showHint && !isLoading && html && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-sky-500/30 rounded-full px-5 py-2 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10 group">
                            <div className="p-1 px-2 bg-sky-500/20 rounded-full text-[10px] font-bold text-sky-400 uppercase tracking-tighter">Tip</div>
                            <p className="text-[11px] text-slate-300 font-medium whitespace-nowrap">
                                Highlight any text to <span className="text-white font-bold">harvest it as a Seed</span>
                            </p>
                            <button
                                onClick={() => setShowHint(false)}
                                className="ml-1 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-pulse">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-bold">Nexus is assimilating context...</span>
                    </div>
                )}
            </div>

            {/* Global style for wiki content */}
            <style>{`
                .wiki-content { font-family: 'Outfit', 'Inter', sans-serif; color: #cbd5e1; }
                .wiki-content p { margin-bottom: 1.5em; line-height: 1.7; font-size: 0.95rem; }
                .wiki-content h1, .wiki-content h2, .wiki-content h3 { color: #fff; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.2em; font-weight: 700; }
                .wiki-content a { color: #38bdf8; text-decoration: none; border-bottom: 1px solid transparent; transition: all 0.2s; }
                .wiki-content a:hover { border-bottom-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
                
                /* Layout & Containers */
                .wiki-content .mw-empty-elt { display: none; }
                .wiki-content .infobox { float: right; margin: 0 0 1em 1em; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 20px; font-size: 0.8rem; max-width: 280px; backdrop-blur: 10px; }
                
                /* Thumbnails & Images */
                .wiki-content .thumb { clear: both; margin-bottom: 1.5em; overflow: hidden; }
                .wiki-content .tright { float: right; margin-left: 1.5em; }
                .wiki-content .tleft { float: left; margin-right: 1.5em; }
                .wiki-content .thumbinner { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 12px; text-align: center; overflow: hidden; }
                .wiki-content .thumbimage { border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; background: #fff; }
                .wiki-content .thumbcaption { font-size: 0.75rem; line-height: 1.4; padding: 8px 4px 4px; color: #94a3b8; text-align: left; }
                .wiki-content .magnify { display: none; }
                
                .wiki-content img { max-width: 100%; height: auto; border-radius: 4px; }
                .wiki-content figure { margin: 1em 0; border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); display: inline-block; max-width: 100%; }
                .wiki-content figcaption { font-size: 0.75rem; color: #94a3b8; margin-top: 8px; }

                /* Math & Misc */
                .wiki-content .mwe-math-element { overflow-x: auto; max-width: 100%; display: inline-block; vertical-align: middle; }
                .wiki-content .mwe-math-fallback-image-inline { filter: invert(0.9) hue-rotate(180deg); } /* Light math images to dark */
                .wiki-content table.ambox { display: none; }
                .wiki-content div.hatnote { font-style: italic; color: #94a3b8; font-size: 0.8rem; margin-bottom: 1em; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; }
                
                /* Tables */
                .wiki-content table:not(.infobox) { border-collapse: collapse; margin: 1em 0; width: 100%; font-size: 0.85rem; }
                .wiki-content table th, .wiki-content table td { border: 1px solid rgba(255,255,255,0.1); padding: 8px; }
                .wiki-content table th { background: rgba(255,255,255,0.05); }
            `}</style>
        </div>
    );
};

export default NexusWikiBrowser;
