import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import Point from './Point';
import { vector2Pixel } from './util/IdentifyUtil';
import MergedMixin from './MergedMixin';
import BBox from './util/BBox';
import { addAttribute } from './util/ThreeAdaptUtil';
import { altitudeToVector3, distanceToVector3 } from './util';
import { PointOptionType } from './type';
import { ThreeLayer } from './index';

const OPTIONS = {
    altitude: 0
};

const vector = new THREE.Vector3();

function roundFun(value: number, n: number) {
    const tempValue = Math.pow(10, n);
    return Math.round(value * tempValue) / tempValue;
}

/**
 *points
 */
class Points extends MergedMixin(BaseObject) {
    constructor(points: Array<PointOptionType>, options: PointOptionType, material: THREE.PointsMaterial, layer: ThreeLayer) {
        if (!Array.isArray(points)) {
            points = [points];
        }
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, points });
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0, len = points.length; i < len; i++) {
            const { coordinate } = points[i];
            let x, y;
            if (Array.isArray(coordinate)) {
                x = coordinate[0];
                y = coordinate[1];
            } else if (coordinate instanceof maptalks.Coordinate) {
                x = coordinate.x;
                y = coordinate.y;
            }
            points[i].coords = [x, y];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        const centerPt = layer.coordinateToVector3([(minX + maxX) / 2, (minY + maxY) / 2]);
        const { grids, averageX, averageY, ROWS, COLS } = BBox.initGrids(minX, minY, maxX, maxY);
        const gridslen = grids.length;

        const vs = new Float32Array(points.length * 3), vectors = [],
            colors = new Float32Array(points.length * 3), sizes = new Float32Array(points.length),
            pointMeshes = [], geometriesAttributes = [];
        const cache = {};
        let maxSize = 0;
        let hasColor = false, hasSize = false;
        const TEMP_VECTOR = new THREE.Vector3(0, 0, 0);
        for (let i = 0, len = points.length; i < len; i++) {
            let { coordinate, height, color, size, coords } = points[i];
            const idx = i * 3;
            if (color) {
                hasColor = true;
                color = (color instanceof THREE.Color ? color : new THREE.Color(color));
                colors[idx] = color.r;
                colors[idx + 1] = color.g;
                colors[idx + 2] = color.b;
            }
            if (size) {
                hasSize = true;
                sizes[i] = size;
                maxSize = Math.max(maxSize, size);
            }
            const z = altitudeToVector3(height, layer, cache);
            const v = layer.coordinateToVector3(coordinate, z);
            TEMP_VECTOR.x = v.x;
            TEMP_VECTOR.y = v.y;
            TEMP_VECTOR.z = v.z;
            TEMP_VECTOR.sub(centerPt);
            // const v1 = v.clone().sub(centerPt);
            vs[idx] = TEMP_VECTOR.x;
            vs[idx + 1] = TEMP_VECTOR.y;
            vs[idx + 2] = TEMP_VECTOR.z;

            vectors.push(v);

            geometriesAttributes[i] = {
                position: {
                    count: 1,
                    start: i * 3,
                    end: i * 3 + 3
                },
                hide: false
            };
            let row = roundFun(((coords[1] - minY) / averageY), 4);
            let col = roundFun(((coords[0] - minX) / averageX), 4);
            row -= 1;
            col -= 1;
            row = Math.max(0, row);
            col = Math.max(0, col);
            row = Math.ceil(row);
            col = Math.ceil(col);
            const gridIndex = col * ROWS + row;
            if (grids[gridIndex]) {
                grids[gridIndex].positions.push(v);
                grids[gridIndex].indexs.push(i);
            }
            // for (let j = 0; j < gridslen; j++) {
            //     if (grids[j].containsCoordinate(coordinate)) {
            //         // grids[j].coordinates.push(coordinate);
            //         grids[j].positions.push(v);
            //         grids[j].indexs.push(i);
            //         console.log(j, gridIndex);
            //         break;
            //     }
            // }
        }
        const geometry = new THREE.BufferGeometry();
        addAttribute(geometry, 'position', new THREE.BufferAttribute(vs, 3, true));
        if (hasColor) {
            addAttribute(geometry, 'color', new THREE.BufferAttribute(colors, 3, true));
        }
        if (hasSize) {
            addAttribute(geometry, 'size', new THREE.BufferAttribute(sizes, 1, true));
        }

        //for identify
        (options as any).positions = vectors;
        super();
        this._initOptions(options);
        this._createPoints(geometry, material);
        const altitude = options.altitude;
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const v = centerPt.clone();
        v.z = z;
        this.getObject3d().position.copy(v);

        this._baseObjects = pointMeshes;
        this._datas = points;
        this.faceIndex = null;
        this._geometriesAttributes = geometriesAttributes;
        this._geometryCache = geometry.clone();
        this.isHide = false;
        this._initBaseObjectsEvent(pointMeshes);
        this._grids = grids;
        this._bindMapEvents();
        this.type = 'Points';
        this.maxSize = maxSize;
    }

    _bindMapEvents() {
        const map = this.getMap();
        const events = 'zoomstart zooming zoomend movestart moving moveend pitch rotate';
        this.on('add', () => {
            this._updateGrids();
            map.on(events, this._updateGrids, this);
        });
        this.on('remove', () => {
            map.off(events, this._updateGrids, this);
        });
    }

    _updateGrids() {
        const map = this.getMap();
        this._grids.forEach(b => {
            if (b.indexs.length) {
                b.updateBBoxPixel(map);
            }
        });
    }

    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this.faceIndex;
        if (index != null) {
            if (!this._baseObjects[index]) {
                const data = this._datas[index];
                const { coordinate, height, color, size } = data;
                this._baseObjects[index] = new Point(coordinate, { height, index, color, size } as any, (this.getObject3d() as any).material, this.getLayer());
                this._proxyEvent(this._baseObjects[index]);
            }
            return {
                data: this._datas[index],
                baseObject: this._baseObjects[index]
            };
        }
    }

    /**
   *
   * @param {maptalks.Coordinate} coordinate
   */
    identify(coordinate: maptalks.Coordinate) {
        const layer = this.getLayer(), size = this.getMap().getSize(),
            camera = this.getLayer().getCamera(), altitude = this.getOptions().altitude, map = this.getMap();
        const z = layer.altitudeToVector3(altitude, altitude).x;
        let pointSize = (this.getObject3d() as any).material.size;
        const isDynamicSize = pointSize === undefined;
        const pixel = map.coordToContainerPoint(coordinate);
        const bs = [];
        this._grids.forEach(b => {
            if (b.indexs.length) {
                if (b.isRecCross(pixel, isDynamicSize ? this.maxSize : pointSize)) {
                    bs.push(b);
                }
            }
        });
        if (bs.length < 1) {
            return false;
        }

        for (let i = 0, len = bs.length; i < len; i++) {
            for (let len1 = bs[i].positions.length, j = len1 - 1; j >= 0; j--) {
                if (isDynamicSize) {
                    pointSize = this._datas[bs[i].indexs[j]].size || 1;
                }
                const v = bs[i].positions[j];
                vector.x = v.x;
                vector.y = v.y;
                vector.z = v.z + z;
                const p = vector2Pixel(vector, size, camera);
                const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
                if (distance <= pointSize / 2) {
                    this.faceIndex = bs[i].indexs[j];
                    return true;
                }
            }
        }
        return false;
    }
}

export default Points;
