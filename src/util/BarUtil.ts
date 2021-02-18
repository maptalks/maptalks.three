import * as THREE from 'three';
import { MergeAttributeType } from '../type/BaseAttribute';
import { mergeBufferGeometries } from './MergeGeometryUtil';
import { addAttribute } from './ThreeAdaptUtil';
type Cache = {
    [key: number]: THREE.BufferGeometry
}
const barGeometryCache: Cache = {};

const defaultBoxGeometry: THREE.BoxBufferGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
defaultBoxGeometry.translate(0, 0, 0.5);

const topColor: THREE.Color = new THREE.Color('#fff'),
    bottomColor: THREE.Color = new THREE.Color('#fff');

function getDefaultCylinderBufferGeometry(radialSegments: number = 6): THREE.BufferGeometry {
    if (!barGeometryCache[radialSegments]) {
        const geometry = new THREE.CylinderBufferGeometry(1, 1, 1, radialSegments, 1);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, 0.5);
        geometry.rotateZ(Math.PI / 6);
        barGeometryCache[radialSegments] = geometry;
    }
    return barGeometryCache[radialSegments];
}

/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property
 */
// eslint-disable-next-line no-unused-vars
export function getGeometry(property: any): THREE.BufferGeometry {
    const {
        height,
        radialSegments,
        radius
    } = property;
    const geometry = getDefaultCylinderBufferGeometry(radialSegments).clone();
    geometry.scale(radius, radius, height);
    return geometry;
}


/**
 * init Colors
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */
export function initVertexColors(geometry: THREE.BufferGeometry, color: string, _topColor: string, key: string = 'y', v: number = 0): Array<number> {
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
    const colors: Array<number> = [];
    for (let i = 0; i < len; i += 3) {
        const y = position[i + offset];
        if (y > v) {
            colors.push(topColor.r, topColor.g, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
        }
    }
    addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
    return colors;
}


export function mergeBarGeometry(geometries: Array<THREE.BufferGeometry>): THREE.BufferGeometry {
    const attributes: MergeAttributeType[] = [], colors = [];
    for (let i = 0, len = geometries.length; i < len; i++) {
        const { color, normal, position, uv } = geometries[i].attributes;
        const index = geometries[i].index;
        if (color) {
            for (let j = 0, len1 = color.array.length; j < len1; j++) {
                colors.push(color.array[j]);
            }
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
        addAttribute(bufferGeometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
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

