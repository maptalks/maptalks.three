import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getLinePosition, getLineSegmentPosition, LineStringSplit, mergeLinePositions } from './util/LineUtil';
import MergedMixin from './MergedMixin';
import FatLine from './FatLine';
import { isGeoJSONLine } from './util/GeoJSONUtil';
import LineGeometry from './util/fatline/LineGeometry';
import Line2 from './util/fatline/Line2';
import LineMaterial from './util/fatline/LineMaterial';
import { getCenterOfPoints, getGeometriesColorArray, getLineStringProperties, setBottomHeight } from './util';
import { FatLineMaterialType, LineOptionType, LineStringType } from './type';
import { ThreeLayer } from './index';
import { getVertexColors } from './util/ThreeAdaptUtil';
import { FatLinesTaskIns } from './BaseObjectTaskManager';

const OPTIONS = {
    altitude: 0,
    colors: null
};

/**
 *
 */
class FatLines extends MergedMixin(BaseObject) {
    constructor(lineStrings: Array<LineStringType>, options: LineOptionType, material: FatLineMaterialType, layer: ThreeLayer) {
        if (!Array.isArray(lineStrings)) {
            lineStrings = [lineStrings];
        }

        const centers = [], lineStringList = [];
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
        super();
        this._initOptions(options);
        const { asynchronous } = options;
        const geometry = new LineGeometry();
        const lines = [], cache = {};
        let faceIndex = 0, faceMap = [], geometriesAttributes = [],
            psIndex = 0, positionList = [];
        let position: Float32Array;
        let newPosition: Float32Array;
        if (asynchronous) {
            FatLinesTaskIns.push({
                id: maptalks.Util.GUID(),
                data: lineStringList,
                key: (options as any).key,
                center,
                layer,
                baseObject: this,
                lineStrings,
                option: options,
            });
        } else {
            //LineSegmentsGeometry
            for (let i = 0; i < len; i++) {
                const lls = lineStringList[i];
                let psCount = 0;
                for (let m = 0, le = lls.length; m < le; m++) {
                    const properties = getLineStringProperties(lls[m]);
                    const opts = maptalks.Util.extend({}, options, properties);
                    const { positions } = getLinePosition(lls[m], layer, center, false);
                    setBottomHeight(positions, opts.bottomHeight, layer, cache);
                    psCount += (positions.length / 3 * 2 - 2);
                    positionList.push(getLineSegmentPosition(positions));
                }
                // const psCount = positionsV.length + positionsV.length - 2;
                const faceLen = psCount;
                // faceMap[i] = [faceIndex, faceIndex + faceLen];
                faceIndex += faceLen;

                geometriesAttributes[i] = {
                    position: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    instanceStart: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    instanceEnd: {
                        count: psCount,
                        start: psIndex,
                        end: psIndex + psCount * 3,
                    },
                    hide: false
                };
                psIndex += psCount * 3;
            }
            position = mergeLinePositions(positionList);
            geometry.setPositions(position);
        }

        this._setMaterialRes(layer, material);
        this._createLine2(geometry, material);
        const { altitude } = options;
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);

        // this._faceMap = faceMap;
        this._baseObjects = lines;
        this._datas = lineStrings;
        this._geometriesAttributes = geometriesAttributes;
        this.faceIndex = null;
        this.index = null;
        this._geometryCache = new LineGeometry();
        if (!asynchronous) {
            newPosition = new Float32Array(position);
            (this._geometryCache as any).setPositions(newPosition);
        }
        this._colorMap = {};
        this.isHide = false;
        this._initBaseObjectsEvent(lines);
        if (!asynchronous) {
            this._setPickObject3d(newPosition, material.linewidth);
            this._init();
        }
        this.type = 'FatLines';
    }

    _setMaterialRes(layer, material) {
        const map = layer.getMap();
        if (!map) {
            return this;
        }
        const size = map.getSize();
        const width = size.width,
            height = size.height;
        material.resolution.set(width, height);
    }

    _setPickObject3d(ps?, linewidth?) {
        if (!this._colorMap) {
            return;
        }
        const geometry = this._geometryCache || new LineGeometry();
        (geometry as LineGeometry).setPositions(ps);
        const pick = this.getLayer().getPick();
        const { _geometriesAttributes } = this;
        const colors = getGeometriesColorArray(_geometriesAttributes);
        let cIndex = 0;
        for (let i = 0, len = _geometriesAttributes.length; i < len; i++) {
            const color = pick.getColor();
            const colorIndex = color.getHex();
            this._colorMap[colorIndex] = i;
            const { count } = _geometriesAttributes[i].position;
            this._datas[i].colorIndex = colorIndex;
            for (let j = 0; j < count; j++) {
                colors[cIndex] = color.r;
                colors[cIndex + 1] = color.g;
                colors[cIndex + 2] = color.b;
                cIndex += 3;
            }
        }
        (geometry as LineGeometry).setColors(colors);
        const material = new LineMaterial({
            // color: color.getStyle(),
            // side: THREE.BackSide,
            color: '#fff',
            linewidth,
            vertexColors: getVertexColors()
            // dashed: false
        });
        this._setMaterialRes(this.getLayer(), material);
        const color = pick.getColor();
        const colorIndex = color.getHex();
        const mesh = new Line2(geometry, material);
        mesh.position.copy(this.getObject3d().position);
        mesh._colorIndex = colorIndex;
        this.setPickObject3d(mesh);
    }

    // eslint-disable-next-line no-unused-vars
    identify(coordinate) {
        return this.picked;
    }

    setSymbol(material) {
        if (material && material instanceof THREE.Material) {
            material.needsUpdate = true;
            const size = this.getMap().getSize();
            const width = size.width,
                height = size.height;
            (material as any).resolution.set(width, height);
            (this.getObject3d() as any).material = material;
        }
        return this;
    }


    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this._getIndex();
        if (index != null) {
            if (!this._baseObjects[index]) {
                const lineString = this._datas[index];
                const opts = maptalks.Util.extend({}, this.getOptions(), { index },
                    isGeoJSONLine(lineString) ? lineString.properties : lineString.getProperties());
                this._baseObjects[index] = new FatLine(lineString, opts, (this.getObject3d() as any).material, this.getLayer());
                this._proxyEvent(this._baseObjects[index]);
            }
            return {
                data: this._datas[index],
                baseObject: this._baseObjects[index]
            };
        }
    }

    /**
       * update geometry attributes
       * @param {*} bufferAttribute
       * @param {*} attribute
       */
    _updateAttribute(bufferAttribute, attribute) {
        const { indexs } = this._getHideGeometryIndex(attribute);
        const array = this._geometryCache.attributes[attribute].array;
        const len = array.length;
        for (let i = 0; i < len; i++) {
            bufferAttribute.array[i] = array[i];
        }
        let value = -100000;
        for (let j = 0; j < indexs.length; j++) {
            const index = indexs[j];
            const { start, end } = this._geometriesAttributes[index][attribute];
            for (let i = start; i < end; i++) {
                bufferAttribute.array[i] = value;
            }
        }
        return this;
    }

    _showGeometry(baseObject, isHide) {
        let index;
        if (baseObject) {
            index = baseObject.getOptions().index;
        }
        if (index != null) {
            const geometryAttributes = this._geometriesAttributes[index];
            const { hide } = geometryAttributes;
            if (hide === isHide) {
                return this;
            }
            geometryAttributes.hide = isHide;
            const buffGeom = (this.getObject3d() as any).geometry;
            this._updateAttribute(buffGeom.attributes.instanceStart, 'instanceStart');
            this._updateAttribute(buffGeom.attributes.instanceEnd, 'instanceEnd');
            // this._updateAttribute(buffGeom.attributes.instanceDistanceStart, 'instanceDistanceStart');
            // this._updateAttribute(buffGeom.attributes.instanceDistanceEnd, 'instanceDistanceEnd');
            buffGeom.attributes.instanceStart.data.needsUpdate = true;
            buffGeom.attributes.instanceEnd.data.needsUpdate = true;
            // buffGeom.attributes.instanceDistanceStart.data.needsUpdate = true;
            // buffGeom.attributes.instanceDistanceEnd.data.needsUpdate = true;
            this.isHide = isHide;
        }
        return this;
    }

    _workerLoad(result) {
        const { geometriesAttributes } = result;
        // this._faceMap = faceMap;
        this._geometriesAttributes = geometriesAttributes;
        const object3d = this.getObject3d();
        const position = new Float32Array(result.position);
        const newPosition = new Float32Array(position);
        (object3d as any).geometry.setPositions(new Float32Array(position));
        (object3d as any).computeLineDistances();
        (this._geometryCache as any).setPositions(newPosition);
        this._setPickObject3d(newPosition, (object3d as any).material.linewidth);
        this._init();
        if (this.isAdd) {
            const pick = this.getLayer().getPick();
            pick.add(this.pickObject3d);
        }
        this._fire('workerload', { target: this });
    }

    _animation() {
        const layer = this.getLayer();
        if (!layer) {
            return this;
        }
        const object3d = this.getObject3d();
        const pickObject3d = this.getPickObject3d();
        [object3d, pickObject3d].forEach(object3d => {
            if (object3d) {
                this._setMaterialRes(layer, (object3d as any).material);
            }
        });
    }
}

export default FatLines;
