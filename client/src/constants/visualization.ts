// 텍스트가 벡터 위로 올라가는 거리
export const TEXT_OFFSET_Y = 0.2;

// 카메라 수직 회전 각도 제한 (도 단위)
export const CAMERA_MIN_POLAR_ANGLE_DEG = 10; // 위쪽 제한
export const CAMERA_MAX_POLAR_ANGLE_DEG = 170; // 아래쪽 제한
export const CAMERA_MIN_POLAR_ANGLE = CAMERA_MIN_POLAR_ANGLE_DEG * Math.PI / 180;
export const CAMERA_MAX_POLAR_ANGLE = CAMERA_MAX_POLAR_ANGLE_DEG * Math.PI / 180;

// 머리길이 벡터 길이의 10% ~ 15퍼
export const ARROW_HEAD_LENGTH_RATIO = 0.1;
export const ARROW_HEAD_MAX_LENGTH = 0.15;
// 머리 너비는 길이의 40%
export const ARROW_HEAD_WIDTH_RATIO = 0.4;

// Text 컴포넌트의 fontSize와 일치
export const TOKEN_FONT_SIZE = 0.15;
export const GATHERING_TOKEN_FONT_SIZE = 0.12;
// 기본 텍스트 크기 (슬라이더 기본값)
export const DEFAULT_FONT_SIZE = 0.1;
// 모여드는 토큰 애니메이션 파라미터
export const GATHERING_TOKEN_OPACITY_BASE = 0.7; // 페이드 시작전 고정 투명도 
export const GATHERING_TOKEN_OPACITY_FADE_START = 0.9; // 이 지점부터 사라지기 시작
export const GATHERING_TOKEN_SCALE_SHRINK_START = 0.8; // 이 지점부터 작아지기 시작
// 각 문자의 대략적인 너비
export const CHAR_WIDTH_RATIO = 0.6;
// 공백의 너비
export const SPACE_WIDTH_RATIO = 0.3;

// Origin sphere
export const ORIGIN_SPHERE_RADIUS = 0.05;

// Axes helper
export const AXES_HELPER_SIZE = 2;

// Camera settings
export const CAMERA_POSITION: [number, number, number] = [5, 5, 5];
export const CAMERA_FOV = 50;

// OrbitControls settings
export const ORBIT_DAMPING_FACTOR = 0.05;
