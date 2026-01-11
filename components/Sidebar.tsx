import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { TranslationItem, ApiProtocol, Model } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  savedPhrases: TranslationItem[];
  history: TranslationItem[];
  onSelectPhrase: (item: TranslationItem) => void;
  onToggleSave: (item: TranslationItem) => void;
  onNewTranslation: () => void;
  autoTranslate: boolean;
  onToggleAutoTranslate: () => void;
  debounceTime: number;
  onChangeDebounceTime: (time: number) => void;
  apiKey: string;
  apiProtocol: ApiProtocol;
  onResetApiSettings: () => void;
  activeModelName: string;
  availableModels: Model[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  onDeleteModel: (e: React.MouseEvent, id: string) => void;
  onOpenAddModel: () => void;
}

type ViewState = 'menu' | 'saved' | 'history' | 'settings' | 'models';

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleDarkMode,
  savedPhrases,
  history,
  onSelectPhrase,
  onToggleSave,
  onNewTranslation,
  autoTranslate,
  onToggleAutoTranslate,
  debounceTime,
  onChangeDebounceTime,
  apiKey,
  apiBaseUrl,
  apiProtocol,
  onSaveApiSettings,
  onResetApiSettings,
  activeModelName,
  availableModels,
  selectedModel,
  onSelectModel,
  onDeleteModel,
  onOpenAddModel
}) => {
  // ... (keep existing state)
  const [view, setView] = useState<ViewState>('menu');
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localApiBaseUrl, setLocalApiBaseUrl] = useState(apiBaseUrl);
  const [localApiProtocol, setLocalApiProtocol] = useState<ApiProtocol>(apiProtocol);

  // Sync local state with props when sidebar opens or props change
  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(apiKey);
      setLocalApiBaseUrl(apiBaseUrl);
      setLocalApiProtocol(apiProtocol);
    }
  }, [isOpen, apiKey, apiBaseUrl, apiProtocol]);

  const handleClose = () => {
    onClose();
    // Reset view after animation finishes
    setTimeout(() => {
      setView('menu');
    }, 300);
  };

  // ... (keep existing helper functions)
  const handleNewTranslationClick = () => {
    onNewTranslation();
    handleClose();
  };

  const handleExport = () => {
    if (savedPhrases.length === 0) return;

    const dataStr = JSON.stringify(savedPhrases, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_translate_saved_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderPhraseList = (items: TranslationItem[], emptyMessage: string, icon: string) => (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* ... keep renderPhraseList content exactly as is ... */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('menu')}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon name="arrow_back" className="text-text-light dark:text-slate-400" />
          </button>
          <h3 className="font-bold text-text-dark dark:text-white capitalize">{view === 'saved' ? 'Saved Phrases' : view === 'models' ? 'AI Models' : view === 'settings' ? 'Settings' : 'History'}</h3>
        </div>
        {view === 'saved' && items.length > 0 && (
          <button
            onClick={handleExport}
            className="text-xs font-bold text-accent-sky hover:text-accent-coral transition-colors flex items-center gap-1 bg-accent-sky/10 px-2 py-1 rounded-lg"
            title="Export to JSON"
          >
            <Icon name="download" className="text-sm" />
            Export
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-10 text-text-light/50 dark:text-slate-500">
            <Icon name={icon} className="text-4xl mb-2 opacity-30" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl p-3 shadow-sm hover:border-accent-sky/30 transition-all group relative">
              <button
                className="w-full text-left"
                onClick={() => {
                  onSelectPhrase(item);
                  handleClose();
                }}
              >
                <div className="pr-8">
                  <div className="text-sm font-bold text-text-dark dark:text-white truncate mb-1">{item.sourceText}</div>
                  <div className="text-xs text-text-light dark:text-slate-300 truncate flex items-center gap-1">
                    <span className="opacity-50 text-[10px] uppercase border border-gray-200 dark:border-slate-500 rounded px-1">{item.targetLang}</span>
                    {item.targetText}
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(item);
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${savedPhrases.some(p => p.id === item.id)
                  ? 'text-accent-coral hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-300 hover:text-accent-coral hover:bg-gray-100 dark:hover:bg-slate-600'
                  }`}
              >
                <Icon name={savedPhrases.some(p => p.id === item.id) ? "bookmark" : "bookmark_border"} className="text-lg" filled={savedPhrases.some(p => p.id === item.id)} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ... keep Backdrop and sidebar structural divs ... */}
      <div
        className={`absolute inset-0 bg-slate-900/20 dark:bg-slate-900/50 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={handleClose}
      />

      <aside
        className={`absolute top-0 right-0 h-full w-[85%] max-w-[300px] bg-white dark:bg-slate-800 z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-6 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-coral flex items-center justify-center text-white shadow-sm">
              <Icon name="translate" className="text-lg" />
            </div>
            <h2 className="font-bold text-xl text-text-dark dark:text-white tracking-tight">Menu</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-text-light dark:text-slate-400 hover:text-text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-full"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {view === 'menu' ? (
          // ... keep menu view ...
          <nav className="flex-1 overflow-y-auto px-6 space-y-3">
            <button
              onClick={handleNewTranslationClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-accent-sky rounded-2xl border border-accent-sky/30 bg-accent-sky/5 hover:bg-accent-sky/10 transition-all group"
            >
              <Icon name="add_circle" className="text-xl" />
              <span className="font-bold text-sm">New Translation</span>
            </button>

            <button
              onClick={() => setView('models')}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-dark dark:text-slate-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group text-left"
            >
              <Icon name="auto_awesome" className="text-xl text-text-light dark:text-slate-400 group-hover:text-text-dark dark:group-hover:text-white transition-colors" />
              <div className="flex-1">
                <span className="font-medium text-sm block">AI Models</span>
                <span className="text-[10px] text-text-light dark:text-slate-400 block">{activeModelName}</span>
              </div>
            </button>

            <button
              onClick={() => setView('history')}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-dark dark:text-slate-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group text-left"
            >
              <Icon name="history" className="text-xl text-text-light dark:text-slate-400 group-hover:text-text-dark dark:group-hover:text-white transition-colors" />
              <span className="font-medium text-sm">Translation History</span>
            </button>

            <button
              onClick={() => setView('saved')}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-dark dark:text-slate-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group text-left"
            >
              <Icon name="bookmark_border" className="text-xl text-text-light dark:text-slate-400 group-hover:text-text-dark dark:group-hover:text-white transition-colors" />
              <span className="font-medium text-sm flex-1">Saved Phrases</span>
              {savedPhrases.length > 0 && (
                <span className="bg-accent-sky/10 text-accent-sky text-[10px] font-bold px-2 py-0.5 rounded-full">{savedPhrases.length}</span>
              )}
            </button>

            <button
              onClick={() => setView('settings')}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-dark dark:text-slate-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group text-left"
            >
              <Icon name="settings" className="text-xl text-text-light dark:text-slate-400 group-hover:text-text-dark dark:group-hover:text-white transition-colors" />
              <span className="font-medium text-sm">Settings</span>
            </button>
          </nav>
        ) : view === 'saved' ? (
          renderPhraseList(savedPhrases, "No saved phrases yet.", "bookmarks")
        ) : view === 'history' ? (
          renderPhraseList(history, "No history yet.", "history")
        ) : view === 'models' ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('menu')}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Icon name="arrow_back" className="text-text-light dark:text-slate-400" />
                </button>
                <h3 className="font-bold text-text-dark dark:text-white">AI Models</h3>
              </div>
              <button
                onClick={onOpenAddModel}
                className="p-2 bg-accent-sky/10 text-accent-sky rounded-full hover:bg-accent-sky hover:text-white transition-colors"
              >
                <Icon name="add" className="text-lg" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {availableModels.map(model => (
                <div key={model.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedModel === model.id ? 'bg-accent-sky/5 border-accent-sky/50 shadow-sm' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600 hover:border-accent-sky/30'}`}>
                  <button
                    className="flex-1 flex items-center gap-3 text-left"
                    onClick={() => {
                      onSelectModel(model.id);
                      handleClose();
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedModel === model.id ? 'bg-accent-sky text-white' : 'bg-gray-100 dark:bg-slate-600 text-text-light dark:text-slate-400'}`}>
                      <Icon name="auto_awesome" className="text-lg" />
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${selectedModel === model.id ? 'text-accent-sky' : 'text-text-dark dark:text-white'}`}>{model.name}</div>
                      <div className="text-[10px] text-text-light dark:text-slate-400 font-mono truncate max-w-[150px]">{model.id}</div>
                    </div>
                  </button>

                  {(model.isCustom || (availableModels.length > 1 && model.id !== 'deepseek-ai/DeepSeek-V3')) && (
                    <button
                      onClick={(e) => onDeleteModel(e, model.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Delete model"
                    >
                      <Icon name="delete" className="text-lg" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('menu')}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Icon name="arrow_back" className="text-text-light dark:text-slate-400" />
                </button>
                <h3 className="font-bold text-text-dark dark:text-white">Settings</h3>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Auto Translate Setting */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-accent-sky/10 rounded-lg text-accent-sky">
                      <Icon name="bolt" className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-dark dark:text-white text-sm">Auto-Translate</h4>
                      <p className="text-xs text-text-light dark:text-slate-400">Translate as you type</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={autoTranslate}
                      onChange={onToggleAutoTranslate}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-sky peer-checked:after:border-accent-sky"></div>
                  </label>
                </div>
              </div>

              {/* Debounce Delay Slider */}
              <div className={`transition-opacity duration-300 ${autoTranslate ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold text-text-dark dark:text-white text-sm">Input Delay</label>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-text-light dark:text-slate-300">{debounceTime}ms</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  value={debounceTime}
                  onChange={(e) => onChangeDebounceTime(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-sky"
                />
                <div className="flex justify-between mt-2 text-[10px] text-text-light dark:text-slate-500 font-medium uppercase tracking-wider">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>

              {/* Custom API Settings */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-accent-coral/10 rounded-lg text-accent-coral">
                    <Icon name="tune" className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark dark:text-white text-sm">Custom API</h4>
                    <p className="text-xs text-text-light dark:text-slate-400">Configure your own endpoint</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-light dark:text-slate-400 mb-1.5 uppercase tracking-wider">Protocol</label>
                    <div className="relative">
                      <select
                        value={localApiProtocol}
                        onChange={(e) => setLocalApiProtocol(e.target.value as ApiProtocol)}
                        className="w-full bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-text-dark dark:text-white focus:ring-2 focus:ring-accent-sky/50 focus:border-accent-sky outline-none transition-all appearance-none"
                      >
                        <option value="gemini">Google Gemini (Default)</option>
                        <option value="openai">OpenAI Compatible (DeepSeek, etc.)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-light dark:text-slate-400">
                        <Icon name="expand_more" className="text-lg" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-light dark:text-slate-400 mb-1.5 uppercase tracking-wider">API Key</label>
                    <input
                      type="password"
                      placeholder="Current defaults"
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-text-dark dark:text-white focus:ring-2 focus:ring-accent-sky/50 focus:border-accent-sky outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-light dark:text-slate-400 mb-1.5 uppercase tracking-wider">Base URL <span className="text-[10px] font-normal opacity-70 normal-case">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder={localApiProtocol === 'openai' ? "https://api.siliconflow.cn/v1" : "https://generativelanguage.googleapis.com"}
                      value={localApiBaseUrl}
                      onChange={(e) => setLocalApiBaseUrl(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-text-dark dark:text-white focus:ring-2 focus:ring-accent-sky/50 focus:border-accent-sky outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500"
                    />
                    {localApiProtocol === 'openai' && (
                      <p className="mt-1 text-[10px] text-accent-sky">For SiliconFlow/DeepSeek, usually ends in /v1</p>
                    )}
                  </div>

                  <button
                    onClick={() => onSaveApiSettings(localApiKey, localApiBaseUrl, localApiProtocol)}
                    className="w-full py-2.5 bg-accent-sky hover:bg-accent-sky/90 text-white rounded-xl font-bold text-sm shadow-md shadow-sky-100 dark:shadow-none transition-all active:scale-[0.98]"
                  >
                    Save API Settings
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-100 dark:border-slate-600"></div>
                    <span className="flex-shrink-0 mx-2 text-[10px] text-gray-300 dark:text-slate-500 uppercase tracking-widest font-bold">OR</span>
                    <div className="flex-grow border-t border-gray-100 dark:border-slate-600"></div>
                  </div>

                  <button
                    onClick={onResetApiSettings}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-text-light dark:text-slate-300 rounded-xl font-bold text-sm transition-all text-xs uppercase tracking-wide"
                  >
                    Reset to Server Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Active Model */}
        <div className="p-6 mt-auto">
          <div
            className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98] group"
            onClick={() => setView('models')}
            title="Click to change model"
          >
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-accent-sky shadow-sm group-hover:scale-110 transition-transform">
                  <Icon name="auto_awesome" className="text-lg" />
                </div>
                <div>
                  <div className="text-[10px] text-text-light dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Active Model</div>
                  <div className="text-sm font-bold text-text-dark dark:text-white leading-none truncate max-w-[120px]">{activeModelName}</div>
                </div>
              </div>
              <div className="relative">
                <Icon name="edit" className="text-gray-300 dark:text-slate-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-text-dark dark:text-white">
              <Icon name="dark_mode" className="text-xl" />
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                className="sr-only peer"
                checked={isDarkMode}
                onChange={onToggleDarkMode}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-text-dark peer-checked:after:border-text-dark"></div>
            </label>
          </div>
        </div>
      </aside>
    </>
  );
};