import * as maptalks from 'maptalks';
import * as THREE from 'three';
import MergedMixin from './MergedMixin';
import BaseObject from './BaseObject';
import { getCenterOfPoints } from './util/ExtrudeUtil';
import { getExtrudeLineGeometry } from './util/LineUtil';
import ExtrudeLine from './ExtrudeLine';

const OPTIONS = {
    width: 3,
    height: 1,
    altitude: 0
};

class MergedExtrudeLine extends MergedMixin(BaseObject) {
    constructor(lineStrings, options, material, layer) {
        if (!THREE.BufferGeometryUtils) {
            console.error('not find BufferGeometryUtils,please include related scripts');
        }
        if (!Array.isArray(lineStrings)) {
            lineStrings = [lineStrings];
        }
        const centers = [];
        const len = lineStrings.length;
        for (let i = 0; i < len; i++) {
            const lineString = lineStrings[i];
            centers.push(lineString.getCenter());
        }
        // Get the center point of the point set
        const center = getCenterOfPoints(centers);
        const geometries = [], extrudeLines = [];
        let faceIndex = 0, faceMap = {}, geometriesAttributes = {},
            psIndex = 0, normalIndex = 0;
        for (let i = 0; i < len; i++) {
            const lineString = lineStrings[i];
            const opts = maptalks.Util.extend({}, OPTIONS, lineString.getProperties(), { index: i });
            const { height, width } = opts;
            const w = layer.distanceToVector3(width, width).x;
            const h = layer.distanceToVector3(height, height).x;
            const buffGeom = getExtrudeLineGeometry(lineString, w, h, layer, center);
            geometries.push(buffGeom);

            const extrudeLine = new ExtrudeLine(lineString, opts, material, layer);
            extrudeLines.push(extrudeLine);

            const geometry = new THREE.Geometry();
            geometry.fromBufferGeometry(buffGeom);
            const faceLen = geometry.faces.length;
            faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
            faceIndex += faceLen;
            geometry.dispose();
            const psCount = buffGeom.attributes.position.count,
                //  colorCount = buffGeom.attributes.color.count,
                normalCount = buffGeom.attributes.normal.count;
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
            // uvIndex += uvCount * 2;
        }
        const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineStrings, coordinate: center });
        super();
        this._initOptions(options);

        this._createMesh(geometry, material);
        const { altitude } = options;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);

        //Face corresponding to monomer
        this._faceMap = faceMap;
        this._extrudeLines = extrudeLines;
        this._datas = lineStrings;
        this._geometriesAttributes = geometriesAttributes;
        this.faceIndex = null;
        this._geometryCache = geometry.clone();
        this.isHide = false;

        extrudeLines.forEach(extrudeLine => {
            this._proxyEvent(extrudeLine);
        });
    }


    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
            return {
                data: this._datas[index],
                baseObject: this._extrudeLines[index]
            };
        }
    }

    // eslint-disable-next-line consistent-return
    _getIndex(faceIndex) {
        if (faceIndex == null) {
            faceIndex = this.faceIndex;
        }
        if (faceIndex != null) {
            for (let index in this._faceMap) {
                const [start, end] = this._faceMap[index];
                if (start <= faceIndex && faceIndex < end) {
                    return index;
                }
            }
        }
    }
}

export default MergedExtrudeLine;
