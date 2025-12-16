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

