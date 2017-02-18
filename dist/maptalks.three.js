/*!
 * maptalks.three v0.1.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks'), require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks', 'three'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks,global.THREE));
}(this, (function (exports,maptalks,THREE) { 'use strict';

THREE = 'default' in THREE ? THREE['default'] : THREE;

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var options = {
    'renderWhenPanning': true,
    'camera': 'perspective', //orth, perspective
    'renderer': 'webgl',
    'doubleBuffer': true,
    'glOptions': null
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
var ThreeLayer = function (_maptalks$CanvasLayer) {
    _inherits(ThreeLayer, _maptalks$CanvasLayer);

    function ThreeLayer() {
        _classCallCheck(this, ThreeLayer);

        return _possibleConstructorReturn(this, _maptalks$CanvasLayer.apply(this, arguments));
    }

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
        var p = map.coordinateToPoint(coordinate, map.getMaxZoom());
        return new THREE.Vector3(p.x, p.y, z);
    };

    ThreeLayer.prototype.redraw = function redraw() {
        _maptalks$CanvasLayer.prototype.redraw.call(this);
    };

    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @param {Number} [z=0] z value
     * @return {THREE.Vector3}
     */


    ThreeLayer.prototype.distanceToVector3 = function distanceToVector3(w, h) {
        var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        var map = this.getMap();
        var scale = map.getScale();
        var size = map.distanceToPixel(w, h)._multi(scale);
        return new THREE.Vector3(size.width, size.height, z);
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

    ThreeLayer.prototype.toExtrudeGeometry = function toExtrudeGeometry(polygon, amount, material) {
        var _this3 = this;

        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(function (c) {
                return _this3.toExtrudeGeometry(c, amount, material);
            });
        }
        var shape = this.toShape(polygon);
        var center = this.coordinateToVector3(polygon.getCenter());
        amount = this.distanceToVector3(amount, amount).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var geom = new THREE.ExtrudeGeometry(shape, { 'amount': amount, 'bevelEnabled': true });
        var mesh = new THREE.Mesh(geom, material);
        // mesh.translateZ(-amount - 1);
        // mesh.translateX(center.x);
        // mesh.translateY(center.y);
        mesh.position.set(center.x, center.y, -amount);
        return mesh;
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

    return ThreeLayer;
}(maptalks.CanvasLayer);

ThreeLayer.mergeOptions(options);

var ThreeRenderer = function (_maptalks$renderer$Ca) {
    _inherits(ThreeRenderer, _maptalks$renderer$Ca);

    function ThreeRenderer() {
        _classCallCheck(this, ThreeRenderer);

        return _possibleConstructorReturn(this, _maptalks$renderer$Ca.apply(this, arguments));
    }

    ThreeRenderer.prototype.hitDetect = function hitDetect() {
        return false;
    };

    ThreeRenderer.prototype.createCanvas = function createCanvas() {
        if (this.canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = maptalks.Browser.retina ? 2 : 1;
        this.canvas = maptalks.Canvas.createCanvas(r * size['width'], r * size['height']);
        var renderer$$1 = this.layer.options['renderer'];
        var gl;
        if (renderer$$1 === 'webgl') {
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
        var maxScale = map.getScale(map.getMinZoom()) / map.getScale(map.getMaxZoom());
        // scene
        var scene = this.scene = new THREE.Scene();
        //TODO can be orth or perspective camera
        var camera = this.camera = new THREE.PerspectiveCamera(90, size.width / size.height, 1, maxScale * 10000);
        this.onCanvasCreate();
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
        scene.add(camera);
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

    ThreeRenderer.prototype.draw = function draw() {
        this.prepareCanvas();
        // this._locateCamera();
        if (!this._predrawed) {
            this._drawContext = this.layer.prepareToDraw(this.context, this.scene, this.camera);
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
        }
        this._drawLayer();
    };

    ThreeRenderer.prototype._drawLayer = function _drawLayer() {
        var args = [this.context, this.scene, this.camera];
        args.push.apply(args, this._drawContext);
        this.layer.draw.apply(this.layer, args);
        this.renderScene();
        this.play();
    };

    ThreeRenderer.prototype.renderScene = function renderScene() {
        this._locateCamera();
        // this.context.clear();
        this.context.render(this.scene, this.camera);
        this.completeRender();
    };

    ThreeRenderer.prototype.remove = function remove() {
        delete this._drawContext;
        _maptalks$renderer$Ca.prototype.remove.call(this);
    };

    ThreeRenderer.prototype.onZoomStart = function onZoomStart(param) {
        this.layer.onZoomStart(this.scene, this.camera, param);
        _maptalks$renderer$Ca.prototype.onZoomStart.call(this, param);
    };

    ThreeRenderer.prototype.onZoomEnd = function onZoomEnd(param) {
        this.layer.onZoomEnd(this.scene, this.camera, param);
        _maptalks$renderer$Ca.prototype.onZoomEnd.call(this, param);
    };

    ThreeRenderer.prototype.onMoveStart = function onMoveStart(param) {
        this.layer.onMoveStart(this.scene, this.camera, param);
        _maptalks$renderer$Ca.prototype.onMoveStart.call(this, param);
    };

    ThreeRenderer.prototype.onMoving = function onMoving(param) {
        if (this.layer.options['renderWhenPanning']) {
            this.prepareRender();
            this.draw();
        }
        // super.onMoving(param);
    };

    ThreeRenderer.prototype.onMoveEnd = function onMoveEnd(param) {
        this.layer.onMoveEnd(this.scene, this.camera, param);
        _maptalks$renderer$Ca.prototype.onMoveEnd.call(this, param);
    };

    ThreeRenderer.prototype.onResize = function onResize(param) {
        this.layer.onResize(this.scene, this.camera, param);
        _maptalks$renderer$Ca.prototype.onResize.call(this, param);
    };

    ThreeRenderer.prototype._locateCamera = function _locateCamera() {
        var map = this.getMap();
        var fullExtent = map.getFullExtent();
        var size = map.getSize();
        var scale = map.getScale();
        var camera = this.camera;
        var center = map.getCenter();
        var center2D = map.coordinateToPoint(center, map.getMaxZoom());
        var z = scale * size.height / 2;
        camera.position.set(center2D.x, center2D.y, -z);
        camera.up.set(0, fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1, 0);
        camera.lookAt(new THREE.Vector3(center2D.x, center2D.y, 0));
        this.camera.updateProjectionMatrix();
    };

    return ThreeRenderer;
}(maptalks.renderer.CanvasLayerRenderer);

ThreeLayer.registerRenderer('canvas', ThreeRenderer);
ThreeLayer.registerRenderer('webgl', ThreeRenderer);

exports.ThreeLayer = ThreeLayer;
exports.ThreeRenderer = ThreeRenderer;

Object.defineProperty(exports, '__esModule', { value: true });

})));
