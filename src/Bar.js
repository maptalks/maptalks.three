import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getGeometry, initVertexColors } from './util/BarUtil';


const OPTIONS = {
    radius: 10,
    height: 100,
    radialSegments: 6,
    altitude: 0,
    topColor: null,
    bottomColor: '#2d2f61',
};


/**
 *
 */
class Bar extends BaseObject {
    constructor(coordinate, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
        super();
        this._initOptions(options);
        const { height, radius, topColor, bottomColor, altitude } = options;
        options.height = layer.distanceToVector3(height, height).x;
        options.radius = layer.distanceToVector3(radius, radius).x;
        // Meter as unit
        options._radius = this.options.radius;
        options._height = this.options.height;
        this._h = options.height;
        const geometry = getGeometry(options);
        if (topColor && !material.map) {
            initVertexColors(geometry, bottomColor, topColor, 'z', options.height / 2);
            material.vertexColors = THREE.VertexColors;
        }
        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        // this.getObject3d().rotation.x = Math.PI / 2;
        // this.getObject3d().translateY(options.height / 2);
    }
}

export default Bar;
