import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { initVertexColors, getExtrudeGeometryParams } from './util/ExtrudeUtil';
import ExtrudePolygon from './ExtrudePolygon';
import MergedMixin from './MergedMixin';
import { getGeoJSONCenter, isGeoJSONPolygon } from './util/GeoJSONUtil';
import { generateBufferGeometry, generatePickBufferGeometry, getDefaultBufferGeometry, mergeBufferGeometries } from './util/MergeGeometryUtil';
import { getActor } from './worker/MeshActor';
import { ExtrudePolygonOptionType, PolygonType } from './type';
import { ThreeLayer } from './index';
import { getVertexColors } from './util/ThreeAdaptUtil';
import { setBottomHeight } from './util';
import { ExtrudePolygonsTaskIns } from './BaseObjectTaskManager';

const OPTIONS = {
    altitude: 0,
    height: 1,
    bottomHeight: 0,
    topColor: null,
    bottomColor: '#2d2f61',
};
const TEMP_COORD = new maptalks.Coordinate(0, 0);

class ExtrudePolygons extends MergedMixin(BaseObject) {
    constructor(polygons: Array<PolygonType>, options: ExtrudePolygonOptionType, material: THREE.Material, layer: ThreeLayer) {
        if (!Array.isArray(polygons)) {
            polygons = [polygons];
        }
        const len = polygons.length;
        if (len === 0) {
            console.error('polygons is empty');
        }
        // const centers = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < len; i++) {
            const polygon = polygons[i];
            const center = ((polygon as any).getCenter ? (polygon as any).getCenter() : getGeoJSONCenter((polygon as any), TEMP_COORD));
            let x, y;
            if (Array.isArray(center)) {
                x = center[0];
                y = center[1];
            } else if (center instanceof maptalks.Coordinate) {
                x = center.x;
                y = center.y;
            }
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        super();
        // Get the center point of the point set
        const center = new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, polygons, coordinate: center });
        const { topColor, bottomColor, altitude, asynchronous } = options;
        let bufferGeometry;
        const extrudePolygons = [], faceMap = [], geometriesAttributes = [];
        if (asynchronous) {
            bufferGeometry = getDefaultBufferGeometry();
            ExtrudePolygonsTaskIns.push({
                id: maptalks.Util.GUID(),
                layer,
                key: options.key,
                center,
                data: polygons,
                baseObject: this
            });
        } else {
            const centerPt = layer.coordinateToVector3(center);
            const geometries = [];
            let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
            const altCache = {};
            for (let i = 0; i < len; i++) {
                const polygon = polygons[i];
                const properties = (isGeoJSONPolygon(polygon as any) ? polygon['properties'] : (polygon as any).getProperties() || {});
                const height = properties.height || 1;
                const bottomHeight = properties.bottomHeight || 0;
                const buffGeom = getExtrudeGeometryParams(polygon, height, layer, center, centerPt, altCache);
                geometries.push(buffGeom);
                const minZ = setBottomHeight(buffGeom, bottomHeight, layer, altCache);

                // const extrudePolygon = new ExtrudePolygon(polygon, Object.assign({}, options, { height, index: i }), material, layer);
                // extrudePolygons.push(extrudePolygon);

                const { position, normal, uv, indices } = buffGeom;
                const faceLen = indices.length / 3;
                faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                faceIndex += faceLen;
                const psCount = position.length / 3,
                    //  colorCount = buffGeom.attributes.color.count,
                    normalCount = normal.length / 3, uvCount = uv.length / 2;
                geometriesAttributes[i] = {
                    position: {
                        middleZ: minZ + altCache[height] / 2,
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    normal: {
                        count: normalCount,
                        start: normalIndex,
                        end: normalIndex + normalCount * 3,
                    },
                    // color: {
                    //     count: colorCount,
                    //     start: colorIndex,
                    //     end: colorIndex + colorCount * 3,
                    // },
                    uv: {
                        count: uvCount,
                        start: uvIndex,
                        end: uvIndex + uvCount * 2,
                    },
                    hide: false
                };
                psIndex += psCount * 3;
                normalIndex += normalCount * 3;
                // colorIndex += colorCount * 3;
                uvIndex += uvCount * 2;
            }
            bufferGeometry = mergeBufferGeometries(geometries);
            if (topColor) {
                initVertexColors(bufferGeometry, bottomColor, topColor, geometriesAttributes);
                (material as any).vertexColors = getVertexColors();
            }
        }

        this._initOptions(options);

        this._createMesh(bufferGeometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);

        //Face corresponding to monomer
        this._faceMap = faceMap;
        this._baseObjects = extrudePolygons;
        this._datas = polygons;
        this._geometriesAttributes = geometriesAttributes;
        this.faceIndex = null;
        this._geometryCache = bufferGeometry.clone();
        this.isHide = false;
        this._colorMap = {};
        this._initBaseObjectsEvent(extrudePolygons);
        if (!asynchronous) {
            this._setPickObject3d();
            this._init();
        }
        this.type = 'ExtrudePolygons';
    }

    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
            if (!this._baseObjects[index]) {
                const polygon = this._datas[index];
                const opts = Object.assign({}, this.options, isGeoJSONPolygon(polygon) ? polygon.properties : polygon.getProperties(), { index });
                this._baseObjects[index] = new ExtrudePolygon(polygon, opts, (this.getObject3d() as any).material, this.getLayer());
                this._proxyEvent(this._baseObjects[index]);
            }
            return {
                data: this._datas[index],
                baseObject: this._baseObjects[index]
            };
        }
    }

    // eslint-disable-next-line no-unused-vars
    identify(coordinate): boolean {
        return this.picked;
    }

    _workerLoad(result) {
        const { faceMap, geometriesAttributes } = result;
        this._faceMap = faceMap;
        this._geometriesAttributes = geometriesAttributes;
        const bufferGeometry = generateBufferGeometry(result);
        this._geometryCache = generatePickBufferGeometry(bufferGeometry);
        const { topColor, bottomColor } = (this.getOptions() as any);
        const object3d = this.getObject3d() as any;
        const material = object3d.material;
        if (topColor) {
            initVertexColors(bufferGeometry, bottomColor, topColor, geometriesAttributes);
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

export default ExtrudePolygons;
