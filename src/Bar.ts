import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { BarTaskIns } from './BaseObjectTaskManager';
import { ThreeLayer } from './index';
import { BarOptionType } from './type/index';
import { getGeometry, initVertexColors } from './util/BarUtil';
import { generateBufferGeometry, getDefaultBufferGeometry } from './util/MergeGeometryUtil';
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
        const { height, radius, topColor, bottomColor, altitude, asynchronous } = options;
        options.height = layer.altitudeToVector3(height, height).x;
        options.radius = layer.distanceToVector3(radius, radius).x;
        let geometry;
        if (asynchronous) {
            geometry = getDefaultBufferGeometry();
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            BarTaskIns.push({
                data: { radius: options.radius, height: options.height, radialSegments: options.radialSegments, id },
                layer,
                id,
                baseObject: this
            });
        } else {
            geometry = getGeometry(options);
            if (topColor) {
                initVertexColors(geometry, bottomColor, topColor, 'z', options.height / 2);
                (material as any).vertexColors = getVertexColors();
            }
        }
        this._createMesh(geometry, material);
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.type = 'Bar';
    }

    _workerLoad(data) {
        const bufferGeometry = generateBufferGeometry(data);
        const { topColor, bottomColor, height } = (this.getOptions() as any);
        const object3d = this.getObject3d() as any;
        const material = object3d.material;
        if (topColor) {
            const layer = this.getLayer();
            const extrudeH = layer.altitudeToVector3(height, height).x;
            initVertexColors(bufferGeometry, bottomColor, topColor, 'z', extrudeH / 2);
            (material as any).vertexColors = getVertexColors();
        }
        object3d.geometry = bufferGeometry;
        object3d.material.needsUpdate = true;
        this._fire('workerload', { target: this });
    }
}

export default Bar;
