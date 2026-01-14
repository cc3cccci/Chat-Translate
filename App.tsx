import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Icon } from './components/Icon';
import { ScrollToTop } from './components/ScrollToTop';
import { LANGUAGES, TranslationItem, ModelType, Model, ApiProtocol } from './types';
import { translateText } from './services/geminiService';

import { encryptData, decryptData } from './utils/crypto';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en"); // Default to English
  const [status, setStatus] = useState<'idle' | 'translating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState<TranslationItem[]>([]);
  const [savedPhrases, setSavedPhrases] = useState<TranslationItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-2.0-flash-exp');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Model Management
  const [availableModels, setAvailableModels] = useState<Model[]>(() => {
    const saved = localStorage.getItem("available_models");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' }
    ];
  });
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");

  // Settings
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [debounceTime, setDebounceTime] = useState(800);
  const [apiKey, setApiKey] = useState(() => {
    const stored = localStorage.getItem("gemini_api_key");
    if (!stored) return "";
    // Try decrypting
    const decrypted = decryptData(stored);
    // If decryption yields empty but we had stored data, it might be old plain text or invalid
    // For backward compatibility during dev, if decryption fails (returns empty) but stored len > 0, 
    if (!decrypted && stored.startsWith("AIza")) return stored;
    return decrypted;
  });

  // If no local key, try env var (moved outside initializer to ensure fallback works)
  const finalApiKey = apiKey || (import.meta.env.VITE_API_KEY as string) || "";

  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    const stored = localStorage.getItem("gemini_api_base_url");
    return stored !== null ? stored : (import.meta.env.VITE_API_BASE_URL as string) || "";
  });

  const [apiProtocol, setApiProtocol] = useState<ApiProtocol>(() => {
    const stored = localStorage.getItem("api_protocol");
    return stored ? (stored as ApiProtocol) : (import.meta.env.VITE_API_PROTOCOL as ApiProtocol) || 'gemini';
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist Models
  useEffect(() => {
    localStorage.setItem("available_models", JSON.stringify(availableModels));
  }, [availableModels]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Debounce translation
  useEffect(() => {
    // Always clear target if source is empty
    if (!sourceText || sourceText.trim().length === 0) {
      setTargetText("");
      setAlternatives([]);
      setConfidenceScore(null);
      setStatus('idle');
      setErrorMessage("");
      return;
    }

    // Only auto-translate if enabled
    // Only auto-translate if enabled
    if (autoTranslate) {
      const timer = setTimeout(() => {
        handleTranslate();
      }, debounceTime);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText, sourceLang, targetLang, autoTranslate, debounceTime, finalApiKey, apiBaseUrl, apiProtocol]); // Trigger on changes

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(128, textareaRef.current.scrollHeight)}px`;
    }
  }, [sourceText]);

  const handleSaveApiSettings = (newKey: string, newUrl: string, newProtocol: ApiProtocol) => {
    // Encrypt and save key
    if (newKey) {
      const encrypted = encryptData(newKey);
      localStorage.setItem("gemini_api_key", encrypted);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
    setApiKey(newKey);

    // Save base URL
    if (newUrl) {
      localStorage.setItem("gemini_api_base_url", newUrl);
    } else {
      localStorage.removeItem("gemini_api_base_url");
    }
    setApiBaseUrl(newUrl);

    // Save Protocol
    setApiProtocol(newProtocol);
  };

  const handleResetApiSettings = () => {
    localStorage.removeItem("gemini_api_key");
    localStorage.removeItem("gemini_api_base_url");
    localStorage.removeItem("api_protocol");
    window.location.reload(); // Simplest way to ensure clean state from env vars
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setStatus('translating');
    setErrorMessage("");
    setConfidenceScore(null);

    try {
      // Use finalApiKey which includes env fallback
      const result = await translateText(sourceText, sourceLang, targetLang, selectedModel, finalApiKey, apiBaseUrl, apiProtocol);

      if (result.error) {
        setStatus('error');
        setErrorMessage(result.error);
        return;
      }

      setTargetText(result.translation);
      setAlternatives(result.alternatives || []);
      setConfidenceScore(result.confidenceScore || null);
      setStatus('idle');

      // Add to history if unique
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

      setHistory(prev => {
        // Simple duplicate check based on source text
        const exists = prev.some(h => h.sourceText === newItem.sourceText && h.targetLang === newItem.targetLang);
        if (exists) return prev;
        return [newItem, ...prev].slice(0, 20);
      });

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
      // Can't easily swap auto, usually implies setting source to current target
      setSourceLang(targetLang);
      setTargetLang('en'); // Default fallback
    } else {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }
    setSourceText(targetText);
    setTargetText(sourceText);
    // Clear alternatives and score when swapping
    setAlternatives([]);
    setConfidenceScore(null);
  };

  const handleCopy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      // Could add toast here
    }
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
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

  // Logic to save the current displayed translation
  const isCurrentSaved = savedPhrases.some(p =>
    p.sourceText === sourceText &&
    p.targetText === targetText &&
    p.targetLang === targetLang &&
    p.sourceText.trim() !== ""
  );

  const handleSaveCurrent = () => {
    if (!sourceText.trim() || !targetText.trim()) return;

    // Check if exactly this translation is already saved to get its ID
    const existingItem = savedPhrases.find(p =>
      p.sourceText === sourceText &&
      p.targetText === targetText &&
      p.targetLang === targetLang
    );

    if (existingItem) {
      handleToggleSave(existingItem);
    } else {
      const newItem: TranslationItem = {
        id: Date.now().toString(),
        sourceText,
        targetText,
        alternatives,
        sourceLang,
        targetLang,
        confidenceScore: confidenceScore || undefined,
        timestamp: Date.now()
      };
      handleToggleSave(newItem);
    }
  };

  const handleSelectHistoryItem = (item: TranslationItem) => {
    setSourceText(item.sourceText);
    setTargetText(item.targetText);
    setAlternatives(item.alternatives || []);
    setConfidenceScore(item.confidenceScore || null);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleAddModel = () => {
    if (!newModelId.trim() || !newModelName.trim()) return;

    setAvailableModels(prev => [...prev, { id: newModelId.trim(), name: newModelName.trim(), isCustom: true }]);
    setSelectedModel(newModelId.trim());
    setNewModelId("");
    setNewModelName("");
    setIsAddModelOpen(false);
  };

  const handleDeleteModel = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAvailableModels(prev => prev.filter(m => m.id !== id));
    if (selectedModel === id) {
      setSelectedModel(availableModels[0]?.id || 'gemini-2.0-flash-exp');
    }
  };

  return (
    <div className="w-full max-w-md h-full flex flex-col relative bg-white dark:bg-slate-800 shadow-2xl sm:rounded-[2.5rem] sm:my-4 sm:h-[calc(100vh-2rem)] overflow-hidden border-4 border-white dark:border-slate-800 ring-1 ring-gray-100/50 dark:ring-slate-700/50 transition-colors duration-300">

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        savedPhrases={savedPhrases}
        history={history}
        onSelectPhrase={(item) => {
          handleSelectHistoryItem(item);
          setSidebarOpen(false);
        }}
        onToggleSave={handleToggleSave}
        onNewTranslation={handleNewTranslation}
        autoTranslate={autoTranslate}
        onToggleAutoTranslate={() => setAutoTranslate(!autoTranslate)}
        debounceTime={debounceTime}
        onChangeDebounceTime={setDebounceTime}
        apiKey={apiKey}
        apiBaseUrl={apiBaseUrl}
        apiProtocol={apiProtocol}
        onSaveApiSettings={handleSaveApiSettings}
        onResetApiSettings={handleResetApiSettings}
        activeModelName={availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
        availableModels={availableModels}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onDeleteModel={handleDeleteModel}
        onOpenAddModel={() => {
          setSidebarOpen(false);
          setIsAddModelOpen(true);
        }}
      />

      {/* Header */}
      <header className="flex-none h-16 px-6 flex items-center justify-between z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 border-b border-gray-50 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-coral to-accent-sky flex items-center justify-center text-white shadow-md">
            <Icon name="translate" className="text-xl" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-text-dark dark:text-white">ChatTranslate</h1>
        </div>
        <button
          aria-label="Menu"
          className="p-2.5 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-text-light dark:text-slate-400 group cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        >
          <Icon name="menu" className="group-hover:text-accent-coral transition-colors" />
        </button>
      </header>

      {/* Model Selector */}


      {/* Add Model Modal */}
      {isAddModelOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-white/50 ring-1 ring-black/5">
            <h3 className="text-lg font-bold text-text-dark dark:text-white mb-4">Add AI Model</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-light dark:text-slate-400 mb-1.5 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gemini 1.5 Pro"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent-sky/50 outline-none text-text-dark dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-light dark:text-slate-400 mb-1.5 uppercase tracking-wider">Model ID</label>
                <input
                  type="text"
                  placeholder="e.g. gemini-1.5-pro"
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent-sky/50 outline-none text-text-dark dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModelOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-text-light dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModel}
                disabled={!newModelId || !newModelName}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-accent-sky hover:bg-accent-sky/90 shadow-lg shadow-sky-100 dark:shadow-none transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Add Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <ScrollToTop container={scrollContainer} />

      <main
        ref={setScrollContainer}
        className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32 flex flex-col gap-4 relative scroll-smooth"
      >

        {/* Source Card */}
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
                  onClick={() => { setSourceText(""); setTargetText(""); setAlternatives([]); }}
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
                onClick={handleTranslate}
                title="Translate now"
                disabled={!sourceText.trim()}
              >
                <Icon name="arrow_forward" className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="relative h-6 z-10 flex justify-center items-center">
          <button
            className="absolute w-14 h-14 bg-gradient-to-br from-accent-coral to-orange-400 text-white rounded-full shadow-lg shadow-orange-200 border-4 border-white dark:border-slate-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
            onClick={swapLanguages}
          >
            <Icon name="swap_vert" className="text-2xl group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Target Card */}
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
                className={`p-2 rounded-full transition-colors ${isCurrentSaved ? 'text-accent-coral bg-accent-coral/10 hover:bg-accent-coral/20' : 'text-text-light dark:text-slate-300 hover:text-white hover:bg-accent-coral'}`}
                title={isCurrentSaved ? "Remove from saved" : "Save phrase"}
                onClick={handleSaveCurrent}
                disabled={!targetText}
              >
                <Icon name="bookmark" className="text-lg" filled={isCurrentSaved} />
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
                  onClick={handleTranslate}
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

        {/* Synonyms / Alternatives Window */}
        {(alternatives.length > 0 || status === 'translating') && (
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
        )}

        <div className="h-10 w-full flex items-center justify-center text-xs text-text-light/40 dark:text-slate-500">
          <Icon name="bolt" className="text-sm mr-1 filled" /> Powered by Gemini
        </div>
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        history={history}
        savedPhrases={savedPhrases}
        onSelect={handleSelectHistoryItem}
        onToggleSave={handleToggleSave}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default App;