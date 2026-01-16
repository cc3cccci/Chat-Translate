import React from 'react';
import { Icon } from './Icon';
import { LANGUAGES } from '../types';

interface TranslationOutputProps {
    targetLang: string;
    setTargetLang: (lang: string) => void;
    targetText: string;
    status: 'idle' | 'translating' | 'error';
    errorMessage: string;
    confidenceScore: number | null;
    onRetry: () => void;
    isSaved: boolean;
    onToggleSave: () => void;
}

export const TranslationOutput: React.FC<TranslationOutputProps> = ({
    targetLang,
    setTargetLang,
    targetText,
    status,
    errorMessage,
    confidenceScore,
    onRetry,
    isSaved,
    onToggleSave
}) => {
    const handleCopy = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
        }
    };

    const handleSpeak = (text: string, lang: string) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(lang));
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="bg-chat-bubble-dark dark:bg-slate-700 rounded-[2rem] p-5 shadow-bubbly dark:shadow-none relative border border-white/50 dark:border-slate-600/50 min-h-[200px] flex flex-col transition-colors">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button className="flex items-center gap-1.5 text-text-dark dark:text-white font-bold text-sm bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-600 shadow-sm transition-all">
                            {LANGUAGES.find(l => l.code === targetLang)?.name || targetLang}
                            <Icon name="expand_more" className="text-sm" />
                        </button>
                        <select
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                        >
                            {LANGUAGES.filter(l => l.code !== 'auto').map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                    {/* Chinese Shortcut */}
                    <button
                        className={`text-xs font-bold px-2 py-1.5 rounded-lg border transition-colors ${targetLang === 'zh' ? 'bg-accent-sky text-white border-accent-sky' : 'border-accent-sky/30 text-accent-sky hover:bg-accent-sky/10 dark:text-accent-sky dark:hover:bg-accent-sky/20'}`}
                        onClick={() => setTargetLang('zh')}
                    >
                        Chinese
                    </button>
                </div>
                <div className="flex gap-1">
                    <button
                        className="p-2 text-text-light dark:text-slate-300 hover:text-white hover:bg-accent-coral rounded-full transition-colors"
                        title="Listen"
                        onClick={() => handleSpeak(targetText, targetLang)}
                    >
                        <Icon name="volume_up" className="text-lg" />
                    </button>
                    <button
                        className="p-2 text-text-light dark:text-slate-300 hover:text-white hover:bg-accent-coral rounded-full transition-colors"
                        title="Copy"
                        onClick={() => handleCopy(targetText)}
                    >
                        <Icon name="content_copy" className="text-lg" />
                    </button>
                    <button
                        className={`p-2 rounded-full transition-colors ${isSaved ? 'text-accent-coral bg-accent-coral/10 hover:bg-accent-coral/20' : 'text-text-light dark:text-slate-300 hover:text-white hover:bg-accent-coral'}`}
                        title={isSaved ? "Remove from saved" : "Save phrase"}
                        onClick={onToggleSave}
                        disabled={!targetText}
                    >
                        <Icon name="bookmark" className="text-lg" filled={isSaved} />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full p-1 text-lg leading-relaxed text-text-dark dark:text-white flex items-start min-h-[8rem] max-h-[40vh] overflow-y-auto scroll-smooth">
                {status === 'translating' ? (
                    <div className="w-full h-full flex items-center justify-center opacity-70 min-h-[8rem]">
                        <div className="flex flex-col items-center gap-2 text-text-light dark:text-slate-400 italic">
                            <Icon name="auto_awesome" className="text-3xl animate-pulse" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                ) : status === 'error' ? (
                    <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
                        <Icon name="error_outline" className="text-3xl text-red-400 mb-2" />
                        <span className="text-red-400 font-medium text-sm">{errorMessage || "Error translating text."}</span>
                        <button
                            className="mt-3 px-4 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            onClick={onRetry}
                        >
                            Try Again
                        </button>
                    </div>
                ) : targetText ? (
                    <span>{targetText}</span>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-light/30 dark:text-slate-400/30 italic">
                        Translation will appear here
                    </div>
                )}
            </div>

            {/* Target Footer with Confidence Score */}
            <div className="flex justify-end items-end mt-2 h-6">
                {status === 'idle' && targetText && confidenceScore !== null && (
                    <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 rounded-full px-3 py-1 backdrop-blur-sm animate-in fade-in zoom-in duration-300" title="Translation Confidence">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${confidenceScore > 0.85 ? 'bg-green-500' : confidenceScore > 0.6 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${confidenceScore * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-text-light dark:text-slate-300 tabular-nums">
                            {Math.round(confidenceScore * 100)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
