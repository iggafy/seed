import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, Plus, ExternalLink, BookOpen, Quote, Calendar, User, Microscope } from 'lucide-react';
import { searchOpenAlex, OpenAlexWork } from '../services/scholarlyService';

interface NexusScholarlyBrowserProps {
    isOpen: boolean;
    initialQuery: string;
    onClose: () => void;
    onAddSeed: (snippet: string, paperTitle: string, metadata: any) => void;
    isProcessing: boolean;
}

const NexusScholarlyBrowser: React.FC<NexusScholarlyBrowserProps> = ({
    isOpen,
    initialQuery,
    onClose,
    onAddSeed,
    isProcessing
}) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState<OpenAlexWork[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedWork, setSelectedWork] = useState<OpenAlexWork | null>(null);
    const [selection, setSelection] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(true);

    // Draggable position
    const [pos, setPos] = useState({ x: 150, y: 150 });
    const [size, setSize] = useState({ width: 700, height: 750 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen && initialQuery) {
            setSearchQuery(initialQuery);
            handleSearch(initialQuery);
        }
    }, [isOpen, initialQuery]);

    const handleSearch = async (queryOverride?: string) => {
        const q = queryOverride || searchQuery;
        if (!q.trim()) return;
        setIsLoading(true);
        setSelectedWork(null);
        try {
            const data = await searchOpenAlex(q);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMouseUp = () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 5) {
            setShowHint(false);
            let text = sel.toString().trim();
            if (text.length > 500) {
                text = text.slice(0, 500) + "...";
            }
            setSelection(text);
        } else {
            setSelection(null);
        }
    };

    const startDrag = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
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
            className="fixed z-[300] bg-slate-900/95 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300"
            style={{
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height
            }}
        >
            {/* Header */}
            <div
                onMouseDown={startDrag}
                className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 cursor-move select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500">
                        <Microscope size={20} />
                    </div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest italic">OpenAlex Nexus</h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search papers, DOIs, authors..."
                            className="bg-slate-950/50 border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-xs text-white w-64 focus:w-80 focus:border-amber-500/50 transition-all outline-none"
                        />
                        <button
                            onClick={() => handleSearch()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <Search size={14} />
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                        <Loader2 size={32} className="text-amber-500 animate-spin mb-4" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">Syncing with OpenAlex...</span>
                    </div>
                )}

                {!selectedWork ? (
                    /* Results List */
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                        {results.length === 0 && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4">
                                <BookOpen size={48} />
                                <p className="text-sm font-medium tracking-wide">Enter a query to browse global research</p>
                            </div>
                        )}
                        {results.map((work) => (
                            <button
                                key={work.id}
                                onClick={() => setSelectedWork(work)}
                                className="w-full text-left p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group flex flex-col gap-3"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <h3 className="font-bold text-white group-hover:text-amber-400 leading-snug">{work.title}</h3>
                                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-black text-slate-300">{work.publication_year}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5"><User size={12} /> {work.authorships.length > 0 ? (work.authorships[0].author.display_name + (work.authorships.length > 1 ? ` et al.` : '')) : 'Unknown Author'}</div>
                                    {work.doi && <div className="flex items-center gap-1.5"><ExternalLink size={12} /> {work.doi.replace('https://doi.org/', '')}</div>}
                                </div>
                                {work.reconstructed_abstract && (
                                    <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
                                        {work.reconstructed_abstract}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Work Detail View */
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <button
                                onClick={() => setSelectedWork(null)}
                                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                &larr; Back to results
                            </button>
                            {selectedWork.primary_location?.landing_page_url && (
                                <a
                                    href={selectedWork.primary_location.landing_page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2"
                                >
                                    View Full Paper <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                        <div
                            onMouseUp={handleMouseUp}
                            className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-white/10"
                        >
                            <div className="max-w-2xl mx-auto">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-black text-white tracking-tighter leading-tight mb-6">
                                        {selectedWork.title}
                                    </h1>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                            <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Authors</span>
                                            <p className="text-sm font-bold text-white">
                                                {selectedWork.authorships.map(a => a.author.display_name).slice(0, 5).join(', ')}
                                                {selectedWork.authorships.length > 5 && ' et al.'}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                            <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Published</span>
                                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                                <Calendar size={14} className="text-amber-500" /> {selectedWork.publication_year}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                                        <Quote size={12} className="text-amber-500" /> Abstract
                                    </h4>
                                    <div className="text-slate-300 leading-relaxed text-sm lg:text-base space-y-4">
                                        {selectedWork.reconstructed_abstract ? (
                                            <p className="first-letter:text-4xl first-letter:font-black first-letter:text-amber-500 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                                                {selectedWork.reconstructed_abstract}
                                            </p>
                                        ) : (
                                            <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-slate-600">
                                                Abstract not available in OpenAlex metadata for this work.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedWork.concepts && selectedWork.concepts.length > 0 && (
                                    <div className="mt-12">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Thematic Concepts</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedWork.concepts.slice(0, 10).map(c => (
                                                <span key={c.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] text-slate-400 font-bold hover:border-amber-500/30 transition-colors">
                                                    {c.display_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Selection Slider */}
                <div
                    className={`absolute top-0 left-0 right-0 z-[60] transition-all duration-500 ease-out transform ${selection && !isProcessing ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
                >
                    <div className="bg-amber-500 text-slate-950 px-8 py-4 flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="p-2 bg-slate-900/10 rounded-lg">
                                <Plus size={20} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Harvest scholarly insight</span>
                                <p className="text-xs font-bold truncate italic">"{selection}"</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelection(null)}
                                className="px-4 py-2 hover:bg-black/5 rounded-lg text-xs font-black uppercase transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selection && selectedWork) {
                                        onAddSeed(selection, selectedWork.title, {
                                            doi: selectedWork.doi,
                                            authors: selectedWork.authorships.map(a => a.author.display_name),
                                            year: selectedWork.publication_year,
                                            url: selectedWork.primary_location?.landing_page_url
                                        });
                                    }
                                    setSelection(null);
                                }}
                                className="bg-slate-950 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all active:scale-95"
                            >
                                Assimilate Seed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hint */}
                {showHint && selectedWork && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-950/80 backdrop-blur-xl border border-amber-500/30 rounded-full px-6 py-3 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                            <div className="p-1 px-2 bg-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">Protocol</div>
                            <p className="text-xs text-slate-300 font-bold whitespace-nowrap">
                                Highlight abstract text to <span className="text-white">create a Literature Seed</span>
                            </p>
                            <button
                                onClick={() => setShowHint(false)}
                                className="ml-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-slate-950 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce font-black uppercase text-xs tracking-widest">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Nexus is Mapping Citations...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NexusScholarlyBrowser;
