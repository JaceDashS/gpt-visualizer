import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FRAME_INTERVAL_MS,
  GATHER_PROGRESS_INCREMENT,
  GROW_PROGRESS_INCREMENT,
  AUTO_PLAY_DELAY,
  DEFAULT_ANIMATION_SPEED,
} from '../constants';

interface UseAnimationTimerReturn {
  animationStep: number;
  isPlaying: boolean;
  isGathering: boolean;
  gatherProgress: number;
  isGrowing: boolean;
  growProgress: number;
  animationSpeed: number;
  setAnimationStep: (step: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  resetAnimation: () => void;
}

// 애니메이션 상태와 타이머를 관리하는 커스텀 훅
export const useAnimationTimer = (
  maxSteps: number,
  hasData: boolean
): UseAnimationTimerReturn => {
  // 애니메이션 스텝: 0 = 입력토큰만, 1~N = 출력 토큰
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // 토큰(텍스트) 모으기 애니메이션 상태
  const [isGathering, setIsGathering] = useState<boolean>(false);
  const [gatherProgress, setGatherProgress] = useState<number>(0);
  
  // 벡터 시작점에서 끝점까지 성장 애니메이션 상태
  const [isGrowing, setIsGrowing] = useState<boolean>(false);
  const [growProgress, setGrowProgress] = useState<number>(0);
  
  // 애니메이션 속도
  const [animationSpeed, setAnimationSpeed] = useState<number>(DEFAULT_ANIMATION_SPEED);

  // 타이머 ref (중복 방지)
  const animationTimerRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const growTimerRef = useRef<number | null>(null);

  // 토큰(텍스트) 모으기 애니메이션 진행
  useEffect(() => {
    if (!isGathering) return;
    
    // 이미 타이머가 있으면 중복 방지
    if (animationTimerRef.current) return;

    animationTimerRef.current = window.setInterval(() => {
      setGatherProgress(prev => {
        if (prev >= 1) {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current);
            animationTimerRef.current = null;
          }
          setIsGathering(false);
          setGatherProgress(0);
          // 모으기 완료, 벡터 성장 시작
          setIsGrowing(true);
          setGrowProgress(0);
          return 0;
        }
        return prev + GATHER_PROGRESS_INCREMENT * animationSpeed;
      });
    }, FRAME_INTERVAL_MS);

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [isGathering, animationSpeed]);

  // 벡터 성장 애니메이션 진행
  useEffect(() => {
    if (!isGrowing) return;
    
    // 이미 타이머가 있으면 중복 방지
    if (growTimerRef.current) return;

    growTimerRef.current = window.setInterval(() => {
      setGrowProgress(prev => {
        if (prev >= 1) {
          if (growTimerRef.current) {
            clearInterval(growTimerRef.current);
            growTimerRef.current = null;
          }
          setIsGrowing(false);
          setGrowProgress(1); // 완료 상태 유지
          // 성장 완료 → 스텝 증가
          setAnimationStep(step => step + 1);
          return 1;
        }
        return prev + GROW_PROGRESS_INCREMENT * animationSpeed;
      });
    }, FRAME_INTERVAL_MS);

    return () => {
      if (growTimerRef.current) {
        clearInterval(growTimerRef.current);
        growTimerRef.current = null;
      }
    };
  }, [isGrowing, animationSpeed]);

  // 자동 재생 - 다음 스텝 시작
  useEffect(() => {
    if (!isPlaying || !hasData || isGathering || isGrowing) return;

    if (animationStep >= maxSteps) {
      setIsPlaying(false);
      return;
    }

    // 이미 타이머가 있으면 중복 방지
    if (delayTimerRef.current) return;

    delayTimerRef.current = window.setTimeout(() => {
      delayTimerRef.current = null;
      setIsGathering(true);
      setGatherProgress(0);
    }, AUTO_PLAY_DELAY / animationSpeed);

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, [isPlaying, animationStep, isGathering, isGrowing, animationSpeed, maxSteps, hasData]);

  const resetAnimation = useCallback(() => {
    setIsPlaying(false);
    setAnimationStep(0);
    setIsGathering(false);
    setIsGrowing(false);
    setGatherProgress(0);
    setGrowProgress(0);
  }, []);

  return {
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
  };
};

export default useAnimationTimer;
