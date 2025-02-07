import React, { CSSProperties, ReactNode } from 'react';
import { Camera, Vector3 } from 'three';
import { OrbitControls } from 'three-stdlib';
import { LightingProps, BaseModelProps, EnvironmentProps, BloomConfiguration, SpawnState, EffectConfiguration } from 'src/types';
import { Dpr } from '@react-three/fiber';
import { CaptureType } from 'src/components/Capture/Capture.component';
import { Background } from 'src/components/Background/Box/Box.component';
export declare const CAMERA: {
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
export type Emotion = Record<string, number>;
export interface AvatarProps extends LightingProps, EnvironmentProps, Omit<BaseModelProps, 'setModelFallback'> {
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
export default AvatarWrapper;
