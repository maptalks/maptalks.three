import * as THREE from 'three';
import { mergeBufferGeometries } from './MergeGeometryUtil';
import { addAttribute } from './ThreeAdaptUtil';
const barGeometryCache = {};
const KEY = '-';

/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property
 */
export function getGeometry(property, isCache = true) {
    const {
        height,
        radialSegments,
        radius,
        _radius,
        _height
    } = property;
    if (!isCache) { //for bars
        const geometry = new THREE.CylinderBufferGeometry(radius, radius, height, radialSegments, 1);
        geometry.rotateX(Math.PI / 2);
        const parray = geometry.attributes.position.array;
        for (let j = 0, len1 = parray.length; j < len1; j += 3) {
            parray[j + 2] += (height / 2);
        }
        return geometry;
    }
    let geometry;
    for (let i = 0; i <= 4; i++) {
        let key = [(_height + i), _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key];
        if (geometry) break;
        key = [(_height - i), _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key];
        if (geometry) break;
    }
    if (!geometry) {
        const key = [_height, _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key] = new THREE.CylinderBufferGeometry(radius, radius, height, radialSegments, 1);
        geometry.rotateX(Math.PI / 2);
        const parray = geometry.attributes.position.array;
        for (let j = 0, len1 = parray.length; j < len1; j += 3) {
            parray[j + 2] += (height / 2);
        }
        return geometry;
    }
    return geometry;
}


/**
 * init Colors
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */
export function initVertexColors(geometry, color, _topColor, key = 'y', v = 0) {
    let offset = 0;
    if (key === 'y') {
        offset = 1;
    } else if (key === 'z') {
        offset = 2;
    }
    const position = geometry.attributes.position.array;
    const len = position.length;
    const bottomColor = (color instanceof THREE.Color ? color : new THREE.Color(color));
    const topColor = new THREE.Color(_topColor);
    const colors = [];
    for (let i = 0; i < len; i += 3) {
        const y = position[i + offset];
        if (y > v) {
            colors.push(topColor.r, topColor.r, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.r, bottomColor.b);
        }
    }
    addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
    return colors;
}


export function mergeBarGeometry(geometries) {
    const attributes = [], colors = [];
    for (let i = 0, len = geometries.length; i < len; i++) {
        const { color, normal, position, uv } = geometries[i].attributes;
        const index = geometries[i].index;
        for (let j = 0, len1 = color.array.length; j < len1; j++) {
            colors.push(color.array[j]);
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
    for (let i = 0, len = colors.length; i < len; i++) {
        bufferGeometry.attributes.color.array[i] = colors[i];
    }
    return bufferGeometry;

}


