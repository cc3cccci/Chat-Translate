export interface TranslationItem {
  id: string;
  sourceText: string;
  targetText: string;
  alternatives?: string[];
  sourceLang: string;
  targetLang: string;
  confidenceScore?: number;
  timestamp: number;
}

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
];

export interface Model {
  id: string;
  name: string;
  isCustom?: boolean;
}

export type ModelType = string;

export type ApiProtocol = 'gemini' | 'openai';