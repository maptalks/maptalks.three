import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getExtrudeGeometry, initVertexColors, getCenterOfPoints } from './util/ExtrudeUtil';

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
        const center = getCenterOfPoints(centers);
        const geometries = [];
        for (let i = 0; i < len; i++) {
            const polygon = polygons[i];
            const height = (polygon.getProperties() || {}).height || 1;
            const buffGeom = getExtrudeGeometry(polygon, height, layer, center);
            geometries.push(buffGeom);
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
