import React, { useState } from 'react';
import { Icon } from './Icon';
import { TranslationItem } from '../types';

interface HistoryDrawerProps {
  history: TranslationItem[];
  savedPhrases: TranslationItem[];
  onSelect: (item: TranslationItem) => void;
  onToggleSave: (item: TranslationItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  history, 
  savedPhrases,
  onSelect, 
  onToggleSave,
  onClearHistory
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const handleToggle = (e: React.MouseEvent, item: TranslationItem) => {
    e.stopPropagation();
    onToggleSave(item);
  };

  const isSaved = (id: string) => savedPhrases.some(p => p.id === id);

  const filteredHistory = history.filter(item => 
    item.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.targetText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className={`absolute bottom-0 left-0 w-full bg-white dark:bg-slate-800 rounded-t-[2.5rem] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] z-30 transition-transform duration-300 ease-out transform ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-4rem)]'
      } peer border-t border-transparent dark:border-slate-700`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setShowClearConfirm(false); // Close confirmation when minimizing
      }}
    >
      <div 
        className="h-16 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-slate-800 rounded-t-[2.5rem] group relative"
        onClick={() => !showClearConfirm && setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full mb-2 group-hover:bg-accent-sky transition-colors"></div>
        <span className="text-xs font-bold text-text-light dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Icon name="history" className="text-base" />
          Recent History
        </span>
        
        {history.length > 0 && isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowClearConfirm(true);
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-text-light/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-slate-500 rounded-full transition-all"
            title="Clear All History"
          >
            <Icon name="delete_sweep" className="text-xl" />
          </button>
        )}
      </div>

      {showClearConfirm && (
        <div className="absolute inset-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-t-[2.5rem] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
           <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-3">
             <Icon name="delete_forever" className="text-2xl" />
           </div>
           <h3 className="text-lg font-bold text-text-dark dark:text-white mb-1">Clear History?</h3>
           <p className="text-sm text-text-light dark:text-slate-400 mb-6">This will remove all recent translations. Saved phrases will be kept.</p>
           <div className="flex gap-3 w-full max-w-xs">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 dark:bg-slate-700 text-text-dark dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-colors"
              >
                Yes, Clear All
              </button>
           </div>
        </div>
      )}
      
      <div className="px-5 pb-8 h-80 overflow-y-auto space-y-3 bg-white dark:bg-slate-800">
        
        {/* Search Input */}
        {history.length > 0 && (
          <div className="sticky top-0 bg-white dark:bg-slate-800 pt-2 pb-3 z-10">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/50 dark:text-slate-500 pointer-events-none">
                <Icon name="search" className="text-lg" />
              </span>
              <input 
                type="text" 
                placeholder="Search history..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-slate-900 border-none rounded-xl py-2.5 pl-10 pr-8 text-sm font-medium text-text-dark dark:text-white placeholder-text-light/50 dark:placeholder-slate-600 focus:ring-2 focus:ring-accent-sky/50 transition-shadow"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-light/50 hover:text-text-dark dark:text-slate-500 dark:hover:text-white rounded-full transition-colors"
                >
                  <Icon name="cancel" className="text-sm" filled />
                </button>
              )}
            </div>
          </div>
        )}

        {history.length === 0 ? (
           <div className="text-center py-10 text-text-light/50 dark:text-slate-500">
             <p className="text-sm">No recent translations</p>
           </div>
        ) : filteredHistory.length === 0 ? (
           <div className="text-center py-8 text-text-light/50 dark:text-slate-500">
             <Icon name="search_off" className="text-3xl mb-2 opacity-50" />
             <p className="text-sm">No matches found</p>
           </div>
        ) : (
          filteredHistory.map((item) => {
            const saved = isSaved(item.id);
            return (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-700 border border-transparent hover:border-accent-sky/20 hover:bg-chat-bubble-light dark:hover:bg-slate-600 transition-all group"
              >
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelect(item)}
                >
                  <div className="text-sm font-bold text-text-dark dark:text-white mb-0.5 group-hover:text-accent-sky transition-colors truncate flex items-center gap-2">
                    <span className="truncate">{item.sourceText}</span>
                  </div>
                  <div className="text-xs text-text-light dark:text-slate-400 truncate flex items-center gap-1">
                     <Icon name="subdirectory_arrow_right" className="text-sm opacity-50 flex-none" />
                     <span className="truncate">{item.targetText}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleToggle(e, item)}
                    className={`p-2 rounded-full transition-all flex-none ${saved ? 'text-accent-coral' : 'text-text-light/40 hover:text-accent-coral'}`}
                    aria-label={saved ? "Remove from saved" : "Save phrase"}
                    title={saved ? "Remove from saved" : "Save phrase"}
                  >
                    <Icon name="bookmark" className="text-lg" filled={saved} />
                  </button>

                  <button
                    onClick={(e) => handleCopy(e, item.targetText)}
                    className="p-2 text-text-light/60 dark:text-slate-400 hover:text-accent-sky hover:bg-white dark:hover:bg-slate-500 rounded-full transition-all flex-none opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Copy translation"
                    title="Copy translation"
                  >
                    <Icon name="content_copy" className="text-lg" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div className="h-8"></div>
      </div>
    </div>
  );
};