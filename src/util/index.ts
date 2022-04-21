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
export function altitudeToVector3(altitude: number, layer: ThreeLayer, cache: { [key: number]: number } = {}): number {
    if (cache[altitude] === undefined) {
        cache[altitude] = layer.altitudeToVector3(altitude, altitude).x;
    }
    return cache[altitude];
}


/**
 *Get the center point of the point set
 * @param {*} coordinates
 */
export function getCenterOfPoints(coordinates: Array<any> = []): maptalks.Coordinate {
    let sumX = 0, sumY = 0;
    const len = coordinates.length;
    for (let i = 0; i < len; i++) {
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
        sumX += x;
        sumY += y;
    }
    return new maptalks.Coordinate(sumX / len, sumY / len);
}

export function setBottomHeight(geometry: THREE.BufferGeometry | MergeAttributeType | THREE.Vector3[] | Float32Array, bottomHeight: number, layer: ThreeLayer,
    cache?: { [key: number]: number }): number {
    if (bottomHeight === undefined || typeof bottomHeight !== 'number' || bottomHeight === 0) {
        return 0;
    }
    let position;
    if (geometry instanceof THREE.BufferGeometry) {
        position = geometry.attributes.position.array;
    } else if (Array.isArray(geometry) || geometry instanceof Float32Array) {
        position = geometry;
    } else {
        position = geometry.position;
    }
    let h = 0;
    if (position) {
        if (cache) {
            if (cache[bottomHeight] === undefined) {
                cache[bottomHeight] = layer.altitudeToVector3(bottomHeight, bottomHeight).x;
            }
            h = cache[bottomHeight];
        } else {
            h = layer.altitudeToVector3(bottomHeight, bottomHeight).x;
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

export function getGeometriesColorArray(geometriesAttributes): Float32Array {
    const len = geometriesAttributes.length;
    let colorsLen = 0;
    for (let i = 0; i < len; i++) {
        const { count } = geometriesAttributes[i].position;
        colorsLen += count;
    }
    return new Float32Array(colorsLen * 3);
}

export function coordiantesToArrayBuffer(coordiantes = []): ArrayBuffer {
    const len = coordiantes.length;
    const array = new Float64Array(len * 2);
    for (let i = 0; i < len; i++) {
        let x, y;
        const c = coordiantes[i];
        if (c.x) {
            x = c.x;
            y = c.y;
        } else {
            x = c[0];
            y = c[1];
        }
        array[i * 2] = x;
        array[i * 2 + 1] = y;
    }
    return array.buffer;
}
