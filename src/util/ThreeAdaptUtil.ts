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

function getThreeNameSpace() {
    const three: any = THREE;
    return three;
}

function _getThreeVertexColors(threeNameSpace) {
    if (threeNameSpace['VertexColors']) {
        return threeNameSpace['VertexColors'];
    }
    return 2;
}
export function getVertexColors(): number | boolean {
    // const vertexColors = THREE?.['VertexColors'] ?? false
    // if (vertexColors) {
    //     return vertexColors;
    // }
    // return true;
    return _getThreeVertexColors(getThreeNameSpace());

}

export function getBoxGeometry(width: number, height: number, depth: number) {
    const three = getThreeNameSpace();
    if (REVISION >= 144) {
        return new three.BoxGeometry(width, height, depth);
    }
    if (three.BoxBufferGeometry) {
        return new three.BoxBufferGeometry(width, height, depth);
    } else if (three.BoxGeometry) {
        return new three.BoxGeometry(width, height, depth);
    }
}

export function createWebGLRenderTarget() {
    //https://github.com/mrdoob/three.js/pull/25771
    if (REVISION >= 152) {
        return new THREE.WebGLRenderTarget(1, 1, {
            format: THREE.RGBAFormat,
            //@ts-ignore
            colorSpace: THREE.SRGBColorSpace
        })
    } else {
        return new THREE.WebGLRenderTarget(1, 1, {});
    }
}
