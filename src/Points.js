import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import Point from './Point';
import { vector2Pixel } from './util/IdentifyUtil';
import MergedMixin from './MergedMixin';
import BBox from './util/BBox';
import { addAttribute } from './util/ThreeAdaptUtil';
import { distanceToVector3 } from './util';

const OPTIONS = {
    altitude: 0
};

const vector = new THREE.Vector3();

/**
 *points
 */
class Points extends MergedMixin(BaseObject) {
    constructor(points, options, material, layer) {
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
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        const centerPt = layer.coordinateToVector3([(minX + maxX) / 2, (minY + maxY) / 2]);
        const grids = BBox.initGrids(minX, minY, maxX, maxY);
        const gridslen = grids.length;

        const vs = [], vectors = [], colors = [], pointMeshes = [], geometriesAttributes = [];
        const cache = {};
        for (let i = 0, len = points.length; i < len; i++) {
            let { coordinate, height, color } = points[i];
            if (color) {
                color = (color instanceof THREE.Color ? color : new THREE.Color(color));
                colors.push(color.r, color.g, color.b);
            }
            const z = distanceToVector3(cache, height, layer);
            const v = layer.coordinateToVector3(coordinate, z);
            const v1 = v.clone().sub(centerPt);
            vs.push(v1.x, v1.y, v1.z);

            vectors.push(v);

            geometriesAttributes[i] = {
                position: {
                    count: 1,
                    start: i * 3,
                    end: i * 3 + 3
                },
                hide: false
            };
            for (let j = 0; j < gridslen; j++) {
                if (grids[j].containsCoordinate(coordinate)) {
                    // grids[j].coordinates.push(coordinate);
                    grids[j].positions.push(v);
                    grids[j].indexs.push(i);
                    break;
                }
            }
        }
        const geometry = new THREE.BufferGeometry();
        addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(vs, 3, true));
        if (colors.length) {
            addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
        }

        //for identify
        options.positions = vectors;
        super();
        this._initOptions(options);
        this._createPoints(geometry, material);
        const altitude = options.altitude;
        const z = layer.distanceToVector3(altitude, altitude).x;
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
    }

    _bindMapEvents() {
        const map = this.getMap();
        this.on('add', () => {
            this._updateGrids();
            map.on('zoomstart zooming zoomend movestart moving moveend pitch rotate', this._updateGrids, this);
        });
        this.on('remove', () => {
            map.off('zoomstart zooming zoomend movestart moving moveend pitch rotate', this._updateGrids, this);
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
                const { coordinate, height, color } = data;
                this._baseObjects[index] = new Point(coordinate, { height, index, color }, this.getObject3d().material, this.getLayer());
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
    identify(coordinate) {
        const layer = this.getLayer(), size = this.getMap().getSize(),
            camera = this.getLayer().getCamera(), altitude = this.getOptions().altitude, map = this.getMap();
        const z = layer.distanceToVector3(altitude, altitude).x;
        const pointSize = this.getObject3d().material.size;
        const pixel = map.coordToContainerPoint(coordinate);
        const bs = [];
        this._grids.forEach(b => {
            if (b.indexs.length) {
                if (b.isRecCross(pixel, pointSize)) {
                    bs.push(b);
                }
            }
        });
        if (bs.length < 1) {
            return false;
        }

        for (let i = 0, len = bs.length; i < len; i++) {
            for (let j = 0, len1 = bs[i].positions.length; j < len1; j++) {
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

        // for (let i = 0, len = positions.length; i < len; i++) {
        //     const v = positions[i];
        //     vector.x = v.x;
        //     vector.y = v.y;
        //     vector.z = v.z + z;
        //     const p = vector2Pixel(vector, size, camera);
        //     const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
        //     if (distance <= pointSize / 2) {
        //         this.faceIndex = i;
        //         console.timeEnd(timer);
        //         return true;
        //     }
        // }
        return false;
    }
}

export default Points;
