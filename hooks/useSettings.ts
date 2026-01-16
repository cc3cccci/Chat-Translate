import { useState, useEffect } from 'react';
import { ApiProtocol } from '../types';
import { encryptData, decryptData } from '../utils/crypto';

export const useSettings = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
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

    const [apiBaseUrl, setApiBaseUrl] = useState(() => {
        const stored = localStorage.getItem("gemini_api_base_url");
        return stored !== null ? stored : (import.meta.env.VITE_API_BASE_URL as string) || "https://api.siliconflow.cn/v1";
    });

    const [apiProtocol, setApiProtocol] = useState<ApiProtocol>(() => {
        const stored = localStorage.getItem("api_protocol");
        return stored ? (stored as ApiProtocol) : (import.meta.env.VITE_API_PROTOCOL as ApiProtocol) || 'openai';
    });

    // If no local key, try env var (moved outside initializer to ensure fallback works)
    const finalApiKey = apiKey || (import.meta.env.VITE_API_KEY as string) || "";

    // Toggle Dark Mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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
        localStorage.setItem("api_protocol", newProtocol);
        setApiProtocol(newProtocol);
    };

    const handleResetApiSettings = () => {
        localStorage.removeItem("gemini_api_key");
        localStorage.removeItem("gemini_api_base_url");
        localStorage.removeItem("api_protocol");
        window.location.reload(); // Simplest way to ensure clean state from env vars
    };

    return {
        isDarkMode,
        toggleDarkMode,
        autoTranslate,
        setAutoTranslate,
        debounceTime,
        setDebounceTime,
        apiKey,
        finalApiKey,
        apiBaseUrl,
        apiProtocol,
        handleSaveApiSettings,
        handleResetApiSettings
    };
};
