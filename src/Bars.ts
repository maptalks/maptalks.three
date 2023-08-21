import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getGeometry, initVertexColors, mergeBarGeometry } from './util/BarUtil';
import Bar from './Bar';
import MergedMixin from './MergedMixin';
import { altitudeToVector3, distanceToVector3, getCenterOfPoints } from './util/index';
import { getVertexColors } from './util/ThreeAdaptUtil';
import { BarOptionType } from './type/index';
import { ThreeLayer } from './index';
import { generateBufferGeometry, generatePickBufferGeometry, getDefaultBufferGeometry } from './util/MergeGeometryUtil';
import { BarsTaskIns } from './BaseObjectTaskManager';


const OPTIONS = {
    coordinate: '',
    radius: 10,
    height: 100,
    radialSegments: 6,
    altitude: 0,
    topColor: '',
    bottomColor: '#2d2f61',
};

/**
 * merged bars
 */
class Bars extends MergedMixin(BaseObject) {
    constructor(points: Array<BarOptionType>, options: BarOptionType, material: THREE.Material, layer: ThreeLayer) {
        if (!Array.isArray(points)) {
            points = [points];
        }
        const len = points.length;
        const center = getCenterOfPoints(points);
        const centerPt = layer.coordinateToVector3(center);
        const geometries = [], bars = [], geometriesAttributes = [], faceMap = [];
        let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
        const cache = {}, altCache = {};
        super();
        options = maptalks.Util.extend({}, { altitude: 0, layer, points }, OPTIONS, options);
        this._initOptions(options);
        let geometry;
        const TEMP_VECTOR = new THREE.Vector3();
        if (options.asynchronous) {
            geometry = getDefaultBufferGeometry();
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            const datas = [];
            for (let i = 0; i < len; i++) {
                const opts = maptalks.Util.extend({ index: i }, options, points[i]);
                const { radius, radialSegments, altitude, height, coordinate } = opts;
                const r = distanceToVector3(radius, layer, cache);
                (points[i] as any)._radius = r;
                const h = altitudeToVector3(height, layer, altCache);
                const alt = altitudeToVector3(altitude, layer, altCache);
                const v = layer.coordinateToVector3(coordinate, 0, TEMP_VECTOR).sub(centerPt);
                datas.push({ radialSegments, radius: r, height: h, center: [v.x, v.y], altitude: alt });
            }
            BarsTaskIns.push({
                id,
                data: datas,
                layer,
                baseObject: this
            });
        } else {
            for (let i = 0; i < len; i++) {
                const opts = maptalks.Util.extend({ index: i }, options, points[i]);
                const { radius, radialSegments, altitude, topColor, bottomColor, height, coordinate } = opts;
                const r = distanceToVector3(radius, layer, cache);
                const h = altitudeToVector3(height, layer, altCache);
                const alt = altitudeToVector3(altitude, layer, altCache);
                const v = layer.coordinateToVector3(coordinate, 0, TEMP_VECTOR).sub(centerPt);
                const buffGeom = getGeometry({ radius: r, height: h, radialSegments, center: [v.x, v.y] });
                if (topColor) {
                    initVertexColors(buffGeom, bottomColor, topColor, 'z', h / 2);
                    (material as any).vertexColors = getVertexColors();
                }
                // buffGeom.rotateX(Math.PI / 2);
                const parray = buffGeom.attributes.position.array as any;
                for (let j = 0, len1 = parray.length; j < len1; j += 3) {
                    parray[j + 2] += alt;
                    // parray[j] += v.x;
                    // parray[j + 1] += v.y;
                    // parray[j + 2] += v.z;
                }
                geometries.push(buffGeom);
                const bar = new Bar(coordinate, opts, material, layer);
                bars.push(bar);

                const faceLen = buffGeom.index.count / 3;
                // faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                faceIndex += faceLen;

                const psCount = buffGeom.attributes.position.count,
                    //  colorCount = buffGeom.attributes.color.count,
                    normalCount = buffGeom.attributes.normal.count, uvCount = buffGeom.attributes.uv.count;
                geometriesAttributes[i] = {
                    position: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    // normal: {
                    //     count: normalCount,
                    //     start: normalIndex,
                    //     end: normalIndex + normalCount * 3,
                    // },
                    // // color: {
                    // //     count: colorCount,
                    // //     start: colorIndex,
                    // //     end: colorIndex + colorCount * 3,
                    // // },
                    // uv: {
                    //     count: uvCount,
                    //     start: uvIndex,
                    //     end: uvIndex + uvCount * 2,
                    // },
                    hide: false
                };
                psIndex += psCount * 3;
                normalIndex += normalCount * 3;
                // colorIndex += colorCount * 3;
                uvIndex += uvCount * 2;
            }
            geometry = mergeBarGeometry(geometries);
        }

        this._createMesh(geometry, material);
        const altitude = options.altitude;
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const v = centerPt.clone();
        v.z = z;
        this.getObject3d().position.copy(v);
        // this._faceMap = faceMap;
        this._baseObjects = bars;
        this._datas = points;
        this._geometriesAttributes = geometriesAttributes;
        this.faceIndex = null;
        this._geometryCache = generatePickBufferGeometry(geometry);
        this.isHide = false;
        this._colorMap = {};
        this._initBaseObjectsEvent(bars);
        if (!options.asynchronous) {
            this._setPickObject3d();
            this._init();
        }
        this.type = 'Bars';
    }

    // eslint-disable-next-line no-unused-vars
    identify() {
        return this.picked;
    }

    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
            if (!this._baseObjects[index]) {
                const bar = this._datas[index];
                const opts = Object.assign({}, this.options, bar, { index, asynchronous: false });
                this._baseObjects[index] = new Bar(bar.coordinate, opts, (this.getObject3d() as any).material, this.getLayer());
                this._proxyEvent(this._baseObjects[index]);
            }
            return {
                data: this._datas[index],
                baseObject: this._baseObjects[index]
            };
        }
    }


    _workerLoad(result) {
        const { geometriesAttributes } = result;
        this._geometriesAttributes = geometriesAttributes;
        const bufferGeometry = generateBufferGeometry(result);
        this._geometryCache = generatePickBufferGeometry(bufferGeometry);
        const { topColor, bottomColor } = (this.getOptions() as any);
        const object3d = this.getObject3d() as any;
        const material = object3d.material;
        if (topColor) {
            initVertexColors(bufferGeometry, bottomColor, topColor, 'z', geometriesAttributes);
            (material as any).vertexColors = getVertexColors();
        }
        object3d.geometry = bufferGeometry;
        object3d.material.needsUpdate = true;
        this._setPickObject3d();
        this._init();
        if (this.isAdd) {
            const pick = this.getLayer().getPick();
            pick.add(this.pickObject3d);
        }
        this._fire('workerload', { target: this });
    }
}

export default Bars;
