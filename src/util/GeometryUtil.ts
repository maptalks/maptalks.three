import * as THREE from 'three';
import { addAttribute } from './ThreeAdaptUtil';

export function getPlaneGeometryAttribute(width: number, height: number, devideW: number, devideH: number) {
    const dx = width / devideW, dy = height / devideH;
    const minX = -width / 2, maxY = height / 2, minY = -height / 2;
    const len = (devideW + 1) * (devideH + 1);
    const position = new Float32Array(len * 3), uv = new Float32Array(len * 2), normal = new Float32Array(len * 3), tempIndex = new Uint32Array(len * 10);
    let index = 0, uIndex = 0, iIndex = 0;
    for (let j = 0; j <= devideH; j++) {
        for (let i = 0; i <= devideW; i++) {
            const x = minX + dx * i;
            const y = maxY - dy * j;
            position[index] = x;
            position[index + 1] = y;
            position[index + 2] = 0;

            normal[index] = 0;
            normal[index + 1] = 0;
            normal[index + 2] = 1;
            const uvx = (x - minX) / width, uvy = (y - minY) / height;
            uv[uIndex] = uvx;
            uv[uIndex + 1] = uvy;

            index += 3;
            uIndex += 2;
            if (i < devideW && j < devideH) {
                const a = j * (devideW + 1) + i, b = a + 1, c = (devideW + 1) * (j + 1) + i, d = c + 1;
                tempIndex[iIndex] = a;
                tempIndex[iIndex + 1] = c;
                tempIndex[iIndex + 2] = b;
                tempIndex[iIndex + 3] = c;
                tempIndex[iIndex + 4] = d;
                tempIndex[iIndex + 5] = b;
                iIndex += 6;
            }
        }
    }
    const indexArray = new Uint32Array(iIndex);
    for (let i = 0, len = indexArray.length; i < len; i++) {
        indexArray[i] = tempIndex[i];
    }
    return {
        position,
        uv,
        normal,
        indexs: indexArray
    };
}

export function getPlaneGeometry(width: number, height: number, devideW: number, devideH: number) {
    const { position, uv, normal, indexs } = getPlaneGeometryAttribute(width, height, devideW, devideH);
    const geometry = new THREE.BufferGeometry();
    addAttribute(geometry, 'position', new THREE.BufferAttribute(position, 3))
    addAttribute(geometry, 'normal', new THREE.BufferAttribute(normal, 3))
    addAttribute(geometry, 'uv', new THREE.BufferAttribute(uv, 2))
    geometry.setIndex(new THREE.BufferAttribute(indexs, 1));
    return geometry;
}