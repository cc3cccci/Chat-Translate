import { useState, useEffect } from 'react';
import { Model, ModelType } from '../types';

export const useModels = () => {
    const [selectedModel, setSelectedModel] = useState<ModelType>('deepseek-ai/DeepSeek-V3');

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

    // Persist Models
    useEffect(() => {
        localStorage.setItem("available_models", JSON.stringify(availableModels));
    }, [availableModels]);


    const handleAddModel = (newModelId: string, newModelName: string) => {
        if (!newModelId.trim() || !newModelName.trim()) return;

        setAvailableModels(prev => [...prev, { id: newModelId.trim(), name: newModelName.trim(), isCustom: true }]);
        setSelectedModel(newModelId.trim());
        setIsAddModelOpen(false);
    };

    const handleDeleteModel = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setAvailableModels(prev => prev.filter(m => m.id !== id));
        if (selectedModel === id) {
            setSelectedModel(availableModels[0]?.id || 'gemini-2.0-flash-exp');
        }
    };

    return {
        selectedModel,
        setSelectedModel,
        availableModels,
        setAvailableModels,
        isAddModelOpen,
        setIsAddModelOpen,
        handleAddModel,
        handleDeleteModel
    };
};
