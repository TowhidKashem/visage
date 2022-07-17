import React, { FC, MutableRefObject } from 'react';
import { useGraph, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import { Model } from 'src/components/Models/Model';
import { Group } from 'three';
import { mutatePose, useEmotion } from 'src/services';
import { EmotionVariantsType } from '../../../types';

interface PoseModelProps {
  modelUrl: string;
  poseUrl: string;
  modelRef?: MutableRefObject<Group | undefined>;
  scale?: number;
  emotion?: EmotionVariantsType;
}

export const PoseModel: FC<PoseModelProps> = ({ modelUrl, poseUrl, modelRef, scale = 1, emotion = 'idle' }) => {
  const { scene } = useLoader(GLTFLoader, modelUrl);
  const { nodes } = useGraph(scene);
  const pose = useLoader(GLTFLoader, poseUrl);
  const { nodes: sourceNodes } = useGraph(pose.scene);

  useEmotion(nodes, emotion);
  mutatePose(sourceNodes, nodes);

  return <Model modelRef={modelRef} scene={scene} scale={scale} />;
};
