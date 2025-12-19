import React, { useEffect, useMemo, useState } from 'react';
import styles from './AboutOverlay.module.css';
import { aboutApi, AboutResponse } from '../../services/api';
import { OVERLAY_SLIDE_DOWN_DURATION, ABOUT_SCROLLBAR_FADE_OUT_DELAY } from '../../constants/animation';
import { ASSETS_CONFIG, API_CONFIG } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface AboutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}



const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose }) => {
  const [aboutData, setAboutData] = useState<AboutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = React.useRef<number | null>(null);
  const textContentRef = React.useRef<HTMLDivElement>(null);

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
      }, OVERLAY_SLIDE_DOWN_DURATION); // 닫힐때 닫히는 시간 후에 언마운트
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [isOpen, isMounted]);

  // 컴포넌트 마운트 시 한 번만 /api/about 호출 시도 (메인 페이지 진입 시 미리 로드)
  useEffect(() => {
    // console.log('AboutOverlay useEffect 실행', { aboutData, isLoading, hasTriedFetch });
    
    if (aboutData || isLoading || hasTriedFetch) {
    //   console.log('AboutOverlay fetch 스킵 - 조건 불만족');
      return;
    }

    const fetchAbout = async () => {
    //   console.log('AboutOverlay fetch 시작');
      setIsLoading(true);
      setError(null);

      try {
        const data = await aboutApi.getAbout();
        setAboutData(data);
        // console.log('aboutData', data);
      } catch (err: unknown) {
        console.error('Failed to fetch about:', err);
        setError('Failed to load data.');
      } finally {
        setIsLoading(false);
        setHasTriedFetch(true);
      }
    };

    fetchAbout();
  }, [aboutData, isLoading, hasTriedFetch]);

  const localizedText = useMemo(() => {
    if (!aboutData) return null;
    // 해당 언어의 텍스트가 있으면 사용, 없으면 영어로 fallback
    return aboutData[language] ?? aboutData.en ?? '';
  }, [aboutData, language]);

  const viewAppsText = useMemo(() => {
    switch (language) {
      case 'ko':
        return '내 모든 앱을 보기';
      case 'ja':
        return 'すべてのアプリを見る';
      case 'zh':
        return '查看我的所有应用';
      case 'en':
      default:
        return 'View all my apps';
    }
  }, [language]);

  // 스크롤 위치 감지 및 스크롤 중 상태 관리
  useEffect(() => {
    const textContent = textContentRef.current;
    if (!textContent) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = textContent;
      const threshold = 5; // 하단 5px 내에 있으면 끝으로 간주
      setIsScrolledToBottom(scrollHeight - scrollTop - clientHeight <= threshold);
      
      // 스크롤 중 상태 설정
      setIsScrolling(true);
      
      // 스크롤이 멈춘 후 ABOUT_SCROLLBAR_FADE_OUT_DELAY초 뒤에 스크롤바 페이드아웃
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, ABOUT_SCROLLBAR_FADE_OUT_DELAY);
    };

    // 초기 체크
    handleScroll();
    textContent.addEventListener('scroll', handleScroll);
    // 내용이 변경될 때도 체크
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(textContent);

    return () => {
      textContent.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [localizedText, isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.backdrop} aria-modal="true" role="dialog">
      <div className={`${styles.sheet} ${isClosing ? styles.closing : ''}`}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close about"
        >
          ×
        </button>

        <div className={styles.content}>
          <div className={styles.profileWrapper}>
            <img
              src={ASSETS_CONFIG.profileImage}
              alt="Profile"
              className={styles.profileImage}
            />
          </div>
          <div className={styles.textWrapper}>
            <div className={styles.headerRow}>
            <h2 className={styles.title}>About</h2>
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
            <div 
              ref={textContentRef}
              className={styles.textContent}
              data-scrolled-to-bottom={isScrolledToBottom}
              data-scrolling={isScrolling}
            >
            {isLoading && <p className={styles.message}>Loading about information...</p>}
            {!isLoading && error && (
              <p className={styles.message}>{error}</p>
            )}
            {!isLoading && !error && localizedText && (
              <p className={styles.aboutText}>{localizedText}</p>
            )}
            </div>
            <a
              href={API_CONFIG.baseURL}
              className={styles.viewAppsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {viewAppsText} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutOverlay;


