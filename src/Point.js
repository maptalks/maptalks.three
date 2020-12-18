import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { vector2Pixel } from './util/IdentifyUtil';
import { addAttribute } from './util/ThreeAdaptUtil';

const OPTIONS = {
    altitude: 0,
    height: 0
};

const vector = new THREE.Vector3();

class Point extends BaseObject {
    constructor(coordinate, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
        super();
        let { height, altitude, color } = options;
        const vs = [], colors = [];
        if (color) {
            color = (color instanceof THREE.Color ? color : new THREE.Color(color));
            colors.push(color.r, color.g, color.b);
        }
        const z = layer.distanceToVector3(height, height).x;
        const v = layer.coordinateToVector3(coordinate, z);
        vs.push(0, 0, v.z);
        const geometry = new THREE.BufferGeometry();
        addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(vs, 3, true));
        if (colors.length) {
            addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3, true));
        }

        options.positions = v;
        this._initOptions(options);
        this._createPoints(geometry, material);
        const z1 = layer.distanceToVector3(altitude, altitude).x;
        const v1 = new THREE.Vector3(v.x, v.y, z1);
        this.getObject3d().position.copy(v1);
        this.type = 'Point';
    }

    /**
     *
     * @param {maptalks.Coordinate} coordinate
     */
    identify(coordinate) {
        const layer = this.getLayer(), size = this.getMap().getSize(),
            camera = this.getLayer().getCamera(), positions = this.getOptions().positions, altitude = this.getOptions().altitude;
        //Size of points
        const pointSize = this.getObject3d().material.size;
        const pixel = this.getMap().coordToContainerPoint(coordinate);

        const z = layer.distanceToVector3(altitude, altitude).x;
        vector.x = positions.x;
        vector.y = positions.y;
        vector.z = positions.z + z;
        //3D vector to screen coordinates
        const p = vector2Pixel(vector, size, camera);
        //Distance between two points
        const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
        if (distance <= pointSize / 2) {
            return true;
        }
        return false;
    }
}

export default Point;
