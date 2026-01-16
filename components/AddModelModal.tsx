import React, { useState, useEffect } from 'react';

interface AddModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (id: string, name: string) => void;
}

export const AddModelModal: React.FC<AddModelModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [newModelId, setNewModelId] = useState("");
    const [newModelName, setNewModelName] = useState("");

    // Reset fields when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setNewModelId("");
            setNewModelName("");
        }
    }, [isOpen]);

    const handleAdd = () => {
        onAdd(newModelId, newModelName);
    };

    if (!isOpen) return null;

    return (
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
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-text-light dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!newModelId || !newModelName}
                        className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-accent-sky hover:bg-accent-sky/90 shadow-lg shadow-sky-100 dark:shadow-none transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        Add Model
                    </button>
                </div>
            </div>
        </div>
    );
};
