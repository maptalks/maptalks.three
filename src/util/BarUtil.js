import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { mergeBufferGeometries } from './MergeGeometryUtil';
import { addAttribute } from './ThreeAdaptUtil';
const barGeometryCache = {};
const defaultBoxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
defaultBoxGeometry.translate(0, 0, 0.5);

const topColor = new THREE.Color('#fff'), bottomColor = new THREE.Color('#fff');

function getDefaultCylinderBufferGeometry(radialSegments = 6) {
    if (!barGeometryCache[radialSegments]) {
        const geometry = new THREE.CylinderBufferGeometry(1, 1, 1, radialSegments, 1);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, 0.5);
        barGeometryCache[radialSegments] = geometry;
    }
    return barGeometryCache[radialSegments];
}

/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property
 */
// eslint-disable-next-line no-unused-vars
export function getGeometry(property, isCache = true) {
    const {
        height,
        radialSegments,
        radius
    } = property;
    const geometry = getDefaultCylinderBufferGeometry(radialSegments).clone();
    geometry.scale(radius, radius, height);
    return geometry;
}


/**
 * init Colors
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */
export function initVertexColors(geometry, color, _topColor, key = 'y', v = 0) {
    let offset = 0;
    if (key === 'y') {
        offset = 1;
    } else if (key === 'z') {
        offset = 2;
    }
    const position = geometry.attributes.position.array;
    const len = position.length;
    bottomColor.setStyle(color);
    topColor.setStyle(_topColor);
    const colors = [];
    for (let i = 0; i < len; i += 3) {
        const y = position[i + offset];
        if (y > v) {
            colors.push(topColor.r, topColor.g, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
        }
    }
    addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
    return colors;
}


export function mergeBarGeometry(geometries) {
    const attributes = [], colors = [];
    for (let i = 0, len = geometries.length; i < len; i++) {
        const { color, normal, position, uv } = geometries[i].attributes;
        const index = geometries[i].index;
        if (color) {
            for (let j = 0, len1 = color.array.length; j < len1; j++) {
                colors.push(color.array[j]);
            }
        }
        attributes.push({
            // color: color.array,
            normal: normal.array,
            uv: uv.array,
            position: position.array,
            indices: index.array
        });
    }
    const bufferGeometry = mergeBufferGeometries(attributes);
    if (colors.length) {
        for (let i = 0, len = colors.length; i < len; i++) {
            bufferGeometry.attributes.color.array[i] = colors[i];
        }
    }
    for (let i = 0, len = geometries.length; i < len; i++) {
        geometries[i].dispose();
    }
    return bufferGeometry;

}

export function getCenterOfPoints(points = []) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0, len = points.length; i < len; i++) {
        const { coordinate } = points[i];
        let x, y;
        if (Array.isArray(coordinate)) {
            x = coordinate[0];
            y = coordinate[1];
        } else if (coordinate instanceof maptalks.Coordinate) {
            x = coordinate.x;
            y = coordinate.y;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    return new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
}

export function getDefaultBoxGeometry() {
    return defaultBoxGeometry;
}

