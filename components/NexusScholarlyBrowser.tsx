import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, Plus, ExternalLink, BookOpen, Quote, Calendar, User, Microscope, ArrowLeft, Copy, Check } from 'lucide-react';
import { searchOpenAlex, getOpenAlexWork, OpenAlexWork } from '../services/scholarlyService';

interface NexusScholarlyBrowserProps {
    isOpen: boolean;
    initialQuery: string;
    initialWorkId?: string;
    onClose: () => void;
    onAddSeed: (snippet: string, paperTitle: string, metadata: any) => void;
    isProcessing: boolean;
}

const NexusScholarlyBrowser: React.FC<NexusScholarlyBrowserProps> = ({
    isOpen,
    initialQuery,
    initialWorkId,
    onClose,
    onAddSeed,
    isProcessing
}) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState<OpenAlexWork[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedWork, setSelectedWork] = useState<OpenAlexWork | null>(null);
    const [selection, setSelection] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'DATA' | 'WEB'>('DATA');
    const [copied, setCopied] = useState(false);
    const [showHint, setShowHint] = useState(true);

    // Draggable position
    const [pos, setPos] = useState({ x: 150, y: 150 });
    const [size, setSize] = useState({ width: 700, height: 750 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen) {
            if (initialWorkId) {
                // Load specific work directly
                loadSpecificWork(initialWorkId);
            } else if (initialQuery) {
                setSearchQuery(initialQuery);
                handleSearch(initialQuery);
            }
        } else {
            // Reset state on close
            setSelectedWork(null);
            setResults([]);
            setViewMode('DATA');
        }
    }, [isOpen, initialQuery, initialWorkId]);

    const loadSpecificWork = async (id: string) => {
        setIsLoading(true);
        try {
            const work = await getOpenAlexWork(id);
            if (work) {
                setSelectedWork(work);
                setSearchQuery(work.title);
            }
        } catch (e) {
            console.error("Failed to load specific paper", e);
        } finally {
            setIsLoading(false);
        }
    };

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
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('iframe')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        };
        const handleMouseUpGlobal = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUpGlobal);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }, [isDragging, dragStart]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{ perspective: '1000px' }}
        >
            <div
                className="pointer-events-auto bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300 transform"
                style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: size.width,
                    height: size.height,
                    boxShadow: isDragging ? '0 64px 256px rgba(0,0,0,0.9)' : '0 32px 128px rgba(0,0,0,0.8)',
                    scale: isDragging ? 1.02 : 1
                }}
            >
                {/* Drag Handle & Header */}
                <div
                    onMouseDown={startDrag}
                    className="p-6 border-b border-white/5 flex items-center justify-between cursor-move bg-slate-950/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Microscope className="text-amber-500" size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                OpenAlex Nexus
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 px-3 rounded-full border border-white/5 shadow-inner">
                            <Search size={14} className="text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search OpenAlex Universe..."
                                className="bg-transparent border-none outline-none text-xs text-white w-48 font-medium placeholder:text-slate-700"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/5 rounded-2xl text-slate-400 hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90"
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
                                    onClick={() => {
                                        setSelectedWork(null);
                                        setViewMode('DATA');
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    &larr; Back to results
                                </button>
                                <div className="flex items-center gap-2">
                                    {selectedWork.doi && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedWork.doi || '');
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className={`p-1.5 rounded-full border transition-all flex items-center gap-2 px-3 text-[9px] font-black uppercase tracking-widest ${copied ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                            title="Copy DOI"
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy DOI'}
                                        </button>
                                    )}
                                    {selectedWork.primary_location?.landing_page_url && (
                                        <button
                                            onClick={() => setViewMode(viewMode === 'DATA' ? 'WEB' : 'DATA')}
                                            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2"
                                        >
                                            {viewMode === 'DATA' ? (
                                                <>Read Full Paper <ExternalLink size={12} /></>
                                            ) : (
                                                <><ArrowLeft size={12} /> Back to Abstract</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {viewMode === 'DATA' ? (
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

                                        {selectedWork.reconstructed_abstract && (
                                            <div className="space-y-4">
                                                <h2 className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Abstract</h2>
                                                <p className="text-slate-300 leading-relaxed text-sm font-medium italic">
                                                    {selectedWork.reconstructed_abstract}
                                                </p>
                                            </div>
                                        )}

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
                            ) : (
                                <div className="flex-1 flex flex-col bg-slate-50 relative">
                                    <iframe
                                        src={selectedWork.primary_location?.landing_page_url}
                                        className="w-full h-full border-none"
                                        title="Full Paper"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
                                <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Harvest insight</span>
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
                                            id: selectedWork.id,
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
                {showHint && selectedWork && viewMode === 'DATA' && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-950/80 backdrop-blur-xl border border-amber-500/30 rounded-full px-6 py-3 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                            <div className="p-1 px-2 bg-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">Protocol</div>
                            <p className="text-xs text-slate-300 font-bold whitespace-nowrap">
                                Highlight text to <span className="text-white">harvest info and grow your space</span>
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
