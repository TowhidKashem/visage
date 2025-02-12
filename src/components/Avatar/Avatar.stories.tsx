import React, { useState, useEffect } from 'react';
import { StoryFn } from '@storybook/react';
import { getStoryAssetPath } from 'src/services';
import { Vector3 } from 'three';
import { Sparkles as SparklesDrei } from '@react-three/drei';
import { FileDropper } from 'src/components/FileDropper/FileDropper.component';
import { environmentPresets } from 'src/services/Environment.service';
import { ignoreArgTypesOnExamples, modelPresets, animationPresets } from 'src/services/Stories.service';
import { Avatar as AvatarWrapper, CAMERA } from './index';
import { AvatarProps } from './Avatar.component';

const Avatar = (args: AvatarProps) => <AvatarWrapper {...args}>{args.children}</AvatarWrapper>;
const Sparkles: StoryFn<typeof SparklesDrei> = (args: any) => <SparklesDrei {...args} />;

const Template: StoryFn<typeof Avatar> = (args) => <Avatar {...args} />;
const DropTemplate: StoryFn<typeof Avatar> = (args) => (
  <FileDropper>
    <Avatar {...args} />
  </FileDropper>
);
export const Static: StoryFn<typeof Avatar> = Template.bind({});
Static.args = {
  modelSrc: getStoryAssetPath('female.glb'),
  animationSrc: undefined,
  poseSrc: undefined,
  environment: 'hub',
  scale: 1,
  shadows: true,
  idleRotation: false,
  headMovement: false,
  ambientLightColor: '#fff5b6',
  dirLightColor: '#002aff',
  spotLightColor: '#fff5b6',
  ambientLightIntensity: 0.25,
  dirLightIntensity: 5,
  spotLightIntensity: 1,
  dirLightPosition: new Vector3(-3, 5, -5),
  spotLightPosition: new Vector3(12, 10, 7.5),
  spotLightAngle: 0.314,
  fov: 50,
  cameraZoomTarget: CAMERA.CONTROLS.FULL_BODY.ZOOM_TARGET,
  cameraInitialDistance: CAMERA.CONTROLS.FULL_BODY.MAX_DISTANCE,
  cameraTarget: CAMERA.TARGET.FULL_BODY.FEMALE,
  bloom: {
    luminanceThreshold: 1.0,
    luminanceSmoothing: 1.0,
    mipmapBlur: true,
    kernelSize: 1,
    intensity: 0.1,
    materialIntensity: 3.3
  },
  background: {
    color: 'rgb(9,20,26)'
  },
  style: {},
  /* eslint-disable no-console */
  onLoaded: () => console.info('EVENT: static avatar loaded'),
  onLoading: () => console.info('EVENT: loading static avatar')
  /* eslint-enable no-console */
};
Static.argTypes = {
  headMovement: { control: false },
  halfBody: { control: false },
  animationSrc: { control: false },
  poseSrc: { control: false },
  fov: { control: { type: 'range', min: 30, max: 100, step: 1 } }
};

const initialValue = 1.0;
const maxValue = 9.0;
const stepSize = 0.3;
const animationUpdateStepMs = 60;

export const Showcase: StoryFn<typeof Avatar> = (args: AvatarProps & { ambientOcclusion?: boolean }) => {
  const [currentValue, setCurrentValue] = useState(args.bloom?.materialIntensity);
  const [increasing, setIncreasing] = useState(true);
  const pulsatingBloom = {
    ...args.bloom,
    intensity: 1.0,
    materialIntensity: currentValue
  };

  useEffect(() => {
    const animationInterval = setInterval(() => {
      if (args?.ambientOcclusion) {
        return;
      }

      if (increasing) {
        setCurrentValue((prevValue) => {
          const newValue = prevValue! + stepSize;
          if (newValue >= maxValue) {
            setIncreasing(false);
            return maxValue;
          }
          return newValue;
        });
      } else {
        setCurrentValue((prevValue) => {
          const newValue = prevValue! - stepSize;
          if (newValue <= initialValue) {
            setIncreasing(true);
            return initialValue;
          }
          return newValue;
        });
      }
    }, animationUpdateStepMs);

    return () => clearInterval(animationInterval);
  }, [currentValue, increasing, initialValue, maxValue, args?.ambientOcclusion]);

  return (
    <Avatar {...args} bloom={pulsatingBloom} effects={{ ambientOcclusion: args?.ambientOcclusion }}>
      <Sparkles color="white" count={50} opacity={0.9} scale={5} size={0.5} speed={0.35} />
    </Avatar>
  );
};
Showcase.args = {
  cameraTarget: CAMERA.TARGET.FULL_BODY.FEMALE,
  cameraInitialDistance: CAMERA.CONTROLS.FULL_BODY.MAX_DISTANCE,
  modelSrc: modelPresets.one,
  animationSrc: animationPresets.one,
  scale: 1.0,
  bloom: {
    luminanceThreshold: 1.0,
    luminanceSmoothing: 1.0,
    mipmapBlur: true,
    kernelSize: 1,
    intensity: 1,
    materialIntensity: 1
  },
  background: {
    color: '#282038'
  },
  dpr: 2,
  ambientLightColor: '#ffffff',
  dirLightColor: '#ffffff',
  spotLightColor: '#adbfe5',
  ambientLightIntensity: 0,
  dirLightIntensity: 2.2,
  spotLightIntensity: 0.5,
  environment: 'apartment',
  shadows: true,
  emotion: {
    jawOpen: 0.1,
    mouthSmileLeft: 0.2,
    mouthSmileRight: 0.1,
    mouthPressLeft: 0.1,
    cheekSquintLeft: 0.3,
    eyeLookOutLeft: 0.6,
    eyeLookInRight: 0.6,
    mouthDimpleLeft: 0.3
  },
  // @ts-ignore
  ambientOcclusion: false
};
Showcase.argTypes = {
  ...ignoreArgTypesOnExamples,
  modelSrc: { options: Object.values(modelPresets), control: { type: 'select' } },
  animationSrc: { options: Object.values(animationPresets), control: { type: 'select' } },
  environment: { table: { disable: true } },
  ambientLightColor: { table: { disable: true } },
  dirLightColor: { table: { disable: true } },
  spotLightColor: { table: { disable: true } },
  ambientLightIntensity: { table: { disable: true } },
  dirLightIntensity: { table: { disable: true } },
  spotLightIntensity: { table: { disable: true } },
  fov: { table: { disable: true } }
};

export const Animated: StoryFn<typeof Avatar> = Template.bind({});
Animated.args = {
  ...Static.args,
  emotion: undefined,
  modelSrc: getStoryAssetPath('male-emissive.glb'),
  animationSrc: getStoryAssetPath('male-idle.glb'),
  cameraTarget: CAMERA.TARGET.FULL_BODY.MALE,
  cameraInitialDistance: CAMERA.CONTROLS.FULL_BODY.MAX_DISTANCE,
  /* eslint-disable no-console */
  onLoaded: () => console.info('EVENT: animated avatar loaded'),
  onLoading: () => console.info('EVENT: loading animated avatar')
  /* eslint-enable no-console */
};
Animated.argTypes = {
  poseSrc: { control: false },
  emotion: { control: false },
  fov: { control: { type: 'range', min: 30, max: 100, step: 1 } }
};

export const HalfBody: StoryFn<typeof Avatar> = Template.bind({});
HalfBody.args = {
  ...Static.args,
  modelSrc: getStoryAssetPath('half-body.glb'),
  halfBody: true,
  cameraTarget: CAMERA.TARGET.HALF_BODY,
  cameraInitialDistance: CAMERA.INITIAL_DISTANCE.HALF_BODY,
  /* eslint-disable no-console */
  onLoaded: () => console.info('EVENT: half body avatar loaded'),
  onLoading: () => console.info('EVENT: loading half body avatar')
  /* eslint-enable no-console */
};

/* eslint-disable */
export const _DragNDrop: StoryFn<typeof Avatar> = DropTemplate.bind({});
_DragNDrop.args = {
  ...Static.args,
  modelSrc: undefined,
  animationSrc: undefined,
  poseSrc: '',
  environment: 'city',
  cameraTarget: CAMERA.TARGET.FULL_BODY.FEMALE,
  cameraInitialDistance: CAMERA.CONTROLS.FULL_BODY.MAX_DISTANCE,
  /* eslint-disable no-console */
  onLoaded: () => console.info('EVENT: binary file loaded'),
  onLoading: () => console.info('EVENT: loading avatar from binary file')
  /* eslint-enable no-console */
};
_DragNDrop.argTypes = {
  modelSrc: { control: false },
  animationSrc: { control: false },
  headMovement: { control: false },
  environment: { control: { type: 'text' } }
};
/* eslint-enable */

export default {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    ambientLightColor: { control: 'color' },
    dirLightColor: { control: 'color' },
    spotLightColor: { control: 'color' },
    ambientLightIntensity: { control: { type: 'range', min: 0, max: 20, step: 0.1 } },
    dirLightIntensity: { control: { type: 'range', min: 0, max: 20, step: 0.1 } },
    spotLightIntensity: { control: { type: 'range', min: 0, max: 20, step: 0.1 } },
    spotLightAngle: { control: { type: 'range', min: 0, max: 10, step: 0.01 } },
    cameraTarget: { control: { type: 'range', min: 0, max: 10, step: 0.01 } },
    scale: { control: { type: 'range', min: 0.01, max: 10, step: 0.01 } },
    cameraInitialDistance: { control: { type: 'range', min: 0, max: 2.5, step: 0.01 } },
    onLoaded: { control: false },
    environment: { options: Object.keys(environmentPresets), control: { type: 'select' } },
    fov: { control: { type: 'range', min: 30, max: 100, step: 1 } }
  }
};
