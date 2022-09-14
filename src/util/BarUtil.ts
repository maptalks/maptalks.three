import * as THREE from 'three';
import { MergeAttributeType } from '../type/BaseAttribute';
import { mergeBufferGeometries } from './MergeGeometryUtil';
import { addAttribute } from './ThreeAdaptUtil';
import { cylinder } from 'poly-extrude';
// type Cache = {
//     [key: number]: THREE.BufferGeometry
// }
// const barGeometryCache: Cache = {};

const defaultBoxGeometry: THREE.BoxBufferGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
defaultBoxGeometry.translate(0, 0, 0.5);

const topColor: THREE.Color = new THREE.Color('#fff'),
    bottomColor: THREE.Color = new THREE.Color('#fff');

// function getDefaultCylinderBufferGeometry(radialSegments: number = 6): THREE.BufferGeometry {
//     if (!barGeometryCache[radialSegments]) {
//         const geometry = new THREE.CylinderBufferGeometry(1, 1, 1, radialSegments, 1);
//         geometry.rotateX(Math.PI / 2);
//         geometry.translate(0, 0, 0.5);
//         geometry.rotateZ(Math.PI / 6);
//         barGeometryCache[radialSegments] = geometry;
//     }
//     return barGeometryCache[radialSegments];
// }

function getClylinderGeometry(property: any): THREE.BufferGeometry {
    const { position, normal, uv, indices } = cylinder(property.center || [0, 0], property)
    const bufferGeomertry = new THREE.BufferGeometry();
    addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(normal, 3));
    addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(position, 3));
    addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(uv, 2));
    bufferGeomertry.setIndex(new THREE.BufferAttribute(indices, 1));
    return bufferGeomertry;
}

/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property
 */
// eslint-disable-next-line no-unused-vars
export function getGeometry(property: any): THREE.BufferGeometry {
    // const {
    //     height,
    //     radialSegments,
    //     radius
    // } = property;
    // const geometry = getDefaultCylinderBufferGeometry(radialSegments).clone();
    // geometry.scale(radius, radius, height);
    // return geometry;
    const options = Object.assign({}, property);
    if (options._radius) {
        options.radius = options._radius;
    }
    return getClylinderGeometry(options);
}


/**
 * init Colors
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */
export function initVertexColors(geometry: THREE.BufferGeometry, color: string, _topColor: string, key: string = 'y', minZ: number = 0): Float32Array {
    let offset = 0;
    if (key === 'y') {
        offset = 1;
    } else if (key === 'z') {
        offset = 2;
    }
    const position = geometry.attributes.position.array;
    const len = position.length;
    bottomColor.setStyle(color);
    topColor.setStyle(_topColor);
    const colors = new Float32Array(len);
    if (Array.isArray(minZ)) {
        for (let i = 0, len = minZ.length; i < len; i++) {
            const { middleZ, start, end } = minZ[i].position;
            for (let j = start; j < end; j += 3) {
                const z = position[j + 2];
                if (z > middleZ) {
                    colors[j] = topColor.r;
                    colors[j + 1] = topColor.g;
                    colors[j + 2] = topColor.b;
                } else {
                    colors[j] = bottomColor.r;
                    colors[j + 1] = bottomColor.g;
                    colors[j + 2] = bottomColor.b;
                }
            }
        }
    } else {
        for (let i = 0; i < len; i += 3) {
            const y = position[i + offset];
            if (y > minZ) {
                colors[i] = topColor.r;
                colors[i + 1] = topColor.g;
                colors[i + 2] = topColor.b;
                // colors.push(topColor.r, topColor.g, topColor.b);
            } else {
                colors[i] = bottomColor.r;
                colors[i + 1] = bottomColor.g;
                colors[i + 2] = bottomColor.b;
                // colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
            }
        }
    }
    addAttribute(geometry, 'color', new THREE.BufferAttribute(colors, 3, true));
    return colors;
}


export function mergeBarGeometry(geometries: Array<THREE.BufferGeometry>): THREE.BufferGeometry {
    const attributes: MergeAttributeType[] = [];
    const len = geometries.length;
    let colorLen = 0;
    for (let i = 0; i < len; i++) {
        const { color } = geometries[i].attributes;
        if (color) {
            colorLen += color.array.length;
        }
    }
    const colors = new Float32Array(colorLen);
    let offset = 0;
    for (let i = 0, len = geometries.length; i < len; i++) {
        const { color, normal, position, uv } = geometries[i].attributes;
        const index = geometries[i].index;
        if (color) {
            colors.set(color.array, offset);
            offset += color.array.length;
            // for (let j = 0, len1 = color.array.length; j < len1; j++) {
            //     colors.push(color.array[j]);
            // }
        }
        attributes.push({
            // color: color.array,
            normal: normal.array,
            uv: uv.array,
            position: position.array,
            indices: index.array
        });
    }
    const bufferGeometry = mergeBufferGeometries(attributes);
    if (colors.length) {
        addAttribute(bufferGeometry, 'color', new THREE.BufferAttribute(colors, 3, true));
        // for (let i = 0, len = colors.length; i < len; i++) {
        //     bufferGeometry.attributes.color.array[i] = colors[i];
        // }
    }
    for (let i = 0, len = geometries.length; i < len; i++) {
        geometries[i].dispose();
    }
    return bufferGeometry;

}

export function getDefaultBoxGeometry(): THREE.BufferGeometry {
    return defaultBoxGeometry;
}

