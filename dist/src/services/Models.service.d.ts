import { Material, Vector2, Object3D, Euler, Vector3, BufferGeometry, Skeleton } from 'three';
import type { ObjectMap } from '@react-three/fiber';
import { GLTF } from 'three-stdlib';
import { Emotion } from 'src/components/Avatar/Avatar.component';
import { BloomConfiguration } from 'src/types';
export interface CustomNode extends Object3D {
    geometry: BufferGeometry;
    material: Material;
    skeleton: Skeleton;
    isMesh: boolean;
    morphTargetInfluences?: number[];
}
export interface Nodes {
    [node: string]: Object3D;
}
type Source = string | string[] | Blob | undefined | null;
export declare const getStoryAssetPath: (publicAsset: string) => string;
export declare const isValidFormat: (source: Source) => source is string | Blob;
export declare const clamp: (value: number, max: number, min: number) => number;
export declare const lerp: (start: number, end: number, time?: number) => number;
/**
 * Avoid texture pixelation and add depth effect.
 */
export declare const normaliseMaterialsConfig: (materials: Record<string, Material>, bloomConfig?: BloomConfiguration) => void;
interface UseHeadMovement {
    nodes: Nodes;
    isHalfBody?: boolean;
    distance?: number;
    activeRotation?: number;
    rotationMargin?: Vector2;
    enabled?: boolean;
}
/**
 * Avatar head movement relative to cursor.
 * When the model isn't a standard Ready Player Me avatar, the head movement won't take effect.
 */
export declare const useHeadMovement: ({ nodes, isHalfBody, distance, activeRotation, rotationMargin, enabled }: UseHeadMovement) => void;
/**
 * Transfers Bone positions from source to target.
 * @param targetNodes {object} - object that will be mutated
 * @param sourceNodes {object} - object that will be used as reference
 */
export declare const mutatePose: (targetNodes?: ObjectMap['nodes'], sourceNodes?: ObjectMap['nodes']) => void;
export declare const useEmotion: (nodes: ObjectMap['nodes'], emotion?: Emotion) => void;
export declare const useGltfLoader: (source: Blob | string) => GLTF;
export declare class Transform {
    constructor();
    scale: Vector3;
    rotation: Euler;
    position: Vector3;
}
export declare const useFallback: (nodes: Nodes, setter?: ((fallback: JSX.Element) => void) | undefined) => void;
export declare const triggerCallback: (callback?: () => void) => void;
export declare const expressions: {
    blink: {
        morphTarget: string;
        morphTargetIndex: number;
        offset: number;
        duration: number;
    }[];
};
/**
 * Animates avatars facial expressions when morphTargets=ARKit,Eyes Extra is provided with the avatar.
 */
export declare const useIdleExpression: (expression: keyof typeof expressions, nodes: Nodes) => void;
export {};
