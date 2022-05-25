import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { ThreeLayer } from './index';
import { BarOptionType } from './type/index';
import { getGeometry, initVertexColors } from './util/BarUtil';
import { getVertexColors } from './util/ThreeAdaptUtil';


const OPTIONS = {
    radius: 10,
    height: 100,
    radialSegments: 6,
    altitude: 0,
    topColor: '',
    bottomColor: '#2d2f61',
    heightEnable: true
};


/**
 *
 */
class Bar extends BaseObject {
    constructor(coordinate: maptalks.Coordinate, options: BarOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
        super();
        this._initOptions(options);
        const { height, radius, topColor, bottomColor, altitude } = options;
        options.height = layer.altitudeToVector3(height, height).x;
        options.radius = layer.distanceToVector3(radius, radius).x;
        // Meter as unit
        options['_radius'] = this.options['radius'];
        options['_height'] = this.options['height'];
        const geometry = getGeometry(options);
        if (topColor) {
            initVertexColors(geometry, bottomColor, topColor, 'z', options.height / 2);
            (material as any).vertexColors = getVertexColors();
        }
        this._createMesh(geometry, material);
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.type = 'Bar';
    }
}

export default Bar;
