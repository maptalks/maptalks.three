
import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { ThreeLayer } from './index';
import { BarOptionType } from './type/index';
import { getDefaultBoxGeometry, initVertexColors } from './util/BarUtil';
import { getVertexColors } from './util/ThreeAdaptUtil';

const OPTIONS = {
    radius: 10,
    height: 100,
    altitude: 0,
    topColor: '',
    bottomColor: '#2d2f61',
    heightEnable: true
};

class Box extends BaseObject {
    constructor(coordinate: maptalks.Coordinate, options: BarOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
        super();
        this._initOptions(options);
        const { height, radius, topColor, bottomColor, altitude } = options;
        const h = layer.distanceToVector3(height, height).x;
        const r = layer.distanceToVector3(radius, radius).x;
        const geometry = getDefaultBoxGeometry().clone();
        geometry.scale(r * 2, r * 2, h);
        if (topColor) {
            initVertexColors(geometry, bottomColor, topColor, 'z', h / 2);
            (material as any).vertexColors = getVertexColors();
        }
        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.type = 'Box';
    }
}
export default Box;
