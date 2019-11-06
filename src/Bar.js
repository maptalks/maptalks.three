import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';

const barGeometryCache = {};
const KEY = '-';

/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property 
 */
function getGeometry(property) {
    const {
        height,
        radialSegments,
        radius,
        _radius,
        _height
    } = property;
    let geometry;
    for (let i = 0; i <= 4; i++) {
        let key = [(_height + i), _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key];
        if (geometry) break;
        key = [(_height - i), _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key];
        if (geometry) break;
    }
    if (!geometry) {
        const key = [_height, _radius, radialSegments].join(KEY).toString();
        geometry = barGeometryCache[key] = new THREE.CylinderBufferGeometry(radius, radius, height, radialSegments, 1);
    }
    return geometry;
}


/**
 * init Colors
 * @param {*} geometry 
 * @param {*} color 
 * @param {*} _topColor 
 */
function initVertexColors(geometry, color, _topColor) {
    const position = geometry.attributes.position.array;
    const len = position.length;
    const bottomColor = (color instanceof THREE.Color ? color : new THREE.Color(color));
    const topColor = new THREE.Color(_topColor);
    const colors = [];
    for (let i = 0; i < len; i += 3) {
        const y = position[i + 1];
        if (y > 0) {
            colors.push(topColor.r, topColor.r, topColor.b);
        } else {
            colors.push(bottomColor.r, bottomColor.r, bottomColor.b);
        }
    }
    geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3, true));
    return colors;
}




const OPTIONS = {
    radius: 10,
    height: 100,
    radialSegments: 6,
    altitude: 0,
    topColor: null,
    bottomColor: '#2d2f61',
};


/**
 * 
 */
class Bar extends BaseObject {
    constructor(coordinate, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
        super();
        this._initOptions(options);
        const { height, radius, topColor, bottomColor, altitude } = options;
        options.height = layer.distanceToVector3(height, height).x;
        options.radius = layer.distanceToVector3(radius, radius).x;
        // Meter as unit
        options._radius = this.options.radius;
        options._height = this.options.height;
        this._h = options.height;
        const geometry = getGeometry(options);
        if (topColor && !material.map) {
            initVertexColors(geometry, bottomColor, topColor);
            material.vertexColors = THREE.VertexColors;
        }
        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.getObject3d().rotation.x = Math.PI / 2;
        this.getObject3d().translateY(options.height / 2);
    }

    setAltitude(altitude) {
        if (maptalks.Util.isNumber(altitude)) {
            const z = this.getLayer().distanceToVector3(altitude, altitude).x;
            const center = this.getCenter();
            const v = this.getLayer().coordinateToVector3(center, z);
            this.getObject3d().position.copy(v);
            this.options.altitude = altitude;
            const h = this._h;
            this.getObject3d().translateY(h / 2);
        }
        return this;
    }

    /**
     * https://github.com/maptalks/maptalks.js/blob/a56b878078e7fb48ecbe700ba7481edde7b83cfe/src/geometry/Path.js#L74
     * @param {*} options 
     * @param {*} cb 
     */
    animateShow(options = {}, cb) {
        if (this._showPlayer) {
            this._showPlayer.cancel();
            //restore bar initial state
            this.getObject3d().scale.set(1, 1, 1);
            this.getObject3d().translateY(this._h / 2);
            delete this._translateY;
        }
        if (maptalks.Util.isFunction(options)) {
            options = {};
            cb = options;
        }
        const duration = options['duration'] || 1000, h = this._h,
            easing = options['easing'] || 'out';

        this.getObject3d().translateY(-h / 2);
        this.getObject3d().scale.set(1, 0.00001, 1);

        const player = this._showPlayer = maptalks.animation.Animation.animate({
            'scale': 1
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            if (this._translateY) {
                this.getObject3d().translateY(-this._translateY);
            }
            const scale = frame.styles.scale;
            if (scale > 0) {
                this.getObject3d().scale.set(1, scale, 1);
                const y = h / 2 * scale;
                this._translateY = y;
                this.getObject3d().translateY(y);
            }
            if (cb) {
                cb(frame, scale);
            }
        });
        player.play();
        return player;
    }
}

export default Bar;