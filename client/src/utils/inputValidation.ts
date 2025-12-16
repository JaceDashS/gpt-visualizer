// 영어, 숫자, 공백, 기본 문장부호 (., ! ? ; : ' " ( ) -)만 허용
export const filterEnglishOnly = (text: string): string => {
  return text.replace(/[^a-zA-Z0-9\s.,!?;:'"()-]/g, '');
};
