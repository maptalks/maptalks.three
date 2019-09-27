import * as THREE from 'three';
import * as maptalks from 'maptalks';

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
        const coordinates = polyline.getCoordinates();
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
