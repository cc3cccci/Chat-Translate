/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { ApiProtocol } from '../types';

let ai: GoogleGenAI | null = null;
let currentApiKey: string = '';

// Helper to safely get env var
const getEnvApiKey = () => {
  // Check for Vite env
  if (import.meta.env && import.meta.env.VITE_API_KEY) {
    return import.meta.env.VITE_API_KEY;
  }
  // Check for process.env (legacy/docker build time) - safeguard against ReferenceError
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // ignore
  }
  return '';
};

const getAI = (apiKey?: string) => {
  // If a specific key is provided and it's different, or if we haven't initialized
  if (apiKey && apiKey !== currentApiKey) {
    ai = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  } else if (!ai) {
    // Fallback to env key
    const envKey = getEnvApiKey();
    if (envKey) {
      ai = new GoogleGenAI({ apiKey: envKey });
      currentApiKey = envKey;
    }
  }
  return ai;
};

export interface TranslationResult {
  translation: string;
  alternatives: string[];
  confidenceScore?: number;
  error?: string;
}

const translateWithOpenAI = async (
  text: string,
  prompt: string, // We'll just use the prompt as system/user message combo for simplicity or structure it properly
  model: string,
  apiKey: string,
  baseUrl: string
): Promise<TranslationResult> => {
  // Default to OpenAI standard if no custom URL
  const cleanBaseUrl = (baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const url = `${cleanBaseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "You are a professional translator. Output valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" } // Force JSON if supported, otherwise prompt handles it
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    // Sanitize URL to hide key for display, just in case
    // Ensure we don't leak the key if it was in the URL (it's not for OpenAI usually, but good practice)
    throw new Error(`OpenAI API Error ${response.status}: ${errText} \nRequested URL: ${url}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("Empty response from OpenAI API");
  return JSON.parse(content) as TranslationResult;
}

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  modelName: string = 'gemini-2.0-flash-exp',
  customApiKey?: string,
  customBaseUrl?: string,
  apiProtocol: ApiProtocol = 'gemini'
): Promise<TranslationResult> => {
  if (!text.trim()) return { translation: "", alternatives: [] };

  const prompt = `You are a professional translator. Translate the following text from ${sourceLang === 'auto' ? 'the detected language' : sourceLang} to ${targetLang}.
  
  Text to translate:
  "${text}"
  
  Please provide:
  1. The primary translation.
  2. A list of 1-3 synonyms, alternative phrasings, or related expressions **exclusively in English** (even if the target language is different). This is for an English learner to understand nuances.
  3. A confidence score (0.0 to 1.0) indicating how certain you are about the accuracy of the translation.
  
  Return the result as a JSON object with the following structure:
  {
    "translation": "string",
    "alternatives": ["string", "string"],
    "confidenceScore": number
  }`;

  try {
    // Standardize model name if needed, but respect input
    const model = modelName || (apiProtocol === 'openai' ? 'deepseek-ai/DeepSeek-V3' : 'gemini-2.0-flash-exp');

    // OpenAI Protocol Route
    if (apiProtocol === 'openai') {
      const apiKey = customApiKey || getEnvApiKey();
      if (!apiKey) throw new Error("API Key required for OpenAI compatible services");

      return await translateWithOpenAI(text, prompt, model, apiKey, customBaseUrl || "");
    }

    // Gemini Protocol Route (Default)
    if (customBaseUrl) {
      // Use custom Base URL with fetch
      const apiKey = customApiKey || getEnvApiKey();
      if (!apiKey) throw new Error("API Key required for Gemini custom API services"); // Added for clarity
      // Ensure base URL doesn't end with slash
      const baseUrl = customBaseUrl.replace(/\/$/, "");

      // Construct standard Gemini REST endpoint
      const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        // Sanitize URL to hide key for display, just in case, though usually valid to see for debug
        const safeUrl = url.replace(apiKey, 'HIDDEN_KEY');
        throw new Error(`Custom API Error ${response.status}: ${errText} \nRequested URL: ${safeUrl}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error("Empty response from custom API");
      return JSON.parse(textResponse) as TranslationResult;

    } else {
      // Use SDK
      const aiClient = getAI(customApiKey);
      if (!aiClient) throw new Error("API Key not configured");

      const response = await aiClient.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const textResponse = response.text?.trim();
      if (!textResponse) return { translation: "", alternatives: [], error: "Empty response from server." };

      return JSON.parse(textResponse) as TranslationResult;
    }

  } catch (error: any) {
    console.error("Translation error:", error);

    let errorMessage = "Could not translate. Please try again.";

    if (error instanceof Error) {
      const msg = error.message || "";
      if (msg.includes('400')) errorMessage = "Invalid request. Please check your text.";
      else if (msg.includes('401') || msg.includes('403')) errorMessage = "Access denied. Please check API configuration.";
      else if (msg.includes('429')) errorMessage = "Too many requests. Please wait a moment.";
      else if (msg.includes('500') || msg.includes('503')) errorMessage = "Gemini service is temporarily unavailable.";
      else if (msg.includes('SAFETY') || msg.includes('blocked')) errorMessage = "Translation flagged for safety reasons.";
      else if (msg.includes('fetch failed') || msg.includes('NetworkError')) errorMessage = "Network error. Please check your connection.";
      // Custom API error
      else if (msg.includes('Custom API Error') || msg.includes('OpenAI API Error')) errorMessage = msg;
    }

    return { translation: "", alternatives: [], error: errorMessage };
  }
};