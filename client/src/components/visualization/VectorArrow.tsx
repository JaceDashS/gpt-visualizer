import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { ARROW_HEAD_LENGTH_RATIO, ARROW_HEAD_MAX_LENGTH, ARROW_HEAD_WIDTH_RATIO } from '../../constants';
import { Vector3Tuple } from '../../utils/vectorMath';

interface VectorArrowProps {
  start: Vector3Tuple;
  end: Vector3Tuple;
  color?: string;
  growProgress?: number; // 0~1, 1이면 완전히 그려짐
}

// 벡터 화살표 컴포넌트 (시작점-끝점 방식)
const VectorArrow: React.FC<VectorArrowProps> = ({
  start,
  end,
  color = '#4a90e2',
  growProgress = 1,
}) => {
  const [arrow, setArrow] = useState<THREE.ArrowHelper | null>(null);

  useEffect(() => {
    const startVec = new THREE.Vector3(...start);
    const fullEndVec = new THREE.Vector3(...end);

    // arrow 성장 진행도에 따라 끝점 계산
    const currentEndVec = new THREE.Vector3().lerpVectors(startVec, fullEndVec, growProgress);

    // 방향 벡터 계산
    const direction = new THREE.Vector3().subVectors(currentEndVec, startVec);
    const length = direction.length();

    if (length === 0 || growProgress === 0) {
      setArrow(null);
      return;
    }

    const dir = direction.normalize();

    // 정리를 위한 이전 arrow 저장
    const previousArrow = arrow;

    // 새로운 arrow 생성
    const headLength = Math.min(length * ARROW_HEAD_LENGTH_RATIO, ARROW_HEAD_MAX_LENGTH); // 머리길이 벡터 길이의 10% ~ 15퍼
    const headWidth = headLength * ARROW_HEAD_WIDTH_RATIO; // 머리 너비는 길이의 40%
    const newArrow = new THREE.ArrowHelper(dir, startVec, length, color, headLength, headWidth);
    setArrow(newArrow);

    // 이전 arrow 정리
    return () => {
      if (previousArrow) {
        if (previousArrow.line) {
          previousArrow.line.geometry.dispose();
          (previousArrow.line.material as THREE.Material).dispose();
        }
        if (previousArrow.cone) {
          previousArrow.cone.geometry.dispose();
          (previousArrow.cone.material as THREE.Material).dispose();
        }
      }
    };
  }, [start, end, color, growProgress]);

  if (!arrow) {
    return null;
  }

  return <primitive object={arrow} />;
};

export default VectorArrow;
