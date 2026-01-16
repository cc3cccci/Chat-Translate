import { useState, useEffect, useRef } from 'react';
import { TranslationItem, ModelType, ApiProtocol } from '../types';
import { translateText } from '../services/geminiService';

interface UseTranslationProps {
    apiKey: string;
    apiBaseUrl: string;
    apiProtocol: ApiProtocol;
    selectedModel: ModelType;
    autoTranslate: boolean;
    debounceTime: number;
    addToHistory: (item: TranslationItem) => void;
}

export const useTranslation = ({
    apiKey,
    apiBaseUrl,
    apiProtocol,
    selectedModel,
    autoTranslate,
    debounceTime,
    addToHistory
}: UseTranslationProps) => {
    const [sourceText, setSourceText] = useState("");
    const [targetText, setTargetText] = useState("");
    const [alternatives, setAlternatives] = useState<string[]>([]);
    const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
    const [sourceLang, setSourceLang] = useState("auto");
    const [targetLang, setTargetLang] = useState("en");
    const [status, setStatus] = useState<'idle' | 'translating' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        setStatus('translating');
        setErrorMessage("");
        setConfidenceScore(null);

        try {
            const result = await translateText(sourceText, sourceLang, targetLang, selectedModel, apiKey, apiBaseUrl, apiProtocol);

            if (result.error) {
                setStatus('error');
                setErrorMessage(result.error);
                return;
            }

            setTargetText(result.translation);
            setAlternatives(result.alternatives || []);
            setConfidenceScore(result.confidenceScore || null);
            setStatus('idle');

            // Add to history
            const newItem: TranslationItem = {
                id: Date.now().toString(),
                sourceText: sourceText,
                targetText: result.translation,
                alternatives: result.alternatives || [],
                sourceLang,
                targetLang,
                confidenceScore: result.confidenceScore,
                timestamp: Date.now()
            };

            addToHistory(newItem);

        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage("An unexpected error occurred.");
        }
    };

    const handleNewTranslation = () => {
        setSourceText("");
        setTargetText("");
        setAlternatives([]);
        setConfidenceScore(null);
        setStatus('idle');
        setErrorMessage("");
    };

    const swapLanguages = () => {
        if (sourceLang === 'auto') {
            setSourceLang(targetLang);
            setTargetLang('en');
        } else {
            setSourceLang(targetLang);
            setTargetLang(sourceLang);
        }
        setSourceText(targetText);
        setTargetText(sourceText);
        setAlternatives([]);
        setConfidenceScore(null);
    };

    // Debounce translation
    useEffect(() => {
        if (!sourceText || sourceText.trim().length === 0) {
            setTargetText("");
            setAlternatives([]);
            setConfidenceScore(null);
            setStatus('idle');
            setErrorMessage("");
            return;
        }

        if (autoTranslate) {
            const timer = setTimeout(() => {
                handleTranslate();
            }, debounceTime);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceText, sourceLang, targetLang, autoTranslate, debounceTime, apiKey, apiBaseUrl, apiProtocol]);

    return {
        sourceText,
        setSourceText,
        targetText,
        setTargetText,
        alternatives,
        setAlternatives,
        confidenceScore,
        setConfidenceScore,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
        status,
        setStatus,
        errorMessage,
        handleTranslate,
        handleNewTranslation,
        swapLanguages
    };
};
