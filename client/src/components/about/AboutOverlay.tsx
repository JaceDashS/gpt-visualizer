import React, { useEffect, useMemo, useState } from 'react';
import styles from './AboutOverlay.module.css';
import { aboutApi, AboutResponse } from '../../services/api';
import { detectUserLanguage } from '../../utils/language';
import type { Language } from '../../pages/howItWorksText';
import { OVERLAY_SLIDE_DOWN_DURATION } from '../../constants/animation';

interface AboutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// About 정보에서 사용할 언어 키 ({ en, zh, jp, kr } 형태)
type AboutLangKey = keyof AboutResponse; // 'en' | 'zh' | 'jp' | 'kr'

const mapLanguageToAboutKey = (language: Language): AboutLangKey => {
  switch (language) {
    case 'ko':
      return 'kr';
    case 'ja':
      return 'jp';
    case 'zh':
      return 'zh';
    case 'en':
    default:
      return 'en';
  }
};

const PROFILE_IMAGE_URL =
  'https://raw.githubusercontent.com/JaceDashS/myAssets/main/img/profile.jpg';

const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose }) => {
  const [aboutData, setAboutData] = useState<AboutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  const [language] = useState<Language>(() => detectUserLanguage());
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
    const key = mapLanguageToAboutKey(language);
    // 해당 언어의 텍스트가 있으면 사용, 없으면 영어로 fallback
    return aboutData[key] ?? aboutData.en ?? '';
  }, [aboutData, language]);

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
              src={PROFILE_IMAGE_URL}
              alt="Profile"
              className={styles.profileImage}
            />
          </div>
          <div className={styles.textWrapper}>
            <h2 className={styles.title}>About</h2>
            {isLoading && <p className={styles.message}>Loading about information...</p>}
            {!isLoading && error && (
              <p className={styles.message}>{error}</p>
            )}
            {!isLoading && !error && localizedText && (
              <p className={styles.aboutText}>{localizedText}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutOverlay;


