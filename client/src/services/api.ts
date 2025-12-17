import { API_BASE_URL } from '../config/api';

export interface VisualizeRequest {
  input_text: string;
}

export interface TokenVector {
  token: string;
  destination: [number, number, number]; // 목적지 좌표 (시작점은 이전 벡터의 destination 또는 [0,0,0])
  is_input: boolean;
}

export interface VisualizeResponse {
  tokens: TokenVector[];
}

// About 페이지 소개글 응답 타입
// 백엔드에서 { en, zh, jp, kr } 형태로 내려온다고 가정
export interface AboutResponse {
  en: string;
  zh: string;
  jp: string;
  kr: string;
}

export const visualizeApi = {
  /**
   * 모델 추론을 수행하고 토큰 벡터 데이터를 반환합니다.
   * @param inputText 입력 텍스트
   * @returns 토큰화된 결과 및 벡터 정보
   */
  async getTokenVectors(inputText: string): Promise<VisualizeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_text: inputText } as VisualizeRequest),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = (await response.json()) as VisualizeResponse;
      return data;
    } catch (error) {
      console.error('Error fetching output:', error);
      throw error;
    }
  },
};

export const aboutApi = {
  /**
   * 게이트웨이 서버에서 소개글(다국어)을 가져온다.
   * 백엔드에서 /api/about 으로 { en, zh, jp, kr } 형태의 객체를 내려준다고 가정.
   */
  async getAbout(): Promise<AboutResponse> {
    const response = await fetch(`${API_BASE_URL}/api/about`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch about: ${response.status}`);
    }

    const data = (await response.json()) as AboutResponse;
    return data;
  },
};

