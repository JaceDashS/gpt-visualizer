export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  apiPrefix: process.env.REACT_APP_API_PREFIX || '/api',
  timeout: 10000, // 10초
} as const;

export const API_BASE_URL = API_CONFIG.baseURL;
export const API_PREFIX = API_CONFIG.apiPrefix;

// GitHub Assets 설정
const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_BASE_URL || '';
export const ASSETS_CONFIG = {
  baseURL: ASSETS_BASE_URL,
  profileImage: `${ASSETS_BASE_URL}/img/profile.jpg`,
  profileOverview: `${ASSETS_BASE_URL}/json/profile-overview.json`,
} as const;

