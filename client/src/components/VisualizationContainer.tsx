import React, { useState, useMemo, useEffect } from 'react';
import TokenVisualization from './TokenVisualization';
import { InputPanel, AnimationControlBar, LoadingIndicator } from './controls';
import { useVisualizationApi, useAnimationTimer } from '../hooks';
import { TokenVector } from '../services/api';
import { calculateMidpoint, Vector3Tuple } from '../utils/vectorMath';
import styles from './VisualizationContainer.module.css';

// 전체 시각화를 관리하는 컨테이너 컴포넌트
const VisualizationContainer: React.FC = () => {
  // 사용자 입력 상태
  const [inputText, setInputText] = useState<string>('');
  const [submittedText, setSubmittedText] = useState<string>('');

  // API 호출 훅
  const {
    visualizationData,
    inputTokens,
    outputTokens,
    isLoading,
    error,
    fetchVisualization,
  } = useVisualizationApi();

  // 애니메이션 훅
  const {
    animationStep,
    isPlaying,
    isGathering,
    gatherProgress,
    isGrowing,
    growProgress,
    animationSpeed,
    setAnimationStep,
    setIsPlaying,
    setAnimationSpeed,
    resetAnimation,
  } = useAnimationTimer(outputTokens.length, !!visualizationData);

  // 데이터가 새로 로드되면 애니메이션 초기화
  useEffect(() => {
    if (visualizationData) {
      resetAnimation();
    }
  }, [visualizationData, resetAnimation]);

  // 텍스트 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setSubmittedText(inputText.trim());
      fetchVisualization(inputText.trim());
    }
  };

  // 현재 스텝에 따라 표시할 토큰 필터링
  const visibleTokens: TokenVector[] = useMemo(() => {
    if (!visualizationData) return [];

    const baseTokens = [...inputTokens, ...outputTokens.slice(0, animationStep)];

    // 성장 중일 때는 성장 중인 토큰도 포함
    if (isGrowing && animationStep < outputTokens.length) {
      baseTokens.push(outputTokens[animationStep]);
    }

    return baseTokens;
  }, [visualizationData, inputTokens, outputTokens, animationStep, isGrowing]);

  // 다음 출력 토큰의 목표 위치 계산 (벡터 중간점)
  const nextTargetPosition: Vector3Tuple = useMemo(() => {
    if (!visualizationData || animationStep >= outputTokens.length) {
      return [0, 0, 0];
    }

    // animationStep번째 출력 토큰
    const nextOutputToken = outputTokens[animationStep];
    if (!nextOutputToken) return [0, 0, 0];

    // 시작점 계산: 원점 or 이전토큰 목적지
    let startPoint: Vector3Tuple = [0, 0, 0];
    if (animationStep > 0) {
      // 이전 출력 토큰 destination
      startPoint = outputTokens[animationStep - 1].destination as Vector3Tuple;
    } else if (inputTokens.length > 0) {
      // 첫 출력 토큰이면 마지막 입력 토큰의 destination
      startPoint = inputTokens[inputTokens.length - 1].destination as Vector3Tuple;
    }

    // 끝점, 다음 출력 토큰의 destination
    const endPoint = nextOutputToken.destination as Vector3Tuple;

    // 중간점 계산
    return calculateMidpoint(startPoint, endPoint);
  }, [visualizationData, animationStep, outputTokens, inputTokens]);

  // 출력 텍스트 생성
  const outputText = outputTokens
    .slice(0, animationStep)
    .map(t => t.token)
    .join(' ');

  const maxOutputSteps = outputTokens.length;

  // 재생/일시정지 핸들러
  const handlePlayPause = () => {
    if (!visualizationData || maxOutputSteps === 0) return;
    if (animationStep >= maxOutputSteps) {
      setAnimationStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  // 스텝 변경 핸들러
  const handleStepChange = (step: number) => {
    if (!visualizationData) return;
    setIsPlaying(false);
    setAnimationStep(step);
  };

  // 리셋 핸들러
  const handleReset = () => {
    if (!visualizationData) return;
    resetAnimation();
  };

  return (
    <div className={styles.container}>
      {/* 상단 입력 패널 */}
      <InputPanel
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleSubmit}
        submittedText={submittedText}
        outputText={outputText}
        isLoading={isLoading}
        error={error}
      />

      {/* 3D 시각화 - 항상 표시 (좌표계는 항상 보임) */}
        <TokenVisualization
        tokens={isLoading ? [] : visibleTokens}
        isAnimating={isGathering}
        animationProgress={gatherProgress}
        targetPosition={nextTargetPosition}
        isGrowing={isGrowing}
        growProgress={growProgress}
      />

      {/* 로딩 인디케이터 */}
      {isLoading && <LoadingIndicator />}

      {/* 하단 애니메이션 컨트롤 바 - 항상 표시, 데이터 없으면 비활성화 */}
      {!isLoading && (
        <AnimationControlBar
          animationStep={animationStep}
          maxSteps={maxOutputSteps}
          isPlaying={isPlaying}
          animationSpeed={animationSpeed}
          hasData={!!visualizationData}
          onPlayPause={handlePlayPause}
          onStepChange={handleStepChange}
          onSpeedChange={setAnimationSpeed}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default VisualizationContainer;
