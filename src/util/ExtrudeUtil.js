import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { isGeoJSONPolygon, spliteGeoJSONMulti, getGeoJSONCenter, isGeoJSONMulti, getGeoJSONCoordinates } from './GeoJSONUtil';
import { extrudePolygon } from 'deyihu-geometry-extrude';
import { addAttribute } from './ThreeAdaptUtil';
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
export function getExtrudeGeometry(polygon, height, layer, center) {
    const { position, normal, uv, indices } = getExtrudeGeometryParams(polygon, height, layer, center);
    const color = new Float32Array(position.length);
    color.fill(1, 0, position.length);
    const bufferGeomertry = new THREE.BufferGeometry();
    addAttribute(bufferGeomertry, 'color', new THREE.BufferAttribute(color, 3));
    addAttribute(bufferGeomertry, 'normal', new THREE.BufferAttribute(normal, 3));
    addAttribute(bufferGeomertry, 'position', new THREE.BufferAttribute(position, 3));
    addAttribute(bufferGeomertry, 'uv', new THREE.BufferAttribute(uv, 2));
    bufferGeomertry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    return bufferGeomertry;
}


export function getExtrudeGeometryParams(polygon, height, layer, center, altCache) {
    const datas = getPolygonPositions(polygon, layer, center);
    const shapes = datas;
    //Possible later use of geojson
    if (!shapes) return null;
    //Reduce height and repeat calculation
    if (altCache) {
        if (altCache[height] == null) {
            altCache[height] = layer.distanceToVector3(height, height).x;
        }
        height = altCache[height];
    } else {
        height = layer.distanceToVector3(height, height).x;
    }
    const { position, normal, uv, indices } = extrudePolygon(shapes, {
        depth: height
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
export function initVertexColors(geometry, color, _topColor) {
    const position = geometry.attributes.position.array;
    const len = position.length;
    const bottomColor = (color instanceof THREE.Color ? color : new THREE.Color(color));
    const topColor = new THREE.Color(_topColor);
    const colors = [];
    for (let i = 0; i < len; i += 3) {
        const z = position[i + 2];
        if (z > 0) {
            colors.push(topColor.r, topColor.g, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
        }
    }
    addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
    return colors;
}

/**
 *Get the center point of the point set
 * @param {*} coordinates
 */
export function getCenterOfPoints(coordinates = []) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0, len = coordinates.length; i < len; i++) {
        const c = coordinates[i];
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


/**
 *
 * @param {*} polygon
 * @param {*} layer
 * @param {*} center
 */
export function getPolygonPositions(polygon, layer, center, isArrayBuff = false) {
    if (!polygon) {
        return null;
    }
    let datas = [];
    if (polygon instanceof maptalks.MultiPolygon) {
        datas = polygon.getGeometries().map(p => {
            return getSinglePolygonPositions(p, layer, center || polygon.getCenter(), isArrayBuff);
        });
    } else if (polygon instanceof maptalks.Polygon) {
        const data = getSinglePolygonPositions(polygon, layer, center || polygon.getCenter(), isArrayBuff);
        datas.push(data);
    } else if (isGeoJSONPolygon(polygon)) {
        const cent = getGeoJSONCenter(polygon);
        if (!isGeoJSONMulti(polygon)) {
            const data = getSinglePolygonPositions(polygon, layer, center || cent, isArrayBuff);
            datas.push(data);
        } else {
            const fs = spliteGeoJSONMulti(polygon);
            for (let i = 0, len = fs.length; i < len; i++) {
                datas.push(getSinglePolygonPositions(fs[i], layer, center || cent, isArrayBuff));
            }
        }
    }
    return datas;
}

export function getSinglePolygonPositions(polygon, layer, center, isArrayBuff = false) {
    let shell, holes;
    //it is pre for geojson,Possible later use of geojson
    if (isGeoJSONPolygon(polygon)) {
        const coordinates = getGeoJSONCoordinates(polygon);
        shell = coordinates[0];
        holes = coordinates.slice(1, coordinates.length);
        center = center || getGeoJSONCenter(polygon);
    } else {
        shell = polygon.getShell();
        holes = polygon.getHoles();
        center = center || polygon.getCenter();
    }
    const centerPt = layer.coordinateToVector3(center);
    let outer;
    if (isArrayBuff) {
        outer = new Float32Array(shell.length * 2);
    } else {
        outer = [];
    }
    for (let i = 0, len = shell.length; i < len; i++) {
        const c = shell[i];
        const v = layer.coordinateToVector3(c).sub(centerPt);
        if (isArrayBuff) {
            const idx = i * 2;
            outer[idx] = v.x;
            outer[idx + 1] = v.y;
            // outer[idx + 2] = v.z;
        } else {
            outer.push([v.x, v.y]);
        }
    }
    const data = [(isArrayBuff ? outer.buffer : outer)];
    if (holes && holes.length > 0) {
        for (let i = 0, len = holes.length; i < len; i++) {
            const pts = (isArrayBuff ? new Float32Array(holes[i].length * 2) : []);
            for (let j = 0, len1 = holes[i].length; j < len1; j++) {
                const c = holes[i][j];
                const pt = layer.coordinateToVector3(c).sub(centerPt);
                if (isArrayBuff) {
                    const idx = j * 2;
                    pts[idx] = pt.x;
                    pts[idx + 1] = pt.y;
                    // pts[idx + 2] = pt.z;
                } else {
                    pts.push([pt.x, pt.y]);
                }
            }
            data.push((isArrayBuff ? pts.buffer : pts));
        }
    }
    return data;
}

