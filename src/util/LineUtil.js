import * as THREE from 'three';
import * as maptalks from 'maptalks';
/**
 * rep: https://github.com/pissang/geometry-extrude
 * 
 * should import { extrudePolyline } from 'geometry-extrude';
 * 
 * geometry-extrude npm Can't be parsed
 * 
 * from gulify-js error: Unexpected token: keyword «const» 
 * 
 * issue  https://github.com/pissang/geometry-extrude/issues/2
 * 
 * 
 */
import { extrudePolyline } from './geometry-extrude/main';

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
        for (let i = 0, len = coordinates.length; i < len; i++) {
            let coordinate = coordinates[i];
            if (Array.isArray(coordinate))
                coordinate = new maptalks.Coordinate(coordinate);
            const v = layer.coordinateToVector3(coordinate, z);
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
    const ps = positions.map(p => {
        return [p.x, p.y];
    })
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
