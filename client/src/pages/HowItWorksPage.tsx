import React, { useEffect, useMemo, useState } from 'react';
import TokenVisualization from '../components/TokenVisualization';
import { TokenVector } from '../services/api';
import { calculateMidpoint, Vector3Tuple } from '../utils/vectorMath';
import styles from './HowItWorksPage.module.css';
import { howItWorksData } from '../locales/howItWorks';
import { useLanguage } from '../contexts/LanguageContext';

export const PCA_WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/Principal_component_analysis';

export type Language = 'en' | 'ko' | 'ja' | 'zh';

export interface UiText {
  title: string;
  prev: string;
  next: string;
  stepLabel: (n: number, total: number) => string;
}

export interface StepContent {
  title: string;
  body: React.ReactNode;
}

export const getUiText = (language: Language): UiText => {
  const data = howItWorksData[language];
  return {
    title: data.uiText.title,
    prev: data.uiText.prev,
    next: data.uiText.next,
    stepLabel: (n, total) => `Step ${n} / ${total}`,
  };
};

// JSON 데이터를 JSX로 변환하는 헬퍼 함수
// paragraphs 배열을 <br />로 구분하고, boldTexts를 <strong>으로 감싸며, links를 <a> 태그로 변환
const renderStepBody = (
  stepData: {
    paragraphs: string[];
    boldTexts?: string[];
    links?: Array<{ text: string; url: string }>;
  },
  cssStyles: typeof styles
): React.ReactNode => {
  const { paragraphs, boldTexts = [], links = [] } = stepData;
  
  const processText = (text: string, linkMap: Map<string, string>): React.ReactNode[] => {
    let result: (string | React.ReactElement)[] = [text];
    
    // boldTexts 처리: 각 bold 텍스트를 찾아서 <strong>으로 감싸기
    // 순서대로 처리 (중첩되지 않는 한)
    boldTexts.forEach((boldText) => {
      const newResult: (string | React.ReactElement)[] = [];
      result.forEach((item, itemIdx) => {
        if (typeof item === 'string') {
          const linkUrl = linkMap.get(boldText);
          const parts = item.split(boldText);
          
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              newResult.push(parts[i]);
            }
            if (i < parts.length - 1) {
              // 링크가 있는 경우
              if (linkUrl) {
                newResult.push(
                  <strong key={`link-${itemIdx}-${i}`}>
                    <a className={cssStyles.link} href={linkUrl} target="_blank" rel="noreferrer">
                      {boldText}
                    </a>
                  </strong>
                );
              } else {
                newResult.push(<strong key={`bold-${itemIdx}-${i}`}>{boldText}</strong>);
              }
            }
          }
        } else {
          newResult.push(item);
        }
      });
      result = newResult;
    });
    
    return result;
  };

  // 링크를 Map으로 변환 (빠른 검색을 위해)
  const linkMap = new Map<string, string>();
  links.forEach(link => linkMap.set(link.text, link.url));

  const elements: React.ReactNode[] = [];
  paragraphs.forEach((paragraph, idx) => {
    if (idx > 0) {
      elements.push(<br key={`br-${idx}`} />);
    }
    const processed = processText(paragraph, linkMap);
    elements.push(...processed.map((item, itemIdx) => 
      <React.Fragment key={`p-${idx}-${itemIdx}`}>{item}</React.Fragment>
    ));
  });

  return <>{elements}</>;
};

export const getSteps = (language: Language): StepContent[] => {
  const data = howItWorksData[language];
  
  return data.steps.map((stepData) => ({
    title: stepData.title,
    body: renderStepBody(stepData, styles),
  }));
};

const REPLAY_LABEL = 'Replay step';

type StepId = 0 | 1 | 2 | 3 | 4;

// How it works 데모에서 사용할 고정 mock 벡터들 (터미널에서 [-2, 2] 범위 난수로 생성)
// 이후에  [-1,1]로 수정할것임
// 같은 토큰은 항상 같은 위치를 가지도록 함
const TOKEN_VECTORS: Record<string, Vector3Tuple> = {
  Explain: [-1.982, -1.455, -1.33],
  GPT: [1.053, -0.131, -0.032],
  in: [-1.269, -1.791, 1.292],
  simple: [0.22, -0.297, 0.951],
  terms: [-1.855, 0.99, -0.674],
  generates: [1.028, -1.416, -1.684],
  the: [-1.004, -0.483, -1.876],
  next: [-1.004, -0.483, -1.876], // 응답의 'next'는 바로 앞 토큰('the')와 같은 위치로 설정 → 길이 0 벡터 예시
  token: [-0.479, 0.975, 0.747],
  '.': [0.882, 1.382, 1.145],
};

const HowItWorksPage: React.FC = () => {
  const [step, setStep] = useState<StepId>(0);
  const [replayKey, setReplayKey] = useState(0);
  const { language, setLanguage } = useLanguage();

  const demoInputText = 'Explain GPT in simple terms';

  const [gatherMoveProgress, setGatherMoveProgress] = useState(0);
  const [gatherEffectProgress, setGatherEffectProgress] = useState(0);
  const [growProgress, setGrowProgress] = useState(0);
  const [showFirstOutputToken, setShowFirstOutputToken] = useState(false);
  const [showZeroLengthToken, setShowZeroLengthToken] = useState(false);

  const uiText = useMemo(() => getUiText(language), [language]);
  const steps = useMemo(() => getSteps(language), [language]);

  const clampStep = (value: number): StepId => {
    if (value <= 0) return 0;
    if (value >= 4) return 4;
    return value as StepId;
  };

  const handlePrev = () => setStep((s: StepId) => clampStep(s - 1));
  const handleNext = () => setStep((s: StepId) => clampStep(s + 1));
  const handleReplay = () => setReplayKey((k) => k + 1);

  //토큰 리스트 생성
  const { userTokens, assistantTokens, allTokens } = useMemo(() => {
    const rawUserWords = demoInputText.trim() ? demoInputText.trim().split(/\s+/) : ['(empty)'];
    const hasPeriodAtEnd = rawUserWords[rawUserWords.length - 1] === '.';
    const baseUserWords = hasPeriodAtEnd ? rawUserWords.slice(0, rawUserWords.length - 1) : rawUserWords;
    const limitedBase = baseUserWords.slice(0, 5);
    const userWords = [...limitedBase, '.'];

    const assistantBaseWords = ['GPT', 'generates', 'the', 'next', 'token'];
    const assistantWords = [...assistantBaseWords, '.'];

    const user = userWords.map((w) => {
      const dest = TOKEN_VECTORS[w] ?? [0, 0, 0];
      return {
        token: w,
        destination: dest,
        is_input: true,
      };
    });

    const assistant = assistantWords.map((w) => {
      const dest = TOKEN_VECTORS[w] ?? [0, 0, 0];
      return {
        token: w,
        destination: dest,
        is_input: false,
      };
    });

    return {
      userTokens: user,
      assistantTokens: assistant,
      allTokens: [...user, ...assistant],
    };
  }, [demoInputText]);

  // 스텝에 따른 시각화 토큰 / 애니메이션 모드 결정
  const visibleTokens: TokenVector[] = useMemo(() => {
    const zeroVectorIndex = assistantTokens.findIndex((t) => t.token === 'next');
    const zeroVectorToken = zeroVectorIndex >= 0 ? assistantTokens[zeroVectorIndex] : undefined;
    const assistantBeforeZero = zeroVectorIndex >= 0 ? assistantTokens.slice(0, zeroVectorIndex) : assistantTokens;

    // 스탭1과 2는 인풋토큰만 보임
    if (step === 0 || step === 1) return userTokens;

    // 스탭3은 shrink하고 벡터 성장
    if (step === 2) {
      return showFirstOutputToken ? [...userTokens, assistantTokens[0]] : userTokens;
    }

    // 스탭4는 길이 0 벡터
    if (step === 3) {
      const assistantForZeroStep =
        showZeroLengthToken && zeroVectorToken
          ? [...assistantBeforeZero, zeroVectorToken]
          : assistantBeforeZero;
      return [...userTokens, ...assistantForZeroStep];
    }

    // 스탭5는 다보임
    return allTokens;
  }, [step, userTokens, assistantTokens, allTokens, showFirstOutputToken, showZeroLengthToken]);

  // Step2: move only / Step3: shrink (then grow) / Step4: 길이 0 벡터 예시용 모으기 애니메이션
  const isAnimating = step === 1 || step === 2 || step === 3;
  const isGrowing = (step === 2 && showFirstOutputToken) || (step === 3 && showZeroLengthToken);

  // 모여들기 목표 지점: User 마지막 토큰과 첫 Assistant 토큰의 중간 지점을 "컨텍스트"처럼 사용
  const targetPosition: Vector3Tuple = useMemo(() => {
    if (userTokens.length === 0) return [0, 0, 0];

    // Step4: zero-length next 토큰을 대상으로 할 때는 직전 assistant(or user)와 next의 중점을 사용
    if (step === 3) {
      const zeroVectorIndex = assistantTokens.findIndex((t) => t.token === 'next');
      const zeroVectorToken = zeroVectorIndex >= 0 ? assistantTokens[zeroVectorIndex] : undefined;
      const prevToken =
        zeroVectorIndex > 0
          ? assistantTokens[zeroVectorIndex - 1]
          : userTokens[userTokens.length - 1];

      if (zeroVectorToken) {
        const startPoint = (prevToken?.destination as Vector3Tuple) ?? (userTokens[userTokens.length - 1].destination as Vector3Tuple);
        const endPoint = zeroVectorToken.destination as Vector3Tuple;
        return calculateMidpoint(startPoint, endPoint);
      }
    }

    const startPoint = userTokens[userTokens.length - 1].destination as Vector3Tuple;
    const firstAssistant = assistantTokens[0];
    if (!firstAssistant) return startPoint;
    const endPoint = firstAssistant.destination as Vector3Tuple;
    return calculateMidpoint(startPoint, endPoint);
  }, [step, userTokens, assistantTokens]);

  // 스텝별 애니메이션 진행(한 번 재생)
  useEffect(() => {
    setGatherMoveProgress(0);
    setGatherEffectProgress(0);
    setGrowProgress(0);
    setShowFirstOutputToken(false);
    setShowZeroLengthToken(false);

    let raf = 0;
    let start = 0;

    const run = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;

      // Step2(=step===1): 이동만 하고 shrink/fade는 하지 않고 그 자리에서 멈춤
      if (step === 1) {
        const moveT = Math.min(1, elapsed / 1200);
        setGatherMoveProgress(moveT);
        setGatherEffectProgress(0);
        if (moveT < 1) raf = window.requestAnimationFrame(run);
      }

      // Step3(=step===2): 먼저 shrink 시작 → 그 다음 grow 시작
      if (step === 2) {
        setGatherMoveProgress(1); // Step2에서 모인 위치에서 시작

        const shrinkDuration = 650;
        const growDuration = 1100;

        if (elapsed < shrinkDuration) {
          const effectT = Math.min(1, elapsed / shrinkDuration);
          setGatherEffectProgress(effectT);
          setGrowProgress(0);
          setShowFirstOutputToken(false); // shrink 완료 전에는 출력 토큰을 보여주지 않음
          raf = window.requestAnimationFrame(run);
          return;
        }

        setGatherEffectProgress(1);
        setShowFirstOutputToken(true); // shrink 완료 후에 출력 토큰을 보여주고 grow 시작
        const growElapsed = elapsed - shrinkDuration;
        const growT = Math.min(1, growElapsed / growDuration);
        setGrowProgress(growT);
        if (growT < 1) raf = window.requestAnimationFrame(run);
      }

      // Step4(=step===3): 길이 0 벡터(next) 예시 - 모이기(gather) → shrink → next 토큰 등장(생성)까지 보여줌
      // 실제로 사용하는 코드블럭을 재사용하면 오히려 헷갈리므로 별도로 작성
      if (step === 3) {
        const gatherDuration = 1200;
        const shrinkDuration = 650;
        const growDuration = 1100;

        // 1) 모이기 애니메이션 (토큰들이 컨텍스트 위치로 이동)
        if (elapsed < gatherDuration) {
          const moveT = Math.min(1, elapsed / gatherDuration);
          setGatherMoveProgress(moveT);
          setGatherEffectProgress(0);
          setGrowProgress(0);
          setShowZeroLengthToken(false);
          if (moveT < 1) raf = window.requestAnimationFrame(run);
          return;
        }

        // 모이기 완료
        setGatherMoveProgress(1);

        const afterGatherElapsed = elapsed - gatherDuration;

        // 2) shrink 
        if (afterGatherElapsed < shrinkDuration) {
          const effectT = Math.min(1, afterGatherElapsed / shrinkDuration);
          setGatherEffectProgress(effectT);
          setGrowProgress(0);
          setShowZeroLengthToken(false);
          raf = window.requestAnimationFrame(run);
          return;
        }

        // shrink 완료 → zero-length next 토큰 등장
        setGatherEffectProgress(1);
        setShowZeroLengthToken(true);

        // 3) grow 단계 (실제 화살표는 길이 0이라 보이지 않지만, 생성 타이밍을 맞추기 위해 유지)
        const growElapsed = afterGatherElapsed - shrinkDuration;
        const growT = Math.min(1, growElapsed / growDuration);
        setGrowProgress(growT);
        if (growT < 1) raf = window.requestAnimationFrame(run);
      }
    };

    if (step === 1 || step === 2 || step === 3) {
      raf = window.requestAnimationFrame(run);
    }

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [step, replayKey]);

  return (
    <div className={styles.container}>
      <TokenVisualization
        tokens={visibleTokens}
        isAnimating={isAnimating}
        animationProgress={gatherMoveProgress}
        gatherEffectProgress={gatherEffectProgress}
        targetPosition={targetPosition}
        isGrowing={isGrowing}
        growProgress={growProgress}
      />

      {/* 상단: 언어 선택 + 스텝 버튼 */}
      <div className={styles.topBar}>
        <div className={styles.headerRow}>
          <div className={styles.title}>{uiText.title}</div>
          <div className={styles.headerRight}>
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
        </div>

        <div className={styles.stepperTop}>
          <button className={styles.replayButton} type="button" onClick={handleReplay}>
            {REPLAY_LABEL}
          </button>
          {steps.map((s, idx) => (
            <button
              key={s.title}
              type="button"
               className={`${styles.stepItem} ${idx === step ? styles.stepItemActive : ''}`}
               onClick={() => setStep(idx as StepId)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 하단: 설명 (기존 애니메이션 컨트롤 위치) */}
      <div className={styles.bottomPanel}>
        <div className={styles.stepTitle}>{steps[step].title}</div>
        <div className={styles.stepBody}>{steps[step].body}</div>

        <div className={styles.navRow}>
          <button className={styles.navButton} type="button" onClick={handlePrev} disabled={step === 0}>
            {uiText.prev}
          </button>
          <div className={styles.stepHint}>{uiText.stepLabel(step + 1, steps.length)}</div>
          <button className={styles.navButton} type="button" onClick={handleNext} disabled={step === 4}>
            {uiText.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;

