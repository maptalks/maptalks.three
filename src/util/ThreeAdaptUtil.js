
import * as THREE from 'three';

/**
 * three api adapt
 */
const REVISION = parseInt(THREE.REVISION.replace('dev', ''));
//Three does not print version information now. Output the version of three to find compatibility problems
console.log(`maptalks.three log: current three.js version is %c${REVISION}`, 'color:red;font-size: 16px;font-weight: bold;');

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

export function setRaycasterLinePrecision(raycaster, linePrecision) {
    if (REVISION > 113) {
        raycaster.params.Line.threshold = linePrecision;
    } else {
        raycaster.linePrecision = linePrecision;
    }
}
