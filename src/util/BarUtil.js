import * as THREE from 'three';
const barGeometryCache = {};
const KEY = '-';

/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property
 */
export function getGeometry(property, isCache = true) {
    const {
        height,
        radialSegments,
        radius,
        _radius,
        _height
    } = property;
    if (!isCache) {
        const geometry = new THREE.CylinderBufferGeometry(radius, radius, height, radialSegments, 1);
        geometry.rotateX(Math.PI / 2);
        const parray = geometry.attributes.position.array;
        for (let j = 0, len1 = parray.length; j < len1; j += 3) {
            parray[j + 2] += (height / 2);
        }
        return geometry;
    }
    let geometry;
    for (let i = 0; i <= 4; i++) {
        let key = [(_height + i), _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key];
        if (geometry) break;
        key = [(_height - i), _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key];
        if (geometry) break;
    }
    if (!geometry) {
        const key = [_height, _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key] = new THREE.CylinderBufferGeometry(radius, radius, height, radialSegments, 1);
        geometry.rotateX(Math.PI / 2);
        const parray = geometry.attributes.position.array;
        for (let j = 0, len1 = parray.length; j < len1; j += 3) {
            parray[j + 2] += (height / 2);
        }
        return geometry;
    }
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
    const bottomColor = (color instanceof THREE.Color ? color : new THREE.Color(color));
    const topColor = new THREE.Color(_topColor);
    const colors = [];
    for (let i = 0; i < len; i += 3) {
        const y = position[i + offset];
        if (y > v) {
            colors.push(topColor.r, topColor.r, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.r, bottomColor.b);
        }
    }
    geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3, true));
    return colors;
}


