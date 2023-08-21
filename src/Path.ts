import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { PathTaskIns } from './BaseObjectTaskManager';
import { ThreeLayer } from './index';
import { LineStringType, MergeAttributeType, PathOptionType } from './type/index';
import { setBottomHeight } from './util';
import { LineStringSplit, getPathParams } from './util/LineUtil';
import { generateBufferGeometry, getDefaultBufferGeometry, mergeBufferGeometries } from './util/MergeGeometryUtil';

const OPTIONS = {
    bottomHeight: 0,
    width: 3,
    cornerRadius: 0,
    altitude: 0,
    topColor: null,
    bottomColor: '#2d2f61',
    heightEnable: true
};

/**
 *
 */
class Path extends BaseObject {
    constructor(lineString: LineStringType, options: PathOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);

        const { width, cornerRadius, bottomHeight, altitude, asynchronous } = options;
        const cr = layer.distanceToVector3(cornerRadius, cornerRadius).x;
        const w = layer.distanceToVector3(width, width).x;
        const { lineStrings, center } = LineStringSplit(lineString);
        let geometry: THREE.BufferGeometry;
        if (asynchronous) {
            geometry = getDefaultBufferGeometry();
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            this.getOptions().center = center;
            PathTaskIns.push({
                id,
                data: lineStrings,
                layer,
                center,
                lineString,
                baseObject: this
            });
        } else {
            const extrudeParams: MergeAttributeType[] = [];
            let minZ = 0;
            const cache = {};
            for (let i = 0, len = lineStrings.length; i < len; i++) {
                const attribute = getPathParams(lineStrings[i], w, cr, layer, center);
                minZ = setBottomHeight(attribute, bottomHeight, layer, cache);
                extrudeParams.push(attribute);
            }
            geometry = mergeBufferGeometries(extrudeParams);
        }
        this._createMesh(geometry, material);
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this.type = 'Path';
    }

    _workerLoad(result) {
        const bufferGeometry = generateBufferGeometry(result);
        const object3d = this.getObject3d() as any;
        object3d.geometry = bufferGeometry;
        this._fire('workerload', { target: this });
    }
}

export default Path;
