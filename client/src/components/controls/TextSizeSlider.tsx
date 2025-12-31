import React from 'react';
import { useTextSize } from '../../contexts/TextSizeContext';
import styles from './TextSizeSlider.module.css';

const TextSizeSlider: React.FC = () => {
  const { fontSize, setFontSize, easterEggActive } = useTextSize();

  // 폰트 크기 범위: 0.05 ~ 0.3 (기본값 0.075)
  const minSize = 0.05;
  const maxSize = 0.3;
  
  // 슬라이더 값 (0 ~ 100)을 폰트 크기로 변환 (세로 슬라이더이므로 반대로 계산)
  const sliderValue = 100 - ((fontSize - minSize) / (maxSize - minSize)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    // 슬라이더 값 (0 ~ 100)을 폰트 크기로 변환 (세로 슬라이더이므로 반대로 계산)
    const newSize = minSize + ((100 - value) / 100) * (maxSize - minSize);
    setFontSize(newSize);
  };

  // thumb 위치 계산 (슬라이더가 회전되어 있으므로)
  const thumbPosition = sliderValue; // 0 ~ 100

  return (
    <div className={styles.container}>
      <div className={styles.sliderWrapper}>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleChange}
          className={styles.slider}
        />
        <div 
          className={`${styles.thumbLabel} ${easterEggActive ? styles.easterEgg : ''}`}
          style={{ bottom: `${thumbPosition}%` }}
        >
          T
        </div>
      </div>
    </div>
  );
};

export default TextSizeSlider;

