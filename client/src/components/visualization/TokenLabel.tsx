import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TEXT_OFFSET_Y, INPUT_TOKEN_COLOR, OUTPUT_TOKEN_COLOR } from '../../constants';
import { useTextSize } from '../../contexts/TextSizeContext';
import { Vector3Tuple } from '../../utils/vectorMath';

interface TokenLabelProps {
  position: Vector3Tuple;
  token: string;
  isInput: boolean;
  opacity?: number;
}

// 토큰 텍스트 컴포넌트 
// 선 위에 항상 카메라를 향하는 텍스트 표시
const TokenLabel: React.FC<TokenLabelProps> = ({
  position,
  token,
  isInput,
  opacity = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { fontSize } = useTextSize();

  // 문자가 사용자가 보고있는 방향을 항상 보게 함 
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group position={[0, TEXT_OFFSET_Y, 0]}>
        <Text
          fontSize={fontSize}
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

export default TokenLabel;


