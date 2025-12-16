import React from 'react';
import styles from './LoadingIndicator.module.css';

interface LoadingIndicatorProps {
  message?: string;
}

// 로딩 인디케이터
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Processing...',
}) => {
  return (
    <div className={styles.container}>
      {message}
    </div>
  );
};

export default LoadingIndicator;
