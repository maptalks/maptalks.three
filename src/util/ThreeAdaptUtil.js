
import * as THREE from 'three';

/**
 * three api adapt
 */
const REVISION = parseInt(THREE.REVISION);

/**
 *
 * @param {THREE.BufferGeometry} bufferGeomertry
 * @param {String} key
 * @param {*} value
 */
export function addAttribute(bufferGeomertry, key, value) {
    if (REVISION > 109) {
        bufferGeomertry.setAttribute(key, value);
    } else {
        bufferGeomertry.addAttribute(key, value);
    }
    return bufferGeomertry;
}
