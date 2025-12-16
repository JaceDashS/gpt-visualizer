// 애니메이션 프레임 설정
export const TARGET_FPS = 60; //프레임 수정하려면 이거만 수정하면됨
export const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

// 애니메이션 진행도 증가량 (프레임당)
export const GATHER_PROGRESS_INCREMENT = 0.05;
export const GROW_PROGRESS_INCREMENT = 0.04;

// 애니메이션 딜레이 (ms)
export const AUTO_PLAY_DELAY = 300;

// 애니메이션 속도 제한
export const MIN_ANIMATION_SPEED = 0.25;
export const MAX_ANIMATION_SPEED = 3;
export const ANIMATION_SPEED_STEP = 0.25;
export const DEFAULT_ANIMATION_SPEED = 1;
