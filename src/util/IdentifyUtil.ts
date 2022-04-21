/* eslint-disable indent */
import * as maptalks from 'maptalks';
import { ThreeLayer } from './../index';
import * as THREE from 'three';
import { altitudeToVector3, distanceToVector3 } from './index';

function positionsConvert(worldPoints: Array<number>, altitude: number = 0, layer: ThreeLayer): Array<THREE.Vector3> {
    const vectors: THREE.Vector3[] = [], cache = {};
    for (let i = 0, len = worldPoints.length; i < len; i += 3) {
        let x = worldPoints[i], y = worldPoints[i + 1], z = worldPoints[i + 2];
        if (altitude > 0) {
            z += altitudeToVector3(altitude, layer, cache);
        }
        vectors.push(new THREE.Vector3(x, y, z));
    }
    return vectors;
}

export function vectors2Pixel(worldPoints: Array<number> | Array<THREE.Vector3>, size: maptalks.Size,
    camera: THREE.Camera, altitude = 0, layer: ThreeLayer): Array<{
        x: number;
        y: number;
    }> {
    if (!(worldPoints[0] instanceof THREE.Vector3)) {
        worldPoints = positionsConvert(worldPoints as Array<number>, altitude, layer);
    }
    const pixels = (worldPoints as Array<THREE.Vector3>).map(worldPoint => {
        return vector2Pixel(worldPoint, size, camera);
    });
    return pixels;

}

// eslint-disable-next-line camelcase
export function vector2Pixel(world_vector: THREE.Vector3, size: maptalks.Size, camera: THREE.Camera): {
    x: number;
    y: number;
} {
    // eslint-disable-next-line camelcase
    const vector = world_vector.project(camera);
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const result = {
        x: Math.round(vector.x * halfWidth + halfWidth),
        y: Math.round(-vector.y * halfHeight + halfHeight)
    };
    return result;
}