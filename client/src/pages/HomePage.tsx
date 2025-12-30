import React, { useState, useMemo, useEffect } from 'react';
import TokenVisualization from '../components/TokenVisualization';
import { InputPanel, AnimationControlBar, LoadingIndicator } from '../components/controls';
import { useVisualizationApi, useAnimationTimer } from '../hooks';
import { TokenVector } from '../services/api';
import { calculateMidpoint, Vector3Tuple } from '../utils/vectorMath';
import styles from './HomePage.module.css';

// 전체 시각화를 관리하는 컨테이너 컴포넌트
const HomePage: React.FC = () => {
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

  // 애니메이션 훅. 텍스트가 목적지로 모이고 화살표가 성장하는 단계가 있음
  const {
    animationStep,
    isPlaying,
    isGathering,
    gatherProgress, // 모으기 진행도 0~1
    isGrowing,
    growProgress, // 성장 진행도 0~1
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
    const trimmed = inputText.trim();
    if (trimmed) {
      setSubmittedText(trimmed);
      fetchVisualization(trimmed);
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
    // api호출결과가 없거나 애니메이션이 끝까지 간경우
    if (!visualizationData || animationStep >= outputTokens.length) {
      return [0, 0, 0];
    }

    // animationStep번째 출력 토큰
    const nextOutputToken = outputTokens[animationStep];

    // 혹시 범위 밖인 경우를 위한 방어
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

  // 출력 텍스트 생성 (useMemo로 계산)
  const outputText = useMemo(() => {
    const tokens = outputTokens.slice(0, animationStep).map(t => t.token);
    if (tokens.length === 0) {
      return '';
    }

    const normalizedTokens = [...tokens];
    normalizedTokens[0] = normalizedTokens[0].replace(/^\s+/, '');
    return normalizedTokens.join('');
  }, [outputTokens, animationStep]);

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

export default HomePage;


