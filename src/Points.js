import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import Point from './Point';
import { vector2Pixel } from './util/IdentifyUtil';
import MergedMixin from './MergedMixin';

const OPTIONS = {
    altitude: 0
};

const MAX = 100000;
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
        const vs = [], vectors = [], colors = [], pointMeshes = [], geometriesAttributes = [];
        for (let i = 0, len = points.length; i < len; i++) {
            let { coordinate, height, color } = points[i];
            if (color) {
                color = (color instanceof THREE.Color ? color : new THREE.Color(color));
                colors.push(color.r, color.g, color.b);
            }
            const z = layer.distanceToVector3(height, height).x;
            const v = layer.coordinateToVector3(coordinate, z);
            vs.push(v.x, v.y, v.z);
            vectors.push(v);
            //Do not initialize the monomer when the data volume is too large
            if (len <= MAX) {
                const point = new Point(coordinate, { height, index: i }, material, layer);
                pointMeshes.push(point);
            }

            geometriesAttributes[i] = {
                position: {
                    count: 1,
                    start: i * 3,
                    end: i * 3 + 3
                },
                hide: false
            };
        }
        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(vs, 3, true));
        if (colors.length) {
            geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3, true));
        }

        //for identify
        options.positions = vectors;
        super();
        this._initOptions(options);
        this._createPoints(geometry, material);
        const altitude = options.altitude;
        const z = layer.distanceToVector3(altitude, altitude).x;
        this.getObject3d().position.z = z;

        this._baseObjects = pointMeshes;
        this._data = points;
        this.faceIndex = null;
        this._geometriesAttributes = geometriesAttributes;
        this._geometryCache = geometry.clone();
        this.isHide = false;
        this._initBaseObjectsEvent(pointMeshes);
    }

    // eslint-disable-next-line consistent-return
    getSelectMesh() {
        const index = this.faceIndex;
        if (index != null) {
            if (!this._baseObjects[index]) {
                const data = this._data[index];
                const { coordinate, height, color } = data;
                this._baseObjects[index] = new Point(coordinate, { height, index, color }, this.getObject3d().material, this.getLayer());
                this._proxyEvent(this._baseObjects[index]);
            }
            return {
                data: this._data[index],
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
            camera = this.getLayer().getCamera(), positions = this.getOptions().positions, altitude = this.getOptions().altitude;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const pointSize = this.getObject3d().material.size;
        const pixel = this.getMap().coordToContainerPoint(coordinate);
        for (let i = 0, len = positions.length; i < len; i++) {
            const v = positions[i];
            vector.x = v.x;
            vector.y = v.y;
            vector.z = v.z + z;
            const p = vector2Pixel(vector, size, camera);
            const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
            if (distance <= pointSize / 2) {
                this.faceIndex = i;
                return true;
            }
        }
        return false;
    }
}

export default Points;
