import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { ExtrudePolygonTaskIns } from './BaseObjectTaskManager';
import { ThreeLayer } from './index';
import { ExtrudePolygonOptionType, PolygonType } from './type/index';
import { setBottomHeight } from './util';
import { getExtrudeGeometry, initVertexColors } from './util/ExtrudeUtil';
import { getGeoJSONCenter, isGeoJSONPolygon } from './util/GeoJSONUtil';
import { generateBufferGeometry, getDefaultBufferGeometry } from './util/MergeGeometryUtil';
import { getVertexColors } from './util/ThreeAdaptUtil';

const OPTIONS = {
    altitude: 0,
    height: 1,
    bottomHeight: 0,
    topColor: null,
    bottomColor: '#2d2f61',
    heightEnable: true
};

/**
 *
 */
class ExtrudePolygon extends BaseObject {
    constructor(polygon: PolygonType, options: ExtrudePolygonOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, polygon });
        super();
        this._initOptions(options);
        const { height, topColor, bottomColor, altitude, bottomHeight, asynchronous } = options;
        let geometry: THREE.BufferGeometry;
        const center = (isGeoJSONPolygon(polygon as any) ? getGeoJSONCenter(polygon as any) : (polygon as any).getCenter());
        if (asynchronous) {
            geometry = getDefaultBufferGeometry();
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            this.getOptions().center = center;
            ExtrudePolygonTaskIns.push({
                data: polygon,
                layer,
                id,
                baseObject: this
            });
        } else {
            geometry = getExtrudeGeometry(polygon, height, layer);
            const h = setBottomHeight(geometry, bottomHeight, layer);
            if (topColor) {
                const extrudeH = layer.altitudeToVector3(height, height).x;
                initVertexColors(geometry, bottomColor, topColor, h + extrudeH / 2);
                (material as any).vertexColors = getVertexColors();
            }
        }
        this._createMesh(geometry, material);
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this.type = 'ExtrudePolygon';
    }

    _workerLoad(data) {
        const bufferGeometry = generateBufferGeometry(data);
        const { topColor, bottomColor, bottomHeight, height } = (this.getOptions() as any);
        const object3d = this.getObject3d() as any;
        const material = object3d.material;
        if (topColor) {
            const layer = this.getLayer();
            const h = layer.altitudeToVector3(bottomHeight, bottomHeight).x;
            const extrudeH = layer.altitudeToVector3(height, height).x;
            initVertexColors(bufferGeometry, bottomColor, topColor, h + extrudeH / 2);
            (material as any).vertexColors = getVertexColors();
        }
        object3d.geometry = bufferGeometry;
        object3d.material.needsUpdate = true;
        this._fire('workerload', { target: this });
    }
}

export default ExtrudePolygon;
