import * as maptalks from 'maptalks';
import * as THREE from 'three';
import MergedMixin from './MergedMixin';
import BaseObject from './BaseObject';
import { getPathParams, LineStringSplit } from './util/LineUtil';
import { isGeoJSON, isGeoJSONLine } from './util/GeoJSONUtil';
import { generateBufferGeometry, generatePickBufferGeometry, getDefaultBufferGeometry, mergeBufferGeometries, mergeBufferGeometriesAttribute } from './util/MergeGeometryUtil';
import { distanceToVector3, getCenterOfPoints, getLineStringProperties, setBottomHeight } from './util/index';
import { LineStringType, MergeAttributeType, PathOptionType, SingleLineStringType } from './type/index';
import { ThreeLayer } from './index';
import { PathsTaskIns } from './BaseObjectTaskManager';
import Path from './Path';

const OPTIONS = {
    width: 3,
    cornerRadius: 0,
    altitude: 0,
    topColor: null,
    bottomColor: '#2d2f61'
};

class Paths extends MergedMixin(BaseObject) {
    constructor(lineStrings: Array<LineStringType>, options: PathOptionType, material: THREE.Material, layer: ThreeLayer) {
        if (!Array.isArray(lineStrings)) {
            lineStrings = [lineStrings];
        }
        const centers: maptalks.Coordinate[] = [], lineStringList: Array<Array<SingleLineStringType>> = [];
        const len = lineStrings.length;
        for (let i = 0; i < len; i++) {
            const lineString = lineStrings[i];
            const result = LineStringSplit(lineString);
            centers.push(result.center);
            lineStringList.push(result.lineStrings);
        }
        // Get the center point of the point set
        const center = getCenterOfPoints(centers);
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineStrings, coordinate: center });
        const { altitude, asynchronous } = options;
        let bufferGeometry: THREE.BufferGeometry;
        const faceMap = [], extrudeLines = [], geometriesAttributes = [];
        super();
        if (asynchronous) {
            bufferGeometry = getDefaultBufferGeometry();
            PathsTaskIns.push({
                id: maptalks.Util.GUID(),
                layer,
                key: options.key,
                center,
                data: lineStringList,
                lineStrings,
                baseObject: this,
                option: options,
            });
        } else {
            const geometries: MergeAttributeType[] = [];
            let faceIndex = 0, faceMap = [],
                psIndex = 0, normalIndex = 0;
            const cache = {}, altCache = {};
            for (let i = 0; i < len; i++) {
                const lineString = lineStrings[i];
                const opts = maptalks.Util.extend({}, options, getLineStringProperties(lineString), { index: i });
                const { cornerRadius, width, bottomHeight } = opts;
                const w = distanceToVector3(width, layer, cache);
                const rc = distanceToVector3(cornerRadius, layer, altCache);
                const lls = lineStringList[i];
                const extrudeParams: MergeAttributeType[] = [];
                let minZ = 0;
                for (let m = 0, le = lls.length; m < le; m++) {
                    const attribute = getPathParams(lls[m], w, rc, layer, center);
                    minZ = setBottomHeight(attribute, bottomHeight, layer, cache);
                    extrudeParams.push(attribute);
                }
                const buffGeom = mergeBufferGeometriesAttribute(extrudeParams);
                geometries.push(buffGeom);

                // const extrudeLine = new ExtrudeLine(lineString, opts, material, layer);
                // extrudeLines.push(extrudeLine);

                const { position, normal, indices } = buffGeom;
                const faceLen = indices.length / 3;
                // faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
                faceIndex += faceLen;
                const psCount = position.length / 3,
                    //  colorCount = buffGeom.attributes.color.count,
                    normalCount = normal.length / 3;
                geometriesAttributes[i] = {
                    position: {
                        middleZ: minZ,
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    // normal: {
                    //     count: normalCount,
                    //     start: normalIndex,
                    //     end: normalIndex + normalCount * 3,
                    // },
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
            bufferGeometry = mergeBufferGeometries(geometries);
        }

        this._initOptions(options);

        this._createMesh(bufferGeometry, material);
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);

        //Face corresponding to monomer
        // this._faceMap = faceMap;
        this._baseObjects = extrudeLines;
        this._datas = lineStrings;
        this._geometriesAttributes = geometriesAttributes;
        this.faceIndex = null;
        this._geometryCache = generatePickBufferGeometry(bufferGeometry);
        this.isHide = false;
        this._colorMap = {};
        this._initBaseObjectsEvent(extrudeLines);
        if (!asynchronous) {
            this._setPickObject3d();
            this._init();
        }
        this.type = 'Paths';
    }

    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
            if (!this._baseObjects[index]) {
                const lineString = this._datas[index];
                const opts = Object.assign({}, this.options, isGeoJSONLine(lineString) ? lineString.properties : lineString.getProperties(), { index });
                this._baseObjects[index] = new Path(lineString, opts, (this.getObject3d() as any).material, this.getLayer());
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
        const { geometriesAttributes } = result;
        // this._faceMap = faceMap;
        this._geometriesAttributes = geometriesAttributes;
        const bufferGeometry = generateBufferGeometry(result);
        this._geometryCache = generatePickBufferGeometry(bufferGeometry);
        (this.getObject3d() as any).geometry = bufferGeometry;
        this._setPickObject3d();
        this._init();
        if (this.isAdd) {
            const pick = this.getLayer().getPick();
            pick.add(this.pickObject3d);
        }
        this._fire('workerload', { target: this });
    }
}

export default Paths;
