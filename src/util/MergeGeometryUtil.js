import * as THREE from 'three';

export function mergeBufferGeometries(geometries) {
    const attributes = {};
    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        for (let name in geometry) {
            if (attributes[name] === undefined) {
                attributes[name] = [];
            }
            attributes[name].push(geometry[name]);
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
            const mergedAttribute = mergeBufferAttributes(attributes[name]);
            if (!mergedAttribute) return null;
            mergedGeometry[name] = mergedAttribute;
        }
    }
    mergedGeometry['indices'] = new Uint32Array(mergedIndex);
    const { position, normal, uv, indices } = mergedGeometry;
    const bufferGeomertry = new THREE.BufferGeometry();
    const color = new Float32Array(position.length);
    color.fill(1, 0, position.length);
    bufferGeomertry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    bufferGeomertry.addAttribute('normal', new THREE.BufferAttribute(normal, 3));
    bufferGeomertry.addAttribute('position', new THREE.BufferAttribute(position, 3));
    if (uv && uv.length) {
        bufferGeomertry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    bufferGeomertry.setIndex(new THREE.BufferAttribute(indices, 1));
    return bufferGeomertry;
}



function mergeBufferAttributes(attributes) {
    let arrayLength = 0;
    for (let i = 0; i < attributes.length; ++i) {
        const attribute = attributes[i];
        arrayLength += attribute.length;
    }
    const array = new Float32Array(arrayLength);
    let offset = 0;
    for (let i = 0; i < attributes.length; ++i) {
        array.set(attributes[i], offset);
        offset += attributes[i].length;
    }
    return array;
}
