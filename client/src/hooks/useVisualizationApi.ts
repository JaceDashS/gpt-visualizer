import { useState, useEffect, useCallback } from 'react';
import { visualizeApi, VisualizeResponse, TokenVector } from '../services/api';

interface UseVisualizationApiReturn {
  visualizationData: VisualizeResponse | null;
  inputTokens: TokenVector[];
  outputTokens: TokenVector[];
  isLoading: boolean;
  error: string | null;
  fetchVisualization: (text: string) => void;
}

// API 호출을 관리하는 커스텀 훅
export const useVisualizationApi = (): UseVisualizationApiReturn => {
  const [submittedText, setSubmittedText] = useState<string>('');
  const [visualizationData, setVisualizationData] = useState<VisualizeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // POST - submittedText가 변경될 때만 API 호출
  useEffect(() => {
    if (!submittedText) return;

    const fetchOutput = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await visualizeApi.getTokenVectors(submittedText);
        setVisualizationData({
          tokens: result.tokens,
        });
      } catch (err) {
        console.error('Error fetching output:', err);
        setError('Failed to fetch output');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutput();
  }, [submittedText]);

  // 입력/출력 토큰 분리
  const inputTokens = visualizationData?.tokens.filter(t => t.is_input) || [];
  const outputTokens = visualizationData?.tokens.filter(t => !t.is_input) || [];

  const fetchVisualization = useCallback((text: string) => {
    if (text.trim()) {
      setSubmittedText(text.trim());
    }
  }, []);

  return {
    visualizationData,
    inputTokens,
    outputTokens,
    isLoading,
    error,
    fetchVisualization,
  };
};

export default useVisualizationApi;
