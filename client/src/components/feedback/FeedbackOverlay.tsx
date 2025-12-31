import React, { useEffect, useState, useMemo } from 'react';
import styles from './FeedbackOverlay.module.css';
import { feedbackApi } from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { OVERLAY_SLIDE_DOWN_DURATION } from '../../constants/animation';
import { useLanguage } from '../../contexts/LanguageContext';
import { feedbackTexts } from '../../locales/feedback';

interface FeedbackOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackFormData {
  password: string;
  content: string;
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState<FeedbackFormData>({
    password: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 다국어 텍스트
  const texts = useMemo(() => feedbackTexts[language], [language]);

  // 열리고 닫힐 때 애니메이션이 자연스럽게 보이도록 내부 마운트 상태 관리
  useEffect(() => {
    let timer: number | undefined;

    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
    } else if (!isOpen && isMounted) {
      // 닫힐 때는 슬라이드 다운 애니메이션을 먼저 보여주고 언마운트
      setIsClosing(true);
      timer = window.setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
        // 폼 상태 초기화
        setFormData({ password: '', content: '' });
        setSubmitStatus('idle');
        setErrorMessage(null);
        setShowPassword(false);
      }, OVERLAY_SLIDE_DOWN_DURATION);
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [isOpen, isMounted]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 상태 초기화
    if (submitStatus === 'error') {
      setSubmitStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 내용 필수 검증
    if (!formData.content.trim()) {
      setSubmitStatus('error');
      setErrorMessage(texts.errorContent);
      return;
    }

    // 비밀번호 필수 검증
    if (!formData.password.trim()) {
      setSubmitStatus('error');
      setErrorMessage(texts.errorPassword);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    try {
      await feedbackApi.submitFeedback({
        content: formData.content.trim(),
        userPassword: formData.password,
      });

      setSubmitStatus('success');
      // 성공 후 폼 초기화
      setFormData({ password: '', content: '' });
      setShowPassword(false);
    } catch (err: unknown) {
      console.error('Failed to submit feedback:', err);
      setSubmitStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : texts.errorSubmit
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // backdrop을 직접 클릭한 경우에만 닫기 (sheet 내부 클릭은 무시)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSheetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // sheet 내부 클릭은 backdrop으로 전파되지 않도록
    e.stopPropagation();
  };

  return (
    <div 
      className={styles.backdrop} 
      aria-modal="true" 
      role="dialog"
      onClick={handleBackdropClick}
    >
      <div 
        className={`${styles.sheet} ${isClosing ? styles.closing : ''}`}
        onClick={handleSheetClick}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={texts.closeLabel}
          disabled={isSubmitting}
        >
          ×
        </button>

        <div className={styles.content}>
          <div className={styles.headerRow}>
            <h2 className={styles.title}>{texts.title}</h2>
            <div className={styles.langGroup} role="group" aria-label="Language">
              <button
                type="button"
                className={`${styles.langButton} ${language === 'en' ? styles.langButtonActive : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`${styles.langButton} ${language === 'zh' ? styles.langButtonActive : ''}`}
                onClick={() => setLanguage('zh')}
              >
                中
              </button>
              <button
                type="button"
                className={`${styles.langButton} ${language === 'ja' ? styles.langButtonActive : ''}`}
                onClick={() => setLanguage('ja')}
              >
                日
              </button>
              <button
                type="button"
                className={`${styles.langButton} ${language === 'ko' ? styles.langButtonActive : ''}`}
                onClick={() => setLanguage('ko')}
              >
                한
              </button>
            </div>
          </div>
          <p className={styles.subtitle}>
            {texts.subtitle}
          </p>

          <a
            href={`${API_BASE_URL}/comments`}
            className={styles.viewAllLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {texts.viewAllFeedback} →
          </a>

          {submitStatus === 'success' ? (
            <div className={styles.successMessage}>
              <p>{texts.successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="feedback-password" className={styles.label}>
                  {texts.passwordLabel} <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="feedback-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={texts.passwordPlaceholder}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? texts.hidePassword : texts.showPassword}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <p className={styles.helpText}>
                  {texts.passwordHelp}
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="feedback-content" className={styles.label}>
                  {texts.contentLabel} <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="feedback-content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder={texts.contentPlaceholder}
                  rows={6}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {submitStatus === 'error' && errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !formData.content.trim() || !formData.password.trim()}
              >
                {isSubmitting ? texts.submitting : texts.submitButton}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackOverlay;

