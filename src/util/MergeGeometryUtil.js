import * as THREE from 'three';
import { addAttribute } from './ThreeAdaptUtil';

export function mergeBufferGeometries(geometries) {
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


export function mergeBufferGeometriesAttribute(geometries) {
    const attributes = {}, attributesLen = {};
    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        for (let name in geometry) {
            if (attributes[name] === undefined) {
                attributes[name] = [];
                attributesLen[name] = 0;
            }
            attributes[name].push(geometry[name]);
            attributesLen[name] += geometry[name].length;
        }
    }
    // merge attributes
    const mergedGeometry = {};
    let indexOffset = 0;
    const mergedIndex = [];
    for (let name in attributes) {
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
            mergedGeometry[name] = mergedAttribute;
        }
    }
    mergedGeometry['indices'] = new Uint32Array(mergedIndex);
    return mergedGeometry;
}



function mergeBufferAttributes(attributes, arrayLength) {
    const array = new Float32Array(arrayLength);
    let offset = 0;
    for (let i = 0; i < attributes.length; ++i) {
        array.set(attributes[i], offset);
        offset += attributes[i].length;
    }
    return array;
}
