import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { LANGUAGES } from '../types';

interface TranslationInputProps {
    sourceLang: string;
    setSourceLang: (lang: string) => void;
    sourceText: string;
    setSourceText: (text: string) => void;
    onTranslate: () => void;
    onClear: () => void;
    autoTranslate: boolean;
}

export const TranslationInput: React.FC<TranslationInputProps> = ({
    sourceLang,
    setSourceLang,
    sourceText,
    setSourceText,
    onTranslate,
    onClear,
    autoTranslate
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(128, textareaRef.current.scrollHeight)}px`;
        }
    }, [sourceText]);

    return (
        <div className="bg-chat-bubble-light dark:bg-slate-700 rounded-[2rem] p-5 shadow-bubbly dark:shadow-none transition-all group focus-within:ring-2 focus-within:ring-accent-sky/50 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-800">
            <div className="flex items-center justify-between mb-3">
                <div className="relative group/dropdown">
                    <button className="flex items-center gap-1.5 text-accent-sky font-bold text-sm bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-600 shadow-sm transition-all">
                        {LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang}
                        <Icon name="expand_more" className="text-sm" />
                    </button>
                    <select
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>
                <div className="flex gap-1">
                    {sourceText && (
                        <button
                            aria-label="Clear"
                            className="p-2 text-accent-sky hover:text-white hover:bg-accent-sky rounded-full transition-colors"
                            onClick={onClear}
                        >
                            <Icon name="close" className="text-lg" />
                        </button>
                    )}
                </div>
            </div>
            <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none p-1 text-lg leading-relaxed text-text-dark dark:text-white placeholder-text-light/60 dark:placeholder-slate-400 focus:ring-0 resize-none min-h-[8rem] max-h-[40vh] overflow-y-auto font-medium scroll-smooth"
                placeholder="Type your message here..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                maxLength={5000}
            />
            <div className="flex justify-between items-end mt-2">
                <button aria-label="Mic" className="text-accent-sky hover:text-accent-coral transition-colors p-1">
                    <Icon name="mic" className="text-2xl" />
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-text-light dark:text-slate-300 font-bold bg-white/50 dark:bg-slate-600/50 px-2.5 py-1 rounded-lg">
                        {sourceText.length} / 5000
                    </span>

                    <button
                        className={`bg-accent-sky text-white rounded-full p-2 hover:bg-accent-sky/90 transition-all ${autoTranslate && sourceText ? 'opacity-0 pointer-events-none' : 'opacity-100 shadow-md'}`}
                        onClick={onTranslate}
                        title="Translate now"
                        disabled={!sourceText.trim()}
                    >
                        <Icon name="arrow_forward" className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    );
};
