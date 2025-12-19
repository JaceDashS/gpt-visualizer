import en from './en.json';
import ko from './ko.json';
import ja from './ja.json';
import zh from './zh.json';
import type { Language } from '../../pages/HowItWorksPage';

export interface HowItWorksData {
  uiText: {
    title: string;
    prev: string;
    next: string;
  };
  steps: Array<{
    title: string;
    paragraphs: string[];
    boldTexts?: string[];
    links?: Array<{
      text: string;
      url: string;
    }>;
  }>;
}

export const howItWorksData: Record<Language, HowItWorksData> = {
  en,
  ko,
  ja,
  zh,
};

export * from './types';

