import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './src/BaseObject';
import Bar from './src/Bar';
import Line from './src/Line';
import ExtrudeLine from './src/ExtrudeLine';
import ExtrudePolygon from './src/ExtrudePolygon';

const options = {
    'renderer': 'gl',
    'doubleBuffer': false,
    'glOptions': null
};

const RADIAN = Math.PI / 180;

const LINEPRECISIONS = [
    [4000, 220],
    [2000, 100],
    [1000, 30],
    [500, 15],
    [100, 5],
    [50, 2],
    [10, 1],
    [5, 0.7],
    [2, 0.1],
    [1, 0.05],
    [0.5, 0.02]
];


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
 *  layer.draw = function (gl, view, scene, camera, width,height) {
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
        if (!(coordinate instanceof maptalks.Coordinate)) {
            coordinate = new maptalks.Coordinate(coordinate);
        }
        const p = map.coordinateToPoint(coordinate, getTargetZoom(map));
        return new THREE.Vector3(p.x, p.y, z);
    }

    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @return {THREE.Vector3}
     */
    distanceToVector3(w, h, coord) {
        const map = this.getMap();
        const zoom = getTargetZoom(map);
        let center = coord || map.getCenter();
        if (!(center instanceof maptalks.Coordinate)) {
            center = new maptalks.Coordinate(center);
        }
        const target = map.locate(center, w, h);
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
        const outer = shell.map(c => this.coordinateToVector3(c).sub(centerPt)).reverse();
        const shape = new THREE.Shape(outer);
        const holes = polygon.getHoles();

        if (holes && holes.length > 0) {
            shape.holes = holes.map(item => {
                const pts = item.map(c => this.coordinateToVector3(c).sub(centerPt));
                return new THREE.Shape(pts);
            });
        }

        return shape;
    }


    /**
     * todo   This should also be extracted as a component
     * @param {*} polygon
     * @param {*} altitude
     * @param {*} material
     * @param {*} height
     */
    toExtrudeMesh(polygon, altitude, material, height) {
        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(c => this.toExtrudeMesh(c, altitude, material, height));
        }
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
        const shape = this.toShape(polygon);
        const center = this.coordinateToVector3(polygon.getCenter());
        height = maptalks.Util.isNumber(height) ? height : altitude;
        height = this.distanceToVector3(height, height).x;
        const amount = this.distanceToVector3(altitude, altitude).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        const config = { 'bevelEnabled': false, 'bevelSize': 1 };
        const name = parseInt(THREE.REVISION) >= 93 ? 'depth' : 'amount';
        config[name] = height;
        const geom = new THREE.ExtrudeGeometry(shape, config);
        const buffGeom = new THREE.BufferGeometry();
        buffGeom.fromGeometry(geom);
        const mesh = new THREE.Mesh(buffGeom, material);
        mesh.position.set(center.x, center.y, amount - height);
        return mesh;
    }


    /**
     *
     * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
     * @param {Object} options
     * @param {THREE.Material} material
     */
    toExtrudePolygon(polygon, options, material) {
        return new ExtrudePolygon(polygon, options, material, this);
    }


    /**
     *
     * @param {maptalks.Coordinate} coordinate
     * @param {Object} options
     * @param {THREE.Material} material
     */
    toBar(coordinate, options, material) {
        return new Bar(coordinate, options, material, this);
    }


    /**
    *
    * @param {maptalks.LineString} lineString
    * @param {Object} options
    * @param {THREE.LineMaterial} material
    */
    toLine(lineString, options, material) {
        return new Line(lineString, options, material, this);
    }


    /**
     *
     * @param {maptalks.LineString} lineString
     * @param {Object} options
     * @param {THREE.Material} material
     */
    toExtrudeLine(lineString, options, material) {
        return new ExtrudeLine(lineString, options, material, this);
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
     * add object3ds
     * @param {BaseObject} meshes
     */
    addMesh(meshes) {
        if (!meshes) return this;
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        const scene = this.getScene();
        meshes.forEach(mesh => {
            if (mesh instanceof BaseObject) {
                scene.add(mesh.getObject3d());
            } else if (mesh instanceof THREE.Object3D) {
                scene.add(mesh);
            }
        });
        this.renderScene();
        return this;
    }

    /**
     * remove object3ds
     * @param {BaseObject} meshes
     */
    removeMesh(meshes) {
        if (!meshes) return this;
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        const scene = this.getScene();
        meshes.forEach(mesh => {
            if (mesh instanceof BaseObject) {
                scene.remove(mesh.getObject3d());
            } else if (mesh instanceof THREE.Object3D) {
                scene.remove(mesh);
            }
        });
        this.renderScene();
        return this;
    }

    _initRaycaster() {
        if (!this._raycaster) {
            this._raycaster = new THREE.Raycaster();
            this._mouse = new THREE.Vector2();
        }
        return this;
    }

    /**
     *
     * @param {Coordinate} coordinate
     * @param {Object} options
     * @return {Array}
     */
    identify(coordinate, options) {
        if (!coordinate) {
            console.error('coordinate is null,it should be Coordinate');
            return [];
        }
        if (Array.isArray(coordinate)) {
            coordinate = new maptalks.Coordinate(coordinate);
        }
        if (!(coordinate instanceof maptalks.Coordinate)) {
            console.error('coordinate type is error,it should be Coordinate');
            return [];
        }
        const p = this.getMap().coordToContainerPoint(coordinate);
        const { x, y } = p;
        this._initRaycaster();
        const raycaster = this._raycaster,
            mouse = this._mouse,
            camera = this.getCamera(),
            scene = this.getScene(),
            size = this.getMap().getSize();
        const width = size.width,
            height = size.height;
        mouse.x = (x / width) * 2 - 1;
        mouse.y = -(y / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        //set linePrecision for THREE.Line
        raycaster.linePrecision = this._getLinePrecision(this.getMap().getResolution());
        const children = [];
        scene.children.forEach(mesh => {
            if (mesh.__parent && mesh.__parent.getOptions) {
                const interactive = mesh.__parent.getOptions().interactive;
                if (interactive) {
                    children.push(mesh);
                }
            } else if (mesh instanceof THREE.Mesh) {
                children.push(mesh);
            }
        });
        let baseObjects = [];
        const intersects = raycaster.intersectObjects(children, true);
        if (intersects && Array.isArray(intersects) && intersects.length) {
            baseObjects = intersects.map(intersect => {
                return intersect.object.__parent || intersect.object;
            });
        }
        options = maptalks.Util.extend({}, options);
        const count = options.count;
        return (maptalks.Util.isNumber(count) && count > 0 ? baseObjects.slice(0, count) : baseObjects);
    }

    //get Line Precision by Resolution
    _getLinePrecision(res = 10) {
        for (let i = 0, len = LINEPRECISIONS.length; i < len; i++) {
            const [resLevel, precision] = LINEPRECISIONS[i];
            if (res > resLevel) {
                return precision;
            }
        }
        return 0.01;
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

    createCanvas() {
        super.createCanvas();
        this.createContext();
    }

    createContext() {
        if (this.canvas.gl && this.canvas.gl.wrap) {
            this.gl = this.canvas.gl.wrap();
        } else {
            const layer = this.layer;
            const attributes = layer.options.glOptions || {
                alpha: true,
                depth: true,
                antialias: true,
                stencil: true
            };
            attributes.preserveDrawingBuffer = true;
            this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        }
        this._initThreeRenderer();
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
    }

    _initThreeRenderer() {
        const renderer = new THREE.WebGLRenderer({ 'context': this.gl, alpha: true });
        renderer.autoClear = false;
        renderer.setClearColor(new THREE.Color(1, 1, 1), 0);
        renderer.setSize(this.canvas.width, this.canvas.height);
        renderer.clear();
        renderer.canvas = this.canvas;
        this.context = renderer;

        const scene = this.scene = new THREE.Scene();
        const map = this.layer.getMap();
        const fov = map.getFov() * Math.PI / 180;
        const camera = this.camera = new THREE.PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
        camera.matrixAutoUpdate = false;
        this._syncCamera();
        scene.add(camera);
    }

    onCanvasCreate() {
        super.onCanvasCreate();

    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        let size;
        if (!canvasSize) {
            size = this.getMap().getSize();
        } else {
            size = canvasSize;
        }
        const r = maptalks.Browser.retina ? 2 : 1;
        const canvas = this.canvas;
        //retina support
        canvas.height = r * size['height'];
        canvas.width = r * size['width'];
        this.context.setSize(canvas.width, canvas.height);
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
        this.layer.fire('renderstart', { 'context': this.context });
        return null;
    }

    renderScene() {
        this._syncCamera();
        this.context.render(this.scene, this.camera);
        this.completeRender();
    }

    remove() {
        delete this._drawContext;
        super.remove();
    }

    _syncCamera() {
        const map = this.getMap();
        this.camera.matrix.elements = map.cameraWorldMatrix;
        this.camera.projectionMatrix.elements = map.projMatrix;
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }
}

ThreeLayer.registerRenderer('gl', ThreeRenderer);

function getTargetZoom(map) {
    return map.getGLZoom();
}
