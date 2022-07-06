import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { extrudePolylines } from 'poly-extrude';
import { isGeoJSON, getGeoJSONCoordinates, getGeoJSONCenter, isGeoJSONMulti, spliteGeoJSONMulti, isGeoJSONLine } from './GeoJSONUtil';
import { addAttribute } from './ThreeAdaptUtil';
import { ThreeLayer } from './../index';
import { GeoJSONLineStringFeature, LineStringType, MergeAttributeType, SingleLineStringType } from './../type/index';
import { coordiantesToArrayBuffer } from '.';
const COMMA = ',';

/**
 *
 * @param {maptalks.LineString} lineString
 * @param {ThreeLayer} layer
 */
export function getLinePosition(lineString: SingleLineStringType | Array<THREE.Vector3>,
    layer: ThreeLayer, center: maptalks.Coordinate, hasVectorArray = true): {
        positions2d: Float32Array,
        positions: Float32Array;
        positionsV: THREE.Vector3[];
        arrayBuffer: ArrayBuffer
    } {
    const positionsV: THREE.Vector3[] = [];
    let positions: Float32Array, positions2d: Float32Array;
    if (Array.isArray(lineString) && lineString[0] instanceof THREE.Vector3) {
        for (let i = 0, len = lineString.length; i < len; i++) {
            const v = lineString[i];
            positionsV.push(v);
        }
    } else {
        if (Array.isArray(lineString)) {
            lineString = new maptalks.LineString(lineString);
        }
        const z = 0;
        //support geojson
        let coordinates: any, cent: maptalks.Coordinate;
        if (isGeoJSON(lineString as any)) {
            coordinates = getGeoJSONCoordinates(lineString as any);
            if (!center) {
                cent = getGeoJSONCenter(lineString as any);
            }
        } else if (lineString instanceof maptalks.LineString) {
            coordinates = lineString.getCoordinates();
            if (!center) {
                cent = lineString.getCenter();
            }
        }
        const centerPt = layer.coordinateToVector3(center || cent);
        if (hasVectorArray) {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                const coordinate = coordinates[i];
                const v = layer.coordinateToVector3(coordinate, z).sub(centerPt);
                // positions.push(v.x, v.y, v.z);
                positionsV.push(v);
            }
        } else {
            const result = layer.coordinatiesToGLFloatArray(coordinates, centerPt);
            positions = result.positions;
            positions2d = result.positons2d;
        }
    }
    if (!hasVectorArray) {
        return {
            positions,
            positionsV,
            positions2d,
            arrayBuffer: positions2d.buffer
        }
    }
    positions2d = new Float32Array(positionsV.length * 2);
    positions = new Float32Array(positionsV.length * 3);
    for (let i = 0, len = positionsV.length; i < len; i++) {
        const idx = i * 3;
        const v = positionsV[i];
        positions[idx] = v.x;
        positions[idx + 1] = v.y;
        positions[idx + 2] = v.z;

        const idx1 = i * 2;
        positions2d[idx1] = v.x;
        positions2d[idx1 + 1] = v.y;
    }
    return {
        positions,
        positionsV,
        positions2d,
        arrayBuffer: positions2d.buffer
    };
}



/**
 *
 * @param {maptalks.LineString} lineString
 * @param {Number} lineWidth
 * @param {Number} depth
 * @param {ThreeLayer} layer
 */
export function getExtrudeLineGeometry(lineString: SingleLineStringType, lineWidth = 1, depth = 1,
    layer: ThreeLayer, center: maptalks.Coordinate): THREE.BufferGeometry {
    const {
        indices,
        position,
        normal,
        uv
    } = getExtrudeLineParams(lineString, lineWidth, depth, layer, center);
    const geometry = new THREE.BufferGeometry();
    addAttribute(geometry, 'position', new THREE.BufferAttribute(position, 3));
    addAttribute(geometry, 'normal', new THREE.BufferAttribute(normal, 3));
    addAttribute(geometry, 'uv', new THREE.BufferAttribute(uv, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    return geometry;
}

/**
 *
 * @param {Array[Array]} chunkLines
 * @param {*} layer
 */
export function getChunkLinesPosition(chunkLines: Array<Array<Array<number>>>, layer: ThreeLayer, positionMap: { [key: string]: any }, centerPt: THREE.Vector3) {
    const positions: Array<number> = [],
        positionsV: Array<THREE.Vector3> = [], lnglats: Array<Array<number>> = [];
    for (let i = 0, len = chunkLines.length; i < len; i++) {
        const line = chunkLines[i];
        for (let j = 0, len1 = line.length; j < len1; j++) {
            const lnglat = line[j];
            if (lnglats.length > 0) {
                const key = lnglat.join(COMMA).toString();
                const key1 = lnglats[lnglats.length - 1].join(COMMA).toString();
                if (key !== key1) {
                    lnglats.push(lnglat);
                }
            } else {
                lnglats.push(lnglat);
            }
        }
    }
    const z = 0;
    for (let i = 0, len = lnglats.length; i < len; i++) {
        const lnglat = lnglats[i];
        let v;
        const key = lnglat.join(COMMA).toString();
        if (positionMap && positionMap[key]) {
            v = positionMap[key];
        } else {
            v = layer.coordinateToVector3(lnglat, z).sub(centerPt);
        }
        positionsV.push(v);
        positions.push(v.x, v.y, v.z);
    }
    return {
        positions: positions,
        positionsV: positionsV,
        lnglats: lnglats
    };
}


/**
 *
 * @param {*} lineString
 * @param {*} lineWidth
 * @param {*} depth
 * @param {*} layer
 */
export function getExtrudeLineParams(lineString: SingleLineStringType | Array<THREE.Vector3>,
    lineWidth = 1, depth = 1, layer: ThreeLayer, center?: maptalks.Coordinate): MergeAttributeType {
    const positions = getLinePosition(lineString, layer, center).positionsV;
    const ps = [];
    for (let i = 0, len = positions.length; i < len; i++) {
        const p = positions[i];
        ps.push([p.x, p.y]);
    }
    const {
        indices,
        position,
        normal,
        uv
    } = extrudePolylines([ps], {
        lineWidth: lineWidth,
        depth: depth
    });
    return {
        position: position,
        normal: normal,
        indices: indices,
        uv
    };
}

export function LineStringSplit(lineString: LineStringType) {
    let lineStrings: Array<SingleLineStringType> = [], center: maptalks.Coordinate;
    if (lineString instanceof maptalks.MultiLineString) {
        lineStrings = lineString.getGeometries();
        center = lineString.getCenter();
    } else if (lineString instanceof maptalks.LineString) {
        lineStrings.push(lineString);
        center = lineString.getCenter();
    } else if (isGeoJSON(lineString)) {
        center = getGeoJSONCenter(lineString);
        if (isGeoJSONMulti(lineString)) {
            lineStrings = spliteGeoJSONMulti(lineString) as any;
        } else {
            lineStrings.push(lineString as GeoJSONLineStringFeature);
        }
    }
    return {
        lineStrings,
        center
    };
}

export function setLineSegmentPosition(position: Array<number>, positionsV: Array<THREE.Vector3>) {
    for (let i = 0, len = positionsV.length; i < len; i++) {
        const v = positionsV[i];
        if (i > 0 && i < len - 1) {
            position.push(v.x, v.y, v.z);
        }
        position.push(v.x, v.y, v.z);
    }
}

export function getLineSegmentPosition(ps?: Float32Array): Float32Array {
    const position = new Float32Array(ps.length * 2 - 6);
    let j = 0;
    for (let i = 0, len = ps.length / 3; i < len; i++) {
        const x = ps[i * 3], y = ps[i * 3 + 1], z = ps[i * 3 + 2];
        if (i > 0 && i < len - 1) {
            const idx = j * 3;
            position[idx] = x;
            position[idx + 1] = y;
            position[idx + 2] = z;
            j++;
        }
        const idx = j * 3;
        position[idx] = x;
        position[idx + 1] = y;
        position[idx + 2] = z;
        j++;
    }
    return position;
}

export function mergeLinePositions(positionsList: Array<Float32Array>): Float32Array {
    let len = 0
    const l = positionsList.length;
    if (l === 1) {
        return positionsList[0];
    }
    for (let i = 0; i < l; i++) {
        len += positionsList[i].length;
    }
    const position = new Float32Array(len);
    let offset = 0;
    for (let i = 0; i < l; i++) {
        position.set(positionsList[i], offset);
        offset += positionsList[i].length;
    }
    return position;

}

export function getLineArrayBuffer(lineString: SingleLineStringType): ArrayBuffer {
    if (lineString instanceof maptalks.LineString) {
        return coordiantesToArrayBuffer(lineString.getCoordinates());
    } else if (isGeoJSONLine(lineString)) {
        return coordiantesToArrayBuffer(lineString.geometry.coordinates);
    }
}

let defaultGeometry;
export function getDefaultLineGeometry() {
    if (!defaultGeometry) {
        defaultGeometry = new THREE.BufferGeometry();
        addAttribute(defaultGeometry, 'position', new THREE.BufferAttribute(new Float32Array(3), 3));
    }
    return defaultGeometry;
}