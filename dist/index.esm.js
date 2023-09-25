import React, { useEffect, useRef, useCallback, useMemo, createContext, createElement, useContext, useReducer, useDebugValue, useState, Suspense, cloneElement } from 'react';
import { Vector2, Vector3, Euler, LinearFilter, AnimationMixer, LoopRepeat, TextureLoader, DirectionalLight, AmbientLight, SpotLight } from 'three';
import { useFrame, useGraph, useThree, Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader, DRACOLoader, FBXLoader, OrbitControls } from 'three-stdlib';
import { suspend } from 'suspend-react';
import { Environment as Environment$1, useBounds, PresentationControls, Bounds, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { Bloom as Bloom$1, EffectComposer, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const validateSource = (source) => {
    if (Array.isArray(source)) {
        return source.length > 0 && source.every(validateSource);
    }
    if (typeof source === 'string') {
        const fileEndExpression = new RegExp(/(.glb|.fbx|.fbx[?].*|.glb[?].*)$/g);
        const uploadFileExpression = new RegExp(/^data:application\/octet-stream;base64,/g);
        const gltfModelExpression = new RegExp(/^data:model\/gltf-binary;base64,/g);
        return fileEndExpression.test(source) || uploadFileExpression.test(source) || gltfModelExpression.test(source);
    }
    if (source instanceof Blob) {
        return source.type === 'model/gltf-binary';
    }
    return false;
};
const isValidFormat = (source) => {
    const isValid = validateSource(source);
    if (source && !isValid) {
        console.warn('Provided GLB/FBX is invalid. Check docs for supported formats: https://github.com/readyplayerme/visage');
    }
    return isValid;
};
const clamp = (value, max, min) => Math.min(Math.max(min, value), max);
const lerp = (start, end, time = 0.05) => start * (1 - time) + end * time;
/**
 * Avoid texture pixelation and add depth effect.
 */
const normaliseMaterialsConfig = (materials, bloomConfig) => {
    Object.values(materials).forEach((material) => {
        const mat = material;
        if (mat.map) {
            mat.map.minFilter = LinearFilter;
            mat.depthWrite = true;
            mat.toneMapped = false;
        }
        if (mat.emissiveMap) {
            mat.emissiveIntensity = (bloomConfig === null || bloomConfig === void 0 ? void 0 : bloomConfig.materialIntensity) || 3.3;
        }
    });
};
/**
 * Avatar head movement relative to cursor.
 * When the model isn't a standard Ready Player Me avatar, the head movement won't take effect.
 */
const useHeadMovement = ({ nodes, isHalfBody = false, distance = 2, activeRotation = 0.2, rotationMargin = new Vector2(5, 10), enabled = false }) => {
    const rad = Math.PI / 180;
    const currentPos = new Vector2(0, 0);
    const targetPos = new Vector2(0, 0);
    const activeDistance = distance - (isHalfBody ? 1 : 0);
    const eyeRotationOffsetX = isHalfBody ? 90 * rad : 0;
    const neckBoneRotationOffsetX = (isHalfBody ? -5 : 10) * rad;
    const mapRange = (value, inMin, inMax, outMin, outMax) => ((clamp(value, inMax, inMin) - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    useFrame((state) => {
        if (!enabled || !nodes.Neck || !nodes.Head || !nodes.RightEye || !nodes.LeftEye) {
            return;
        }
        const cameraToHeadDistance = state.camera.position.distanceTo(nodes.Head.position);
        const cameraRotation = Math.abs(state.camera.rotation.z);
        if (cameraToHeadDistance < activeDistance && cameraRotation < activeRotation) {
            targetPos.x = mapRange(state.mouse.y, -0.5, 1, rotationMargin.x * rad, -rotationMargin.x * rad);
            targetPos.y = mapRange(state.mouse.x, -0.5, 0.5, -rotationMargin.y * rad, rotationMargin.y * rad);
        }
        else {
            targetPos.set(0, 0);
        }
        currentPos.x = lerp(currentPos.x, targetPos.x);
        currentPos.y = lerp(currentPos.y, targetPos.y);
        /* eslint-disable no-param-reassign */
        nodes.Neck.rotation.x = currentPos.x + neckBoneRotationOffsetX;
        nodes.Neck.rotation.y = currentPos.y;
        nodes.Head.rotation.x = currentPos.x;
        nodes.Head.rotation.y = currentPos.y;
        nodes.RightEye.rotation.x = currentPos.x - eyeRotationOffsetX;
        nodes.LeftEye.rotation.x = currentPos.x - eyeRotationOffsetX;
        if (isHalfBody) {
            nodes.RightEye.rotation.z = currentPos.y * 2 + Math.PI;
            nodes.LeftEye.rotation.z = currentPos.y * 2 + Math.PI;
        }
        else {
            nodes.RightEye.rotation.y = currentPos.y * 2;
            nodes.LeftEye.rotation.y = currentPos.y * 2;
        }
    });
};
/**
 * Transfers Bone positions from source to target.
 * @param targetNodes {object} - object that will be mutated
 * @param sourceNodes {object} - object that will be used as reference
 */
const mutatePose = (targetNodes, sourceNodes) => {
    if (targetNodes && sourceNodes) {
        Object.keys(targetNodes).forEach((key) => {
            if (targetNodes[key].type === 'Bone' && sourceNodes[key]) {
                /* eslint-disable no-param-reassign */
                const pos = sourceNodes[key].position;
                targetNodes[key].position.set(pos.x, pos.y, pos.z);
                const rot = sourceNodes[key].rotation;
                targetNodes[key].rotation.set(rot.x, rot.y, rot.z);
            }
        });
    }
};
const useEmotion = (nodes, emotion) => {
    // @ts-ignore
    const meshes = Object.values(nodes).filter((item) => item === null || item === void 0 ? void 0 : item.morphTargetInfluences);
    const resetEmotions = (resetMeshes) => {
        resetMeshes.forEach((mesh) => {
            var _a;
            (_a = mesh === null || mesh === void 0 ? void 0 : mesh.morphTargetInfluences) === null || _a === void 0 ? void 0 : _a.forEach((_, index) => {
                mesh.morphTargetInfluences[index] = 0;
            });
        });
    };
    useFrame(() => {
        if (emotion) {
            resetEmotions(meshes);
            meshes.forEach((mesh) => {
                Object.entries(emotion).forEach(([shape, value]) => {
                    var _a;
                    const shapeId = (_a = mesh === null || mesh === void 0 ? void 0 : mesh.morphTargetDictionary) === null || _a === void 0 ? void 0 : _a[shape];
                    if (shapeId) {
                        mesh.morphTargetInfluences[shapeId] = value;
                    }
                });
            });
        }
        else {
            resetEmotions(meshes);
        }
    });
};
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
loader.setDRACOLoader(dracoLoader);
const useGltfLoader = (source) => suspend(() => __awaiter(void 0, void 0, void 0, function* () {
    if (source instanceof Blob) {
        const buffer = yield source.arrayBuffer();
        return (yield loader.parseAsync(buffer, ''));
    }
    const gltf = yield loader.loadAsync(source);
    return gltf;
}), [source]);
class Transform {
    constructor() {
        this.scale = new Vector3(1, 1, 1);
        this.rotation = new Euler(0, 0, 0);
        this.position = new Vector3(0, 0, 0);
    }
}
/**
 * Builds a fallback model for given nodes.
 * Useful for displaying as the suspense fallback object.
 */
function buildFallback(nodes, transform = new Transform()) {
    return (React.createElement("group", null, Object.keys(nodes).map((key) => {
        const node = nodes[key];
        if (node.type === 'SkinnedMesh') {
            return (React.createElement("skinnedMesh", { castShadow: true, receiveShadow: true, key: node.name, scale: transform.scale, position: transform.position, rotation: transform.rotation, geometry: node.geometry, material: node.material, skeleton: node.skeleton, morphTargetInfluences: node.morphTargetInfluences || [] }));
        }
        if (node.type === 'Mesh') {
            return (React.createElement("mesh", { castShadow: true, receiveShadow: true, key: node.name, scale: transform.scale, position: transform.position, rotation: transform.rotation, geometry: node.geometry, material: node.material, morphTargetInfluences: node.morphTargetInfluences || [] }));
        }
        return null;
    })));
}
const useFallback = (nodes, setter) => useEffect(() => {
    if (typeof setter === 'function') {
        setter(buildFallback(nodes));
    }
}, [setter, nodes]);
const triggerCallback = (callback) => {
    if (typeof callback === 'function') {
        callback();
    }
};
const expressions = {
    blink: [
        {
            morphTarget: 'eyesClosed',
            morphTargetIndex: -1,
            offset: 0,
            duration: 0.2
        },
        {
            morphTarget: 'eyeSquintLeft',
            morphTargetIndex: -1,
            offset: 0,
            duration: 0.2
        },
        {
            morphTarget: 'eyeSquintRight',
            morphTargetIndex: -1,
            offset: 0,
            duration: 0.2
        }
    ]
};
/**
 * Animates avatars facial expressions when morphTargets=ARKit,Eyes Extra is provided with the avatar.
 */
const useIdleExpression = (expression, nodes) => {
    const headMesh = (nodes.Wolf3D_Head || nodes.Wolf3D_Avatar);
    const selectedExpression = expression in expressions ? expressions[expression] : undefined;
    const timeout = useRef();
    const duration = useRef(Number.POSITIVE_INFINITY);
    useEffect(() => {
        if ((headMesh === null || headMesh === void 0 ? void 0 : headMesh.morphTargetDictionary) && selectedExpression) {
            for (let i = 0; i < selectedExpression.length; i++) {
                selectedExpression[i].morphTargetIndex = headMesh.morphTargetDictionary[selectedExpression[i].morphTarget];
            }
        }
    }, [selectedExpression === null || selectedExpression === void 0 ? void 0 : selectedExpression.length]);
    const animateExpression = useCallback((delta) => {
        if ((headMesh === null || headMesh === void 0 ? void 0 : headMesh.morphTargetInfluences) && selectedExpression) {
            duration.current += delta;
            for (let i = 0; i < selectedExpression.length; i++) {
                const section = selectedExpression[i];
                if (duration.current < section.duration + section.offset) {
                    if (duration.current > section.offset) {
                        const pivot = ((duration.current - section.offset) / section.duration) * Math.PI;
                        const morphInfluence = Math.sin(pivot);
                        headMesh.morphTargetInfluences[section.morphTargetIndex] = morphInfluence;
                    }
                }
                else {
                    headMesh.morphTargetInfluences[section.morphTargetIndex] = 0;
                }
            }
        }
    }, [headMesh === null || headMesh === void 0 ? void 0 : headMesh.morphTargetInfluences, selectedExpression, duration.current, timeout.current]);
    const setNextInterval = () => {
        duration.current = 0;
        const delay = Math.random() * 3000 + 3000;
        clearTimeout(timeout.current);
        timeout.current = setTimeout(setNextInterval, delay);
    };
    useEffect(() => {
        if (selectedExpression) {
            timeout.current = setTimeout(setNextInterval, 3000);
        }
        return () => {
            clearTimeout(timeout.current);
        };
    }, [selectedExpression]);
    useFrame((_, delta) => {
        if (headMesh && selectedExpression) {
            animateExpression(delta);
        }
    });
};

const environmentPresets = {
    hub: 'hub',
    sunset: 'sunset',
    dawn: 'dawn',
    night: 'night',
    warehouse: 'warehouse',
    forest: 'forest',
    apartment: 'apartment',
    studio: 'studio',
    city: 'city',
    park: 'park',
    lobby: 'lobby'
};
const getPresetEnvironmentMap = (preset) => `https://readyplayerme-assets.s3.amazonaws.com/environment/${preset}.hdr`;
const environmentModels = {
    spaceStation: 'https://readyplayerme-assets.s3.amazonaws.com/props/environment-space-station.glb',
    platformDark: 'https://readyplayerme-assets.s3.amazonaws.com/props/simple-platform-dark.glb',
    platformGreen: 'https://readyplayerme-assets.s3.amazonaws.com/props/simple-platform-green.glb',
    platformBlue: 'https://readyplayerme-assets.s3.amazonaws.com/props/simple-platform-blue.glb'
};

const Environment = ({ environment }) => {
    const config = useMemo(() => {
        const isStaticPreset = environment in environmentPresets;
        const files = isStaticPreset ? getPresetEnvironmentMap(environment) : environment;
        return {
            files
        };
    }, [environment]);
    return React.createElement(Environment$1, { files: config.files });
};

let keyCount = 0;
function atom(read, write) {
  const key = `atom${++keyCount}`;
  const config = {
    toString: () => key
  };
  if (typeof read === "function") {
    config.read = read;
  } else {
    config.init = read;
    config.read = (get) => get(config);
    config.write = (get, set, arg) => set(
      config,
      typeof arg === "function" ? arg(get(config)) : arg
    );
  }
  if (write) {
    config.write = write;
  }
  return config;
}

const hasInitialValue = (atom) => "init" in atom;
const isActuallyWritableAtom = (atom) => !!atom.write;
const cancelPromiseMap = /* @__PURE__ */ new WeakMap();
const registerCancelPromise = (promise, cancel) => {
  cancelPromiseMap.set(promise, cancel);
  promise.catch(() => {
  }).finally(() => cancelPromiseMap.delete(promise));
};
const cancelPromise = (promise, next) => {
  const cancel = cancelPromiseMap.get(promise);
  if (cancel) {
    cancelPromiseMap.delete(promise);
    cancel(next);
  }
};
const resolvePromise = (promise, value) => {
  promise.status = "fulfilled";
  promise.value = value;
};
const rejectPromise = (promise, e) => {
  promise.status = "rejected";
  promise.reason = e;
};
const isPromiseLike$1 = (x) => typeof (x == null ? void 0 : x.then) === "function";
const isEqualAtomValue = (a, b) => "v" in a && "v" in b && Object.is(a.v, b.v);
const isEqualAtomError = (a, b) => "e" in a && "e" in b && Object.is(a.e, b.e);
const hasPromiseAtomValue = (a) => "v" in a && a.v instanceof Promise;
const isEqualPromiseAtomValue = (a, b) => "v" in a && "v" in b && a.v.orig && a.v.orig === b.v.orig;
const returnAtomValue = (atomState) => {
  if ("e" in atomState) {
    throw atomState.e;
  }
  return atomState.v;
};
const createStore = () => {
  const atomStateMap = /* @__PURE__ */ new WeakMap();
  const mountedMap = /* @__PURE__ */ new WeakMap();
  const pendingMap = /* @__PURE__ */ new Map();
  let storeListenersRev1;
  let storeListenersRev2;
  let mountedAtoms;
  if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
    storeListenersRev1 = /* @__PURE__ */ new Set();
    storeListenersRev2 = /* @__PURE__ */ new Set();
    mountedAtoms = /* @__PURE__ */ new Set();
  }
  const getAtomState = (atom) => atomStateMap.get(atom);
  const setAtomState = (atom, atomState) => {
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      Object.freeze(atomState);
    }
    const prevAtomState = atomStateMap.get(atom);
    atomStateMap.set(atom, atomState);
    if (!pendingMap.has(atom)) {
      pendingMap.set(atom, prevAtomState);
    }
    if (prevAtomState && hasPromiseAtomValue(prevAtomState)) {
      const next = "v" in atomState ? atomState.v instanceof Promise ? atomState.v : Promise.resolve(atomState.v) : Promise.reject(atomState.e);
      cancelPromise(prevAtomState.v, next);
    }
  };
  const updateDependencies = (atom, nextAtomState, nextDependencies) => {
    const dependencies = /* @__PURE__ */ new Map();
    let changed = false;
    nextDependencies.forEach((aState, a) => {
      if (!aState && a === atom) {
        aState = nextAtomState;
      }
      if (aState) {
        dependencies.set(a, aState);
        if (nextAtomState.d.get(a) !== aState) {
          changed = true;
        }
      } else if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
        console.warn("[Bug] atom state not found");
      }
    });
    if (changed || nextAtomState.d.size !== dependencies.size) {
      nextAtomState.d = dependencies;
    }
  };
  const setAtomValue = (atom, value, nextDependencies) => {
    const prevAtomState = getAtomState(atom);
    const nextAtomState = {
      d: (prevAtomState == null ? void 0 : prevAtomState.d) || /* @__PURE__ */ new Map(),
      v: value
    };
    if (nextDependencies) {
      updateDependencies(atom, nextAtomState, nextDependencies);
    }
    if (prevAtomState && isEqualAtomValue(prevAtomState, nextAtomState) && prevAtomState.d === nextAtomState.d) {
      return prevAtomState;
    }
    if (prevAtomState && hasPromiseAtomValue(prevAtomState) && hasPromiseAtomValue(nextAtomState) && isEqualPromiseAtomValue(prevAtomState, nextAtomState)) {
      if (prevAtomState.d === nextAtomState.d) {
        return prevAtomState;
      } else {
        nextAtomState.v = prevAtomState.v;
      }
    }
    setAtomState(atom, nextAtomState);
    return nextAtomState;
  };
  const setAtomValueOrPromise = (atom, valueOrPromise, nextDependencies, abortPromise) => {
    if (isPromiseLike$1(valueOrPromise)) {
      let continuePromise;
      const promise = new Promise((resolve, reject) => {
        let settled = false;
        valueOrPromise.then(
          (v) => {
            if (!settled) {
              settled = true;
              const prevAtomState = getAtomState(atom);
              const nextAtomState = setAtomValue(
                atom,
                promise,
                nextDependencies
              );
              resolvePromise(promise, v);
              resolve(v);
              if ((prevAtomState == null ? void 0 : prevAtomState.d) !== nextAtomState.d) {
                mountDependencies(atom, nextAtomState, prevAtomState == null ? void 0 : prevAtomState.d);
              }
            }
          },
          (e) => {
            if (!settled) {
              settled = true;
              const prevAtomState = getAtomState(atom);
              const nextAtomState = setAtomValue(
                atom,
                promise,
                nextDependencies
              );
              rejectPromise(promise, e);
              reject(e);
              if ((prevAtomState == null ? void 0 : prevAtomState.d) !== nextAtomState.d) {
                mountDependencies(atom, nextAtomState, prevAtomState == null ? void 0 : prevAtomState.d);
              }
            }
          }
        );
        continuePromise = (next) => {
          if (!settled) {
            settled = true;
            next.then(
              (v) => resolvePromise(promise, v),
              (e) => rejectPromise(promise, e)
            );
            resolve(next);
          }
        };
      });
      promise.orig = valueOrPromise;
      promise.status = "pending";
      registerCancelPromise(promise, (next) => {
        if (next) {
          continuePromise(next);
        }
        abortPromise == null ? void 0 : abortPromise();
      });
      return setAtomValue(atom, promise, nextDependencies);
    }
    return setAtomValue(atom, valueOrPromise, nextDependencies);
  };
  const setAtomError = (atom, error, nextDependencies) => {
    const prevAtomState = getAtomState(atom);
    const nextAtomState = {
      d: (prevAtomState == null ? void 0 : prevAtomState.d) || /* @__PURE__ */ new Map(),
      e: error
    };
    if (nextDependencies) {
      updateDependencies(atom, nextAtomState, nextDependencies);
    }
    if (prevAtomState && isEqualAtomError(prevAtomState, nextAtomState) && prevAtomState.d === nextAtomState.d) {
      return prevAtomState;
    }
    setAtomState(atom, nextAtomState);
    return nextAtomState;
  };
  const readAtomState = (atom) => {
    const atomState = getAtomState(atom);
    if (atomState) {
      atomState.d.forEach((_, a) => {
        if (a !== atom && !mountedMap.has(a)) {
          readAtomState(a);
        }
      });
      if (Array.from(atomState.d).every(([a, s]) => {
        const aState = getAtomState(a);
        return a === atom || aState === s || // TODO This is a hack, we should find a better solution.
        aState && !hasPromiseAtomValue(aState) && isEqualAtomValue(aState, s);
      })) {
        return atomState;
      }
    }
    const nextDependencies = /* @__PURE__ */ new Map();
    let isSync = true;
    const getter = (a) => {
      if (a === atom) {
        const aState2 = getAtomState(a);
        if (aState2) {
          nextDependencies.set(a, aState2);
          return returnAtomValue(aState2);
        }
        if (hasInitialValue(a)) {
          nextDependencies.set(a, void 0);
          return a.init;
        }
        throw new Error("no atom init");
      }
      const aState = readAtomState(a);
      nextDependencies.set(a, aState);
      return returnAtomValue(aState);
    };
    let controller;
    let setSelf;
    const options = {
      get signal() {
        if (!controller) {
          controller = new AbortController();
        }
        return controller.signal;
      },
      get setSelf() {
        if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && !isActuallyWritableAtom(atom)) {
          console.warn("setSelf function cannot be used with read-only atom");
        }
        if (!setSelf && isActuallyWritableAtom(atom)) {
          setSelf = (...args) => {
            if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && isSync) {
              console.warn("setSelf function cannot be called in sync");
            }
            if (!isSync) {
              return writeAtom(atom, ...args);
            }
          };
        }
        return setSelf;
      }
    };
    try {
      const valueOrPromise = atom.read(getter, options);
      return setAtomValueOrPromise(
        atom,
        valueOrPromise,
        nextDependencies,
        () => controller == null ? void 0 : controller.abort()
      );
    } catch (error) {
      return setAtomError(atom, error, nextDependencies);
    } finally {
      isSync = false;
    }
  };
  const readAtom = (atom) => returnAtomValue(readAtomState(atom));
  const addAtom = (atom) => {
    let mounted = mountedMap.get(atom);
    if (!mounted) {
      mounted = mountAtom(atom);
    }
    return mounted;
  };
  const canUnmountAtom = (atom, mounted) => !mounted.l.size && (!mounted.t.size || mounted.t.size === 1 && mounted.t.has(atom));
  const delAtom = (atom) => {
    const mounted = mountedMap.get(atom);
    if (mounted && canUnmountAtom(atom, mounted)) {
      unmountAtom(atom);
    }
  };
  const recomputeDependents = (atom) => {
    const dependencyMap = /* @__PURE__ */ new Map();
    const dirtyMap = /* @__PURE__ */ new WeakMap();
    const loop1 = (a) => {
      const mounted = mountedMap.get(a);
      mounted == null ? void 0 : mounted.t.forEach((dependent) => {
        if (dependent !== a) {
          dependencyMap.set(
            dependent,
            (dependencyMap.get(dependent) || /* @__PURE__ */ new Set()).add(a)
          );
          dirtyMap.set(dependent, (dirtyMap.get(dependent) || 0) + 1);
          loop1(dependent);
        }
      });
    };
    loop1(atom);
    const loop2 = (a) => {
      const mounted = mountedMap.get(a);
      mounted == null ? void 0 : mounted.t.forEach((dependent) => {
        var _a;
        if (dependent !== a) {
          let dirtyCount = dirtyMap.get(dependent);
          if (dirtyCount) {
            dirtyMap.set(dependent, --dirtyCount);
          }
          if (!dirtyCount) {
            let isChanged = !!((_a = dependencyMap.get(dependent)) == null ? void 0 : _a.size);
            if (isChanged) {
              const prevAtomState = getAtomState(dependent);
              const nextAtomState = readAtomState(dependent);
              isChanged = !prevAtomState || !isEqualAtomValue(prevAtomState, nextAtomState);
            }
            if (!isChanged) {
              dependencyMap.forEach((s) => s.delete(dependent));
            }
          }
          loop2(dependent);
        }
      });
    };
    loop2(atom);
  };
  const writeAtomState = (atom, ...args) => {
    let isSync = true;
    const getter = (a) => returnAtomValue(readAtomState(a));
    const setter = (a, ...args2) => {
      let r;
      if (a === atom) {
        if (!hasInitialValue(a)) {
          throw new Error("atom not writable");
        }
        const prevAtomState = getAtomState(a);
        const nextAtomState = setAtomValueOrPromise(a, args2[0]);
        if (!prevAtomState || !isEqualAtomValue(prevAtomState, nextAtomState)) {
          recomputeDependents(a);
        }
      } else {
        r = writeAtomState(a, ...args2);
      }
      if (!isSync) {
        const flushed = flushPending();
        if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
          storeListenersRev2.forEach(
            (l) => l({ type: "async-write", flushed })
          );
        }
      }
      return r;
    };
    const result = atom.write(getter, setter, ...args);
    isSync = false;
    return result;
  };
  const writeAtom = (atom, ...args) => {
    const result = writeAtomState(atom, ...args);
    const flushed = flushPending();
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      storeListenersRev2.forEach(
        (l) => l({ type: "write", flushed })
      );
    }
    return result;
  };
  const mountAtom = (atom, initialDependent) => {
    const mounted = {
      t: new Set(initialDependent && [initialDependent]),
      l: /* @__PURE__ */ new Set()
    };
    mountedMap.set(atom, mounted);
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      mountedAtoms.add(atom);
    }
    readAtomState(atom).d.forEach((_, a) => {
      const aMounted = mountedMap.get(a);
      if (aMounted) {
        aMounted.t.add(atom);
      } else {
        if (a !== atom) {
          mountAtom(a, atom);
        }
      }
    });
    readAtomState(atom);
    if (isActuallyWritableAtom(atom) && atom.onMount) {
      const onUnmount = atom.onMount((...args) => writeAtom(atom, ...args));
      if (onUnmount) {
        mounted.u = onUnmount;
      }
    }
    return mounted;
  };
  const unmountAtom = (atom) => {
    var _a;
    const onUnmount = (_a = mountedMap.get(atom)) == null ? void 0 : _a.u;
    if (onUnmount) {
      onUnmount();
    }
    mountedMap.delete(atom);
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      mountedAtoms.delete(atom);
    }
    const atomState = getAtomState(atom);
    if (atomState) {
      if (hasPromiseAtomValue(atomState)) {
        cancelPromise(atomState.v);
      }
      atomState.d.forEach((_, a) => {
        if (a !== atom) {
          const mounted = mountedMap.get(a);
          if (mounted) {
            mounted.t.delete(atom);
            if (canUnmountAtom(a, mounted)) {
              unmountAtom(a);
            }
          }
        }
      });
    } else if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      console.warn("[Bug] could not find atom state to unmount", atom);
    }
  };
  const mountDependencies = (atom, atomState, prevDependencies) => {
    const depSet = new Set(atomState.d.keys());
    prevDependencies == null ? void 0 : prevDependencies.forEach((_, a) => {
      if (depSet.has(a)) {
        depSet.delete(a);
        return;
      }
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.t.delete(atom);
        if (canUnmountAtom(a, mounted)) {
          unmountAtom(a);
        }
      }
    });
    depSet.forEach((a) => {
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.t.add(atom);
      } else if (mountedMap.has(atom)) {
        mountAtom(a, atom);
      }
    });
  };
  const flushPending = () => {
    let flushed;
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      flushed = /* @__PURE__ */ new Set();
    }
    while (pendingMap.size) {
      const pending = Array.from(pendingMap);
      pendingMap.clear();
      pending.forEach(([atom, prevAtomState]) => {
        const atomState = getAtomState(atom);
        if (atomState) {
          if (atomState.d !== (prevAtomState == null ? void 0 : prevAtomState.d)) {
            mountDependencies(atom, atomState, prevAtomState == null ? void 0 : prevAtomState.d);
          }
          const mounted = mountedMap.get(atom);
          if (mounted && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (prevAtomState && !hasPromiseAtomValue(prevAtomState) && (isEqualAtomValue(prevAtomState, atomState) || isEqualAtomError(prevAtomState, atomState)))) {
            mounted.l.forEach((listener) => listener());
            if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
              flushed.add(atom);
            }
          }
        } else if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
          console.warn("[Bug] no atom state to flush");
        }
      });
    }
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      storeListenersRev1.forEach((l) => l("state"));
      return flushed;
    }
  };
  const subscribeAtom = (atom, listener) => {
    const mounted = addAtom(atom);
    const flushed = flushPending();
    const listeners = mounted.l;
    listeners.add(listener);
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      storeListenersRev1.forEach((l) => l("sub"));
      storeListenersRev2.forEach(
        (l) => l({ type: "sub", flushed })
      );
    }
    return () => {
      listeners.delete(listener);
      delAtom(atom);
      if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
        storeListenersRev1.forEach((l) => l("unsub"));
        storeListenersRev2.forEach((l) => l({ type: "unsub" }));
      }
    };
  };
  if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
    return {
      get: readAtom,
      set: writeAtom,
      sub: subscribeAtom,
      // store dev methods (these are tentative and subject to change without notice)
      dev_subscribe_store: (l, rev) => {
        if (rev !== 2) {
          console.warn(
            "The current StoreListener revision is 2. The older ones are deprecated."
          );
          storeListenersRev1.add(l);
          return () => {
            storeListenersRev1.delete(l);
          };
        }
        storeListenersRev2.add(l);
        return () => {
          storeListenersRev2.delete(l);
        };
      },
      dev_get_mounted_atoms: () => mountedAtoms.values(),
      dev_get_atom_state: (a) => atomStateMap.get(a),
      dev_get_mounted: (a) => mountedMap.get(a),
      dev_restore_atoms: (values) => {
        for (const [atom, valueOrPromise] of values) {
          if (hasInitialValue(atom)) {
            setAtomValueOrPromise(atom, valueOrPromise);
            recomputeDependents(atom);
          }
        }
        const flushed = flushPending();
        storeListenersRev2.forEach(
          (l) => l({ type: "restore", flushed })
        );
      }
    };
  }
  return {
    get: readAtom,
    set: writeAtom,
    sub: subscribeAtom
  };
};
let defaultStore;
const getDefaultStore = () => {
  if (!defaultStore) {
    defaultStore = createStore();
  }
  return defaultStore;
};
if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
  if (globalThis.__JOTAI_PACKAGE_IS_LOADED__) {
    console.warn(
      "Detected multiple Jotai instances. It may cause unexpected behavior. https://github.com/pmndrs/jotai/discussions/2044"
    );
  } else {
    globalThis.__JOTAI_PACKAGE_IS_LOADED__ = true;
  }
}

const StoreContext = createContext(void 0);
const useStore = (options) => {
  const store = useContext(StoreContext);
  return (options == null ? void 0 : options.store) || store || getDefaultStore();
};
const Provider = ({
  children,
  store
}) => {
  const storeRef = useRef();
  if (!store && !storeRef.current) {
    storeRef.current = createStore();
  }
  return createElement(
    StoreContext.Provider,
    {
      value: store || storeRef.current
    },
    children
  );
};

const isPromiseLike = (x) => typeof (x == null ? void 0 : x.then) === "function";
const use = React.use || ((promise) => {
  if (promise.status === "pending") {
    throw promise;
  } else if (promise.status === "fulfilled") {
    return promise.value;
  } else if (promise.status === "rejected") {
    throw promise.reason;
  } else {
    promise.status = "pending";
    promise.then(
      (v) => {
        promise.status = "fulfilled";
        promise.value = v;
      },
      (e) => {
        promise.status = "rejected";
        promise.reason = e;
      }
    );
    throw promise;
  }
});
function useAtomValue(atom, options) {
  const store = useStore(options);
  const [[valueFromReducer, storeFromReducer, atomFromReducer], rerender] = useReducer(
    (prev) => {
      const nextValue = store.get(atom);
      if (Object.is(prev[0], nextValue) && prev[1] === store && prev[2] === atom) {
        return prev;
      }
      return [nextValue, store, atom];
    },
    void 0,
    () => [store.get(atom), store, atom]
  );
  let value = valueFromReducer;
  if (storeFromReducer !== store || atomFromReducer !== atom) {
    rerender();
    value = store.get(atom);
  }
  const delay = options == null ? void 0 : options.delay;
  useEffect(() => {
    const unsub = store.sub(atom, () => {
      if (typeof delay === "number") {
        setTimeout(rerender, delay);
        return;
      }
      rerender();
    });
    rerender();
    return unsub;
  }, [store, atom, delay]);
  useDebugValue(value);
  return isPromiseLike(value) ? use(value) : value;
}

function useSetAtom(atom, options) {
  const store = useStore(options);
  const setAtom = useCallback(
    (...args) => {
      if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && !("write" in atom)) {
        throw new Error("not writable atom");
      }
      return store.set(atom, ...args);
    },
    [store, atom]
  );
  return setAtom;
}

const MIXAMO_PREFIX = 'mixamorig';
const POSITION_SUFFIX = '.position';
const MIXAMO_SCALE = 0.01;
const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
function normaliseFbxAnimation(fbx, index = 0) {
    const { tracks } = fbx.animations[index];
    for (let i = 0; i < tracks.length; i += 1) {
        const hasMixamoPrefix = tracks[i].name.includes(MIXAMO_PREFIX);
        if (hasMixamoPrefix) {
            tracks[i].name = tracks[i].name.replace(MIXAMO_PREFIX, '');
        }
        if (tracks[i].name.includes(POSITION_SUFFIX)) {
            for (let j = 0; j < tracks[i].values.length; j += 1) {
                // Scale the bound size down to match the size of the model
                // eslint-disable-next-line operator-assignment
                tracks[i].values[j] = tracks[i].values[j] * MIXAMO_SCALE;
            }
        }
    }
    return fbx.animations[index];
}
const loadBlobFile = (blob) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buffer = yield blob.arrayBuffer();
        return {
            group: (yield gltfLoader.parseAsync(buffer, '')),
            isFbx: false
        };
    }
    catch (e) {
        return {
            group: (yield fbxLoader.loadAsync(URL.createObjectURL(blob))),
            isFbx: true
        };
    }
});
const loadPathFile = (source) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return {
            group: (yield gltfLoader.loadAsync(source)),
            isFbx: false
        };
    }
    catch (e) {
        return {
            group: (yield fbxLoader.loadAsync(source)),
            isFbx: true
        };
    }
});
const loadAnimationClip = (source) => __awaiter(void 0, void 0, void 0, function* () {
    const animation = source instanceof Blob ? yield loadBlobFile(source) : yield loadPathFile(source);
    return animation.isFbx ? normaliseFbxAnimation(animation.group) : animation.group.animations[0];
});

const SpawnEffect = ({ onLoadedEffect, onLoadedEffectFinish }) => {
    const ref = useRef(null);
    const [effectRunning, setEffectRunning] = React.useState(true);
    const { scene: mountEffectScene } = useGltfLoader(onLoadedEffect.src);
    const { nodes: mountEffectNode } = useGraph(mountEffectScene);
    useEffect(() => {
        if (!effectRunning) {
            triggerCallback(onLoadedEffectFinish);
        }
    }, [onLoadedEffectFinish, effectRunning]);
    const animationLoadedEffect = useMemo(() => __awaiter(void 0, void 0, void 0, function* () { return loadAnimationClip((onLoadedEffect === null || onLoadedEffect === void 0 ? void 0 : onLoadedEffect.animationSrc) || onLoadedEffect.src); }), [onLoadedEffect === null || onLoadedEffect === void 0 ? void 0 : onLoadedEffect.animationSrc, onLoadedEffect.src]);
    const spawnEffectMixer = useMemo(() => __awaiter(void 0, void 0, void 0, function* () {
        const mixer = new AnimationMixer(mountEffectNode.Scene);
        const loadedEffect = yield animationLoadedEffect;
        if (!loadedEffect) {
            setEffectRunning(false);
            return mixer;
        }
        const animation = mixer.clipAction(loadedEffect);
        animation.setLoop(LoopRepeat, (onLoadedEffect === null || onLoadedEffect === void 0 ? void 0 : onLoadedEffect.loop) || 1);
        animation.clampWhenFinished = true;
        animation.play();
        mixer.addEventListener('finished', () => {
            animation.fadeOut(0.5);
            setEffectRunning(false);
        });
        return mixer;
    }), [mountEffectNode.Scene, animationLoadedEffect, onLoadedEffect === null || onLoadedEffect === void 0 ? void 0 : onLoadedEffect.loop]);
    useFrame((state, delta) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        (_a = (yield spawnEffectMixer)) === null || _a === void 0 ? void 0 : _a.update(delta);
    }));
    return React.createElement(React.Fragment, null, effectRunning && React.createElement("primitive", { modelRef: ref, object: mountEffectScene }));
};

const SpawnAnimation = ({ avatar, onLoadedAnimationFinish, onLoadedAnimation }) => {
    const [animationRunning, setAnimationRunning] = React.useState(true);
    useEffect(() => {
        if (!animationRunning) {
            triggerCallback(onLoadedAnimationFinish);
        }
    }, [onLoadedAnimationFinish, animationRunning]);
    const { nodes: avatarNode } = useGraph(avatar);
    const animationClip = useMemo(() => __awaiter(void 0, void 0, void 0, function* () { return loadAnimationClip((onLoadedAnimation === null || onLoadedAnimation === void 0 ? void 0 : onLoadedAnimation.src) || ''); }), [onLoadedAnimation === null || onLoadedAnimation === void 0 ? void 0 : onLoadedAnimation.src]);
    const animationMixerAvatar = useMemo(() => __awaiter(void 0, void 0, void 0, function* () {
        const mixer = new AnimationMixer(avatarNode.Armature);
        if (!avatarNode.Armature) {
            return mixer;
        }
        const animation = mixer.clipAction(yield animationClip);
        animation.setLoop(LoopRepeat, (onLoadedAnimation === null || onLoadedAnimation === void 0 ? void 0 : onLoadedAnimation.loop) || 1);
        animation.clampWhenFinished = true;
        animation.play();
        mixer.addEventListener('finished', () => {
            animation.fadeOut(0.5);
            setAnimationRunning(false);
        });
        return mixer;
    }), [avatarNode.Armature, onLoadedAnimation === null || onLoadedAnimation === void 0 ? void 0 : onLoadedAnimation.loop, animationClip]);
    useFrame((state, delta) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        (_a = (yield animationMixerAvatar)) === null || _a === void 0 ? void 0 : _a.update(delta);
    }));
    return React.createElement(React.Fragment, null);
};

const initialSpawnState = {
    onLoadedEffect: null,
    onLoadedAnimation: null
};
const spawnState = atom(initialSpawnState);

const Spawn = ({ avatar, onSpawnFinish }) => {
    var _a, _b;
    const animationProps = useAtomValue(spawnState);
    const usesMountEffect = isValidFormat((_a = animationProps === null || animationProps === void 0 ? void 0 : animationProps.onLoadedEffect) === null || _a === void 0 ? void 0 : _a.src);
    const usesMountAnimation = isValidFormat((_b = animationProps === null || animationProps === void 0 ? void 0 : animationProps.onLoadedAnimation) === null || _b === void 0 ? void 0 : _b.src);
    const [effectRunning, setEffectRunning] = React.useState(usesMountEffect);
    const [animationRunning, setAnimationRunning] = React.useState(usesMountAnimation);
    useEffect(() => {
        if (!animationRunning && !effectRunning) {
            triggerCallback(onSpawnFinish);
        }
    }, [onSpawnFinish, effectRunning, animationRunning]);
    const onLoadedAnimationFinish = () => {
        setAnimationRunning(false);
    };
    const onLoadedEffectFinish = () => {
        setEffectRunning(false);
    };
    return (React.createElement(React.Fragment, null,
        usesMountEffect && (React.createElement(SpawnEffect, { onLoadedEffect: animationProps.onLoadedEffect, onLoadedEffectFinish: onLoadedEffectFinish })),
        usesMountAnimation && (React.createElement(SpawnAnimation, { onLoadedAnimation: animationProps.onLoadedAnimation, avatar: avatar, onLoadedAnimationFinish: onLoadedAnimationFinish }))));
};

const ROTATION_STEP = 0.005;
const isBrowser$1 = typeof window !== 'undefined';
const Model = ({ scene, scale = 1, modelRef, onLoaded, onSpawnAnimationFinish, bloom }) => {
    const { materials } = useGraph(scene);
    const { gl } = useThree();
    const [isTouching, setIsTouching] = useState(false);
    const [touchEvent, setTouchEvent] = useState(null);
    const setTouchingOn = (e) => {
        if (isBrowser$1 && window.TouchEvent && e instanceof TouchEvent) {
            setTouchEvent(e);
        }
        setIsTouching(true);
    };
    const setTouchingOff = (e) => {
        if (isBrowser$1 && window.TouchEvent && e instanceof TouchEvent) {
            setTouchEvent(null);
        }
        setIsTouching(false);
    };
    const onTouchMove = useCallback((event) => {
        if (isTouching && event instanceof MouseEvent) {
            /* eslint-disable-next-line no-param-reassign */
            scene.rotation.y += event.movementX * ROTATION_STEP;
        }
        if (isBrowser$1 && isTouching && window.TouchEvent && event instanceof TouchEvent) {
            /* eslint-disable-next-line no-param-reassign */
            const movementX = Math.round(event.touches[0].pageX - touchEvent.touches[0].pageX);
            /* eslint-disable-next-line no-param-reassign */
            scene.rotation.y += movementX * ROTATION_STEP;
            setTouchEvent(event);
        }
    }, [isTouching, touchEvent]);
    normaliseMaterialsConfig(materials, bloom);
    scene.traverse((object) => {
        const node = object;
        if (node.isMesh) {
            node.castShadow = true;
        }
        if (node.type === 'SkinnedMesh') {
            node.receiveShadow = true;
        }
    });
    useEffect(() => triggerCallback(onLoaded), [scene, materials, onLoaded]);
    useEffect(() => {
        gl.domElement.addEventListener('mousedown', setTouchingOn);
        gl.domElement.addEventListener('touchstart', setTouchingOn, { passive: true });
        gl.domElement.addEventListener('mouseup', setTouchingOff);
        gl.domElement.addEventListener('touchend', setTouchingOff);
        gl.domElement.addEventListener('touchcancel', setTouchingOff);
        gl.domElement.addEventListener('mousemove', onTouchMove);
        gl.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
        return () => {
            gl.domElement.removeEventListener('mousedown', setTouchingOn);
            gl.domElement.removeEventListener('touchstart', setTouchingOn);
            gl.domElement.removeEventListener('mouseup', setTouchingOff);
            gl.domElement.removeEventListener('touchend', setTouchingOff);
            gl.domElement.removeEventListener('touchcancel', setTouchingOff);
            gl.domElement.removeEventListener('mousemove', onTouchMove);
            gl.domElement.removeEventListener('touchmove', onTouchMove);
        };
    });
    const spawnComponent = useMemo(() => React.createElement(Spawn, { avatar: scene, onSpawnFinish: onSpawnAnimationFinish }), [onSpawnAnimationFinish]);
    return (React.createElement("group", { ref: modelRef, dispose: null, rotation: [0, 0, 0] },
        React.createElement("primitive", { object: scene, scale: scale }),
        spawnComponent));
};

const FloatingModel = ({ modelSrc, scale = 1.0, onLoaded, bloom }) => {
    const ref = useRef(null);
    const { scene } = useGltfLoader(modelSrc);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ref === null || ref === void 0 ? void 0 : ref.current) {
            ref.current.rotation.y = Math.sin(t / 2) / 8;
            ref.current.position.y = (1 + Math.sin(t / 1.5)) / -9;
        }
    });
    return React.createElement(Model, { modelRef: ref, scale: scale, scene: scene, onLoaded: onLoaded, bloom: bloom });
};

/**
 * Contains model to handle suspense fallback.
 */
const FloatingModelContainer = (props) => {
    /* eslint-disable-next-line react/jsx-no-useless-fragment */
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    return (React.createElement(Suspense, { fallback: fallback },
        React.createElement(FloatingModel, Object.assign({}, props, { setModelFallback: setFallback }))));
};

const StaticModel = ({ modelSrc, modelRef, scale = 1, setModelFallback, onLoaded, emotion, bloom }) => {
    const { scene } = useGltfLoader(modelSrc);
    const { nodes } = useGraph(scene);
    useEmotion(nodes, emotion);
    useFallback(nodes, setModelFallback);
    return React.createElement(Model, { modelRef: modelRef, scene: scene, scale: scale, onLoaded: onLoaded, bloom: bloom });
};

/**
 * Contains model to handle suspense fallback.
 */
const StaticModelContainer = (props) => {
    /* eslint-disable-next-line react/jsx-no-useless-fragment */
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    return (React.createElement(Suspense, { fallback: fallback },
        React.createElement(StaticModel, Object.assign({ setModelFallback: setFallback }, props))));
};

const BoundsModelContainer = ({ modelSrc, children, fit, onLoaded }) => {
    const bounds = useBounds();
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    const onChildLoaded = useCallback(() => {
        if (fit) {
            bounds.refresh().clip().fit();
        }
        triggerCallback(onLoaded);
    }, [bounds, fit]);
    const childModel = useMemo(() => React.Children.map(children, (child) => cloneElement(child, { setModelFallback: setFallback, onLoaded: onChildLoaded })), [modelSrc, children, onChildLoaded]);
    useEffect(() => {
        if (fit) {
            bounds.refresh().clip().fit();
        }
    }, [modelSrc, fit, fallback]);
    return React.createElement(React.Fragment, null, childModel);
};

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$1 = ".BaseCanvas-module_base-canvas__Xjohd {\n  width: 100%;\n  height: 100%;\n  margin: 0;\n  padding: 0;\n}";
var styles$1 = {"base-canvas":"BaseCanvas-module_base-canvas__Xjohd"};
styleInject(css_248z$1);

const isBrowser = typeof window !== 'undefined';
const BaseCanvas = ({ children = undefined, fov = 50, position = new Vector3(0, 0, 5), style, dpr = [(isBrowser ? window.devicePixelRatio : 0) * 0.5, 2], className }) => (React.createElement(Canvas, { key: fov, className: `${styles$1['base-canvas']} ${className !== null && className !== void 0 ? className : ''}`, shadows: "soft", gl: { preserveDrawingBuffer: true, toneMappingExposure: 0.5, alpha: true }, dpr: dpr, camera: { fov, position }, resize: { scroll: true, debounce: { scroll: 50, resize: 0 } }, style: Object.assign(Object.assign({}, style), { background: 'transparent' }) }, children));

const Capture = ({ trigger, settings, callBack }) => {
    const gl = useThree((state) => state.gl);
    const type = (settings === null || settings === void 0 ? void 0 : settings.type) || 'image/png';
    const quality = (settings === null || settings === void 0 ? void 0 : settings.quality) || 0.1;
    useEffect(() => {
        if (trigger) {
            const capture = gl.domElement.toDataURL(type, quality);
            callBack(capture);
        }
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [trigger]);
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return React.createElement(React.Fragment, null);
};

const BackgroundColor = ({ color }) => React.createElement("color", { attach: "background", args: [color] });

const Box = (_a) => {
    var { src = '' } = _a, baseProps = __rest(_a, ["src"]);
    const ref = useRef(null);
    const texture = useLoader(TextureLoader, src);
    return (React.createElement("mesh", Object.assign({ ref: ref, castShadow: true, receiveShadow: true }, baseProps),
        React.createElement("boxBufferGeometry", null),
        React.createElement("meshPhysicalMaterial", { map: texture })));
};

/**
 * Interactive presentation of any GLTF (.glb) asset.
 */
const Exhibit = ({ modelSrc, scale = 1.0, environment = 'city', position, style, className, shadows = false, float = false, fit = false, capture, snap = false, lockVertical = false, onLoaded, onLoading }) => {
    const model = useMemo(() => {
        if (!isValidFormat(modelSrc)) {
            return null;
        }
        if (!float) {
            return React.createElement(StaticModelContainer, { modelSrc: modelSrc, scale: scale });
        }
        return React.createElement(FloatingModelContainer, { modelSrc: modelSrc, scale: scale });
    }, [float, modelSrc, scale]);
    useEffect(() => triggerCallback(onLoading), [modelSrc, onLoading]);
    return (React.createElement(BaseCanvas, { position: position, style: style, className: className },
        React.createElement(Suspense, { fallback: null },
            React.createElement("ambientLight", { intensity: 0.5 }),
            React.createElement("spotLight", { position: [10, 10, 10], angle: 0.15, penumbra: 1, "shadow-mapSize": [512, 512], castShadow: true }),
            React.createElement(PresentationControls, { global: true, config: { mass: 2, tension: 500 }, snap: snap, rotation: [0, -0.3, 0], polar: lockVertical ? [0, 0] : [-Math.PI / 3, Math.PI / 3], azimuth: [-Infinity, Infinity] }, model && (React.createElement(Bounds, { fit: fit, clip: fit, observe: fit },
                React.createElement(BoundsModelContainer, { modelSrc: modelSrc, fit: fit, onLoaded: onLoaded }, model)))),
            shadows && React.createElement(ContactShadows, { position: [0, -1.0, 0], opacity: 0.75, scale: 10, blur: 2.6, far: 2 }),
            React.createElement(Environment, { environment: environment })),
        capture && React.createElement(Capture, Object.assign({}, capture)),
        (style === null || style === void 0 ? void 0 : style.background) && React.createElement(BackgroundColor, { color: style.background })));
};

let currentRotation$1 = 0;
const AnimationModel = ({ modelSrc, animationSrc, rotation = 20 * (Math.PI / 180), scale = 1, idleRotation = false, setModelFallback, onLoaded, headMovement = false, bloom }) => {
    const ref = useRef(null);
    const [animationRunning, setAnimationRunning] = React.useState(true);
    const onSpawnAnimationFinish = () => {
        setAnimationRunning(false);
    };
    const { scene } = useGltfLoader(modelSrc);
    const { nodes } = useGraph(scene);
    const animationClip = useMemo(() => __awaiter(void 0, void 0, void 0, function* () { return loadAnimationClip(animationSrc); }), [animationSrc]);
    const animationMixer = useMemo(() => __awaiter(void 0, void 0, void 0, function* () {
        const mixer = new AnimationMixer(nodes.Armature);
        if (animationRunning) {
            return mixer;
        }
        const animation = mixer.clipAction(yield animationClip);
        animation.fadeIn(0.5);
        animation.play();
        mixer.update(0);
        return mixer;
    }), [animationRunning, animationClip, nodes.Armature]);
    useFrame((state, delta) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        (_a = (yield animationMixer)) === null || _a === void 0 ? void 0 : _a.update(delta);
        if (!idleRotation) {
            return;
        }
        if (ref === null || ref === void 0 ? void 0 : ref.current) {
            currentRotation$1 += delta * 0.2;
            ref.current.rotation.y = rotation + Math.sin(currentRotation$1) / 3;
        }
    }));
    useHeadMovement({ nodes, enabled: headMovement });
    useIdleExpression('blink', nodes);
    useFallback(nodes, setModelFallback);
    return (React.createElement(Model, { modelRef: ref, scene: scene, scale: scale, onLoaded: () => onLoaded && onLoaded(ref.current), onSpawnAnimationFinish: onSpawnAnimationFinish, bloom: bloom }));
};

/**
 * Contains model to handle suspense fallback.
 */
const AnimationModelContainer = (props) => {
    /* eslint-disable-next-line react/jsx-no-useless-fragment */
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    return (React.createElement(Suspense, { fallback: fallback },
        React.createElement(AnimationModel, Object.assign({ setModelFallback: setFallback }, props))));
};

let currentRotation = 0;
const HalfBodyModel = ({ modelSrc, scale = 1, rotation = 20 * (Math.PI / 180), idleRotation = false, emotion, setModelFallback, onLoaded, headMovement = false, bloom }) => {
    const ref = useRef(null);
    const { scene } = useGltfLoader(modelSrc);
    const { nodes } = useGraph(scene);
    scene.traverse((object) => {
        const node = object;
        if (node.name === 'Wolf3D_Hands') {
            node.visible = false;
        }
        if (node.name === 'RightHand') {
            node.position.set(0, -2, 0);
        }
        if (node.name === 'LeftHand') {
            node.position.set(0, -2, 0);
        }
    });
    useFrame((state, delta) => {
        if (!idleRotation) {
            return;
        }
        if (ref === null || ref === void 0 ? void 0 : ref.current) {
            currentRotation += delta * 0.2;
            ref.current.rotation.y = rotation + Math.sin(currentRotation) / 3;
        }
    });
    useHeadMovement({ nodes, isHalfBody: true, enabled: headMovement });
    useIdleExpression('blink', nodes);
    useEmotion(nodes, emotion);
    useFallback(nodes, setModelFallback);
    return React.createElement(Model, { modelRef: ref, scene: scene, scale: scale, onLoaded: onLoaded, bloom: bloom });
};

/**
 * Contains model to handle suspense fallback.
 */
const HalfBodyModelContainer = (props) => {
    /* eslint-disable-next-line react/jsx-no-useless-fragment */
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    return (React.createElement(Suspense, { fallback: fallback },
        React.createElement(HalfBodyModel, Object.assign({ setModelFallback: setFallback }, props))));
};

const PoseModel = ({ modelSrc, poseSrc, modelRef, scale = 1, emotion, setModelFallback, onLoaded, bloom }) => {
    const { scene } = useGltfLoader(modelSrc);
    const { nodes } = useGraph(scene);
    const pose = useGltfLoader(poseSrc);
    const { nodes: sourceNodes } = useGraph(pose.scene);
    mutatePose(nodes, sourceNodes);
    useEmotion(nodes, emotion);
    useFallback(nodes, setModelFallback);
    return React.createElement(Model, { modelRef: modelRef, scene: scene, scale: scale, onLoaded: onLoaded, bloom: bloom });
};

/**
 * Contains model to handle suspense fallback.
 */
const PoseModelContainer = (props) => {
    /* eslint-disable-next-line react/jsx-no-useless-fragment */
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    return (React.createElement(Suspense, { fallback: fallback },
        React.createElement(PoseModel, Object.assign({ setModelFallback: setFallback }, props))));
};

const EnvironmentModel = ({ environment, scale = 1, setModelFallback, onLoaded }) => {
    const transform = new Transform();
    const { scene } = useGltfLoader(environment);
    const { nodes } = useGraph(scene);
    useFallback(nodes, setModelFallback);
    useEffect(() => triggerCallback(onLoaded), [scene, onLoaded]);
    return (React.createElement("group", null, Object.keys(nodes).map((key) => {
        const node = nodes[key];
        if (node.type === 'Mesh') {
            return (React.createElement("mesh", { receiveShadow: true, key: node.name, scale: scale, position: transform.position, rotation: transform.rotation, geometry: node.geometry, material: node.material, morphTargetInfluences: node.morphTargetInfluences || [] }));
        }
        return null;
    })));
};

/**
 * Contains model to handle suspense fallback.
 */
const EnvironmentModelContainer = (props) => {
    /* eslint-disable-next-line react/jsx-no-useless-fragment */
    const [fallback, setFallback] = useState(React.createElement(React.Fragment, null));
    const { environment } = props;
    const isStaticPreset = environment in environmentModels;
    const environmentSrc = isStaticPreset ? environmentModels[environment] : environment;
    return (React.createElement(Suspense, { fallback: fallback },
        React.createElement(EnvironmentModel, Object.assign({ setModelFallback: setFallback }, props, { environment: environmentSrc }))));
};

let controls;
let progress = Number.POSITIVE_INFINITY;
const updateCameraFocus = (camera, delta, target) => {
    if (target && progress <= 1) {
        camera.position.setX(lerp(camera.position.x, target.x, progress));
        camera.position.setZ(lerp(camera.position.z, target.z, progress));
        progress += delta;
    }
};
const updateCameraTarget = (camera, target, minDistance, maxDistance) => {
    if (controls) {
        let distance = controls.target.distanceTo(camera.position);
        distance = clamp(distance, maxDistance, minDistance);
        const pivot = (distance - minDistance) / (maxDistance - minDistance);
        controls.target.set(0, target - 0.6 * pivot, 0);
    }
};
const CameraLighting = ({ onCameraReady, // custom change
cameraTarget, cameraInitialDistance, cameraZoomTarget, headScale = 1, ambientLightColor, ambientLightIntensity, dirLightPosition, dirLightColor, dirLightIntensity, spotLightPosition, spotLightColor, spotLightAngle, spotLightIntensity, controlsMinDistance = 0.4, controlsMaxDistance = 2.5, updateCameraTargetOnZoom = false }) => {
    const cameraZoomTargetRef = useRef(cameraZoomTarget);
    const { camera, gl, scene } = useThree();
    const fallbackCameraTarget = cameraTarget || 1.475 + headScale / 10;
    const headScaleAdjustedMinDistance = controlsMinDistance + headScale / 10;
    useEffect(() => {
        var _a, _b, _c;
        if (((_a = cameraZoomTargetRef.current) === null || _a === void 0 ? void 0 : _a.x) !== (cameraZoomTarget === null || cameraZoomTarget === void 0 ? void 0 : cameraZoomTarget.x) ||
            ((_b = cameraZoomTargetRef.current) === null || _b === void 0 ? void 0 : _b.y) !== (cameraZoomTarget === null || cameraZoomTarget === void 0 ? void 0 : cameraZoomTarget.y) ||
            ((_c = cameraZoomTargetRef.current) === null || _c === void 0 ? void 0 : _c.z) !== (cameraZoomTarget === null || cameraZoomTarget === void 0 ? void 0 : cameraZoomTarget.z)) {
            cameraZoomTargetRef.current = cameraZoomTarget;
            progress = 0;
        }
        controls = new OrbitControls(camera, gl.domElement);
        if (onCameraReady)
            onCameraReady(camera, controls); // custom change
        // controls.enableRotate = false;
        // controls.enablePan = false;
        // prevents camera from zooming too far into the insides of the body // custom change
        controls.minDistance = headScaleAdjustedMinDistance;
        controls.maxDistance = controlsMaxDistance;
        controls.minPolarAngle = 1.4;
        controls.maxPolarAngle = 1.4;
        controls.target.set(0, fallbackCameraTarget, 0);
        controls.update();
        // TODO: Look for a better distance initialiser, without progress value check it conflicts with cameraZoomTarget which also can update camera position.z
        if (cameraInitialDistance && progress === Number.POSITIVE_INFINITY) {
            camera.position.z = cameraInitialDistance;
            controls.update();
        }
        return () => {
            controls.dispose();
        };
    }, [
        cameraInitialDistance,
        camera,
        controlsMinDistance,
        controlsMaxDistance,
        fallbackCameraTarget,
        gl.domElement,
        headScaleAdjustedMinDistance,
        cameraZoomTarget
    ]);
    useEffect(() => {
        if (!scene.getObjectByName('back-highlight')) {
            const dirLight = new DirectionalLight(dirLightColor, dirLightIntensity);
            dirLight.name = 'back-highlight';
            dirLight.position.set(dirLightPosition.x, dirLightPosition.y, dirLightPosition.z);
            dirLight.castShadow = true;
            dirLight.shadow.bias = -0.0001;
            dirLight.shadow.mapSize.height = 1024;
            dirLight.shadow.mapSize.width = 1024;
            dirLight.shadow.blurSamples = 100;
            const ambientLight = new AmbientLight(ambientLightColor, ambientLightIntensity);
            ambientLight.name = 'ambient-light';
            ambientLight.position.set(0, 0, 0);
            const spotLight = new SpotLight(spotLightColor, spotLightIntensity, 0, spotLightAngle, 0, 1);
            spotLight.name = 'spot-light';
            spotLight.position.set(spotLightPosition.x, spotLightPosition.y, spotLightPosition.z);
            camera.add(ambientLight);
            camera.add(spotLight);
            camera.add(dirLight);
            scene.add(camera);
        }
        else {
            const dirLight = scene.getObjectByName('back-highlight');
            dirLight.color.set(dirLightColor);
            dirLight.intensity = dirLightIntensity;
            dirLight.position.set(dirLightPosition.x, dirLightPosition.y, dirLightPosition.z);
            const ambientLight = scene.getObjectByName('ambient-light');
            ambientLight.color.set(ambientLightColor);
            ambientLight.intensity = ambientLightIntensity;
            const spotLight = scene.getObjectByName('spot-light');
            spotLight.color.set(spotLightColor);
            spotLight.intensity = spotLightIntensity;
            spotLight.angle = spotLightAngle;
            spotLight.position.set(spotLightPosition.x, spotLightPosition.y, spotLightPosition.z);
        }
    }, [
        ambientLightColor,
        ambientLightIntensity,
        dirLightPosition,
        dirLightColor,
        dirLightIntensity,
        spotLightPosition,
        spotLightColor,
        spotLightIntensity,
        spotLightAngle,
        camera,
        scene
    ]);
    useFrame((_, delta) => {
        if (updateCameraTargetOnZoom) {
            updateCameraTarget(camera, fallbackCameraTarget, headScaleAdjustedMinDistance, controlsMaxDistance);
        }
        updateCameraFocus(camera, delta, cameraZoomTarget);
        if (controls) {
            controls.update();
        }
    });
    return null;
};

const Shadow = () => (React.createElement("group", { position: [0, 0, 0] },
    React.createElement("mesh", { key: "shadow-catcher", receiveShadow: true, position: [0, 0, 0], "rotation-x": -Math.PI / 2 },
        React.createElement("planeGeometry", { attach: "geometry", args: [5, 5] }),
        React.createElement("shadowMaterial", { attach: "material", transparent: true, opacity: 0.2 }))));

var css_248z = ".Loader-module_loader__Ukoov {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  height: 100%;\n  width: 100%;\n}\n\n.Loader-module_dots__KfhUo {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.Loader-module_dot__qTWRh {\n  background-color: rgb(236, 236, 236);\n  width: 8px;\n  height: 8px;\n  margin: 2px;\n  border-radius: 100%;\n  display: inline-block;\n}\n.Loader-module_dot__qTWRh:nth-child(1) {\n  animation: 0.75s cubic-bezier(0.2, 0.68, 0.18, 1.08) 0.12s infinite normal both running Loader-module_glowing__nwo3q;\n}\n.Loader-module_dot__qTWRh:nth-child(2) {\n  animation: 0.75s cubic-bezier(0.2, 0.68, 0.18, 1.08) 0.24s infinite normal both running Loader-module_glowing__nwo3q;\n}\n.Loader-module_dot__qTWRh:nth-child(3) {\n  animation: 0.75s cubic-bezier(0.2, 0.68, 0.18, 1.08) 0.36s infinite normal both running Loader-module_glowing__nwo3q;\n}\n\n@keyframes Loader-module_glowing__nwo3q {\n  0% {\n    transform: scale(1);\n    opacity: 1;\n  }\n  45% {\n    transform: scale(0.1);\n    opacity: 0.7;\n  }\n  80% {\n    transform: scale(1);\n    opacity: 1;\n  }\n}";
var styles = {"loader":"Loader-module_loader__Ukoov","dots":"Loader-module_dots__KfhUo","dot":"Loader-module_dot__qTWRh","glowing":"Loader-module_glowing__nwo3q"};
styleInject(css_248z);

const Loader = () => (React.createElement("div", { className: styles.loader },
    React.createElement("div", { className: styles.dots }, [1, 2, 3].map((it) => (React.createElement("div", { key: it, className: styles.dot }))))));

const Bloom = ({ luminanceThreshold = 1, luminanceSmoothing = 1, mipmapBlur = true, intensity = 0.1, kernelSize = 0 }) => (React.createElement(Bloom$1, { luminanceThreshold: luminanceThreshold, luminanceSmoothing: luminanceSmoothing, mipmapBlur: mipmapBlur, intensity: intensity, kernelSize: kernelSize }));

const CAMERA = {
    TARGET: {
        FULL_BODY: {
            MALE: 1.65,
            FEMALE: 1.55
        },
        HALF_BODY: 0.6
    },
    INITIAL_DISTANCE: {
        FULL_BODY: 0.4,
        HALF_BODY: 0.5
    },
    CONTROLS: {
        FULL_BODY: {
            MIN_DISTANCE: 0.5,
            MAX_DISTANCE: 3.2,
            ZOOM_TARGET: new Vector3(-0.11, 0, 3.2)
        },
        HALF_BODY: {
            MIN_DISTANCE: 0.4,
            MAX_DISTANCE: 1.4,
            ZOOM_TARGET: new Vector3(-0.15, 0, 0.55)
        }
    }
};
/**
 * Interactive avatar presentation with zooming and horizontal rotation controls.
 * Optimised for full-body and half-body avatars.
 */
const Avatar = ({ onCameraReady, // custom change
modelSrc, animationSrc = undefined, poseSrc = undefined, environment = 'city', halfBody = false, shadows = false, scale = 1, ambientLightColor = '#fff5b6', ambientLightIntensity = 0.25, dirLightPosition = new Vector3(-3, 5, -5), dirLightColor = '#002aff', dirLightIntensity = 5, spotLightPosition = new Vector3(12, 10, 7.5), spotLightColor = '#fff5b6', spotLightAngle = 0.314, spotLightIntensity = 1, cameraTarget = CAMERA.TARGET.FULL_BODY.MALE, cameraInitialDistance = CAMERA.INITIAL_DISTANCE.FULL_BODY, style, emotion, idleRotation = false, capture, background, onLoaded, onLoading, dpr, className, headMovement = false, cameraZoomTarget = CAMERA.CONTROLS.FULL_BODY.ZOOM_TARGET, bloom, onLoadedEffect, onLoadedAnimation, children, effects, fov = 50 }) => {
    const setSpawnState = useSetAtom(spawnState);
    useEffect(() => {
        setSpawnState({ onLoadedEffect, onLoadedAnimation });
    }, [onLoadedAnimation, onLoadedEffect, setSpawnState]);
    const AvatarModel = useMemo(() => {
        if (!isValidFormat(modelSrc)) {
            return null;
        }
        if (!!animationSrc && !halfBody && isValidFormat(animationSrc)) {
            return (React.createElement(AnimationModelContainer, { modelSrc: modelSrc, animationSrc: animationSrc, scale: scale, idleRotation: idleRotation, onLoaded: onLoaded, headMovement: headMovement, bloom: bloom }));
        }
        if (halfBody) {
            return (React.createElement(HalfBodyModelContainer, { emotion: emotion, modelSrc: modelSrc, scale: scale, idleRotation: idleRotation, onLoaded: onLoaded, headMovement: headMovement, bloom: bloom }));
        }
        if (isValidFormat(poseSrc)) {
            return (React.createElement(PoseModelContainer, { emotion: emotion, modelSrc: modelSrc, scale: scale, poseSrc: poseSrc, onLoaded: onLoaded, bloom: bloom }));
        }
        return React.createElement(StaticModelContainer, { modelSrc: modelSrc, scale: scale, onLoaded: onLoaded, emotion: emotion, bloom: bloom });
    }, [halfBody, animationSrc, modelSrc, scale, poseSrc, idleRotation, emotion, onLoaded, headMovement, bloom]);
    useEffect(() => triggerCallback(onLoading), [modelSrc, animationSrc, onLoading]);
    return (React.createElement(BaseCanvas, { position: new Vector3(0, 0, 3), fov: fov, style: style, dpr: dpr, className: className },
        React.createElement(Environment, { environment: environment }),
        React.createElement(CameraLighting, { onCameraReady: onCameraReady, cameraTarget: cameraTarget, cameraInitialDistance: cameraInitialDistance, cameraZoomTarget: cameraZoomTarget, ambientLightColor: ambientLightColor, ambientLightIntensity: ambientLightIntensity, dirLightPosition: dirLightPosition, dirLightColor: dirLightColor, dirLightIntensity: dirLightIntensity, spotLightPosition: spotLightPosition, spotLightColor: spotLightColor, spotLightAngle: spotLightAngle, spotLightIntensity: spotLightIntensity, controlsMinDistance: halfBody ? CAMERA.CONTROLS.HALF_BODY.MIN_DISTANCE : CAMERA.CONTROLS.FULL_BODY.MIN_DISTANCE, controlsMaxDistance: halfBody ? CAMERA.CONTROLS.HALF_BODY.MAX_DISTANCE : CAMERA.CONTROLS.FULL_BODY.MAX_DISTANCE, updateCameraTargetOnZoom: !halfBody }),
        AvatarModel,
        children,
        shadows && React.createElement(Shadow, null),
        (background === null || background === void 0 ? void 0 : background.src) && React.createElement(Box, Object.assign({}, background)),
        capture && React.createElement(Capture, Object.assign({}, capture)),
        (background === null || background === void 0 ? void 0 : background.color) && React.createElement(BackgroundColor, { color: background.color }),
        React.createElement(EffectComposer, { autoClear: false },
            React.createElement(Bloom, { luminanceThreshold: bloom === null || bloom === void 0 ? void 0 : bloom.luminanceThreshold, luminanceSmoothing: bloom === null || bloom === void 0 ? void 0 : bloom.luminanceSmoothing, intensity: bloom === null || bloom === void 0 ? void 0 : bloom.intensity, kernelSize: bloom === null || bloom === void 0 ? void 0 : bloom.kernelSize, mipmapBlur: bloom === null || bloom === void 0 ? void 0 : bloom.mipmapBlur }),
            React.createElement(React.Fragment, null, (effects === null || effects === void 0 ? void 0 : effects.ambientOcclusion) && (React.createElement(SSAO, { blendFunction: BlendFunction.MULTIPLY, distanceScaling: false, radius: 0.09, bias: 0.02, intensity: 3, samples: 20, worldDistanceThreshold: 24, worldDistanceFalloff: 0, worldProximityThreshold: 0, worldProximityFalloff: 6 }))))));
};
const AvatarWrapper = (props) => {
    var _a;
    return (React.createElement(Suspense, { fallback: (_a = props.loader) !== null && _a !== void 0 ? _a : React.createElement(Loader, null) },
        React.createElement(Provider, null,
            React.createElement(Avatar, Object.assign({}, props)))));
};

const FloorReflection = (_a) => {
    var { resolution = 512, mixBlur = 0.8, mixStrength = 80, metalness = 0.5, blur = [300, 200], mirror = 1, minDepthThreshold = 0.4, maxDepthThreshold = 1.4, depthScale = 1.2, depthToBlurRatioBias = 1, distortion = 0, mixContrast = 1, reflectorOffset = 0, roughness = 1, color } = _a, props = __rest(_a, ["resolution", "mixBlur", "mixStrength", "metalness", "blur", "mirror", "minDepthThreshold", "maxDepthThreshold", "depthScale", "depthToBlurRatioBias", "distortion", "mixContrast", "reflectorOffset", "roughness", "color"]);
    return (React.createElement(React.Fragment, null,
        React.createElement("fog", { attach: "fog", args: [color, 4, 8] }),
        React.createElement("group", { position: [0, 0, 0] },
            React.createElement("mesh", { rotation: [-Math.PI / 2, 0, 0] },
                React.createElement("planeGeometry", { args: [20, 10] }),
                React.createElement(MeshReflectorMaterial, Object.assign({ resolution: resolution, mixBlur: mixBlur, mixStrength: mixStrength, metalness: metalness, blur: blur, mirror: mirror, minDepthThreshold: minDepthThreshold, maxDepthThreshold: maxDepthThreshold, depthScale: depthScale, depthToBlurRatioBias: depthToBlurRatioBias, distortion: distortion, mixContrast: mixContrast, reflectorOffset: reflectorOffset, roughness: roughness, color: color, envMapIntensity: 0 }, props))))));
};

export { AnimationModelContainer as AnimationModel, AvatarWrapper as Avatar, CAMERA, EnvironmentModelContainer as EnvironmentModel, Exhibit, FloatingModelContainer as FloatingModel, FloorReflection, HalfBodyModelContainer as HalfBodyModel, PoseModelContainer as PoseModel, StaticModelContainer as StaticModel, lerp };
