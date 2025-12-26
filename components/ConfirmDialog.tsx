import React from 'react';
import { HelpCircle, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'warning'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white',
        warning: 'bg-amber-600/20 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white',
        info: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white'
    };

    const iconColors = {
        danger: 'text-red-400 bg-red-500/10 border-red-500/20',
        warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        info: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    };

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-500 shadow-red-900/20 hover:shadow-red-500/40',
        warning: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20 hover:shadow-amber-500/40',
        info: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 hover:shadow-indigo-500/40'
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 ${iconColors[type]}`}>
                        <HelpCircle size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-8">{message}</p>

                    <div className="flex w-full gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3.5 ${buttonColors[type]} text-white rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap`}
                        >
                            <Check size={18} className="shrink-0" />
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmDialog;
