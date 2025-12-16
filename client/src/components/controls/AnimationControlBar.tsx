import React from 'react';
import {
  MIN_ANIMATION_SPEED,
  MAX_ANIMATION_SPEED,
  ANIMATION_SPEED_STEP,
} from '../../constants';
import styles from './AnimationControlBar.module.css';

interface AnimationControlBarProps {
  animationStep: number;
  maxSteps: number;
  isPlaying: boolean;
  animationSpeed: number;
  hasData: boolean;
  onPlayPause: () => void;
  onStepChange: (step: number) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

// 하단 애니메이션 컨트롤 바 - 항상 표시, 데이터 없으면 비활성화
const AnimationControlBar: React.FC<AnimationControlBarProps> = ({
  animationStep,
  maxSteps,
  isPlaying,
  animationSpeed,
  hasData,
  onPlayPause,
  onStepChange,
  onSpeedChange,
  onReset,
}) => {
  const isDisabled = !hasData || maxSteps === 0; //데이터가 없가나 maxSteps가 0이면 비활성화

  const containerClasses = [
    styles.container,
    !hasData && styles.containerDisabled,
  ].filter(Boolean).join(' ');

  const playButtonClasses = [
    styles.playButton,
    isPlaying ? styles.playButtonPlaying : styles.playButtonPaused,
    isDisabled ? styles.playButtonDisabled : styles.playButtonEnabled,
  ].filter(Boolean).join(' ');

  const stepSliderClasses = [
    styles.stepSlider,
    hasData ? styles.stepSliderEnabled : styles.stepSliderDisabled,
  ].filter(Boolean).join(' ');

  const resetButtonClasses = [
    styles.resetButton,
    hasData ? styles.resetButtonEnabled : styles.resetButtonDisabled,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* 상단: 재생 컨트롤 */}
      <div className={styles.playbackRow}>
        {/* 재생/일시정지 버튼 */}
        <button
          onClick={onPlayPause}
          disabled={isDisabled}
          className={playButtonClasses}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* 슬라이더 */}
        <input
          type="range"
          min={0}
          max={maxSteps || 1}
          disabled={isDisabled}
          value={animationStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className={stepSliderClasses}
        />

        {/* 스텝 표시 */}
        <span className={styles.stepDisplay}>
          {animationStep} / {maxSteps}
        </span>
      </div>

      {/* 하단: 속도 조절 + 리셋 */}
      <div className={styles.speedRow}>
        <span>Speed:</span>
        <input
          type="range"
          min={MIN_ANIMATION_SPEED}
          max={MAX_ANIMATION_SPEED}
          step={ANIMATION_SPEED_STEP}
          value={animationSpeed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className={styles.speedSlider}
        />
        <span className={styles.speedDisplay}>{animationSpeed}x</span>

        {/* 리셋 버튼 */}
        <button
          onClick={onReset}
          disabled={!hasData}
          className={resetButtonClasses}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default AnimationControlBar;
