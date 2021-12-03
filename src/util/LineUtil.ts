import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { extrudePolyline } from 'deyihu-geometry-extrude';
import { isGeoJSON, getGeoJSONCoordinates, getGeoJSONCenter, isGeoJSONMulti, spliteGeoJSONMulti } from './GeoJSONUtil';
import { addAttribute } from './ThreeAdaptUtil';
import { ThreeLayer } from './../index';
import { GeoJSONLineStringFeature, LineStringType, MergeAttributeType, SingleLineStringType } from './../type/index';
const COMMA = ',';

/**
 *
 * @param {maptalks.LineString} lineString
 * @param {ThreeLayer} layer
 */
export function getLinePosition(lineString: SingleLineStringType | Array<THREE.Vector3>,
    layer: ThreeLayer, center: maptalks.Coordinate): {
        positions2d: Float32Array,
        positions: Float32Array;
        positionsV: THREE.Vector3[];
    } {
    const positionsV: THREE.Vector3[] = [];
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
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const coordinate = coordinates[i];
            const v = layer.coordinateToVector3(coordinate, z).sub(centerPt);
            // positions.push(v.x, v.y, v.z);
            positionsV.push(v);
        }
    }
    const positions = new Float32Array(positionsV.length * 3);
    const positions2d = new Float32Array(positionsV.length * 2);
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
        positions2d
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
    } = extrudePolyline([ps], {
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
