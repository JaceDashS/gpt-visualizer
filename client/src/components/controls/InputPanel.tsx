import React, { useRef } from 'react';
import { filterEnglishOnly } from '../../utils';
import styles from './InputPanel.module.css';

interface InputPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submittedText: string;
  outputText: string;
  isLoading: boolean;
  error: string | null;
}

// 상단 입력 패널 컴포넌트
const InputPanel: React.FC<InputPanelProps> = ({
  inputText,
  onInputChange,
  onSubmit,
  submittedText,
  outputText,
  isLoading,
  error,
}) => {
  // IME 조합(한글 등) 중에는 입력 흐름이 끊기지 않도록 필터링을 미루고, 조합후 필터링 적용
  // IME 조합때문에 일시적으로 영어가 아닌 입력이 보일수 있음
  const isComposingRef = useRef(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // IME 조합 중에는 그대로 반영 (안 그러면 입력이 멈추거나 기존 텍스트가 날아갈 수 있음)
    if (isComposingRef.current) {
      onInputChange(newValue);
      return;
    }

    // 조합 중이 아니면 즉시 필터링 적용 (허용되지 않는 문자는 제거, 기존 텍스트는 유지)
    onInputChange(filterEnglishOnly(newValue));
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    // 조합 완료된 최종 값에 대해 필터 적용
    onInputChange(filterEnglishOnly(e.currentTarget.value));
  };

  const isSubmitDisabled = isLoading || !inputText.trim();

  const formClasses = [
    styles.form,
    submittedText && styles.formWithResult,
  ].filter(Boolean).join(' ');

  const submitButtonClasses = [
    styles.submitButton,
    isLoading && styles.submitButtonLoading,
    isSubmitDisabled && styles.submitButtonDisabled,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.container}>
      {/* 입력 폼 */}
      <form onSubmit={onSubmit} className={formClasses}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Enter English text to visualize..."
          disabled={isLoading}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={submitButtonClasses}
        >
          {isLoading ? 'Processing...' : 'Visualize'}
        </button>
      </form>

      {/* 결과 표시 */}
      {submittedText && (
        <>
          <div className={styles.resultRow}>
            <strong className={styles.inputLabel}>Input:</strong> {submittedText}
          </div>
          <div>
            <strong className={styles.outputLabel}>Output:</strong>{' '}
            {isLoading ? 'Loading...' : outputText || '(waiting...)'}
          </div>
        </>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default InputPanel;
