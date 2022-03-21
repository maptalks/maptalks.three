import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { ExtrudeLineTaskIns } from './BaseObjectTaskManager';
import { ThreeLayer } from './index';
import { ExtrudeLineOptionType, LineStringType, MergeAttributeType } from './type/index';
import { setBottomHeight } from './util';
import { initVertexColors } from './util/ExtrudeUtil';
import { LineStringSplit, getExtrudeLineParams } from './util/LineUtil';
import { generateBufferGeometry, getDefaultBufferGeometry, mergeBufferGeometries } from './util/MergeGeometryUtil';
import { getVertexColors } from './util/ThreeAdaptUtil';

const OPTIONS = {
    bottomHeight: 0,
    width: 3,
    height: 1,
    altitude: 0,
    topColor: null,
    bottomColor: '#2d2f61',
    heightEnable: true
};


/**
 *
 */
class ExtrudeLine extends BaseObject {
    constructor(lineString: LineStringType, options: ExtrudeLineOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);

        const { height, width, bottomColor, topColor, bottomHeight, altitude, asynchronous } = options;
        const h = layer.distanceToVector3(height, height).x;
        const w = layer.distanceToVector3(width, width).x;
        const { lineStrings, center } = LineStringSplit(lineString);
        let geometry: THREE.BufferGeometry;
        if (asynchronous) {
            geometry = getDefaultBufferGeometry();
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            this.getOptions().center = center;
            ExtrudeLineTaskIns.push({
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
                const attribute = getExtrudeLineParams(lineStrings[i], w, h, layer, center);
                minZ = setBottomHeight(attribute, bottomHeight, layer, cache);
                extrudeParams.push(attribute);
            }
            geometry = mergeBufferGeometries(extrudeParams);
            if (topColor) {
                initVertexColors(geometry, bottomColor, topColor, minZ + h / 2);
                (material as any).vertexColors = getVertexColors();
            }
        }
        this._createMesh(geometry, material);

        // const center = (isGeoJSON(lineString) ? getGeoJSONCenter(lineString) : lineString.getCenter());
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this.type = 'ExtrudeLine';
    }

    _workerLoad(result) {
        const bufferGeometry = generateBufferGeometry(result);
        const { topColor, bottomColor, bottomHeight, height } = (this.getOptions() as any);
        const object3d = this.getObject3d() as any;
        const material = object3d.material;
        if (topColor) {
            const layer = this.getLayer();
            const h = layer.distanceToVector3(bottomHeight, bottomHeight).x;
            const extrudeH = layer.distanceToVector3(height, height).x;
            initVertexColors(bufferGeometry, bottomColor, topColor, h + extrudeH / 2);
            (material as any).vertexColors = getVertexColors();
        }
        object3d.geometry = bufferGeometry;
        object3d.material.needsUpdate = true;
        this._fire('workerload', { target: this });
    }
}

export default ExtrudeLine;
