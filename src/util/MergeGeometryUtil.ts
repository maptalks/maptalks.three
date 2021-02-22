
import { MergeAttributeType } from './../type/index';
import * as THREE from 'three';
import { TypedArray } from 'three';
import { addAttribute } from './ThreeAdaptUtil';

export function mergeBufferGeometries(geometries: Array<MergeAttributeType>): THREE.BufferGeometry {
    const { position, normal, uv, indices } = mergeBufferGeometriesAttribute(geometries);
    const bufferGeomertry = new THREE.BufferGeometry();
    const color = new Float32Array(position.length);
    color.fill(1, 0, position.length);
    addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
    addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(normal, 3));
    addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(position, 3));
    if (uv && uv.length) {
        addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(uv, 2));
    }
    bufferGeomertry.setIndex(new THREE.BufferAttribute(indices, 1));
    return bufferGeomertry;
}


export function mergeBufferGeometriesAttribute(geometries: Array<MergeAttributeType>): MergeAttributeType {
    const attributes: { [key: string]: Array<TypedArray> } = {}, attributesLen: { [key: string]: number } = {};
    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        for (const name in geometry) {
            if (attributes[name] === undefined) {
                attributes[name] = [];
                attributesLen[name] = 0;
            }
            attributes[name].push((geometry as any)[name]);
            attributesLen[name] += (geometry as any)[name].length;
        }
    }
    // merge attributes
    const mergedGeometry: MergeAttributeType = {};
    let indexOffset = 0;
    const mergedIndex = [];
    for (const name in attributes) {
        if (name === 'indices') {
            const indices = attributes[name];
            for (let i = 0, len = indices.length; i < len; i++) {
                const index = indices[i];
                for (let j = 0, len1 = index.length; j < len1; j++) {
                    mergedIndex.push(index[j] + indexOffset);
                }
                indexOffset += attributes['position'][i].length / 3;
            }
        } else {
            const mergedAttribute = mergeBufferAttributes(attributes[name], attributesLen[name]);
            if (!mergedAttribute) return null;
            (mergedGeometry as any)[name] = mergedAttribute;
        }
    }
    mergedGeometry['indices'] = new Uint32Array(mergedIndex);
    return mergedGeometry;
}



function mergeBufferAttributes(attributes: Array<TypedArray>, arrayLength: number): Float32Array {
    const array = new Float32Array(arrayLength);
    let offset = 0;
    for (let i = 0; i < attributes.length; ++i) {
        array.set(attributes[i], offset);
        offset += attributes[i].length;
    }
    return array;
}

export function generateBufferGeometry(data: MergeAttributeType): THREE.BufferGeometry {
    //arraybuffer data
    const { position, normal, uv, indices } = data;
    const color = new Float32Array(position.length);
    color.fill(1, 0, position.length);
    const bufferGeomertry = new THREE.BufferGeometry();
    addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
    addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
    addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(new Float32Array(position), 3));
    addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    bufferGeomertry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    return bufferGeomertry;
}

let defaultBufferGeometry: THREE.BufferGeometry;

export function getDefaultBufferGeometry(): THREE.BufferGeometry {
    if (!defaultBufferGeometry) {
        const SIZE = 0.000001;
        defaultBufferGeometry = new THREE.BoxBufferGeometry(SIZE, SIZE, SIZE);
    }
    return defaultBufferGeometry;
}
