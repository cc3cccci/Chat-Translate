import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Icon } from './components/Icon';
import { ScrollToTop } from './components/ScrollToTop';
import { Header } from './components/Header';
import { TranslationInput } from './components/TranslationInput';
import { TranslationOutput } from './components/TranslationOutput';
import { AlternativesPanel } from './components/AlternativesPanel';
import { AddModelModal } from './components/AddModelModal';
import { TranslationItem } from './types';

import { useSettings } from './hooks/useSettings';
import { useModels } from './hooks/useModels';
import { useHistory } from './hooks/useHistory';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  // Hooks
  const {
    isDarkMode, toggleDarkMode,
    autoTranslate, setAutoTranslate,
    debounceTime, setDebounceTime,
    apiKey, finalApiKey, apiBaseUrl, apiProtocol,
    handleSaveApiSettings, handleResetApiSettings
  } = useSettings();

  const {
    selectedModel, setSelectedModel,
    availableModels, setAvailableModels, // setAvailableModels needed for Sidebar? Sidebar doesn't use it directly maybe? Wait, Sidebar probably doesn't need setAvailableModels.
    isAddModelOpen, setIsAddModelOpen,
    handleAddModel, handleDeleteModel
  } = useModels();

  const {
    history, savedPhrases,
    addToHistory, handleToggleSave, handleClearHistory
  } = useHistory();

  const {
    sourceText, setSourceText,
    targetText, setTargetText,
    alternatives, setAlternatives,
    confidenceScore, setConfidenceScore,
    sourceLang, setSourceLang,
    targetLang, setTargetLang,
    status, setStatus,
    errorMessage, setErrorMessage,
    handleTranslate, handleNewTranslation,
    swapLanguages
  } = useTranslation({
    apiKey: finalApiKey,
    apiBaseUrl,
    apiProtocol,
    selectedModel,
    autoTranslate,
    debounceTime,
    addToHistory
  });

  // Derived Logic
  const activeModelName = availableModels.find(m => m.id === selectedModel)?.name || selectedModel;

  const isCurrentSaved = savedPhrases.some(p =>
    p.sourceText === sourceText &&
    p.targetText === targetText &&
    p.targetLang === targetLang &&
    p.sourceText.trim() !== ""
  );

  const handleSaveCurrent = () => {
    if (!sourceText.trim() || !targetText.trim()) return;

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
    setSidebarOpen(false); // Close sidebar if open
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
        onSelectPhrase={handleSelectHistoryItem}
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
        activeModelName={activeModelName}
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
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Add Model Modal */}
      <AddModelModal
        isOpen={isAddModelOpen}
        onClose={() => setIsAddModelOpen(false)}
        onAdd={handleAddModel}
      />

      {/* Main Content */}
      <ScrollToTop container={scrollContainer} />

      <main
        ref={setScrollContainer}
        className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32 flex flex-col gap-4 relative scroll-smooth"
      >
        {/* Source Card */}
        <TranslationInput
          sourceLang={sourceLang}
          setSourceLang={setSourceLang}
          sourceText={sourceText}
          setSourceText={setSourceText}
          onTranslate={handleTranslate}
          onClear={handleNewTranslation}
          autoTranslate={autoTranslate}
        />

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
        <TranslationOutput
          targetLang={targetLang}
          setTargetLang={setTargetLang}
          targetText={targetText}
          status={status}
          errorMessage={errorMessage}
          confidenceScore={confidenceScore}
          onRetry={handleTranslate}
          isSaved={isCurrentSaved}
          onToggleSave={handleSaveCurrent}
        />

        {/* Synonyms / Alternatives Window */}
        <AlternativesPanel alternatives={alternatives} status={status} />

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