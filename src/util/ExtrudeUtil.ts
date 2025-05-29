import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { isGeoJSONPolygon, spliteGeoJSONMulti, getGeoJSONCenter, isGeoJSONMulti, getGeoJSONCoordinates } from './GeoJSONUtil';
import { extrudePolygons } from 'poly-extrude';
import { addAttribute } from './ThreeAdaptUtil';
import { ThreeLayer } from './../index';
import { MergeAttributeType, PolygonType, SinglePolygonType } from './../type/index';
import { coordiantesToArrayBuffer } from '.';

const topColor: THREE.Color = new THREE.Color('#fff'),
    bottomColor: THREE.Color = new THREE.Color('#fff');
/**
 * this is for ExtrudeMesh util
 */

/**
 * Fix the bug in the center of multipoygon
 * @param {maptalks.Polygon} polygon
 * @param {*} layer
 */
// export function toShape(datas = []) {
//     const shapes = [];
//     for (let i = 0, len = datas.length; i < len; i++) {
//         const { outer, holes } = datas[i];
//         const shape = [outer];
//         if (holes && holes.length) {
//             for (let j = 0, len1 = holes.length; j < len1; j++) {
//                 shape.push(holes[j]);
//             }
//         }
//         shapes.push(shape);
//     }
//     return shapes;
// }

/**
 *  Support custom center point
 * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
 * @param {*} height
 * @param {*} layer
 */
export function getExtrudeGeometry(polygon: PolygonType, height: number, top: boolean, layer: ThreeLayer, center?: maptalks.Coordinate): THREE.BufferGeometry {
    const { position, normal, uv, indices } = getExtrudeGeometryParams(polygon, height, top, layer, center);
    const color = new Float32Array(position.length);
    color.fill(1, 0, position.length);
    const bufferGeomertry = new THREE.BufferGeometry();
    addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
    addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(normal, 3));
    addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(position, 3));
    addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(uv, 2));
    bufferGeomertry.setIndex(new THREE.BufferAttribute(indices, 1));
    return bufferGeomertry;
}


export function getExtrudeGeometryParams(polygon: PolygonType, height: number, top: boolean, layer: ThreeLayer, center: maptalks.Coordinate, centerPt?: THREE.Vector3, altCache?: any): MergeAttributeType {
    const datas = getPolygonPositions(polygon, layer, center, centerPt, false);
    const shapes = datas;
    //Possible later use of geojson
    if (!shapes) return null;
    //Reduce height and repeat calculation
    if (altCache) {
        if (altCache[height] == null) {
            altCache[height] = layer.altitudeToVector3(height, height).x;
        }
        height = altCache[height];
    } else {
        height = layer.altitudeToVector3(height, height).x;
    }
    const { position, normal, uv, indices } = extrudePolygons(shapes as any, {
        depth: height,
        top
    });
    return {
        position, normal, uv, indices
    };
}

/**
 *
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */
export function initVertexColors(geometry: THREE.BufferGeometry, color: string, _topColor: string, minZ: number | Array<any>): Float32Array {
    if (minZ === undefined) {
        minZ = 0;
    }
    const position = geometry.attributes.position.array;
    const len = position.length;
    bottomColor.setStyle(color);
    topColor.setStyle(_topColor);
    let colors: Float32Array;
    if (Array.isArray(minZ)) {
        let colorLen = 0;
        for (let i = 0, len = minZ.length; i < len; i++) {
            const { count } = minZ[i].position;
            colorLen += count * 3;
        }
        colors = new Float32Array(colorLen);
    } else {
        colors = new Float32Array(position.length);
    }
    if (Array.isArray(minZ)) {
        for (let i = 0, len = minZ.length; i < len; i++) {
            const { middleZ, start, end } = minZ[i].position;
            for (let j = start; j < end; j += 3) {
                const z = position[j + 2];
                if (z > middleZ) {
                    colors[j] = topColor.r;
                    colors[j + 1] = topColor.g;
                    colors[j + 2] = topColor.b;
                } else {
                    colors[j] = bottomColor.r;
                    colors[j + 1] = bottomColor.g;
                    colors[j + 2] = bottomColor.b;
                }
            }
        }
    } else {
        for (let i = 0; i < len; i += 3) {
            const z = position[i + 2];
            if (z > minZ) {
                colors[i] = topColor.r;
                colors[i + 1] = topColor.g;
                colors[i + 2] = topColor.b;
            } else {
                colors[i] = bottomColor.r;
                colors[i + 1] = bottomColor.g;
                colors[i + 2] = bottomColor.b;
            }
        }
    }
    addAttribute(geometry, 'color', new THREE.BufferAttribute(colors, 3, true));
    return colors;
}

/**
 *
 * @param {*} polygon
 * @param {*} layer
 * @param {*} center
 */
export function getPolygonPositions(polygon: PolygonType, layer: ThreeLayer, center: maptalks.Coordinate, centerPt: THREE.Vector3, isArrayBuff = false): Array<Array<Array<Array<number>> | ArrayBufferLike>> {
    if (!polygon) {
        return null;
    }
    let datas = [];
    if (polygon instanceof maptalks.MultiPolygon) {
        datas = polygon.getGeometries().map(p => {
            return getSinglePolygonPositions(p, layer, center || polygon.getCenter(), centerPt, isArrayBuff);
        });
    } else if (polygon instanceof maptalks.Polygon) {
        const data = getSinglePolygonPositions(polygon, layer, center || polygon.getCenter(), centerPt, isArrayBuff);
        datas.push(data);
    } else if (isGeoJSONPolygon(polygon)) {
        // const cent = getGeoJSONCenter(polygon);
        if (!isGeoJSONMulti(polygon)) {
            const data = getSinglePolygonPositions(polygon as any, layer, center || getGeoJSONCenter(polygon), centerPt, isArrayBuff);
            datas.push(data);
        } else {
            const fs = spliteGeoJSONMulti(polygon);
            for (let i = 0, len = fs.length; i < len; i++) {
                datas.push(getSinglePolygonPositions(fs[i] as any, layer, center || getGeoJSONCenter(polygon), centerPt, isArrayBuff));
            }
        }
    }
    return datas;
}

export function getSinglePolygonPositions(polygon: SinglePolygonType, layer: ThreeLayer,
    center: maptalks.Coordinate, centerPt: THREE.Vector3, isArrayBuff = false): Array<Array<Array<number>> | ArrayBufferLike> {
    let shell: Array<any>, holes: Array<any>;
    //it is pre for geojson,Possible later use of geojson
    if (isGeoJSONPolygon(polygon as any)) {
        const coordinates = getGeoJSONCoordinates(polygon as any);
        shell = coordinates[0] as Array<any>;
        holes = coordinates.slice(1, coordinates.length);
        center = center || getGeoJSONCenter(polygon as any);
    } else if (polygon instanceof maptalks.Polygon) {
        shell = polygon.getShell();
        holes = polygon.getHoles();
        center = center || polygon.getCenter();
    }
    centerPt = centerPt || layer.coordinateToVector3(center);
    let outer: Array<Array<number>> | Float32Array;
    if (isArrayBuff) {
        outer = layer.coordinatiesToGLFloatArray(shell, centerPt).positons2d;
    } else {
        outer = layer.coordinatiesToGLArray(shell, centerPt);
    }
    const data = [(isArrayBuff ? (outer as Float32Array).buffer : outer)];
    if (holes && holes.length > 0) {
        for (let i = 0, len = holes.length; i < len; i++) {
            let pts: Array<Array<number>> | Float32Array;
            if (isArrayBuff) {
                pts = layer.coordinatiesToGLFloatArray(holes[i], centerPt).positons2d;
            } else {
                pts = layer.coordinatiesToGLArray(holes[i], centerPt);
            }
            data.push((isArrayBuff ? (pts as Float32Array).buffer : pts));
        }
    }
    return data;
}

export function getPolygonArrayBuffer(polygon: PolygonType): Array<Array<ArrayBufferLike>> {
    if (!polygon) {
        return null;
    }
    let datas = [];
    if (polygon instanceof maptalks.MultiPolygon) {
        datas = polygon.getGeometries().map(p => {
            return getSinglePolygonArrayBuffer(p, false);
        });
    } else if (polygon instanceof maptalks.Polygon) {
        const data = getSinglePolygonArrayBuffer(polygon, false);
        datas.push(data);
    } else if (isGeoJSONPolygon(polygon)) {
        // const cent = getGeoJSONCenter(polygon);
        if (!isGeoJSONMulti(polygon)) {
            const data = getSinglePolygonArrayBuffer(polygon as any, true);
            datas.push(data);
        } else {
            const fs = spliteGeoJSONMulti(polygon);
            for (let i = 0, len = fs.length; i < len; i++) {
                datas.push(getSinglePolygonArrayBuffer(fs[i] as any, true));
            }
        }
    }
    return datas;
}

export function getSinglePolygonArrayBuffer(polygon: SinglePolygonType, isGeoJSON: boolean): Array<ArrayBufferLike> {
    let shell: Array<any>, holes: Array<any>;
    //it is pre for geojson,Possible later use of geojson
    if (isGeoJSON) {
        const coordinates = getGeoJSONCoordinates(polygon as any);
        shell = coordinates[0] as Array<any>;
        holes = coordinates.slice(1, coordinates.length);
    } else if (polygon instanceof maptalks.Polygon) {
        shell = polygon.getShell();
        holes = polygon.getHoles();
    }
    const outer = coordiantesToArrayBuffer(shell);
    const data = [outer];
    if (holes && holes.length > 0) {
        for (let i = 0, len = holes.length; i < len; i++) {
            const pts = coordiantesToArrayBuffer(holes[i]);
            data.push(pts);
        }
    }
    return data;
}