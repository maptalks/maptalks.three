import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getLinePosition } from './util/LineUtil';

function initColors(cs) {
    const colors = [];
    if (cs && cs.length) {
        cs.forEach(color => {
            color = (color instanceof THREE.Color ? color : new THREE.Color(color));
            colors.push(color.r, color.g, color.b);
        });
    }
    return colors;
}

const OPTIONS = {
    altitude: 0,
    colors: null
};

/**
 *
 */
class Line extends BaseObject {
    constructor(lineString, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);
        const positions = getLinePosition(lineString, layer).positions;
        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const colors = initColors(options.colors);
        if (colors && colors.length) {
            geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            material.vertexColors = THREE.VertexColors;
        }
        this._createLine(geometry, material);

        const { altitude } = options;
        const center = lineString.getCenter();
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
    }
}

export default Line;
