/*!
 * maptalks.three v0.6.1
 * LICENSE : MIT
 * (c) 2016-2018 maptalks.org
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks'), require('three')) :
  typeof define === 'function' && define.amd ? define(['exports', 'maptalks', 'three'], factory) :
  (factory((global.maptalks = global.maptalks || {}),global.maptalks,global.THREE));
}(this, (function (exports,maptalks,THREE) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  var options = {
    'renderer': 'gl',
    'doubleBuffer': false,
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

  var ThreeLayer =
  /*#__PURE__*/
  function (_maptalks$CanvasLayer) {
    _inheritsLoose(ThreeLayer, _maptalks$CanvasLayer);

    function ThreeLayer() {
      return _maptalks$CanvasLayer.apply(this, arguments) || this;
    }

    var _proto = ThreeLayer.prototype;

    /**
     * Draw method of ThreeLayer
     * In default, it calls renderScene, refresh the camera and the scene
     */
    _proto.draw = function draw() {
      this.renderScene();
    };
    /**
     * Draw method of ThreeLayer when map is interacting
     * In default, it calls renderScene, refresh the camera and the scene
     */


    _proto.drawOnInteracting = function drawOnInteracting() {
      this.renderScene();
    };
    /**
     * Convert a geographic coordinate to THREE Vector3
     * @param  {maptalks.Coordinate} coordinate - coordinate
     * @param {Number} [z=0] z value
     * @return {THREE.Vector3}
     */


    _proto.coordinateToVector3 = function coordinateToVector3(coordinate, z) {
      if (z === void 0) {
        z = 0;
      }

      var map = this.getMap();

      if (!map) {
        return null;
      }

      var p = map.coordinateToPoint(coordinate, getTargetZoom(map));
      return new THREE.Vector3(p.x, p.y, z);
    };
    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @return {THREE.Vector3}
     */


    _proto.distanceToVector3 = function distanceToVector3(w, h, coord) {
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


    _proto.toShape = function toShape(polygon) {
      var _this = this;

      if (!polygon) {
        return null;
      }

      if (polygon instanceof maptalks.MultiPolygon) {
        return polygon.getGeometries().map(function (c) {
          return _this.toShape(c);
        });
      }

      var center = polygon.getCenter();
      var centerPt = this.coordinateToVector3(center);
      var shell = polygon.getShell();
      var outer = shell.map(function (c) {
        return _this.coordinateToVector3(c).sub(centerPt);
      }).reverse();
      var shape = new THREE.Shape(outer);
      var holes = polygon.getHoles();

      if (holes && holes.length > 0) {
        shape.holes = holes.map(function (item) {
          var pts = item.map(function (c) {
            return _this.coordinateToVector3(c).sub(centerPt);
          });
          return new THREE.Shape(pts);
        });
      }

      return shape;
    };

    _proto.toExtrudeMesh = function toExtrudeMesh(polygon, altitude, material, height) {
      var _this2 = this;

      if (!polygon) {
        return null;
      }

      if (polygon instanceof maptalks.MultiPolygon) {
        return polygon.getGeometries().map(function (c) {
          return _this2.toExtrudeGeometry(c, altitude, material, height);
        });
      }

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
      var shape = this.toShape(polygon);
      var center = this.coordinateToVector3(polygon.getCenter());
      height = maptalks.Util.isNumber(height) ? height : altitude;
      height = this.distanceToVector3(height, height).x;
      var amount = this.distanceToVector3(altitude, altitude).x; //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

      var config = {
        'bevelEnabled': false,
        'bevelSize': 1
      };
      var name = parseInt(THREE.REVISION) >= 93 ? 'depth' : 'amount';
      config[name] = height;
      var geom = new THREE.ExtrudeGeometry(shape, config);
      var buffGeom = new THREE.BufferGeometry();
      buffGeom.fromGeometry(geom);
      var mesh = new THREE.Mesh(geom, material);
      mesh.position.set(center.x, center.y, amount - height);
      return mesh;
    };

    _proto.clearMesh = function clearMesh() {
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

    _proto.lookAt = function lookAt(vector) {
      var renderer = this._getRenderer();

      if (renderer) {
        renderer.context.lookAt(vector);
      }

      return this;
    };

    _proto.getCamera = function getCamera() {
      var renderer = this._getRenderer();

      if (renderer) {
        return renderer.camera;
      }

      return null;
    };

    _proto.getScene = function getScene() {
      var renderer = this._getRenderer();

      if (renderer) {
        return renderer.scene;
      }

      return null;
    };

    _proto.renderScene = function renderScene() {
      var renderer = this._getRenderer();

      if (renderer) {
        return renderer.renderScene();
      }

      return this;
    };

    _proto.getThreeRenderer = function getThreeRenderer() {
      var renderer = this._getRenderer();

      if (renderer) {
        return renderer.context;
      }

      return null;
    };
    /**
     * To make map's 2d point's 1 pixel euqal with 1 pixel on XY plane in THREE's scene:
     * 1. fov is 90 and camera's z is height / 2 * scale,
     * 2. if fov is not 90, a ratio is caculated to transfer z to the equivalent when fov is 90
     * @return {Number} fov ratio on z axis
     */


    _proto._getFovRatio = function _getFovRatio() {
      var map = this.getMap();
      var fov = map.getFov();
      return Math.tan(fov / 2 * RADIAN);
    };

    return ThreeLayer;
  }(maptalks.CanvasLayer);
  ThreeLayer.mergeOptions(options);
  var ThreeRenderer =
  /*#__PURE__*/
  function (_maptalks$renderer$Ca) {
    _inheritsLoose(ThreeRenderer, _maptalks$renderer$Ca);

    function ThreeRenderer() {
      return _maptalks$renderer$Ca.apply(this, arguments) || this;
    }

    var _proto2 = ThreeRenderer.prototype;

    _proto2.getPrepareParams = function getPrepareParams() {
      return [this.scene, this.camera];
    };

    _proto2.getDrawParams = function getDrawParams() {
      return [this.scene, this.camera];
    };

    _proto2._drawLayer = function _drawLayer() {
      _maptalks$renderer$Ca.prototype._drawLayer.apply(this, arguments);

      this.renderScene();
    };

    _proto2.hitDetect = function hitDetect() {
      return false;
    };

    _proto2.createCanvas = function createCanvas() {
      _maptalks$renderer$Ca.prototype.createCanvas.call(this);

      this.createContext();
    };

    _proto2.createContext = function createContext() {
      if (this.canvas.gl && this.canvas.gl.wrap) {
        this.gl = this.canvas.gl.wrap();
      } else {
        var layer = this.layer;
        var attributes = layer.options.glOptions || {
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
    };

    _proto2._initThreeRenderer = function _initThreeRenderer() {
      var renderer = new THREE.WebGLRenderer({
        'context': this.gl,
        alpha: true
      });
      renderer.autoClear = false;
      renderer.setClearColor(new THREE.Color(1, 1, 1), 0);
      renderer.setSize(this.canvas.width, this.canvas.height);
      renderer.clear();
      renderer.canvas = this.canvas;
      this.context = renderer;
      var scene = this.scene = new THREE.Scene();
      var map = this.layer.getMap();
      var fov = map.getFov() * Math.PI / 180;
      var camera = this.camera = new THREE.PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
      camera.matrixAutoUpdate = false;

      this._syncCamera();

      scene.add(camera);
    };

    _proto2.onCanvasCreate = function onCanvasCreate() {
      _maptalks$renderer$Ca.prototype.onCanvasCreate.call(this);
    };

    _proto2.resizeCanvas = function resizeCanvas(canvasSize) {
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
      var canvas = this.canvas; //retina support

      canvas.height = r * size['height'];
      canvas.width = r * size['width'];
      this.context.setSize(canvas.width, canvas.height);
    };

    _proto2.clearCanvas = function clearCanvas() {
      if (!this.canvas) {
        return;
      }

      this.context.clear();
    };

    _proto2.prepareCanvas = function prepareCanvas() {
      if (!this.canvas) {
        this.createCanvas();
      } else {
        this.clearCanvas();
      }

      this.layer.fire('renderstart', {
        'context': this.context
      });
      return null;
    };

    _proto2.renderScene = function renderScene() {
      this._syncCamera();

      this.context.render(this.scene, this.camera);
      this.completeRender();
    };

    _proto2.remove = function remove() {
      delete this._drawContext;

      _maptalks$renderer$Ca.prototype.remove.call(this);
    };

    _proto2._syncCamera = function _syncCamera() {
      var map = this.getMap();
      this.camera.matrix.elements = map.cameraWorldMatrix;
      this.camera.projectionMatrix.elements = map.projMatrix;
    };

    _proto2._createGLContext = function _createGLContext(canvas, options) {
      var names = ['webgl', 'experimental-webgl'];
      var context = null;
      /* eslint-disable no-empty */

      for (var i = 0; i < names.length; ++i) {
        try {
          context = canvas.getContext(names[i], options);
        } catch (e) {}

        if (context) {
          break;
        }
      }

      return context;
      /* eslint-enable no-empty */
    };

    return ThreeRenderer;
  }(maptalks.renderer.CanvasLayerRenderer);
  ThreeLayer.registerRenderer('gl', ThreeRenderer);

  function getTargetZoom(map) {
    return map.getGLZoom();
  }

  exports.ThreeLayer = ThreeLayer;
  exports.ThreeRenderer = ThreeRenderer;

  Object.defineProperty(exports, '__esModule', { value: true });

  typeof console !== 'undefined' && console.log('maptalks.three v0.6.1, requires maptalks@>=0.39.0.');

})));
