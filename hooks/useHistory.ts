import { useState } from 'react';
import { TranslationItem } from '../types';

export const useHistory = () => {
    const [history, setHistory] = useState<TranslationItem[]>([]);
    const [savedPhrases, setSavedPhrases] = useState<TranslationItem[]>([]);

    const addToHistory = (item: TranslationItem) => {
        setHistory(prev => {
            // Simple duplicate check based on source text and target lang
            const exists = prev.some(h => h.sourceText === item.sourceText && h.targetLang === item.targetLang);
            if (exists) return prev;
            return [item, ...prev].slice(0, 20);
        });
    };

    const handleToggleSave = (item: TranslationItem) => {
        setSavedPhrases(prev => {
            const isSaved = prev.some(p => p.id === item.id);
            if (isSaved) {
                return prev.filter(p => p.id !== item.id);
            } else {
                return [item, ...prev];
            }
        });
    };

    const handleClearHistory = () => {
        setHistory([]);
    };

    return {
        history,
        savedPhrases,
        addToHistory,
        handleToggleSave,
        handleClearHistory
    };
};
