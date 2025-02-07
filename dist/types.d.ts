import React, { FC, CSSProperties, ReactNode, Ref } from 'react';
import { CameraProps, EnvironmentProps, BaseModelProps, LightingProps, BloomConfiguration, SpawnState, EffectConfiguration } from './src/types';
import { CaptureType } from './src/components/Capture/Capture.component';
import { Vector3, Camera, Group } from 'three';
import { OrbitControls } from 'three-stdlib';
import { Dpr } from '@react-three/fiber';
import { Background } from './src/components/Background/Box/Box.component';
import { EnvironmentModels } from './src/services/Environment.service';

declare const lerp: (start: number, end: number, time?: number) => number;

interface ExhibitProps extends CameraProps, EnvironmentProps, Omit<BaseModelProps, 'setModelFallback'> {
    /**
     * Arbitrary binary data (base64 string | Blob) of a `.glb` file or path (URL) to a `.glb` resource.
     */
    modelSrc: string | Blob;
    /**
     * Size of the rendered GLB model.
     */
    scale?: number;
    /**
     * Pass styling to canvas.
     */
    style?: CSSProperties;
    /**
     * Custom style classes for canvas.
     */
    className?: string;
    /**
     * Enables soft shadows.
     */
    shadows?: boolean;
    /**
     * Enables floating idle animation.
     */
    float?: boolean;
    /**
     * Enables model to fit to available canvas dimensions.
     */
    fit?: boolean;
    /**
     * Return base64 image after making screenshot of the canvas.
     */
    capture?: CaptureType;
    /**
     * Enables snap-back to center after rotating model.
     */
    snap?: boolean;
    /**
     * Disables vertical rotation.
     */
    lockVertical?: boolean;
}
/**
 * Interactive presentation of any GLTF (.glb) asset.
 */
declare const Exhibit: FC<ExhibitProps>;

interface FloatingModelProps extends BaseModelProps {
    modelSrc: string | Blob;
    scale?: number;
}

/**
 * Contains model to handle suspense fallback.
 */
declare const FloatingModelContainer: FC<FloatingModelProps>;

interface AnimationModelProps extends BaseModelProps {
    modelSrc: string | Blob;
    animationSrc: string | Blob;
    rotation?: number;
    scale?: number;
    idleRotation?: boolean;
    headMovement?: boolean;
}

/**
 * Contains model to handle suspense fallback.
 */
declare const AnimationModelContainer: FC<AnimationModelProps>;

declare const CAMERA: {
    TARGET: {
        FULL_BODY: {
            MALE: number;
            FEMALE: number;
        };
        HALF_BODY: number;
    };
    INITIAL_DISTANCE: {
        FULL_BODY: number;
        HALF_BODY: number;
    };
    CONTROLS: {
        FULL_BODY: {
            MIN_DISTANCE: number;
            MAX_DISTANCE: number;
            ZOOM_TARGET: Vector3;
        };
        HALF_BODY: {
            MIN_DISTANCE: number;
            MAX_DISTANCE: number;
            ZOOM_TARGET: Vector3;
        };
    };
};
type Emotion = Record<string, number>;
interface AvatarProps extends LightingProps, EnvironmentProps, Omit<BaseModelProps, 'setModelFallback'> {
    onCameraReady?: (camera: Camera, controls: OrbitControls) => void;
    /**
     * Arbitrary binary data (base64 string, Blob) of a `.glb` file or path (URL) to a `.glb` resource.
     */
    modelSrc: string | Blob;
    /**
     * Arbitrary binary data (base64 string, Blob) of a `.glb|.fbx` file or path (URL) to a `.glb|.fbx` resource.
     * The animation will be run for the 3D model provided in `modelSrc`.
     */
    animationSrc?: string | Blob;
    /**
     * Arbitrary binary data (base64 string, Blob) or a path (URL) to `.glb` file which will be used to map Bone placements onto the underlying 3D model.
     * Applied when not specifying an animation.
     */
    poseSrc?: string | Blob;
    halfBody?: boolean;
    /**
     * Enable rendering shadows on ground.
     */
    shadows?: boolean;
    /**
     * Size of the rendered GLB model.
     */
    scale?: number;
    /**
     * Camera target on Y-axis.
     */
    cameraTarget?: number;
    /**
     * Initial Z-axis distance from the object upon render.
     */
    cameraInitialDistance?: number;
    /**
     * Apply styling to canvas DOM element.
     * Note that background property can not be set via style prop, it will always be overridden to `transparent`.
     * Instead, use `background` prop for that purpose.
     */
    style?: CSSProperties;
    /**
     * Applies an idle rotation to the animated and half-body models.
     */
    idleRotation?: boolean;
    /**
     * Applies a face emotion of the model.
     */
    emotion?: Emotion;
    /**
     * Allows adding a background image and background color to the scene.
     * Make sure that image is loadable to prevent bg errors.
     * background.src - Accepts URL string.
     * background.color - Accepts Hexadeximal, RGB, X11 color name, HSL string, doesn't support CSS gradients.
     */
    background?: Background;
    /**
     * Return base64 image after making screenshot of the canvas.
     */
    capture?: CaptureType;
    /**
     * Pass custom fallback component.
     */
    loader?: ReactNode;
    /**
     * Device Pixel Ratio.
     */
    dpr?: Dpr;
    /**
     * Custom style classes for canvas.
     */
    className?: string;
    /**
     * Enable head tracking cursor movements.
     */
    headMovement?: boolean;
    /**
     * Initialise and update camera movement on Z-Axis.
     * Defaults to full-body zoom distance.
     */
    cameraZoomTarget?: Vector3;
    /**
     * Bloom post-processing effect.
     */
    bloom?: BloomConfiguration;
    /**
     * Spawn effect when model is loaded into scene.
     */
    onLoadedEffect?: SpawnState['onLoadedEffect'];
    /**
     * Spawn animation when model is loaded into scene.
     */
    onLoadedAnimation?: SpawnState['onLoadedAnimation'];
    /**
     * Field of view of the camera.
     */
    fov?: number;
    /**
     * Control some effects like post-processing effects
     */
    effects?: EffectConfiguration;
    /**
     * Use any three.js(fiber, post-processing) compatible components to render in the scene.
     */
    children?: ReactNode;
}
declare const AvatarWrapper: (props: AvatarProps) => React.JSX.Element;

interface HalfBodyModelProps extends BaseModelProps {
    modelSrc: string | Blob;
    rotation?: number;
    scale?: number;
    idleRotation?: boolean;
    emotion?: Emotion;
    headMovement?: boolean;
}

/**
 * Contains model to handle suspense fallback.
 */
declare const HalfBodyModelContainer: FC<HalfBodyModelProps>;

interface StaticModelProps extends BaseModelProps {
    modelSrc: string | Blob;
    modelRef?: Ref<Group>;
    scale?: number;
    emotion?: Emotion;
}

/**
 * Contains model to handle suspense fallback.
 */
declare const StaticModelContainer: FC<StaticModelProps>;

interface PoseModelProps extends BaseModelProps {
    modelSrc: string | Blob;
    poseSrc: string | Blob;
    modelRef?: Ref<Group>;
    scale?: number;
    emotion?: Emotion;
}

/**
 * Contains model to handle suspense fallback.
 */
declare const PoseModelContainer: FC<PoseModelProps>;

interface EnvironmentModelProps extends BaseModelProps {
    environment: string | EnvironmentModels;
    scale?: number;
}

/**
 * Contains model to handle suspense fallback.
 */
declare const EnvironmentModelContainer: FC<EnvironmentModelProps>;

interface FloorReflectionProps {
    resolution?: number;
    mixBlur?: number;
    mixStrength?: number;
    metalness?: number;
    blur?: [number, number] | number;
    mirror: number;
    minDepthThreshold?: number;
    maxDepthThreshold?: number;
    depthScale?: number;
    depthToBlurRatioBias?: number;
    distortion?: number;
    mixContrast?: number;
    reflectorOffset?: number;
    roughness?: number;
    /**
     * The color should match the canvas background color to provide a seamless transition from background to the reflective plane.
     */
    color: string;
}
declare const FloorReflection: FC<FloorReflectionProps>;

export { AnimationModelContainer as AnimationModel, AvatarWrapper as Avatar, AvatarProps, CAMERA, EnvironmentModelContainer as EnvironmentModel, Exhibit, FloatingModelContainer as FloatingModel, FloorReflection, HalfBodyModelContainer as HalfBodyModel, PoseModelContainer as PoseModel, StaticModelContainer as StaticModel, lerp };
