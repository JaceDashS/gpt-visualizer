import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { TokenVector } from '../services/api';
import { VectorArrow, TokenLabel, GatheringToken } from './visualization';
import {
  CAMERA_MIN_POLAR_ANGLE,
  CAMERA_MAX_POLAR_ANGLE,
  CAMERA_POSITION,
  CAMERA_FOV,
  ORBIT_DAMPING_FACTOR,
  AXES_HELPER_SIZE,
  ORIGIN_SPHERE_RADIUS,
  TOKEN_FONT_SIZE,
  CHAR_WIDTH_RATIO,
  SPACE_WIDTH_RATIO,
  INPUT_TOKEN_COLOR,
  OUTPUT_TOKEN_COLOR,
} from '../constants';
import styles from './TokenVisualization.module.css';
import { Vector3Tuple } from '../utils/vectorMath';

interface TokenData {
  token: string;
  position: Vector3Tuple;
  isInput: boolean;
}

interface TokenVisualizationProps {
  tokens: TokenVector[];
  isAnimating?: boolean;
  animationProgress?: number;
  targetPosition?: Vector3Tuple;
  isGrowing?: boolean;
  growProgress?: number;
}

// 전체 시각화 (좌표나 화살표등을 랜더링해줌)
const TokenVisualization: React.FC<TokenVisualizationProps> = ({
  tokens,
  isAnimating = false,
  animationProgress = 0,
  targetPosition = [0, 0, 0],
  isGrowing = false,
  growProgress = 1,
}) => {
  // 시작점을 클라이언트에서 추적하며 토큰 위치 계산
  const calculateTokenPositions = (): TokenData[] => {
    const tokenData: TokenData[] = [];
    let currentStart: Vector3Tuple = [0, 0, 0];

    let i = 0;
    while (i < tokens.length) {
      const tv = tokens[i];
      const startVec = new THREE.Vector3(...currentStart);
      const endVec = new THREE.Vector3(...tv.destination);

      const direction = new THREE.Vector3().subVectors(endVec, startVec);
      const length = direction.length();

      if (length === 0) {
        // 연속된 길이0의 벡터가 있는지 찾아야함.
        // 따로 분류하지 않으면 텍스트가 겹침
        const zeroLengthGroup: number[] = [];
        let j = i;
        let groupStart = currentStart;

        // 연속된 길이 0 벡터 수집
        while (j < tokens.length) {
          const currentTv = tokens[j];
          const currentStartVec = new THREE.Vector3(...groupStart);
          const currentEndVec = new THREE.Vector3(...currentTv.destination);
          const currentDir = new THREE.Vector3().subVectors(currentEndVec, currentStartVec);

          if (currentDir.length() === 0) {
            zeroLengthGroup.push(j);
            j++;
          } else {
            break;
          }
        }

        // 그룹 내에서 연속된 같은 타입의 토큰들을 묶어서 하나의 텍스트로 표시
        // 타입이 바뀌면 색상도 바뀌지만 같은 줄에 표시
        const centerPosition = new THREE.Vector3(...tv.destination);
        const fontSize = TOKEN_FONT_SIZE;
        const charWidth = fontSize * CHAR_WIDTH_RATIO;
        const spaceWidth = fontSize * SPACE_WIDTH_RATIO;

        // 전체 그룹의 총 너비 계산 (중앙 정렬을 위해)
        let totalWidth = 0;
        const groups: Array<{ tokens: number[]; isInput: boolean; text: string }> = [];

        let i_group = 0;
        while (i_group < zeroLengthGroup.length) {
          // 연속된 같은 타입의 토큰들을 그룹화
          const startIdx = zeroLengthGroup[i_group];
          const startType = tokens[startIdx].is_input;
          const groupTokens: number[] = [startIdx];

          // 같은 타입의 연속된 토큰들 수집
          let j_group = i_group + 1;
          while (j_group < zeroLengthGroup.length && tokens[zeroLengthGroup[j_group]].is_input === startType) {
            groupTokens.push(zeroLengthGroup[j_group]);
            j_group++;
          }

          // 그룹의 토큰들을 하나의 텍스트로 합치기
          const combinedTokens = groupTokens.map(idx => tokens[idx].token).join(' ');
          const textWidth = combinedTokens.length * charWidth + (groupTokens.length - 1) * spaceWidth;

          groups.push({
            tokens: groupTokens,
            isInput: startType,
            text: combinedTokens,
          });

          totalWidth += textWidth;
          if (j_group < zeroLengthGroup.length) {
            totalWidth += spaceWidth; // 그룹 사이 공백
          }

          i_group = j_group;
        }

        // 각 그룹을 중앙 정렬하여 배치
        let currentX = -totalWidth / 2;
        groups.forEach(group => {
          const textWidth = group.text.length * charWidth + (group.tokens.length - 1) * spaceWidth;
          const groupPosition = new THREE.Vector3(
            centerPosition.x + currentX + textWidth / 2,
            centerPosition.y,
            centerPosition.z
          );

          tokenData.push({
            token: group.text,
            position: [groupPosition.x, groupPosition.y, groupPosition.z],
            isInput: group.isInput,
          });

          currentX += textWidth + spaceWidth;
        });

        currentStart = tv.destination;
        i = j;
      } else {
        // 길이가 0이 아닌 경우: 항상 화살표 중간에 텍스트 배치
        const midPoint = new THREE.Vector3()
          .addVectors(startVec, endVec)
          .multiplyScalar(0.5);

        tokenData.push({
          token: tv.token,
          position: [midPoint.x, midPoint.y, midPoint.z],
          isInput: tv.is_input,
        });

        // 다음 벡터의 시작점은 현재 목적지
        currentStart = tv.destination;
        i++;
      }
    }

    return tokenData;
  };

  const tokenData = calculateTokenPositions();

  // 화살표 렌더링을 위한 시작점 추적
  const getArrowData = () => {
    const arrows: Array<{ start: Vector3Tuple; end: Vector3Tuple; color: string }> = [];
    let currentStart: Vector3Tuple = [0, 0, 0];

    for (const tv of tokens) {
      arrows.push({
        start: currentStart,
        end: tv.destination,
        color: tv.is_input ? INPUT_TOKEN_COLOR : OUTPUT_TOKEN_COLOR,
      });
      currentStart = tv.destination;
    }

    return arrows;
  };

  const arrowData = getArrowData();

  return (
    <div className={styles.container}>
      <Canvas camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {arrowData.map((arrow, idx) => {
          // 성장 중인 마지막 벡터인지 확인
          const isGrowingArrow = isGrowing && idx === arrowData.length - 1;
          return (
            <VectorArrow
              key={idx}
              start={arrow.start}
              end={arrow.end}
              color={arrow.color}
              growProgress={isGrowingArrow ? growProgress : 1}
            />
          );
        })}

        {tokenData.map((data, idx) => (
          <TokenLabel
            key={idx}
            position={data.position}
            token={data.token}
            isInput={data.isInput}
          />
        ))}

        {/* 모여드는 토큰 애니메이션 */}
        {isAnimating && tokenData.map((data, idx) => (
          <GatheringToken
            key={`gathering-${idx}`}
            startPosition={data.position}
            targetPosition={targetPosition}
            token={data.token}
            isInput={data.isInput}
            progress={animationProgress}
          />
        ))}

        {/* 원점 표시 구 */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[ORIGIN_SPHERE_RADIUS, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        <axesHelper args={[AXES_HELPER_SIZE]} />

        {/* 각도를 제한하지 않으면 선을 중심으로 글자가 회전함 */}
        <OrbitControls
          enableDamping
          dampingFactor={ORBIT_DAMPING_FACTOR}
          minPolarAngle={CAMERA_MIN_POLAR_ANGLE}
          maxPolarAngle={CAMERA_MAX_POLAR_ANGLE}
        />
      </Canvas>
    </div>
  );
};

export default TokenVisualization;
