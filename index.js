import * as maptalks from 'maptalks';
import THREE from 'three';

const options = {
    'renderWhenPanning' : true,
    'camera'   : 'perspective', //orth, perspective
    'renderer' : 'webgl',
    'doubleBuffer' : true,
    'glOptions' : null
};

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
        const p = map.coordinateToPoint(coordinate, map.getMaxZoom());
        return new THREE.Vector3(p.x, p.y, z);
    }

    redraw() {
        super.redraw();
    }

    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @param {Number} [z=0] z value
     * @return {THREE.Vector3}
     */
    distanceToVector3(w, h, z = 0) {
        const map = this.getMap();
        const scale = map.getScale();
        const size = map.distanceToPixel(w, h)._multi(scale);
        return new THREE.Vector3(size.width, size.height, z);
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


    toExtrudeGeometry(polygon, amount, material, removeDup) {
        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(c => this.toExtrudeGeometry(c, amount, material));
        }
        if (removeDup) {
            const rings = polygon.getCoordinates();
            rings.forEach( ring => {
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
        const mesh = new THREE.Mesh(geom, material);
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
}

ThreeLayer.mergeOptions(options);

export class ThreeRenderer extends maptalks.renderer.CanvasLayerRenderer {

    hitDetect() {
        return false;
    }

    createCanvas() {
        if (this.canvas) {
            return;
        }
        const map = this.getMap();
        const size = map.getSize();
        const r = maptalks.Browser.retina ? 2 : 1;
        this.canvas = maptalks.Canvas.createCanvas(r * size['width'], r * size['height']);
        const renderer = this.layer.options['renderer'];
        var gl;
        if (renderer === 'webgl') {
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
        const maxScale = map.getScale(map.getMinZoom()) / map.getScale(map.getMaxZoom());
        // scene
        const scene = this.scene = new THREE.Scene();
        //TODO can be orth or perspective camera
        const camera = this.camera =  new THREE.PerspectiveCamera(90, size.width / size.height, 1, maxScale * 10000);
        this.onCanvasCreate();
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
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

    draw() {
        this.prepareCanvas();
        // this._locateCamera();
        if (!this._predrawed) {
            this._drawContext = this.layer.prepareToDraw(this.context, this.scene, this. camera);
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
        }
        this._drawLayer();
    }

    _drawLayer() {
        var args = [this.context, this.scene, this.camera];
        args.push.apply(args, this._drawContext);
        this.layer.draw.apply(this.layer, args);
        this.renderScene();
        this.play();
    }

    renderScene() {
        this._locateCamera();
        // this.context.clear();
        this.context.render(this.scene, this.camera);
        this.completeRender();
    }

    remove() {
        delete this._drawContext;
        super.remove();
    }

    onZoomStart(param) {
        this.layer.onZoomStart(this.scene, this.camera, param);
        super.onZoomStart(param);
    }

    onZoomEnd(param) {
        this.layer.onZoomEnd(this.scene, this.camera, param);
        super.onZoomEnd(param);
    }

    onMoveStart(param) {
        this.layer.onMoveStart(this.scene, this.camera, param);
        super.onMoveStart(param);
    }

    onMoving(param) {
        if (this.layer.options['renderWhenPanning']) {
            this.prepareRender();
            this.draw();
        }
        // super.onMoving(param);
    }

    onMoveEnd(param) {
        this.layer.onMoveEnd(this.scene, this.camera, param);
        super.onMoveEnd(param);
    }

    onResize(param) {
        this.layer.onResize(this.scene, this.camera, param);
        super.onResize(param);
    }

    _locateCamera() {
        const map = this.getMap();
        const fullExtent = map.getFullExtent();
        const size = map.getSize();
        const scale = map.getScale();
        const camera = this.camera;
        const center = map.getCenter();
        const center2D = map.coordinateToPoint(center, map.getMaxZoom());
        const z = scale * size.height / 2;
        camera.position.set(center2D.x, center2D.y, -z);
        camera.up.set(0, (fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1), 0);
        camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
        this.camera.updateProjectionMatrix();
    }
}

ThreeLayer.registerRenderer('canvas', ThreeRenderer);
ThreeLayer.registerRenderer('webgl', ThreeRenderer);
