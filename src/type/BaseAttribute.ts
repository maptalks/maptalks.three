import * as THREE from 'three';
import { TypedArray } from 'three';

export type BaseAttributeType = {
    position: THREE.BufferAttribute,
    uv: THREE.BufferAttribute,
    normal: THREE.BufferAttribute,
    color: THREE.BufferAttribute
};

export type MergeAttributeType = {
    position?: ArrayLike<number> | TypedArray,
    uv?: ArrayLike<number> | TypedArray,
    normal?: ArrayLike<number> | TypedArray,
    color?: ArrayLike<number> | TypedArray,
    indices?: ArrayLike<number> | TypedArray
};
