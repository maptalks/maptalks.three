import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getExtrudeGeometry, initVertexColors, getCenterOfPoints } from './util/ExtrudeUtil';
import ExtrudePolygon from './ExtrudePolygon';

const OPTIONS = {
    altitude: 0,
    height: 1,
    topColor: null,
    bottomColor: '#2d2f61',
};

class MergedExtrudeMesh extends BaseObject {
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
            centers.push(polygon.getCenter());
        }
        // Get the center point of the point set
        const center = getCenterOfPoints(centers);
        const geometries = [], extrudePolygons = [];
        let faceIndex = 0, faceMap = {}, geometriesAttributes = {},
            psIndex = 0, normalIndex = 0, colorIndex = 0, uvIndex = 0;
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
            const psCount = buffGeom.attributes.position.count, colorCount = buffGeom.attributes.color.count,
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
                color: {
                    count: colorCount,
                    start: colorIndex,
                    end: colorIndex + colorCount * 3,
                },
                uv: {
                    count: uvCount,
                    start: uvIndex,
                    end: uvIndex + uvCount * 2,
                },
                hide: false
            };
            psIndex += psCount * 3;
            normalIndex += normalCount * 3;
            colorIndex += colorCount * 3;
            uvIndex += uvCount * 2;
        }
        const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

        options = maptalks.Util.extend({}, OPTIONS, options, { layer, polygons, coordinate: center });
        super();
        this._initOptions(options);

        const { topColor, bottomColor, altitude } = options;
        if (topColor && !material.map) {
            initVertexColors(geometry, bottomColor, topColor);
            material.vertexColors = THREE.VertexColors;
        }

        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);

        //Face corresponding to monomer
        this._faceMap = faceMap;
        this._extrudePolygons = extrudePolygons;
        this._polygons = polygons;
        this._geometriesAttributes = geometriesAttributes;
        // this.positions = positions;
        this.faceIndex = null;
        this._geometryCache = geometry.clone();
        this.isHide = false;

        extrudePolygons.forEach(extrudePolygon => {
            extrudePolygon.on('add', (e) => {
                this._showGeometry(e.target, true);
            });
            extrudePolygon.on('remove', (e) => {
                this._showGeometry(e.target, false);
            });
            extrudePolygon.on('mouseout', (e) => {
                this._mouseover = false;
                this._fire('mouseout', Object.assign({}, e, { target: this, type: 'mouseout' }));
                // this._showGeometry(e.target, false);
            });
            ['click', 'mousemove', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].forEach((eventType) => {
                extrudePolygon.on(eventType, (e) => {
                    this._fire(e.type, Object.assign({}, e, { target: this }));
                });
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

    // eslint-disable-next-line consistent-return
    getSelectMesh(faceIndex) {
        const index = this._getIndex(faceIndex);
        if (index != null) {
            return {
                data: this._polygons[index],
                baseObject: this._extrudePolygons[index]
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
                if (start <= faceIndex && faceIndex <= end) {
                    return index;
                }
            }
        }
    }


    /**
     * https://github.com/maptalks/maptalks.js/blob/a56b878078e7fb48ecbe700ba7481edde7b83cfe/src/geometry/Path.js#L74
     * @param {*} options
     * @param {*} cb
     */
    animateShow(options = {}, cb) {
        if (this._showPlayer) {
            this._showPlayer.cancel();
        }
        if (maptalks.Util.isFunction(options)) {
            options = {};
            cb = options;
        }
        const duration = options['duration'] || 1000,
            easing = options['easing'] || 'out';
        const player = this._showPlayer = maptalks.animation.Animation.animate({
            'scale': 1
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            const scale = frame.styles.scale;
            if (scale > 0) {
                this.getObject3d().scale.set(1, 1, scale);
            }
            if (cb) {
                cb(frame, scale);
            }
        });
        player.play();
        return player;
    }
}

export default MergedExtrudeMesh;
