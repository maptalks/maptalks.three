import * as maptalks from 'maptalks';
import * as THREE from 'three';

const options = {
    'renderer' : 'gl',
    'doubleBuffer' : true,
    'glOptions' : null
};

const RADIAN = Math.PI / 180;

/**
 * A Layer to render with THREE.JS (http://threejs.org), the most popular library for WebGL. <br>
 *
 * @classdesc
 * A layer to render with THREE.JS
 * @example
 *  var layer = new maptalks.ThreeLayer('three');
 *
 *  layer.prepareToDraw = function (gl, scene, camera) {
 *      var size = map.getSize();
 *      return [size.width, size.height]
 *  };
 *
 *  layer.draw = function (gl, scene, camera, width, height) {
 *      //...
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {maptalks.CanvasLayer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link maptalks.ThreeLayer#options}
 */
export class ThreeLayer extends maptalks.CanvasLayer {
    /**
     * Draw method of ThreeLayer
     * In default, it calls renderScene, refresh the camera and the scene
     */
    draw() {
        this.renderScene();
    }

    /**
     * Draw method of ThreeLayer when map is interacting
     * In default, it calls renderScene, refresh the camera and the scene
     */
    drawOnInteracting() {
        this.renderScene();
    }
    /**
     * Convert a geographic coordinate to THREE Vector3
     * @param  {maptalks.Coordinate} coordinate - coordinate
     * @param {Number} [z=0] z value
     * @return {THREE.Vector3}
     */
    coordinateToVector3(coordinate, z = 0) {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        const p = map.coordinateToPoint(coordinate, getTargetZoom(map));
        return new THREE.Vector3(p.x, p.y, -z);
    }

    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @return {THREE.Vector3}
     */
    distanceToVector3(w, h, coord) {
        const map = this.getMap();
        const zoom = getTargetZoom(map),
            center = coord || map.getCenter(),
            target = map.locate(center, w, h);
        const p0 = map.coordinateToPoint(center, zoom),
            p1 = map.coordinateToPoint(target, zoom);
        const x = Math.abs(p1.x - p0.x) * maptalks.Util.sign(w);
        const y = Math.abs(p1.y - p0.y) * maptalks.Util.sign(h);
        return new THREE.Vector3(x, y, 0);
    }

    /**
     * Convert a Polygon or a MultiPolygon to THREE shape
     * @param  {maptalks.Polygon|maptalks.MultiPolygon} polygon - polygon or multipolygon
     * @return {THREE.Shape}
     */
    toShape(polygon) {
        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(c => this.toShape(c));
        }
        const center = polygon.getCenter();
        const centerPt = this.coordinateToVector3(center);
        const shell = polygon.getShell();
        const outer = shell.map(c => this.coordinateToVector3(c).sub(centerPt));
        const shape = new THREE.Shape(outer);
        const holes = polygon.getHoles();

        if (holes && holes.length > 0) {
            shape.holes = holes.map(item => {
                var pts = item.map(c => this.coordinateToVector3(c).sub(centerPt));
                return new THREE.Shape(pts);
            });
        }

        return shape;
    }


    toExtrudeMesh(polygon, amount, material, removeDup) {
        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(c => this.toExtrudeGeometry(c, amount, material));
        }
        if (removeDup) {
            const rings = polygon.getCoordinates();
            rings.forEach(ring => {
                const length = ring.length;
                for (let i = length - 1; i >= 1; i--) {
                    if (ring[i].equals(ring[i - 1])) {
                        ring.splice(i, 1);
                    }
                }
            });
            polygon.setCoordinates(rings);
        }
        const shape = this.toShape(polygon);
        const center = this.coordinateToVector3(polygon.getCenter());
        amount = this.distanceToVector3(amount, amount).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        const geom = new THREE.ExtrudeGeometry(shape, { 'amount': amount, 'bevelEnabled': true });
        const buffGeom = new THREE.BufferGeometry();
        buffGeom.fromGeometry(geom);
        const mesh = new THREE.Mesh(buffGeom, material);
        mesh.position.set(center.x, center.y, -amount);
        return mesh;
    }

    clearMesh() {
        const scene = this.getScene();
        if (!scene) {
            return this;
        }
        for (var i = scene.children.length - 1; i >= 0; i--) {
            if (scene.children[i] instanceof THREE.Mesh) {
                scene.remove(scene.children[i]);
            }
        }
        return this;
    }

    lookAt(vector) {
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.context.lookAt(vector);
        }
        return this;
    }

    getCamera() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.camera;
        }
        return null;
    }

    getScene() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.scene;
        }
        return null;
    }

    renderScene() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.renderScene();
        }
        return this;
    }

    getThreeRenderer() {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.context;
        }
        return null;
    }

    /**
     * To make map's 2d point's 1 pixel euqal with 1 pixel on XY plane in THREE's scene:
     * 1. fov is 90 and camera's z is height / 2 * scale,
     * 2. if fov is not 90, a ratio is caculated to transfer z to the equivalent when fov is 90
     * @return {Number} fov ratio on z axis
     */
    _getFovRatio() {
        const map = this.getMap();
        const fov = map.getFov();
        return Math.tan(fov / 2 * RADIAN);
    }
}

ThreeLayer.mergeOptions(options);

export class ThreeRenderer extends maptalks.renderer.CanvasLayerRenderer {

    getPrepareParams() {
        return [this.scene, this.camera];
    }

    getDrawParams() {
        return [this.scene, this.camera];
    }

    _drawLayer() {
        super._drawLayer.apply(this, arguments);
        this.renderScene();
    }

    hitDetect() {
        return false;
    }

    onCanvasCreate() {
        super.onCanvasCreate();
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
    }

    initContext() {
        const map = this.getMap();
        const size = map.getSize();
        const renderer = this.layer.options['renderer'];
        var gl;
        if (renderer === 'gl') {
            gl = new THREE.WebGLRenderer(maptalks.Util.extend({
                'canvas' : this.canvas,
                'alpha' : true,
                'preserveDrawingBuffer' : true
            }, this.layer.options['glOptions']));
            gl.autoClear = false;
            gl.clear();
        } else if (renderer === 'canvas') {
            gl = new THREE.CanvasRenderer(maptalks.Util.extend({
                'canvas' : this.canvas,
                'alpha' : true
            }, this.layer.options['glOptions']));
        }
        gl.setSize(this.canvas.width, this.canvas.height);
        gl.setClearColor(new THREE.Color(1, 1, 1), 0);
        gl.canvas = this.canvas;
        this.context = gl;
        const maxScale = map.getScale(map.getMinZoom()) / map.getScale(getTargetZoom(map));
        const farZ = maxScale * size.height / 2 / this.layer._getFovRatio();
        // scene
        const scene = this.scene = new THREE.Scene();
        const fov = map.getFov();
        const camera = this.camera =  new THREE.PerspectiveCamera(fov, size.width / size.height, 1, farZ);
        scene.add(camera);
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        var size;
        if (!canvasSize) {
            size = this.getMap().getSize();
        } else {
            size = canvasSize;
        }
        const r = maptalks.Browser.retina ? 2 : 1;
        //retina support
        this.canvas.height = r * size['height'];
        this.canvas.width = r * size['width'];
        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();
        this.context.setSize(this.canvas.width, this.canvas.height);
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }

        this.context.clear();
    }

    prepareCanvas() {
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        this.layer.fire('renderstart', { 'context' : this.context });
        return null;
    }

    renderScene() {
        this._locateCamera();
        this.context.render(this.scene, this.camera);
        this.completeRender();
    }

    remove() {
        delete this._drawContext;
        super.remove();
    }

    _locateCamera() {
        const map = this.getMap();
        const size = map.getSize();
        const scale = map.getScale();
        const camera = this.camera;
        // 1. camera is always looking at map's center
        // 2. camera's distance from map's center doesn't change when rotating and tilting.
        const center2D = map.coordinateToPoint(map.getCenter(), getTargetZoom(map));
        const pitch = map.getPitch() * RADIAN;
        const bearing = map.getBearing() * RADIAN;

        const ratio = this.layer._getFovRatio();
        const z = -scale * size.height / 2 / ratio;

        // when map tilts, camera's position should be lower in Z axis
        camera.position.z = z * Math.cos(pitch);
        // and [dist] away from map's center on XY plane to tilt the scene.
        const dist = Math.sin(pitch) * z;
        // when map rotates, the camera's xy position is rotating with the given bearing and still keeps [dist] away from map's center
        camera.position.x = center2D.x + dist * Math.sin(bearing);
        camera.position.y = center2D.y - dist * Math.cos(bearing);

        // when map rotates, camera's up axis is pointing to south direction of map
        camera.up.set(Math.sin(bearing), -Math.cos(bearing), 0);

        // look at to the center of map
        camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
        camera.updateProjectionMatrix();
    }
}

ThreeLayer.registerRenderer('canvas', ThreeRenderer);
ThreeLayer.registerRenderer('gl', ThreeRenderer);

function getTargetZoom(map) {
    return map.getMaxNativeZoom();
}
