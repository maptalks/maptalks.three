import * as THREE from 'three';
import * as maptalks from 'maptalks';

/**
 * this is for ExtrudeMesh util
 */

/**
 * Fix the bug in the center of multipoygon
 * @param {maptalks.Polygon} polygon
 * @param {*} layer
 */
export function toShape(polygon, layer, center) {
    let shell, holes;
    //it is pre for geojson,Possible later use of geojson
    if (Array.isArray(polygon)) {
        shell = polygon[0];
        holes = polygon.slice(1, polygon.length);
    } else {
        shell = polygon.getShell();
        holes = polygon.getHoles();
    }
    center = center || polygon.getCenter();
    const centerPt = layer.coordinateToVector3(center);
    const outer = shell.map(c => layer.coordinateToVector3(c).sub(centerPt));
    const shape = new THREE.Shape(outer);
    if (holes && holes.length > 0) {
        shape.holes = holes.map(item => {
            const pts = item.map(c => layer.coordinateToVector3(c).sub(centerPt));
            return new THREE.Shape(pts);
        });
    }
    return shape;
}

/**
 *  Support custom center point
 * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
 * @param {*} height
 * @param {*} layer
 */
export function getExtrudeGeometry(polygon, height, layer, center) {
    if (!polygon) {
        return null;
    }
    let shape;
    if (polygon instanceof maptalks.MultiPolygon) {
        shape = polygon.getGeometries().map(p => {
            return toShape(p, layer, center || polygon.getCenter());
        });
    } else if (polygon instanceof maptalks.Polygon) {
        shape = toShape(polygon, layer, center || polygon.getCenter());
    }
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
