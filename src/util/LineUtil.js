import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { extrudePolyline } from 'geometry-extrude';

const COMMA = ',';

/**
 *
 * @param {maptalks.LineString} lineString
 * @param {ThreeLayer} layer
 */
export function getLinePosition(lineString, layer) {
    const positions = [];
    const positionsV = [];
    if (Array.isArray(lineString) && lineString[0] instanceof THREE.Vector3) {
        for (let i = 0, len = lineString.length; i < len; i++) {
            const v = lineString[i];
            positions.push(v.x, v.y, v.z);
            positionsV.push(v);
        }
    } else {
        if (Array.isArray(lineString)) lineString = new maptalks.LineString(lineString);
        if (!lineString || !(lineString instanceof maptalks.LineString)) return;
        const z = 0;
        const coordinates = lineString.getCoordinates();
        const centerPt = layer.coordinateToVector3(lineString.getCenter());
        for (let i = 0, len = coordinates.length; i < len; i++) {
            let coordinate = coordinates[i];
            if (Array.isArray(coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            const v = layer.coordinateToVector3(coordinate, z).sub(centerPt);
            positions.push(v.x, v.y, v.z);
            positionsV.push(v);
        }
    }
    return {
        positions: positions,
        positionsV: positionsV
    }
}



/**
 * 
 * @param {maptalks.LineString} lineString 
 * @param {Number} lineWidth 
 * @param {Number} depth 
 * @param {ThreeLayer} layer 
 */
export function getExtrudeLineGeometry(lineString, lineWidth = 1, depth = 1, layer) {
    const positions = getLinePosition(lineString, layer).positionsV;
    const ps = [];
    for (let i = 0, len = positions.length; i < len; i++) {
        const p = positions[i];
        ps.push([p.x, p.y]);
    }
    const {
        indices,
        position,
        normal
    } = extrudePolyline([ps], {
        lineWidth,
        depth
    });
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
    geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    return geometry;
}

/**
 * 
 * @param {Array[Array]} chunkLines 
 * @param {*} layer 
 */
export function getChunkLinesPosition(chunkLines, layer, positionMap, centerPt) {
    const positions = [],
        positionsV = [], lnglats = [];
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
export function getExtrudeLineParams(lineString, lineWidth = 1, depth = 1, layer) {
    const positions = getLinePosition(lineString, layer).positionsV;
    const ps = [];
    for (let i = 0, len = positions.length; i < len; i++) {
        const p = positions[i];
        ps.push([p.x, p.y]);
    }
    const {
        indices,
        position,
        normal
    } = extrudePolyline([ps], {
        lineWidth: lineWidth,
        depth: depth
    });
    return {
        position: position,
        normal: normal,
        indices: indices
    }
}
