import React, { useEffect, useMemo, useState } from 'react';
import TokenVisualization from '../components/TokenVisualization';
import { TextSizeSlider } from '../components/controls';
import { TokenVector } from '../services/api';
import { calculateMidpoint, Vector3Tuple } from '../utils/vectorMath';
import { useAnimationTimer } from '../hooks';
import { useTextSize } from '../contexts/TextSizeContext';
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

type StepId = 0 | 1 | 2 | 3 | 4 | 5;

// How it works 데모에서 사용할 고정 mock 벡터들 (터미널에서 [-2, 2] 범위 난수로 생성)
// 이후에  [-1,1]로 수정할것임
// 같은 토큰은 항상 같은 위치를 가지도록 함
const USER_TOKENS: TokenVector[] = [
  { token: 'Ex', destination: [0.5857302708020367, -0.17127111196926315, 0.6450533411395873], is_input: true },
  { token: 'plain', destination: [0.04237512438311963, -1, -0.1178833352529004], is_input: true },
  { token: ' G', destination: [1, -0.008739334137217614, 1], is_input: true },
  { token: 'PT', destination: [0.6665919750067879, 1, -1], is_input: true },
  { token: ' in', destination: [-0.017225745428265826, -0.8717108739418001, -0.4430874295318551], is_input: true },
  { token: ' simple', destination: [-0.0926379053450167, -0.8890219558250391, -0.11963766783925567], is_input: true },
  { token: ' terms', destination: [-0.03569214256438602, -0.7780485219856715, -0.15024645554376526], is_input: true },
  { token: '.', destination: [0.038395651440974454, -0.46548892711627265, -0.6504794715862583], is_input: true },
];

const ASSISTANT_TOKENS: TokenVector[] = [
  { token: 'G', destination: [0.9801735914591101, 0.01117484987736872, 0.9926450061791408], is_input: false },
  { token: 'PT', destination: [0.8442876748482859, 0.993738869803318, -0.9699582986625429], is_input: false },
  { token: ' is', destination: [-0.23435287621675094, -0.729011516923119, -0.2390387346996773], is_input: false },
  { token: ' a', destination: [-0.45800081077089994, -0.5241113246876802, -0.32277384957820154], is_input: false },
  { token: ' large', destination: [-0.695850375126017, 0.030017176578402305, 0.1194130545359493], is_input: false },
  { token: ' language', destination: [-0.793213959638941, 0.5766287225329205, 0.24142875881527504], is_input: false },
  { token: ' model', destination: [-1, 0.641368070793618, 0.2783895814813502], is_input: false },
  { token: ' AI', destination: [-0.9592712427210238, 0.7823042480271183, 0.416999980194547], is_input: false },
  { token: ' system', destination: [-0.6977809560336253, -0.04606662962281638, 0.2510720732122893], is_input: false },
  { token: '.', destination: [-0.2116552545798317, -0.2480484857141918, -0.4474033676024035], is_input: false },
];

const HowItWorksPage: React.FC = () => {
  const { fontSize } = useTextSize();
  const [step, setStep] = useState<StepId>(0);
  const [replayKey, setReplayKey] = useState(0);
  const { language, setLanguage } = useLanguage();
  const [gatherMoveProgress, setGatherMoveProgress] = useState(0);
  const [gatherEffectProgress, setGatherEffectProgress] = useState(0);
  const [growProgress, setGrowProgress] = useState(0);
  const [showFirstOutputToken, setShowFirstOutputToken] = useState(false);
  const [showSecondOutputToken, setShowSecondOutputToken] = useState(false);

  const uiText = useMemo(() => getUiText(language), [language]);
  const steps = useMemo(() => getSteps(language), [language]);

  const clampStep = (value: number): StepId => {
    if (value <= 0) return 0;
    if (value >= 5) return 5;
    return value as StepId;
  };

  const handlePrev = () => setStep((s: StepId) => clampStep(s - 1));
  const handleNext = () => setStep((s: StepId) => clampStep(s + 1));
  const handleReplay = () => setReplayKey((k) => k + 1);

  //토큰 리스트 생성
  const { userTokens, assistantTokens, allTokens } = useMemo(() => {
    return {
      userTokens: USER_TOKENS,
      assistantTokens: ASSISTANT_TOKENS,
      allTokens: [...USER_TOKENS, ...ASSISTANT_TOKENS],
    };
  }, []);

  // Step5에서만 사용할 HomePage와 동일한 애니메이션 훅 (첫 번째~두 번째 아웃풋 토큰)
  const step5Animation = useAnimationTimer(
    2, // 첫 번째와 두 번째 아웃풋 토큰만 (maxSteps = 2)
    assistantTokens.length >= 2 // 항상 데이터가 있다고 가정
  );

  // Step6에서 사용할 HomePage와 동일한 애니메이션 훅 (세 번째~마지막 아웃풋 토큰)
  const step6MaxSteps = Math.max(0, assistantTokens.length - 2); // 3번부터 마지막까지
  const step6Animation = useAnimationTimer(
    step6MaxSteps,
    assistantTokens.length >= 3 // 세 번째 토큰부터 있으면 데이터가 있다고 가정
  );

  // 스텝에 따른 시각화 토큰 / 애니메이션 모드 결정
  const visibleTokens: TokenVector[] = useMemo(() => {
    // Step1~2: input tokens only
    if (step === 0 || step === 1) return userTokens;

    // Step3: show first output token
    if (step === 2) {
      return showFirstOutputToken ? [...userTokens, assistantTokens[0]] : userTokens;
    }

    // Step4: animate second output token
    if (step === 3) {
      if (!assistantTokens[0]) return userTokens;
      return showSecondOutputToken
        ? [...userTokens, assistantTokens[0], assistantTokens[1]]
        : [...userTokens, assistantTokens[0]];
    }

    // Step5: HomePage와 동일한 로직으로 첫 번째~두 번째 아웃풋 토큰 재생
    if (step === 4) {
      if (!assistantTokens[0] || assistantTokens.length < 2) return userTokens;
      
      const baseTokens = [...userTokens, ...assistantTokens.slice(0, step5Animation.animationStep)];
      
      // 성장 중일 때는 성장 중인 토큰도 포함
      if (step5Animation.isGrowing && step5Animation.animationStep < 2) {
        baseTokens.push(assistantTokens[step5Animation.animationStep]);
      }
      
      return baseTokens;
    }

    // Step6: HomePage와 동일한 로직으로 세 번째~마지막 아웃풋 토큰 재생
    if (step === 5) {
      if (assistantTokens.length < 3) return allTokens;
      
      // 첫 두 토큰은 항상 표시
      const firstTwoTokens = assistantTokens.slice(0, 2);
      // 세 번째부터는 animationStep에 따라 표시 (animationStep은 0부터 시작하므로 +2)
      const remainingTokens = assistantTokens.slice(2, 2 + step6Animation.animationStep);
      
      const baseTokens = [...userTokens, ...firstTwoTokens, ...remainingTokens];
      
      // 성장 중일 때는 성장 중인 토큰도 포함
      if (step6Animation.isGrowing && step6Animation.animationStep < step6MaxSteps) {
        const growingTokenIndex = 2 + step6Animation.animationStep;
        if (assistantTokens[growingTokenIndex]) {
          baseTokens.push(assistantTokens[growingTokenIndex]);
        }
      }
      
      return baseTokens;
    }

    // 기본: show all tokens
    return allTokens;
  }, [step, userTokens, assistantTokens, allTokens, showFirstOutputToken, showSecondOutputToken, step5Animation, step6Animation, step6MaxSteps]);

  // Step2: move only / Step3: shrink (then grow) / Step5, Step6: HomePage와 동일한 로직
  const isAnimating = step === 1 || step === 2 || step === 3 || 
    (step === 4 && step5Animation.isGathering) || 
    (step === 5 && step6Animation.isGathering);
  const isGrowing =
    (step === 2 && showFirstOutputToken) ||
    (step === 3 && showSecondOutputToken) ||
    (step === 4 && step5Animation.isGrowing) ||
    (step === 5 && step6Animation.isGrowing);

  // 모여들기 목표 지점: User 마지막 토큰과 첫 Assistant 토큰의 중간 지점을 "컨텍스트"처럼 사용
  const targetPosition: Vector3Tuple = useMemo(() => {
    if (userTokens.length === 0) return [0, 0, 0];

    // Step5: HomePage와 동일한 로직으로 계산
    if (step === 4 && assistantTokens.length >= 2) {
      const animationStep = step5Animation.animationStep;
      
      // api호출결과가 없거나 애니메이션이 끝까지 간경우
      if (animationStep >= 2) {
        return [0, 0, 0];
      }

      // animationStep번째 출력 토큰
      const nextOutputToken = assistantTokens[animationStep];

      // 혹시 범위 밖인 경우를 위한 방어
      if (!nextOutputToken) return [0, 0, 0];

      // 시작점 계산: 원점 or 이전토큰 목적지
      let startPoint: Vector3Tuple = [0, 0, 0];
      if (animationStep > 0) {
        // 이전 출력 토큰 destination
        startPoint = assistantTokens[animationStep - 1].destination as Vector3Tuple;
      } else if (userTokens.length > 0) {
        // 첫 출력 토큰이면 마지막 입력 토큰의 destination
        startPoint = userTokens[userTokens.length - 1].destination as Vector3Tuple;
      }

      // 끝점, 다음 출력 토큰의 destination
      const endPoint = nextOutputToken.destination as Vector3Tuple;

      // 중간점 계산
      return calculateMidpoint(startPoint, endPoint);
    }

    // Step6: HomePage와 동일한 로직으로 계산 (세 번째부터 마지막까지)
    if (step === 5 && assistantTokens.length >= 3) {
      const animationStep = step6Animation.animationStep;
      
      // 애니메이션이 끝까지 간경우
      if (animationStep >= step6MaxSteps) {
        return [0, 0, 0];
      }

      // 세 번째 토큰부터 시작하므로 인덱스는 2 + animationStep
      const nextOutputTokenIndex = 2 + animationStep;
      const nextOutputToken = assistantTokens[nextOutputTokenIndex];

      // 혹시 범위 밖인 경우를 위한 방어
      if (!nextOutputToken) return [0, 0, 0];

      // 시작점 계산: 이전 출력 토큰 목적지 (첫 번째는 assistantTokens[1])
      let startPoint: Vector3Tuple = [0, 0, 0];
      if (animationStep > 0) {
        // 이전 출력 토큰 destination (2 + animationStep - 1 = 1 + animationStep)
        startPoint = assistantTokens[1 + animationStep].destination as Vector3Tuple;
      } else {
        // 첫 번째 (세 번째 토큰)이면 두 번째 토큰의 destination
        startPoint = assistantTokens[1].destination as Vector3Tuple;
      }

      // 끝점, 다음 출력 토큰의 destination
      const endPoint = nextOutputToken.destination as Vector3Tuple;

      // 중간점 계산
      return calculateMidpoint(startPoint, endPoint);
    }

    if (step === 3 && assistantTokens.length > 1) {
      const startPoint = assistantTokens[0].destination as Vector3Tuple;
      const endPoint = assistantTokens[1].destination as Vector3Tuple;
      return calculateMidpoint(startPoint, endPoint);
    }

    const startPoint = userTokens[userTokens.length - 1].destination as Vector3Tuple;
    const firstAssistant = assistantTokens[0];
    if (!firstAssistant) return startPoint;
    const endPoint = firstAssistant.destination as Vector3Tuple;
    return calculateMidpoint(startPoint, endPoint);
  }, [step, userTokens, assistantTokens, step5Animation.animationStep, step6Animation.animationStep, step6MaxSteps]);

  // 스텝별 애니메이션 진행(한 번 재생)
  // Step5는 useAnimationTimer를 사용하므로 여기서는 제외
  useEffect(() => {
    // Step5는 useAnimationTimer가 처리하므로 스킵
    if (step === 4) return;

    setGatherMoveProgress(0);
    setGatherEffectProgress(0);
    setGrowProgress(0);
    setShowFirstOutputToken(false);
    setShowSecondOutputToken(false);

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

      // Step3(=step===2): shrink then grow first output token
      if (step === 2) {
        setGatherMoveProgress(1);

        const shrinkDuration = 650;
        const growDuration = 1100;

        if (elapsed < shrinkDuration) {
          const effectT = Math.min(1, elapsed / shrinkDuration);
          setGatherEffectProgress(effectT);
          setGrowProgress(0);
          setShowFirstOutputToken(false);
          raf = window.requestAnimationFrame(run);
          return;
        }

        setGatherEffectProgress(1);
        setShowFirstOutputToken(true);
        const growElapsed = elapsed - shrinkDuration;
        const growT = Math.min(1, growElapsed / growDuration);
        setGrowProgress(growT);
        if (growT < 1) raf = window.requestAnimationFrame(run);
      }

      // Step4(=step===3): gather then show second output token
      if (step === 3) {
        const gatherDuration = 1200;
        const shrinkDuration = 650;
        const growDuration = 1100;

        if (elapsed < gatherDuration) {
          const moveT = Math.min(1, elapsed / gatherDuration);
          setGatherMoveProgress(moveT);
          setGatherEffectProgress(0);
          setGrowProgress(0);
          setShowSecondOutputToken(false);
          if (moveT < 1) raf = window.requestAnimationFrame(run);
          return;
        }

        setGatherMoveProgress(1);

        const afterGatherElapsed = elapsed - gatherDuration;
        if (afterGatherElapsed < shrinkDuration) {
          const effectT = Math.min(1, afterGatherElapsed / shrinkDuration);
          setGatherEffectProgress(effectT);
          setGrowProgress(0);
          setShowSecondOutputToken(false);
          raf = window.requestAnimationFrame(run);
          return;
        }

        setGatherEffectProgress(1);
        setShowSecondOutputToken(true);
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

  // Step5: HomePage와 동일한 로직으로 자동 재생 시작
  const { resetAnimation: resetStep5Animation, setIsPlaying: setStep5Playing } = step5Animation;
  useEffect(() => {
    if (step === 4 && assistantTokens.length >= 2) {
      // 리셋 후 재생 시작
      resetStep5Animation();
      // 상태 업데이트가 완료된 후 재생 시작
      const timer = setTimeout(() => {
        setStep5Playing(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (step !== 4) {
      // 다른 스텝으로 이동하면 재생 중지
      setStep5Playing(false);
    }
  }, [step, replayKey, assistantTokens.length, resetStep5Animation, setStep5Playing]);

  // Step6: HomePage와 동일한 로직으로 자동 재생 시작 (세 번째~마지막 아웃풋 토큰)
  const { resetAnimation: resetStep6Animation, setIsPlaying: setStep6Playing } = step6Animation;
  useEffect(() => {
    if (step === 5 && assistantTokens.length >= 3) {
      // 리셋 후 재생 시작
      resetStep6Animation();
      // 상태 업데이트가 완료된 후 재생 시작
      const timer = setTimeout(() => {
        setStep6Playing(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (step !== 5) {
      // 다른 스텝으로 이동하면 재생 중지
      setStep6Playing(false);
    }
  }, [step, replayKey, assistantTokens.length, resetStep6Animation, setStep6Playing]);

  return (
    <div className={styles.container}>
      {/* 텍스트 크기 조정 슬라이더 */}
      <TextSizeSlider />
      
      <TokenVisualization
        tokens={visibleTokens}
        isAnimating={
          step === 4 ? step5Animation.isGathering : 
          step === 5 ? step6Animation.isGathering : 
          isAnimating
        }
        animationProgress={
          step === 4 ? step5Animation.gatherProgress : 
          step === 5 ? step6Animation.gatherProgress : 
          gatherMoveProgress
        }
        gatherEffectProgress={step === 4 || step === 5 ? 0 : gatherEffectProgress}
        targetPosition={targetPosition}
        isGrowing={isGrowing}
        growProgress={
          step === 4 ? step5Animation.growProgress : 
          step === 5 ? step6Animation.growProgress : 
          growProgress
        }
        fontSize={fontSize}
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
          <button className={styles.navButton} type="button" onClick={handleNext} disabled={step === 5}>
            {uiText.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;

