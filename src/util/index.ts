import * as maptalks from 'maptalks';
import * as THREE from 'three';
import { ThreeLayer } from './../index';
import { MergeAttributeType } from './../type/index';
//Using cache to reduce computation
export function distanceToVector3(distance: number, layer: ThreeLayer, cache: { [key: number]: number } = {}): number {
    if (cache[distance] === undefined) {
        cache[distance] = layer.distanceToVector3(distance, distance).x;
    }
    return cache[distance];
}


/**
 *Get the center point of the point set
 * @param {*} coordinates
 */
export function getCenterOfPoints(coordinates: Array<any> = []): maptalks.Coordinate {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0, len = coordinates.length; i < len; i++) {
        const { coordinate, lnglat, lnglats, xy, xys } = coordinates[i];
        const c = coordinate || lnglat || lnglats || xy || xys || coordinates[i];
        let x, y;
        if (Array.isArray(c)) {
            x = c[0];
            y = c[1];
        } else if (c instanceof maptalks.Coordinate) {
            x = c.x;
            y = c.y;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    return new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
}

export function setBottomHeight(geometry: THREE.BufferGeometry | MergeAttributeType | THREE.Vector3[], bottomHeight: number, layer: ThreeLayer,
    cache?: { [key: number]: number }): number {
    if (bottomHeight === undefined || typeof bottomHeight !== 'number' || bottomHeight === 0) {
        return 0;
    }
    let position;
    if (geometry instanceof THREE.BufferGeometry) {
        position = geometry.attributes.position.array;
    } else if (Array.isArray(geometry)) {
        position = geometry;
    } else {
        position = geometry.position;
    }
    let h = 0;
    if (position) {
        if (cache) {
            if (cache[bottomHeight] === undefined) {
                cache[bottomHeight] = layer.distanceToVector3(bottomHeight, bottomHeight).x;
            }
            h = cache[bottomHeight];
        } else {
            h = layer.distanceToVector3(bottomHeight, bottomHeight).x;
        }
        const len = position.length;
        if (position[0] instanceof THREE.Vector3) {
            for (let i = 0; i < len; i++) {
                position[i].z += h;
            }
        } else {
            for (let i = 0; i < len; i += 3) {
                position[i + 2] += h;
            }
        }
    }
    return h;
}
