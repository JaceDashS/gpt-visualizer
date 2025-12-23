import { API_BASE_URL, ASSETS_CONFIG } from '../config/api';

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
// GitHub JSON에서 { en, ko, ja, zh } 형태로 가져옴
export interface AboutResponse {
  en: string;
  ko: string;
  ja: string;
  zh: string;
}

export const visualizeApi = {
  /**
   * 모델 추론을 수행하고 토큰 벡터 데이터를 반환합니다.
   * @param inputText 입력 텍스트
   * @returns 토큰화된 결과 및 벡터 정보
   */
  async getTokenVectors(inputText: string): Promise<VisualizeResponse> {
    try {
      // 테스트용: 로컬 서버로 직접 요청
      const response = await fetch('http://localhost:7860/api/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_text: inputText } as VisualizeRequest),
      });

      // 기존 코드 (나중에 살릴 예정)
      // const response = await fetch(`${API_BASE_URL}/api/visualize`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ input_text: inputText } as VisualizeRequest),
      // });

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
   * GitHub에서 소개글(다국어) JSON을 가져온다.
   * { en, ko, ja, zh } 형태의 객체를 반환.
   */
  async getAbout(): Promise<AboutResponse> {
    const response = await fetch(ASSETS_CONFIG.profileOverview, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch about: ${response.status}`);
    }

    const data = (await response.json()) as AboutResponse;
    return data;
  },
};

// 코멘트/피드백 시스템 인터페이스
export interface CommentRequest {
  parentHeaderId: number | null;
  content: string;
  userPassword: string;
}

export interface CommentResponse {
  id: number;
}

export const feedbackApi = {
  /**
   * 피드백(코멘트)을 서버에 제출합니다.
   * IP는 서버에서 자동으로 추출되어 해싱됩니다.
   * @param comment 코멘트 데이터 (parentHeaderId는 null, content와 userPassword는 필수)
   * @returns 생성된 코멘트 ID
   */
  async submitFeedback(comment: { content: string; userPassword: string }): Promise<CommentResponse> {
    try {
      const requestBody: CommentRequest = {
        parentHeaderId: null, // 최상위 코멘트이므로 null
        content: comment.content,
        userPassword: comment.userPassword,
      };
      //api base url 확인
      // console.log("API_BASE_URL", API_BASE_URL);

      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to submit feedback: ${response.status}`
        );
      }

      const data = (await response.json()) as CommentResponse;
      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },
};

