import { FC } from 'react';
import { Camera, Vector3 } from 'three';
import { OrbitControls } from 'three-stdlib';
import { LightingProps, Required } from 'src/types';
type CameraLightingProps = Required<LightingProps> & {
    onCameraReady?: (camera: Camera, controls: OrbitControls) => void;
    fullBody?: boolean;
    headScale?: number;
    cameraTarget?: number;
    cameraInitialDistance?: number;
    /**
     * Handles camera movement on the Z-axis.
     */
    cameraZoomTarget?: Vector3;
    controlsMinDistance?: number;
    controlsMaxDistance?: number;
    /**
     * Enables camera moving on Y-axis while zooming in-out.
     */
    updateCameraTargetOnZoom?: boolean;
};
export declare const CameraLighting: FC<CameraLightingProps>;
export {};
