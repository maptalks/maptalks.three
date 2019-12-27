import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getExtrudeGeometry, initVertexColors, getCenterOfPoints } from './util/ExtrudeUtil';
import ExtrudePolygon from './ExtrudePolygon';
import MergedMixin from './MergedMixin';
import { getGeoJSONCenter, isGeoJSONPolygon } from './util/GeoJSONUtil';
import { pushQueue as meshPushQueue } from './queue/WorkerQueue';


function updateAttribute(data) {
    const { position, normal, uv } = data;
    // geometry.attributes.position.count = position.length;
    // geometry.attributes.normal.count = normal.length;
    // geometry.attributes.color.count = color.length;
    // geometry.attributes.uv.count = uv.length;
    const color = new Float32Array(position.length);
    color.fill(1, 0, position.length);
    const bufferGeomertry = new THREE.BufferGeometry();
    bufferGeomertry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    bufferGeomertry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
    bufferGeomertry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
    bufferGeomertry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    return bufferGeomertry;
}

const OPTIONS = {
    altitude: 0,
    height: 1,
    topColor: null,
    bottomColor: '#2d2f61',
};

class ExtrudePolygons extends MergedMixin(BaseObject) {
    constructor(polygons, options, material, layer) {
        if (!THREE.BufferGeometryUtils) {
            console.error('not find BufferGeometryUtils,please include related scripts');
        }
        if (!Array.isArray(polygons)) {
            polygons = [polygons];
        }
        const centers = [];
        const len = polygons.length;
        for (let i = 0; i < len; i++) {
            const polygon = polygons[i];
            centers.push(isGeoJSONPolygon(polygon) ? getGeoJSONCenter(polygon) : polygon.getCenter());
        }
        // Get the center point of the point set
        const center = getCenterOfPoints(centers);
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, polygons, coordinate: center });
        const { topColor, bottomColor, altitude, asynchronous } = options;
        let bufferGeometry;
        const extrudePolygons = [], faceMap = [], geometriesAttributes = [];
        if (asynchronous) {
            const SIZE = 0.000001;
            bufferGeometry = new THREE.BoxBufferGeometry(SIZE, SIZE, SIZE * 5);
            meshPushQueue({
                type: 'Polygon',
                layer,
                key: options.key,
                data: polygons,
                callback: (e) => {
                    const { faceMap, geometriesAttributes } = e;
                    this._faceMap = faceMap;
                    this._geometriesAttributes = geometriesAttributes;
                    const bufferGeometry = updateAttribute(e);
                    if (topColor && !material.map) {
                        initVertexColors(bufferGeometry, bottomColor, topColor);
                        material.vertexColors = THREE.VertexColors;
                    }
                    this.getObject3d().geometry.dispose();
                    this.getObject3d().geometry = bufferGeometry;
                    this.getObject3d().material.needsUpdate = true;
                    this._geometryCache = bufferGeometry.clone();
                    this._fire('workerload', { target: this });
                }
            });
        } else {
            const geometries = [];
            let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
            for (let i = 0; i < len; i++) {
                const polygon = polygons[i];
                const height = (polygon.getProperties() || {}).height || 1;
                const buffGeom = getExtrudeGeometry(polygon, height, layer, center);
                geometries.push(buffGeom);

                const extrudePolygon = new ExtrudePolygon(polygon, Object.assign({}, options, { height, index: i }), material, layer);
                extrudePolygons.push(extrudePolygon);

                const geometry = new THREE.Geometry();
                geometry.fromBufferGeometry(buffGeom);
                const faceLen = geometry.faces.length;
                faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                faceIndex += faceLen;
                geometry.dispose();
                const psCount = buffGeom.attributes.position.count,
                    //  colorCount = buffGeom.attributes.color.count,
                    normalCount = buffGeom.attributes.normal.count, uvCount = buffGeom.attributes.uv.count;
                geometriesAttributes[i] = {
                    position: {
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
            bufferGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
            if (topColor && !material.map) {
                initVertexColors(bufferGeometry, bottomColor, topColor);
                material.vertexColors = THREE.VertexColors;
            }
        }

        super();
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

        this._initBaseObjectsEvent(extrudePolygons);
    }

    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
            if (!this._baseObjects[index]) {
                const polygon = this._datas[index];
                const opts = Object.assign({}, this.options, isGeoJSONPolygon(polygon) ? polygon.properties : polygon.getProperties(), { index });
                this._baseObjects[index] = new ExtrudePolygon(polygon, opts, this.getObject3d().material, this.getLayer());
                this._proxyEvent(this._baseObjects[index]);
            }
            return {
                data: this._datas[index],
                baseObject: this._baseObjects[index]
            };
        }
    }

    // eslint-disable-next-line consistent-return
    _getIndex(faceIndex) {
        if (faceIndex == null) {
            faceIndex = this.faceIndex;
        }
        if (faceIndex != null) {
            for (let i = 0, len = this._faceMap.length; i < len; i++) {
                const [start, end] = this._faceMap[i];
                if (start <= faceIndex && faceIndex < end) {
                    return i;
                }
            }
        }
    }
}

export default ExtrudePolygons;
