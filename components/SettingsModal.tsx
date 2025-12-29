import React, { useState, useEffect } from 'react';
import { X, Save, Key, Cpu, Server } from 'lucide-react';
import { AISettings, AIProvider } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AISettings;
    onSave: (settings: AISettings) => void;
}

const PROVIDER_OPTIONS = [
    { value: AIProvider.GEMINI, label: 'Google Gemini', icon: Cpu },
    { value: AIProvider.OPENAI, label: 'OpenAI', icon: Server },
    { value: AIProvider.DEEPSEEK, label: 'DeepSeek', icon: Server },
];

const DEFAULT_MODELS: Record<AIProvider, string> = {
    [AIProvider.GEMINI]: 'gemini-3-flash-preview',
    [AIProvider.OPENAI]: 'gpt-4o',
    [AIProvider.DEEPSEEK]: 'deepseek-chat',
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<AISettings>(settings);

    // Sync when opening
    useEffect(() => {
        if (isOpen) setLocalSettings(settings);
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleProviderChange = (provider: AIProvider) => {
        setLocalSettings(prev => ({
            ...prev,
            provider
        }));
    };

    const handleUpdateActiveProviderSettings = (updates: Partial<{ apiKey: string, model: string }>) => {
        setLocalSettings(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [prev.provider]: {
                    ...prev.providers[prev.provider],
                    ...updates
                }
            }
        }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden ring-1 ring-white/5">

                {/* Header */}
                <div className="bg-slate-950/50 p-4 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Cpu size={18} className="text-sky-400" />
                        AI Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AI Provider</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PROVIDER_OPTIONS.map(opt => {
                                const Icon = opt.icon;
                                const isActive = localSettings.provider === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleProviderChange(opt.value)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2 ${isActive
                                            ? 'bg-sky-500/10 border-sky-500/50 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                                            : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                                            }`}
                                    >
                                        <Icon size={20} className={isActive ? 'text-sky-400' : 'opacity-50'} />
                                        <span className="text-xs font-medium">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex justify-between">
                            <span>API Key</span>
                            <span className="text-xs font-normal text-slate-600 normal-case">Stored locally in browser</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-slate-500">
                                <Key size={16} />
                            </div>
                            <input
                                type="password"
                                value={localSettings.providers[localSettings.provider]?.apiKey || ''}
                                onChange={(e) => handleUpdateActiveProviderSettings({ apiKey: e.target.value })}
                                placeholder={`Enter ${localSettings.provider} API Key...`}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Model Input (Advanced) */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Model Name</label>
                        <input
                            type="text"
                            value={localSettings.providers[localSettings.provider]?.model || DEFAULT_MODELS[localSettings.provider]}
                            onChange={(e) => handleUpdateActiveProviderSettings({ model: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                        />
                        <p className="text-[10px] text-slate-600">
                            Default: <span className="font-mono text-slate-500">{DEFAULT_MODELS[localSettings.provider]}</span>
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950/30 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-sky-900/20 hover:shadow-sky-500/30 transition-all flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Settings
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
