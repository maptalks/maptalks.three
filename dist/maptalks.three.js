/*!
 * maptalks.three v0.5.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
/*!
 * requires maptalks@>=0.36.2 
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks'), require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks', 'three'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks,global.THREE));
}(this, (function (exports,maptalks,THREE) { 'use strict';

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var options = {
    'renderer': 'gl',
    'doubleBuffer': true,
    'glOptions': null
};

var RADIAN = Math.PI / 180;

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
var ThreeLayer = function (_maptalks$CanvasLayer) {
    _inherits(ThreeLayer, _maptalks$CanvasLayer);

    function ThreeLayer() {
        _classCallCheck(this, ThreeLayer);

        return _possibleConstructorReturn(this, _maptalks$CanvasLayer.apply(this, arguments));
    }

    /**
     * Draw method of ThreeLayer
     * In default, it calls renderScene, refresh the camera and the scene
     */
    ThreeLayer.prototype.draw = function draw() {
        this.renderScene();
    };

    /**
     * Draw method of ThreeLayer when map is interacting
     * In default, it calls renderScene, refresh the camera and the scene
     */


    ThreeLayer.prototype.drawOnInteracting = function drawOnInteracting() {
        this.renderScene();
    };
    /**
     * Convert a geographic coordinate to THREE Vector3
     * @param  {maptalks.Coordinate} coordinate - coordinate
     * @param {Number} [z=0] z value
     * @return {THREE.Vector3}
     */


    ThreeLayer.prototype.coordinateToVector3 = function coordinateToVector3(coordinate) {
        var z = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var map = this.getMap();
        if (!map) {
            return null;
        }
        var p = map.coordinateToPoint(coordinate, getTargetZoom(map));
        return new THREE.Vector3(p.x, p.y, -z);
    };

    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @return {THREE.Vector3}
     */


    ThreeLayer.prototype.distanceToVector3 = function distanceToVector3(w, h, coord) {
        var map = this.getMap();
        var zoom = getTargetZoom(map),
            center = coord || map.getCenter(),
            target = map.locate(center, w, h);
        var p0 = map.coordinateToPoint(center, zoom),
            p1 = map.coordinateToPoint(target, zoom);
        var x = Math.abs(p1.x - p0.x) * maptalks.Util.sign(w);
        var y = Math.abs(p1.y - p0.y) * maptalks.Util.sign(h);
        return new THREE.Vector3(x, y, 0);
    };

    /**
     * Convert a Polygon or a MultiPolygon to THREE shape
     * @param  {maptalks.Polygon|maptalks.MultiPolygon} polygon - polygon or multipolygon
     * @return {THREE.Shape}
     */


    ThreeLayer.prototype.toShape = function toShape(polygon) {
        var _this2 = this;

        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return _this2.toShape(c);
            });
        }
        var center = polygon.getCenter();
        var centerPt = this.coordinateToVector3(center);
        var shell = polygon.getShell();
        var outer = shell.map(function (c) {
            return _this2.coordinateToVector3(c).sub(centerPt);
        });
        var shape = new THREE.Shape(outer);
        var holes = polygon.getHoles();

        if (holes && holes.length > 0) {
            shape.holes = holes.map(function (item) {
                var pts = item.map(function (c) {
                    return _this2.coordinateToVector3(c).sub(centerPt);
                });
                return new THREE.Shape(pts);
            });
        }

        return shape;
    };

    ThreeLayer.prototype.toExtrudeMesh = function toExtrudeMesh(polygon, amount, material, removeDup) {
        var _this3 = this;

        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return _this3.toExtrudeGeometry(c, amount, material);
            });
        }
        if (removeDup) {
            var rings = polygon.getCoordinates();
            rings.forEach(function (ring) {
                var length = ring.length;
                for (var i = length - 1; i >= 1; i--) {
                    if (ring[i].equals(ring[i - 1])) {
                        ring.splice(i, 1);
                    }
                }
            });
            polygon.setCoordinates(rings);
        }
        var shape = this.toShape(polygon);
        var center = this.coordinateToVector3(polygon.getCenter());
        amount = this.distanceToVector3(amount, amount).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var geom = new THREE.ExtrudeGeometry(shape, { 'amount': amount, 'bevelEnabled': true });
        var buffGeom = new THREE.BufferGeometry();
        buffGeom.fromGeometry(geom);
        var mesh = new THREE.Mesh(buffGeom, material);
        mesh.position.set(center.x, center.y, -amount);
        return mesh;
    };

    ThreeLayer.prototype.clearMesh = function clearMesh() {
        var scene = this.getScene();
        if (!scene) {
            return this;
        }
        for (var i = scene.children.length - 1; i >= 0; i--) {
            if (scene.children[i] instanceof THREE.Mesh) {
                scene.remove(scene.children[i]);
            }
        }
        return this;
    };

    ThreeLayer.prototype.lookAt = function lookAt(vector) {
        var renderer$$1 = this._getRenderer();
        if (renderer$$1) {
            renderer$$1.context.lookAt(vector);
        }
        return this;
    };

    ThreeLayer.prototype.getCamera = function getCamera() {
        var renderer$$1 = this._getRenderer();
        if (renderer$$1) {
            return renderer$$1.camera;
        }
        return null;
    };

    ThreeLayer.prototype.getScene = function getScene() {
        var renderer$$1 = this._getRenderer();
        if (renderer$$1) {
            return renderer$$1.scene;
        }
        return null;
    };

    ThreeLayer.prototype.renderScene = function renderScene() {
        var renderer$$1 = this._getRenderer();
        if (renderer$$1) {
            return renderer$$1.renderScene();
        }
        return this;
    };

    ThreeLayer.prototype.getThreeRenderer = function getThreeRenderer() {
        var renderer$$1 = this._getRenderer();
        if (renderer$$1) {
            return renderer$$1.context;
        }
        return null;
    };

    /**
     * To make map's 2d point's 1 pixel euqal with 1 pixel on XY plane in THREE's scene:
     * 1. fov is 90 and camera's z is height / 2 * scale,
     * 2. if fov is not 90, a ratio is caculated to transfer z to the equivalent when fov is 90
     * @return {Number} fov ratio on z axis
     */


    ThreeLayer.prototype._getFovRatio = function _getFovRatio() {
        var map = this.getMap();
        var fov = map.getFov();
        return Math.tan(fov / 2 * RADIAN);
    };

    return ThreeLayer;
}(maptalks.CanvasLayer);

ThreeLayer.mergeOptions(options);

var ThreeRenderer = function (_maptalks$renderer$Ca) {
    _inherits(ThreeRenderer, _maptalks$renderer$Ca);

    function ThreeRenderer() {
        _classCallCheck(this, ThreeRenderer);

        return _possibleConstructorReturn(this, _maptalks$renderer$Ca.apply(this, arguments));
    }

    ThreeRenderer.prototype.getPrepareParams = function getPrepareParams() {
        return [this.scene, this.camera];
    };

    ThreeRenderer.prototype.getDrawParams = function getDrawParams() {
        return [this.scene, this.camera];
    };

    ThreeRenderer.prototype._drawLayer = function _drawLayer() {
        _maptalks$renderer$Ca.prototype._drawLayer.apply(this, arguments);
        this.renderScene();
    };

    ThreeRenderer.prototype.hitDetect = function hitDetect() {
        return false;
    };

    ThreeRenderer.prototype.createCanvas = function createCanvas() {
        if (this.canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = maptalks.Browser.retina ? 2 : 1,
            w = r * size.width,
            h = r * size.height;
        if (this.layer._canvas) {
            var canvas = this.layer._canvas;
            canvas.width = w;
            canvas.height = h;
            if (canvas.style) {
                canvas.style.width = size.width + 'px';
                canvas.style.height = size.height + 'px';
            }
            this.canvas = this.layer._canvas;
        } else {
            this.canvas = maptalks.Canvas.createCanvas(w, h);
        }
        this._initThreeRenderer();
        this.onCanvasCreate();

        this.layer.fire('canvascreate', {
            'context': this.context,
            'gl': this.gl
        });
    };

    ThreeRenderer.prototype._initThreeRenderer = function _initThreeRenderer() {
        var map = this.getMap();
        var size = map.getSize();
        var renderer$$1 = this.layer.options['renderer'];
        var gl;
        if (renderer$$1 === 'gl') {
            gl = new THREE.WebGLRenderer(maptalks.Util.extend({
                'canvas': this.canvas,
                'alpha': true,
                'preserveDrawingBuffer': true
            }, this.layer.options['glOptions']));
            gl.autoClear = false;
            gl.clear();
        } else if (renderer$$1 === 'canvas') {
            gl = new THREE.CanvasRenderer(maptalks.Util.extend({
                'canvas': this.canvas,
                'alpha': true
            }, this.layer.options['glOptions']));
        }
        gl.setSize(this.canvas.width, this.canvas.height);
        gl.setClearColor(new THREE.Color(1, 1, 1), 0);
        gl.canvas = this.canvas;
        this.context = gl;
        var maxScale = map.getScale(map.getMinZoom()) / map.getScale(getTargetZoom(map));
        var farZ = maxScale * size.height / 2 / this.layer._getFovRatio();
        // scene
        var scene = this.scene = new THREE.Scene();
        var fov = map.getFov();
        var camera = this.camera = new THREE.PerspectiveCamera(fov, size.width / size.height, 1, farZ);
        scene.add(camera);
    };

    ThreeRenderer.prototype.onCanvasCreate = function onCanvasCreate() {
        _maptalks$renderer$Ca.prototype.onCanvasCreate.call(this);
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
    };

    ThreeRenderer.prototype.resizeCanvas = function resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        var size;
        if (!canvasSize) {
            size = this.getMap().getSize();
        } else {
            size = canvasSize;
        }
        var r = maptalks.Browser.retina ? 2 : 1;
        //retina support
        this.canvas.height = r * size['height'];
        this.canvas.width = r * size['width'];
        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();
        this.context.setSize(this.canvas.width, this.canvas.height);
    };

    ThreeRenderer.prototype.clearCanvas = function clearCanvas() {
        if (!this.canvas) {
            return;
        }

        this.context.clear();
    };

    ThreeRenderer.prototype.prepareCanvas = function prepareCanvas() {
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        this.layer.fire('renderstart', { 'context': this.context });
        return null;
    };

    ThreeRenderer.prototype.renderScene = function renderScene() {
        this._locateCamera();
        this.context.render(this.scene, this.camera);
        this.completeRender();
    };

    ThreeRenderer.prototype.remove = function remove() {
        delete this._drawContext;
        _maptalks$renderer$Ca.prototype.remove.call(this);
    };

    ThreeRenderer.prototype._locateCamera = function _locateCamera() {
        var map = this.getMap();
        var size = map.getSize();
        var scale = map.getScale();
        var camera = this.camera;
        // 1. camera is always looking at map's center
        // 2. camera's distance from map's center doesn't change when rotating and tilting.
        var center2D = map.coordinateToPoint(map.getCenter(), getTargetZoom(map));
        var pitch = map.getPitch() * RADIAN;
        var bearing = map.getBearing() * RADIAN;

        var ratio = this.layer._getFovRatio();
        var z = -scale * size.height / 2 / ratio;

        // when map tilts, camera's position should be lower in Z axis
        camera.position.z = z * Math.cos(pitch);
        // and [dist] away from map's center on XY plane to tilt the scene.
        var dist = Math.sin(pitch) * z;
        // when map rotates, the camera's xy position is rotating with the given bearing and still keeps [dist] away from map's center
        camera.position.x = center2D.x + dist * Math.sin(bearing);
        camera.position.y = center2D.y - dist * Math.cos(bearing);

        // when map rotates, camera's up axis is pointing to south direction of map
        camera.up.set(Math.sin(bearing), -Math.cos(bearing), 0);

        // look at to the center of map
        camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
        camera.updateProjectionMatrix();
    };

    return ThreeRenderer;
}(maptalks.renderer.CanvasLayerRenderer);

ThreeLayer.registerRenderer('canvas', ThreeRenderer);
ThreeLayer.registerRenderer('gl', ThreeRenderer);

function getTargetZoom(map) {
    return map.getMaxNativeZoom();
}

exports.ThreeLayer = ThreeLayer;
exports.ThreeRenderer = ThreeRenderer;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('maptalks.three v0.5.0, requires maptalks@>=0.36.2.');

})));
