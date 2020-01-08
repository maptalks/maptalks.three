import * as maptalks from 'maptalks';
import MergedMixin from './MergedMixin';
import BaseObject from './BaseObject';
import { getCenterOfPoints } from './util/ExtrudeUtil';
import { getExtrudeLineParams } from './util/LineUtil';
import ExtrudeLine from './ExtrudeLine';
import { getGeoJSONCenter, isGeoJSON } from './util/GeoJSONUtil';
import { mergeBufferGeometries } from './util/MergeGeometryUtil';

const OPTIONS = {
    width: 3,
    height: 1,
    altitude: 0
};

class ExtrudeLines extends MergedMixin(BaseObject) {
    constructor(lineStrings, options, material, layer) {
        if (!Array.isArray(lineStrings)) {
            lineStrings = [lineStrings];
        }
        const centers = [];
        const len = lineStrings.length;
        for (let i = 0; i < len; i++) {
            const lineString = lineStrings[i];
            centers.push(isGeoJSON(lineString) ? getGeoJSONCenter(lineString) : lineString.getCenter());
        }
        // Get the center point of the point set
        const center = getCenterOfPoints(centers);
        const geometries = [], extrudeLines = [];
        let faceIndex = 0, faceMap = [], geometriesAttributes = [],
            psIndex = 0, normalIndex = 0;
        for (let i = 0; i < len; i++) {
            const lineString = lineStrings[i];
            const opts = maptalks.Util.extend({}, OPTIONS, isGeoJSON(lineString) ? lineString.properties : lineString.getProperties(), { index: i });
            const { height, width } = opts;
            const w = layer.distanceToVector3(width, width).x;
            const h = layer.distanceToVector3(height, height).x;
            const buffGeom = getExtrudeLineParams(lineString, w, h, layer, center);
            geometries.push(buffGeom);

            const extrudeLine = new ExtrudeLine(lineString, opts, material, layer);
            extrudeLines.push(extrudeLine);

            const { position, normal, indices } = buffGeom;
            const faceLen = indices.length / 3;
            faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
            faceIndex += faceLen;
            const psCount = position.length / 3,
                //  colorCount = buffGeom.attributes.color.count,
                normalCount = normal.length / 3;
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
        const geometry = mergeBufferGeometries(geometries);

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
        this._baseObjects = extrudeLines;
        this._datas = lineStrings;
        this._geometriesAttributes = geometriesAttributes;
        this.faceIndex = null;
        this._geometryCache = geometry.clone();
        this.isHide = false;

        this._initBaseObjectsEvent(extrudeLines);
    }


    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
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

export default ExtrudeLines;
