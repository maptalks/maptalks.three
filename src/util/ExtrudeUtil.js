import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { isGeoJSONPolygon, spliteGeoJSONMulti, getGeoJSONCenter, isGeoJSONMulti, getGeoJSONCoordinates } from './GeoJSONUtil';
/**
 * this is for ExtrudeMesh util
 */

/**
 * Fix the bug in the center of multipoygon
 * @param {maptalks.Polygon} polygon
 * @param {*} layer
 */
export function toShape(datas = []) {
    const shapes = [];
    for (let i = 0, len = datas.length; i < len; i++) {
        const { outer, holes } = datas[i];
        const outShape = new THREE.Shape(outer);
        if (holes && holes.length) {
            outShape.holes = [];
            for (let j = 0, len1 = holes.length; j < len1; j++) {
                const holeShape = new THREE.Shape(holes[j]);
                outShape.holes.push(holeShape);
            }
        }
        shapes.push(outShape);
    }
    return shapes;
}

/**
 *  Support custom center point
 * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
 * @param {*} height
 * @param {*} layer
 */
export function getExtrudeGeometry(polygon, height, layer, center) {
    const datas = getPolygonPositions(polygon, layer, center);
    let shape = toShape(datas);
    //Possible later use of geojson
    if (!shape) return null;
    height = layer.distanceToVector3(height, height).x;
    const name = parseInt(THREE.REVISION) >= 93 ? 'depth' : 'amount';
    const config = {
        'bevelEnabled': false, 'bevelSize': 1
    };
    config[name] = height;
    const geom = new THREE.ExtrudeGeometry(shape, config);
    const buffGeom = new THREE.BufferGeometry();
    buffGeom.fromGeometry(geom);
    return buffGeom;
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
            colors.push(topColor.r, topColor.r, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.r, bottomColor.b);
        }
    }
    geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3, true));
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
        outer = new Float32Array(shell.length * 3);
    } else {
        outer = [];
    }
    for (let i = 0, len = shell.length; i < len; i++) {
        const c = shell[i];
        const v = layer.coordinateToVector3(c).sub(centerPt);
        if (isArrayBuff) {
            const idx = i * 3;
            outer[idx] = v.x;
            outer[idx + 1] = v.y;
            outer[idx + 2] = v.z;
        } else {
            outer.push(v);
        }
    }
    const data = { outer: (isArrayBuff ? outer.buffer : outer) };
    if (holes && holes.length > 0) {
        data.holes = [];
        for (let i = 0, len = holes.length; i < len; i++) {
            const pts = (isArrayBuff ? new Float32Array(holes[i].length * 3) : []);
            for (let j = 0, len1 = holes[i].length; j < len1; j++) {
                const c = holes[i][j];
                const pt = layer.coordinateToVector3(c).sub(centerPt);
                if (isArrayBuff) {
                    const idx = j * 3;
                    outer[idx] = pt.x;
                    outer[idx + 1] = pt.y;
                    outer[idx + 2] = pt.z;
                } else {
                    pts.push(pt);
                }
            }
            data.holes.push((isArrayBuff ? pts.buffer : pts));
        }
    }
    return data;
}

