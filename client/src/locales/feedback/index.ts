import en from './en.json';
import ko from './ko.json';
import ja from './ja.json';
import zh from './zh.json';
import type { FeedbackTexts } from './types';
import type { Language } from '../../pages/HowItWorksPage';

export const feedbackTexts: Record<Language, FeedbackTexts> = {
  en,
  ko,
  ja,
  zh,
};

export * from './types';

