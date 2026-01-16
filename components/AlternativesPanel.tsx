import React from 'react';
import { Icon } from './Icon';

interface AlternativesPanelProps {
    alternatives: string[];
    status: 'idle' | 'translating' | 'error';
}

export const AlternativesPanel: React.FC<AlternativesPanelProps> = ({ alternatives, status }) => {
    const handleCopy = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
        }
    };

    if (alternatives.length === 0 && status !== 'translating') return null;

    return (
        <div className={`rounded-2xl border-2 border-chat-bubble-light dark:border-slate-700 bg-white dark:bg-slate-700 p-4 transition-all duration-500 ${status === 'translating' ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-accent-sky uppercase tracking-wider">
                <Icon name="lightbulb" className="text-base" />
                <span>Alternatives & Synonyms</span>
            </div>
            <div className="space-y-2">
                {status === 'translating' ? (
                    <div className="h-4 w-3/4 bg-gray-100 dark:bg-slate-600 rounded animate-pulse"></div>
                ) : (
                    alternatives.map((alt, index) => (
                        <div key={index} className="text-sm text-text-light dark:text-slate-300 hover:text-text-dark dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 cursor-pointer transition-colors" onClick={() => handleCopy(alt)}>
                            {alt}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
