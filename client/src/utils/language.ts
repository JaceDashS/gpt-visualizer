import type { Language } from '../pages/HowItWorksPage';

// 브라우저 설정을 기반으로 앱에서 사용할 Language 코드로 매핑
export const detectUserLanguage = (): Language => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const raw = navigator.language || (navigator as any).userLanguage || 'en';
  const lower = raw.toLowerCase();

  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('zh')) return 'zh';

  // 기본값: en
  return 'en';
};


