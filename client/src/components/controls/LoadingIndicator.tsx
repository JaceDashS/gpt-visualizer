import React from 'react';
import styles from './LoadingIndicator.module.css';

interface LoadingIndicatorProps {
  message?: string;
}

// 로딩 인디케이터 (아이콘 애니메이션)
const LoadingIndicator: React.FC<LoadingIndicatorProps> = () => {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export default LoadingIndicator;
