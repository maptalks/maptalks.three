
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
export function addAttribute(bufferGeomertry: THREE.BufferGeometry, key: string, value: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferGeometry {
    if (REVISION > 109) {
        bufferGeomertry.setAttribute(key, value);
    } else {
        bufferGeomertry.addAttribute(key, value);
    }
    return bufferGeomertry;
}

export function setRaycasterLinePrecision(raycaster: THREE.Raycaster, linePrecision: number): void {
    if (REVISION > 113) {
        raycaster.params.Line.threshold = linePrecision;
    } else {
        (raycaster as any).linePrecision = linePrecision;
    }
}

export function getVertexColors(): number | boolean {
    if (REVISION > 117) {
        return true;
    }
    return (THREE as any).VertexColors;

}
