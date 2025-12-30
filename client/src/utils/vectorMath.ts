import * as THREE from 'three';

export type Vector3Tuple = [number, number, number];

/**
 * 
 */
export const calculateMidpoint = (
  start: Vector3Tuple,
  end: Vector3Tuple
): Vector3Tuple => {
  return [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];
};

export const calculateVectorLength = (
  start: Vector3Tuple,
  end: Vector3Tuple
): number => {
  const direction = new THREE.Vector3().subVectors(
    new THREE.Vector3(...end),
    new THREE.Vector3(...start)
  );
  return direction.length();
};

/**
 * 벡터의 성장에 쓰임 
 * @param start 
 * @param end 
 * @param t Interpolation factor (0 to 1)
 * @returns 
 */
export const lerpVector3 = (
  start: Vector3Tuple,
  end: Vector3Tuple,
  t: number
): Vector3Tuple => {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  ];
};

export const calculateDirection = (
  start: Vector3Tuple,
  end: Vector3Tuple
): THREE.Vector3 => {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  return new THREE.Vector3().subVectors(endVec, startVec).normalize();
};

/**
 * 각 차원의 합이 음수인 경우 해당 차원을 반전시켜 벡터들이 전방을 향하도록 조정
 * @param tokens 토큰 벡터 배열
 * @returns 방향이 조정된 토큰 벡터 배열
 */
export const flipDimensionsToForward = (tokens: Array<{ destination: Vector3Tuple }>): Array<{ destination: Vector3Tuple }> => {
  if (tokens.length === 0) return tokens;

  // 각 차원의 합 계산
  let sumX = 0, sumY = 0, sumZ = 0;
  for (const token of tokens) {
    const [x, y, z] = token.destination;
    sumX += x;
    sumY += y;
    sumZ += z;
  }

  // 각 차원을 독립적으로 판단: 합이 음수면 해당 차원만 반전
  const flipX = sumX < 0;
  const flipY = sumY < 0;
  const flipZ = sumZ < 0;

  // 반전이 필요 없는 경우 원본 반환
  if (!flipX && !flipY && !flipZ) {
    return tokens;
  }

  // 해당 차원만 반전
  return tokens.map(token => {
    const [x, y, z] = token.destination;
    return {
      ...token,
      destination: [
        flipX ? -x : x,
        flipY ? -y : y,
        flipZ ? -z : z,
      ] as Vector3Tuple,
    };
  });
};

