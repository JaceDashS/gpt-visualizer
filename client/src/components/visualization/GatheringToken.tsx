import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  TEXT_OFFSET_Y,
  GATHERING_TOKEN_FONT_SIZE,
  GATHERING_TOKEN_OPACITY_BASE,
  GATHERING_TOKEN_OPACITY_FADE_START,
  GATHERING_TOKEN_SCALE_SHRINK_START,
  INPUT_TOKEN_COLOR,
  OUTPUT_TOKEN_COLOR,
} from '../../constants';
import { Vector3Tuple, lerpVector3 } from '../../utils/vectorMath';

interface GatheringTokenProps {
  startPosition: Vector3Tuple;
  targetPosition: Vector3Tuple;
  token: string;
  isInput: boolean;
  progress: number; // 0~1
}

// 텍스트가 모여드는 토큰 애니메이션 컴포넌트
const GatheringToken: React.FC<GatheringTokenProps> = ({
  startPosition,
  targetPosition,
  token,
  isInput,
  progress,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // 현재 위치 계산 (lerp)
  const currentPosition = lerpVector3(startPosition, targetPosition, progress);

  // progress 기반으로 계산이 필요한 값만 로컬 변수로 분리
  // fadeStart 지점에서 opacity가 끊기지 않도록 multiplier를 유도함:
  // base === (1 - fadeStart) * multiplier  =>  multiplier = base / (1 - fadeStart)
  const opacityFade = (1 - progress) * (GATHERING_TOKEN_OPACITY_BASE / (1 - GATHERING_TOKEN_OPACITY_FADE_START));
  // shrinkStart 지점에서 scale이 끊기지 않도록 multiplier를 유도함:
  // scale = 1 - (progress - start) * multiplier, progress=1일 때 scale=0을 목표
  // 0 = 1 - (1 - start) * multiplier  =>  multiplier = 1 / (1 - start)
  const shrinkAmount = (progress - GATHERING_TOKEN_SCALE_SHRINK_START) * (1 / (1 - GATHERING_TOKEN_SCALE_SHRINK_START));

  // 진행도에 따라 투명도 조절 (마지막에 사라짐)
  const opacity =
    progress < GATHERING_TOKEN_OPACITY_FADE_START
      ? GATHERING_TOKEN_OPACITY_BASE
      : opacityFade;

  // 진행도에 따라 크기 조절 (마지막에 작아짐)
  const scale =
    progress < GATHERING_TOKEN_SCALE_SHRINK_START
      ? 1
      : 1 - shrinkAmount;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={currentPosition} scale={[scale, scale, scale]}>
      <group position={[0, TEXT_OFFSET_Y, 0]}>
        <Text
          fontSize={GATHERING_TOKEN_FONT_SIZE}
          color={isInput ? INPUT_TOKEN_COLOR : OUTPUT_TOKEN_COLOR}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity}
        >
          {token}
        </Text>
      </group>
    </group>
  );
};

export default GatheringToken;
