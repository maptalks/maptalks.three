import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import Point from './Point';
import { vector2Pixel } from './util/IdentifyUtil';

const OPTIONS = {
    altitude: 0
};

const MAX = 100000;

class Points extends BaseObject {
    constructor(points, options, material, layer) {
        if (!Array.isArray(points)) {
            points = [points];
        }
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, points });
        super();

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

        options.positions = vectors;
        this._initOptions(options);
        this._createPoints(geometry, material);
        const altitude = options.altitude;
        const z = layer.distanceToVector3(altitude, altitude).x;
        this.getObject3d().position.z = z;

        this._points = pointMeshes;
        this._data = points;
        this.faceIndex = null;
        this._geometriesAttributes = geometriesAttributes;
        this._geometryCache = geometry.clone();
        this.isHide = false;
        if (pointMeshes.length) {
            pointMeshes.forEach(this._bindEvent.bind(this));
        }
    }

    _bindEvent(point) {
        point.on('add', (e) => {
            this._showGeometry(e.target, true);
        });
        point.on('remove', (e) => {
            this._showGeometry(e.target, false);
        });
        point.on('mouseout', (e) => {
            this._mouseover = false;
            this._fire('mouseout', Object.assign({}, e, { target: this, type: 'mouseout' }));
            // this._showGeometry(e.target, false);
        });
        ['click', 'mousemove', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].forEach((eventType) => {
            point.on(eventType, (e) => {
                this._fire(e.type, Object.assign({}, e, { target: this }));
            });
        });
    }


    _getHideGeometryIndex(attribute) {
        const indexs = [];
        let len = 0;
        for (let key in this._geometriesAttributes) {
            if (this._geometriesAttributes[key].hide === true) {
                indexs.push(key);
                len += this._geometriesAttributes[key][attribute].count;
            }
        }
        return {
            indexs,
            count: len
        };
    }

    _updateAttribute(bufferAttribute, attribute) {
        const { indexs } = this._getHideGeometryIndex(attribute);
        const array = this._geometryCache.attributes[attribute].array;
        const len = array.length;
        for (let i = 0; i < len; i++) {
            bufferAttribute.array[i] = array[i];
        }
        for (let j = 0; j < indexs.length; j++) {
            const index = indexs[j];
            const { start, end } = this._geometriesAttributes[index][attribute];
            for (let i = start; i < end; i++) {
                bufferAttribute.array[i] = NaN;
            }
        }
        return this;
    }

    _showGeometry(extrudePolygon, isHide) {
        let index;
        if (extrudePolygon) {
            index = extrudePolygon.getOptions().index;
        }
        if (index != null) {
            const geometryAttributes = this._geometriesAttributes[index];
            const { hide } = geometryAttributes;
            if (hide === isHide) {
                return this;
            }
            geometryAttributes.hide = isHide;
            const buffGeom = this.getObject3d().geometry;
            this._updateAttribute(buffGeom.attributes.position, 'position', 3);
            // this._updateAttribute(buffGeom.attributes.normal, 'normal', 3);
            // this._updateAttribute(buffGeom.attributes.color, 'color', 3);
            // this._updateAttribute(buffGeom.attributes.uv, 'uv', 2);
            buffGeom.attributes.position.needsUpdate = true;
            // buffGeom.attributes.color.needsUpdate = true;
            // buffGeom.attributes.normal.needsUpdate = true;
            // buffGeom.attributes.uv.needsUpdate = true;
            this.isHide = isHide;
        }
        return this;
    }

    _getIndex() {
        return this.faceIndex;
    }

    // eslint-disable-next-line consistent-return
    getSelectMesh(faceIndex) {
        const index = faceIndex || this.faceIndex;
        if (index != null) {
            if (!this._points[index]) {
                const data = this._data[index];
                const { coordinate, height, color } = data;
                this._points[index] = new Point(coordinate, { height, index, color }, this.getObject3d().material, this.getLayer());
                this._bindEvent(this._points[index]);
            }
            return {
                data: this._data[index],
                baseObject: this._points[index]
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
        const vector = new THREE.Vector3();
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
