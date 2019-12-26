/*!
 * maptalks.three v0.7.0
 * LICENSE : MIT
 * (c) 2016-2019 maptalks.org
 */
import { Coordinate, Util, MultiPolygon, CanvasLayer, Browser, renderer, ui, animation, Eventable, LineString, Polygon } from 'maptalks';
import { Matrix4, Vector3, Shape, REVISION, ExtrudeGeometry, BufferGeometry, Mesh, Object3D, Raycaster, Vector2, Group, Scene, WebGLRenderer, Color, PerspectiveCamera, Material, Line, Points, LineSegments, VertexColors, Float32BufferAttribute, BufferAttribute, BufferGeometryUtils, Geometry, CylinderBufferGeometry, Uint32BufferAttribute } from 'three';

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

var ToolTip =
/*#__PURE__*/
function (_maptalks$ui$ToolTip) {
  _inheritsLoose(ToolTip, _maptalks$ui$ToolTip);

  function ToolTip() {
    return _maptalks$ui$ToolTip.apply(this, arguments) || this;
  }

  var _proto = ToolTip.prototype;

  /**
  * Adds the UI Component to a BaseObject
  * @param {BaseObject} owner - BaseObject to add.
  * @returns {UIComponent} this
  * @fires UIComponent#add
  */
  _proto.addTo = function addTo(owner) {
    if (owner instanceof BaseObject$$1) {
      owner.on('mousemove', this.onMouseMove, this);
      owner.on('mouseout', this.onMouseOut, this);
      this._owner = owner; // first time

      this._switchEvents('on');

      if (this.onAdd) {
        this.onAdd();
      }
      /**
       * add event.
       *
       * @event ui.UIComponent#add
       * @type {Object}
       * @property {String} type - add
       * @property {ui.UIComponent} target - UIComponent
       */


      this.fire('add');
      return this;
    } else {
      throw new Error('Invalid BaseObject the tooltip is added to.');
    }
  };

  return ToolTip;
}(ui.ToolTip);

var OPTIONS = {
  interactive: true,
  altitude: 0,
  minZoom: 0,
  maxZoom: 30
};
/**
 * a Class for Eventable
 */

var Base = function Base() {};
/**
 * EVENTS=[
 *  'add',
 *  'remove',
    'mousemove',
    'click',
    'mousedown',
    'mouseup',
    'dblclick',
    'contextmenu',
    'touchstart',
    'touchmove',
    'touchend',
    'mouseover',
    'mouseout',
    'idchange',
    'propertieschange',
    'show',
    'hide',
    'symbolchange'
     empty
];
 * This is the base class for all 3D objects
 *
 *
 * Its function and maptalks.geometry are as similar as possible
 *
 * maptalks.Eventable(Base) return a Class  https://github.com/maptalks/maptalks.js/blob/master/src/core/Eventable.js
 *
 */


var BaseObject$$1 =
/*#__PURE__*/
function (_maptalks$Eventable) {
  _inheritsLoose(BaseObject$$1, _maptalks$Eventable);

  function BaseObject$$1(id) {
    var _this;

    _this = _maptalks$Eventable.call(this) || this;
    _this.isBaseObject = true;
    _this.isAdd = false;
    _this.object3d = null;
    _this.options = {};
    _this.toolTip = null;
    _this.infoWindow = null;
    _this._mouseover = false;
    _this._showPlayer = null;

    if (id === undefined) {
      id = Util.GUID();
    }

    _this.id = id;
    return _this;
  }

  var _proto = BaseObject$$1.prototype;

  _proto.addTo = function addTo(layer) {
    if (layer instanceof ThreeLayer) {
      layer.addMesh(this);
    } else {
      console.error('layer only support maptalks.ThreeLayer');
    }

    return this;
  };

  _proto.remove = function remove() {
    var layer = this.getLayer();

    if (layer) {
      layer.removeMesh(this);
    }

    return this;
  };

  _proto.getObject3d = function getObject3d() {
    return this.object3d;
  };

  _proto.getId = function getId() {
    return this.id;
  };

  _proto.setId = function setId(id) {
    var oldId = this.getId();
    this.id = id;

    this._fire('idchange', {
      'old': oldId,
      'new': id,
      'target': this
    });

    return this;
  };

  _proto.getType = function getType() {
    return this.constructor.name;
  };

  _proto.getOptions = function getOptions() {
    return this.options;
  };

  _proto.getProperties = function getProperties() {
    return (this.options || {}).properties;
  };

  _proto.setProperties = function setProperties(property) {
    var old = Object.assign({}, this.getProperties());
    this.options.properties = property;

    this._fire('propertieschange', {
      'old': old,
      'new': property,
      'target': this
    });

    return this;
  };

  _proto.getLayer = function getLayer() {
    return this.options.layer;
  } // eslint-disable-next-line consistent-return
  ;

  _proto.getMap = function getMap() {
    var layer = this.getLayer();

    if (layer) {
      return layer.getMap();
    }
  } // eslint-disable-next-line consistent-return
  ;

  _proto.getCenter = function getCenter() {
    var options = this.getOptions();
    var coordinate = options.coordinate,
        lineString = options.lineString,
        polygon = options.polygon;

    if (coordinate) {
      return coordinate;
    } else {
      var geometry = polygon || lineString;

      if (geometry && geometry.getCenter) {
        return geometry.getCenter();
      }
    }
  };

  _proto.getAltitude = function getAltitude() {
    return this.getOptions().altitude;
  }
  /**
   * Different objects need to implement their own methods
   * @param {*} altitude
   */
  ;

  _proto.setAltitude = function setAltitude(altitude) {
    if (Util.isNumber(altitude)) {
      var z = this.getLayer().distanceToVector3(altitude, altitude).x;
      this.getObject3d().position.z = z;
      this.options.altitude = altitude;
    }

    return this;
  };

  _proto.show = function show() {
    this.getObject3d().visible = true;

    this._fire('show');

    return this;
  };

  _proto.hide = function hide() {
    this.getObject3d().visible = false;

    this._fire('hide');

    return this;
  };

  _proto.isVisible = function isVisible() {
    return !!this.getObject3d().visible;
  }
  /**
   *  Different objects need to implement their own methods
   */
  ;

  _proto.getSymbol = function getSymbol() {
    return this.getObject3d().material;
  }
  /**
   *  Different objects need to implement their own methods
   * @param {*} material
   */
  ;

  _proto.setSymbol = function setSymbol(material) {
    if (material && material instanceof Material) {
      material.needsUpdate = true;
      material.vertexColors = this.getObject3d().material.vertexColors;
      var old = this.getObject3d().material.clone();
      this.getObject3d().material = material;

      this._fire('symbolchange', {
        'old': old,
        'new': material,
        'target': this
      });
    }

    return this;
  };

  _proto.setInfoWindow = function setInfoWindow(options) {
    this.infoWindow = new ui.InfoWindow(options);
    return this;
  };

  _proto.getInfoWindow = function getInfoWindow() {
    return this.infoWindow;
  };

  _proto.openInfoWindow = function openInfoWindow(coordinate) {
    // eslint-disable-next-line no-unused-expressions
    coordinate && this.infoWindow && this.infoWindow.show(coordinate);
    return this;
  };

  _proto.closeInfoWindow = function closeInfoWindow() {
    // eslint-disable-next-line no-unused-expressions
    this.infoWindow && this.infoWindow.hide();
    return this;
  };

  _proto.removeInfoWindow = function removeInfoWindow() {
    // eslint-disable-next-line no-unused-expressions
    this.infoWindow && this.infoWindow.remove() && delete this.infoWindow;
    return this;
  };

  _proto.setToolTip = function setToolTip(content, options) {
    this.toolTip = new ToolTip(content, options);
    return this;
  };

  _proto.getToolTip = function getToolTip() {
    return this.toolTip;
  };

  _proto.openToolTip = function openToolTip(coordinate) {
    // eslint-disable-next-line no-unused-expressions
    coordinate && this.toolTip && this.toolTip.show(coordinate);
    return this;
  };

  _proto.closeToolTip = function closeToolTip() {
    // eslint-disable-next-line no-unused-expressions
    this.toolTip && this.toolTip.hide();
    return this;
  };

  _proto.removeToolTip = function removeToolTip() {
    // eslint-disable-next-line no-unused-expressions
    this.toolTip && this.toolTip.remove() && delete this.toolTip;
    return this;
  }
  /**
   * different components should implement their own animation methods
   * @param {*} options
   * @param {*} cb
   */
  // eslint-disable-next-line no-unused-vars
  ;

  _proto.animateShow = function animateShow(options, cb) {
    var _this2 = this;

    if (options === void 0) {
      options = {};
    }

    if (this._showPlayer) {
      this._showPlayer.cancel();
    }

    if (Util.isFunction(options)) {
      options = {};
      cb = options;
    }

    var duration = options['duration'] || 1000,
        easing = options['easing'] || 'out';
    var player = this._showPlayer = animation.Animation.animate({
      'scale': 1
    }, {
      'duration': duration,
      'easing': easing
    }, function (frame) {
      var scale = frame.styles.scale;

      if (scale > 0) {
        _this2.getObject3d().scale.set(1, 1, scale);
      }

      if (cb) {
        cb(frame, scale);
      }
    });
    player.play();
    return player;
  };

  _proto.getMinZoom = function getMinZoom() {
    return this.getOptions().minZoom;
  };

  _proto.getMaxZoom = function getMaxZoom() {
    return this.getOptions().maxZoom;
  };

  _proto.config = function config() {
    return this;
  }
  /**
   * more method support
   * @param {*} options
   */

  /**
   *
   * @param {*} options
   */
  ;

  _proto._initOptions = function _initOptions(options) {
    this.options = Util.extend({}, OPTIONS, options);
    return this;
  };

  _proto._createMesh = function _createMesh(geometry, material) {
    this.object3d = new Mesh(geometry, material);
    this.object3d.__parent = this;
    return this;
  };

  _proto._createGroup = function _createGroup() {
    this.object3d = new Group();
    this.object3d.__parent = this;
    return this;
  };

  _proto._createLine = function _createLine(geometry, material) {
    this.object3d = new Line(geometry, material);
    this.object3d.computeLineDistances();
    this.object3d.__parent = this;
    return this;
  } // eslint-disable-next-line no-unused-vars
  ;

  _proto._createPoints = function _createPoints(geometry, material) {
    //Serving for particles
    this.object3d = new Points(geometry, material);
    this.object3d.__parent = this;
    return this;
  };

  _proto._createLineSegments = function _createLineSegments(geometry, material) {
    this.object3d = new LineSegments(geometry, material);
    this.object3d.computeLineDistances();
    this.object3d.__parent = this;
    return this;
  };

  return BaseObject$$1;
}(Eventable(Base));

var barGeometryCache = {};
var KEY = '-';
/**
 * Reuse Geometry   , Meter as unit
 * @param {*} property
 */

function getGeometry(property, isCache) {
  if (isCache === void 0) {
    isCache = true;
  }

  var height = property.height,
      radialSegments = property.radialSegments,
      radius = property.radius,
      _radius = property._radius,
      _height = property._height;

  if (!isCache) {
    //for bars
    var _geometry = new CylinderBufferGeometry(radius, radius, height, radialSegments, 1);

    _geometry.rotateX(Math.PI / 2);

    var parray = _geometry.attributes.position.array;

    for (var j = 0, len1 = parray.length; j < len1; j += 3) {
      parray[j + 2] += height / 2;
    }

    return _geometry;
  }

  var geometry;

  for (var i = 0; i <= 4; i++) {
    var key = [_height + i, _radius, radialSegments].join(KEY).toString();
    geometry = barGeometryCache[key];
    if (geometry) break;
    key = [_height - i, _radius, radialSegments].join(KEY).toString();
    geometry = barGeometryCache[key];
    if (geometry) break;
  }

  if (!geometry) {
    var _key = [_height, _radius, radialSegments].join(KEY).toString();

    geometry = barGeometryCache[_key] = new CylinderBufferGeometry(radius, radius, height, radialSegments, 1);
    geometry.rotateX(Math.PI / 2);
    var _parray = geometry.attributes.position.array;

    for (var _j = 0, _len = _parray.length; _j < _len; _j += 3) {
      _parray[_j + 2] += height / 2;
    }

    return geometry;
  }

  return geometry;
}
/**
 * init Colors
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */

function initVertexColors(geometry, color, _topColor, key, v) {
  if (key === void 0) {
    key = 'y';
  }

  if (v === void 0) {
    v = 0;
  }

  var offset = 0;

  if (key === 'y') {
    offset = 1;
  } else if (key === 'z') {
    offset = 2;
  }

  var position = geometry.attributes.position.array;
  var len = position.length;
  var bottomColor = color instanceof Color ? color : new Color(color);
  var topColor = new Color(_topColor);
  var colors = [];

  for (var i = 0; i < len; i += 3) {
    var y = position[i + offset];

    if (y > v) {
      colors.push(topColor.r, topColor.r, topColor.b);
    } else {
      colors.push(bottomColor.r, bottomColor.r, bottomColor.b);
    }
  }

  geometry.addAttribute('color', new Float32BufferAttribute(colors, 3, true));
  return colors;
}

var OPTIONS$1 = {
  radius: 10,
  height: 100,
  radialSegments: 6,
  altitude: 0,
  topColor: null,
  bottomColor: '#2d2f61'
};
/**
 *
 */

var Bar =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(Bar, _BaseObject);

  function Bar(coordinate, options, material, layer) {
    var _this;

    options = Util.extend({}, OPTIONS$1, options, {
      layer: layer,
      coordinate: coordinate
    });
    _this = _BaseObject.call(this) || this;

    _this._initOptions(options);

    var _options = options,
        height = _options.height,
        radius = _options.radius,
        topColor = _options.topColor,
        bottomColor = _options.bottomColor,
        altitude = _options.altitude;
    options.height = layer.distanceToVector3(height, height).x;
    options.radius = layer.distanceToVector3(radius, radius).x; // Meter as unit

    options._radius = _this.options.radius;
    options._height = _this.options.height;
    _this._h = options.height;
    var geometry = getGeometry(options);

    if (topColor && !material.map) {
      initVertexColors(geometry, bottomColor, topColor, 'z', options.height / 2);
      material.vertexColors = VertexColors;
    }

    _this._createMesh(geometry, material);

    var z = layer.distanceToVector3(altitude, altitude).x;
    var position = layer.coordinateToVector3(coordinate, z);

    _this.getObject3d().position.copy(position); // this.getObject3d().rotation.x = Math.PI / 2;
    // this.getObject3d().translateY(options.height / 2);


    return _this;
  }

  return Bar;
}(BaseObject$$1);

/*
 (c) 2017, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/
// to suit your point format, run search/replace for '.x' and '.y';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)
// square distance between 2 points
function getSqDist(p1, p2) {
  var dx = p1[0] - p2[0],
      dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
} // square distance from a point to a segment


function getSqSegDist(p, p1, p2) {
  var x = p1[0],
      y = p1[1],
      dx = p2[0] - x,
      dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
} // rest of the code doesn't care about point format
// basic distance-based simplification


function simplifyRadialDist(points, sqTolerance) {
  var prevPoint = points[0],
      newPoints = [prevPoint],
      point;

  for (var i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point);
  return newPoints;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  var maxSqDist = sqTolerance,
      index;

  for (var i = first + 1; i < last; i++) {
    var sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
} // simplification using Ramer-Douglas-Peucker algorithm


function simplifyDouglasPeucker(points, sqTolerance) {
  var last = points.length - 1;
  var simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
} // both algorithms combined for awesome performance


function simplify(points, tolerance, highestQuality) {
  if (points.length <= 2) return points;
  var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
  points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);
  return points;
}

function dot(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}
function v2Dot(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}
function normalize(out, v) {
  var x = v[0];
  var y = v[1];
  var z = v[2];
  var d = Math.sqrt(x * x + y * y + z * z);
  out[0] = x / d;
  out[1] = y / d;
  out[2] = z / d;
  return out;
}
function v2Normalize(out, v) {
  var x = v[0];
  var y = v[1];
  var d = Math.sqrt(x * x + y * y);
  out[0] = x / d;
  out[1] = y / d;
  return out;
}
function scale(out, v, s) {
  out[0] = v[0] * s;
  out[1] = v[1] * s;
  out[2] = v[2] * s;
  return out;
}
function scaleAndAdd(out, v1, v2, s) {
  out[0] = v1[0] + v2[0] * s;
  out[1] = v1[1] + v2[1] * s;
  out[2] = v1[2] + v2[2] * s;
  return out;
}
function v2Add(out, v1, v2) {
  out[0] = v1[0] + v2[0];
  out[1] = v1[1] + v2[1];
  return out;
}
function v3Sub(out, v1, v2) {
  out[0] = v1[0] - v2[0];
  out[1] = v1[1] - v2[1];
  out[2] = v1[2] - v2[2];
  return out;
}
function v3Normalize(out, v) {
  var x = v[0];
  var y = v[1];
  var z = v[2];
  var d = Math.sqrt(x * x + y * y + z * z);
  out[0] = x / d;
  out[1] = y / d;
  out[2] = z / d;
  return out;
}
function v3Cross(out, v1, v2) {
  var ax = v1[0],
      ay = v1[1],
      az = v1[2],
      bx = v2[0],
      by = v2[1],
      bz = v2[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
var rel = []; // start and end must be normalized

function slerp(out, start, end, t) {
  // https://keithmaggio.wordpress.com/2011/02/15/math-magician-lerp-slerp-and-nlerp/
  var cosT = dot(start, end);
  var theta = Math.acos(cosT) * t;
  scaleAndAdd(rel, end, start, -cosT);
  normalize(rel, rel); // start and rel Orthonormal basis

  scale(out, start, Math.cos(theta));
  scaleAndAdd(out, out, rel, Math.sin(theta));
  return out;
}
function area$1(points, start, end) {
  // Signed polygon area
  var n = end - start;

  if (n < 3) {
    return 0;
  }

  var area = 0;

  for (var i = (end - 1) * 2, j = start * 2; j < end * 2;) {
    var x0 = points[i];
    var y0 = points[i + 1];
    var x1 = points[j];
    var y1 = points[j + 1];
    i = j;
    j += 2;
    area += x0 * y1 - x1 * y0;
  }

  return area;
}

// TODO fitRect x, y are negative?
var v1 = [];
var v2 = [];
var v = [];

function innerOffsetPolygon(vertices, out, start, end, outStart, offset, miterLimit, close) {
  var checkMiterLimit = miterLimit != null;
  var outOff = outStart;
  var indicesMap = null;

  if (checkMiterLimit) {
    indicesMap = new Uint32Array(end - start);
  }

  for (var i = start; i < end; i++) {
    var nextIdx = i === end - 1 ? start : i + 1;
    var prevIdx = i === start ? end - 1 : i - 1;
    var x1 = vertices[prevIdx * 2];
    var y1 = vertices[prevIdx * 2 + 1];
    var x2 = vertices[i * 2];
    var y2 = vertices[i * 2 + 1];
    var x3 = vertices[nextIdx * 2];
    var y3 = vertices[nextIdx * 2 + 1];
    v1[0] = x2 - x1;
    v1[1] = y2 - y1;
    v2[0] = x3 - x2;
    v2[1] = y3 - y2;
    v2Normalize(v1, v1);
    v2Normalize(v2, v2);
    checkMiterLimit && (indicesMap[i] = outOff);

    if (!close && i === start) {
      v[0] = v2[1];
      v[1] = -v2[0];
      v2Normalize(v, v);
      out[outOff * 2] = x2 + v[0] * offset;
      out[outOff * 2 + 1] = y2 + v[1] * offset;
      outOff++;
    } else if (!close && i === end - 1) {
      v[0] = v1[1];
      v[1] = -v1[0];
      v2Normalize(v, v);
      out[outOff * 2] = x2 + v[0] * offset;
      out[outOff * 2 + 1] = y2 + v[1] * offset;
      outOff++;
    } else {
      // PENDING Why using sub will lost the direction info.
      v2Add(v, v2, v1);
      var tmp = v[1];
      v[1] = -v[0];
      v[0] = tmp;
      v2Normalize(v, v);
      var cosA = v2Dot(v, v2);
      var sinA = Math.sqrt(1 - cosA * cosA); // PENDING

      var miter = offset * Math.min(10, 1 / sinA);
      var isCovex = offset * cosA < 0;

      if (checkMiterLimit && 1 / sinA > miterLimit && isCovex) {
        var mx = x2 + v[0] * offset;
        var my = y2 + v[1] * offset;
        var halfA = Math.acos(sinA) / 2;
        var dist = Math.tan(halfA) * Math.abs(offset);
        out[outOff * 2] = mx + v[1] * dist;
        out[outOff * 2 + 1] = my - v[0] * dist;
        outOff++;
        out[outOff * 2] = mx - v[1] * dist;
        out[outOff * 2 + 1] = my + v[0] * dist;
        outOff++;
      } else {
        out[outOff * 2] = x2 + v[0] * miter;
        out[outOff * 2 + 1] = y2 + v[1] * miter;
        outOff++;
      }
    }
  }

  return indicesMap;
}

function offsetPolygon(vertices, holes, offset, miterLimit, close) {
  var offsetVertices = miterLimit != null ? [] : new Float32Array(vertices.length);
  var exteriorSize = holes && holes.length ? holes[0] : vertices.length / 2;
  innerOffsetPolygon(vertices, offsetVertices, 0, exteriorSize, 0, offset, miterLimit, close, false);

  if (holes) {
    for (var i = 0; i < holes.length; i++) {
      var start = holes[i];
      var end = holes[i + 1] || vertices.length / 2;
      innerOffsetPolygon(vertices, offsetVertices, start, end, miterLimit != null ? offsetVertices.length / 2 : start, offset, miterLimit, close);
    }
  }

  return offsetVertices;
}

function reversePoints(points, stride, start, end) {
  for (var i = 0; i < Math.floor((end - start) / 2); i++) {
    for (var j = 0; j < stride; j++) {
      var a = (i + start) * stride + j;
      var b = (end - i - 1) * stride + j;
      var tmp = points[a];
      points[a] = points[b];
      points[b] = tmp;
    }
  }

  return points;
}

function normalizeOpts(opts) {
  opts.depth = opts.depth || 1;
  opts.bevelSize = opts.bevelSize || 0;
  opts.bevelSegments = opts.bevelSegments == null ? 2 : opts.bevelSegments;
  opts.smoothSide = opts.smoothSide || false;
  opts.smoothBevel = opts.smoothBevel || false;
  opts.simplify = opts.simplify || 0; // Normalize bevel options.

  if (typeof opts.depth === 'number') {
    opts.bevelSize = Math.min(!(opts.bevelSegments > 0) ? 0 : opts.bevelSize, opts.depth / 2);
  }

  if (!(opts.bevelSize > 0)) {
    opts.bevelSegments = 0;
  }

  opts.bevelSegments = Math.round(opts.bevelSegments);
  var boundingRect = opts.boundingRect;
  opts.translate = opts.translate || [0, 0];
  opts.scale = opts.scale || [1, 1];

  if (opts.fitRect) {
    var targetX = opts.fitRect.x == null ? boundingRect.x || 0 : opts.fitRect.x;
    var targetY = opts.fitRect.y == null ? boundingRect.y || 0 : opts.fitRect.y;
    var targetWidth = opts.fitRect.width;
    var targetHeight = opts.fitRect.height;

    if (targetWidth == null) {
      if (targetHeight != null) {
        targetWidth = targetHeight / boundingRect.height * boundingRect.width;
      } else {
        targetWidth = boundingRect.width;
        targetHeight = boundingRect.height;
      }
    } else if (targetHeight == null) {
      targetHeight = targetWidth / boundingRect.width * boundingRect.height;
    }

    opts.scale = [targetWidth / boundingRect.width, targetHeight / boundingRect.height];
    opts.translate = [(targetX - boundingRect.x) * opts.scale[0], (targetY - boundingRect.y) * opts.scale[1]];
  }
}

function generateNormal(indices, position) {
  function v3Set(p, a, b, c) {
    p[0] = a;
    p[1] = b;
    p[2] = c;
  }

  var p1 = [];
  var p2 = [];
  var p3 = [];
  var v21 = [];
  var v32 = [];
  var n = [];
  var len = indices.length;
  var normals = new Float32Array(position.length);

  for (var f = 0; f < len;) {
    var i1 = indices[f++] * 3;
    var i2 = indices[f++] * 3;
    var i3 = indices[f++] * 3;
    v3Set(p1, position[i1], position[i1 + 1], position[i1 + 2]);
    v3Set(p2, position[i2], position[i2 + 1], position[i2 + 2]);
    v3Set(p3, position[i3], position[i3 + 1], position[i3 + 2]);
    v3Sub(v21, p1, p2);
    v3Sub(v32, p2, p3);
    v3Cross(n, v21, v32); // Already be weighted by the triangle area

    for (var _i = 0; _i < 3; _i++) {
      normals[i1 + _i] = normals[i1 + _i] + n[_i];
      normals[i2 + _i] = normals[i2 + _i] + n[_i];
      normals[i3 + _i] = normals[i3 + _i] + n[_i];
    }
  }

  for (var i = 0; i < normals.length;) {
    v3Set(n, normals[i], normals[i + 1], normals[i + 2]);
    v3Normalize(n, n);
    normals[i++] = n[0];
    normals[i++] = n[1];
    normals[i++] = n[2];
  }

  return normals;
} // 0,0----1,0
// 0,1----1,1


var quadToTriangle = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]; // Add side vertices and indices. Include bevel.

function addExtrudeSide(out, _ref, start, end, cursors, opts) {
  var vertices = _ref.vertices,
      topVertices = _ref.topVertices,
      depth = _ref.depth,
      rect = _ref.rect;
  var ringVertexCount = end - start;
  var splitSide = opts.smoothSide ? 1 : 2;
  var splitRingVertexCount = ringVertexCount * splitSide;
  var splitBevel = opts.smoothBevel ? 1 : 2;
  var bevelSize = Math.min(depth / 2, opts.bevelSize);
  var bevelSegments = opts.bevelSegments;
  var vertexOffset = cursors.vertex;
  var size = Math.max(rect.width, rect.height); // Side vertices

  if (bevelSize > 0) {
    var v0 = [0, 0, 1];
    var _v = [];
    var _v2 = [0, 0, -1];
    var _v3 = [];
    var ringCount = 0;
    var vLen = new Float32Array(ringVertexCount);

    for (var k = 0; k < 2; k++) {
      var z = k === 0 ? depth - bevelSize : bevelSize;

      for (var s = 0; s <= bevelSegments * splitBevel; s++) {
        var uLen = 0;
        var prevX = void 0;
        var prevY = void 0;

        for (var i = 0; i < ringVertexCount; i++) {
          for (var j = 0; j < splitSide; j++) {
            // TODO Cache and optimize
            var idx = ((i + j) % ringVertexCount + start) * 2;
            _v[0] = vertices[idx] - topVertices[idx];
            _v[1] = vertices[idx + 1] - topVertices[idx + 1];
            _v[2] = 0;
            var l = Math.sqrt(_v[0] * _v[0] + _v[1] * _v[1]);
            _v[0] /= l;
            _v[1] /= l;
            var t = (Math.floor(s / splitBevel) + s % splitBevel) / bevelSegments;
            k === 0 ? slerp(_v3, v0, _v, t) : slerp(_v3, _v, _v2, t);
            var t2 = k === 0 ? t : 1 - t;
            var a = bevelSize * Math.sin(t2 * Math.PI / 2);
            var b = l * Math.cos(t2 * Math.PI / 2); // ellipse radius

            var r = bevelSize * l / Math.sqrt(a * a + b * b);
            var x = _v3[0] * r + topVertices[idx];
            var y = _v3[1] * r + topVertices[idx + 1];
            var zz = _v3[2] * r + z;
            out.position[cursors.vertex * 3] = x;
            out.position[cursors.vertex * 3 + 1] = y;
            out.position[cursors.vertex * 3 + 2] = zz; // TODO Cache and optimize

            if (i > 0 || j > 0) {
              uLen += Math.sqrt((prevX - x) * (prevX - x) + (prevY - y) * (prevY - y));
            }

            if (s > 0 || k > 0) {
              var tmp = (cursors.vertex - splitRingVertexCount) * 3;
              var prevX2 = out.position[tmp];
              var prevY2 = out.position[tmp + 1];
              var prevZ2 = out.position[tmp + 2];
              vLen[i] += Math.sqrt((prevX2 - x) * (prevX2 - x) + (prevY2 - y) * (prevY2 - y) + (prevZ2 - zz) * (prevZ2 - zz));
            }

            out.uv[cursors.vertex * 2] = uLen / size;
            out.uv[cursors.vertex * 2 + 1] = vLen[i] / size;
            prevX = x;
            prevY = y;
            cursors.vertex++;
          }

          if (splitBevel > 1 && s % splitBevel || splitBevel === 1 && s >= 1) {
            for (var f = 0; f < 6; f++) {
              var m = (quadToTriangle[f][0] + i * splitSide) % splitRingVertexCount;
              var n = quadToTriangle[f][1] + ringCount;
              out.indices[cursors.index++] = (n - 1) * splitRingVertexCount + m + vertexOffset;
            }
          }
        }

        ringCount++;
      }
    }
  } else {
    for (var _k = 0; _k < 2; _k++) {
      var _z = _k === 0 ? depth - bevelSize : bevelSize;

      var _uLen = 0;

      var _prevX = void 0;

      var _prevY = void 0;

      for (var _i2 = 0; _i2 < ringVertexCount; _i2++) {
        for (var _m = 0; _m < splitSide; _m++) {
          var _idx = ((_i2 + _m) % ringVertexCount + start) * 2;

          var _x = vertices[_idx];
          var _y = vertices[_idx + 1];
          out.position[cursors.vertex * 3] = _x;
          out.position[cursors.vertex * 3 + 1] = _y;
          out.position[cursors.vertex * 3 + 2] = _z;

          if (_i2 > 0 || _m > 0) {
            _uLen += Math.sqrt((_prevX - _x) * (_prevX - _x) + (_prevY - _y) * (_prevY - _y));
          }

          out.uv[cursors.vertex * 2] = _uLen / size;
          out.uv[cursors.vertex * 2 + 1] = _z / size;
          _prevX = _x;
          _prevY = _y;
          cursors.vertex++;
        }
      }
    }
  } // Connect the side


  var sideStartRingN = bevelSize > 0 ? bevelSegments * splitBevel + 1 : 1;

  for (var _i3 = 0; _i3 < ringVertexCount; _i3++) {
    for (var _f = 0; _f < 6; _f++) {
      var _m2 = (quadToTriangle[_f][0] + _i3 * splitSide) % splitRingVertexCount;

      var _n = quadToTriangle[_f][1] + sideStartRingN;

      out.indices[cursors.index++] = (_n - 1) * splitRingVertexCount + _m2 + vertexOffset;
    }
  }
}

function addTopAndBottom(_ref2, out, cursors, opts) {
  var indices = _ref2.indices,
      vertices = _ref2.vertices,
      topVertices = _ref2.topVertices,
      rect = _ref2.rect,
      depth = _ref2.depth;

  if (vertices.length <= 4) {
    return;
  }

  var vertexOffset = cursors.vertex; // Top indices

  var indicesLen = indices.length;

  for (var i = 0; i < indicesLen; i++) {
    out.indices[cursors.index++] = vertexOffset + indices[i];
  }

  var size = Math.max(rect.width, rect.height); // Top and bottom vertices

  for (var k = 0; k < (opts.excludeBottom ? 1 : 2); k++) {
    for (var _i4 = 0; _i4 < topVertices.length; _i4 += 2) {
      var x = topVertices[_i4];
      var y = topVertices[_i4 + 1];
      out.position[cursors.vertex * 3] = x;
      out.position[cursors.vertex * 3 + 1] = y;
      out.position[cursors.vertex * 3 + 2] = (1 - k) * depth;
      out.uv[cursors.vertex * 2] = (x - rect.x) / size;
      out.uv[cursors.vertex * 2 + 1] = (y - rect.y) / size;
      cursors.vertex++;
    }
  } // Bottom indices


  if (!opts.excludeBottom) {
    var vertexCount = vertices.length / 2;

    for (var _i5 = 0; _i5 < indicesLen; _i5 += 3) {
      for (var _k2 = 0; _k2 < 3; _k2++) {
        out.indices[cursors.index++] = vertexOffset + vertexCount + indices[_i5 + 2 - _k2];
      }
    }
  }
}

function innerExtrudeTriangulatedPolygon(preparedData, opts) {
  var indexCount = 0;
  var vertexCount = 0;

  for (var p = 0; p < preparedData.length; p++) {
    var _preparedData$p = preparedData[p],
        indices = _preparedData$p.indices,
        vertices = _preparedData$p.vertices,
        holes = _preparedData$p.holes,
        depth = _preparedData$p.depth;
    var polygonVertexCount = vertices.length / 2;
    var bevelSize = Math.min(depth / 2, opts.bevelSize);
    var bevelSegments = !(bevelSize > 0) ? 0 : opts.bevelSegments;
    indexCount += indices.length * (opts.excludeBottom ? 1 : 2);
    vertexCount += polygonVertexCount * (opts.excludeBottom ? 1 : 2);
    var ringCount = 2 + bevelSegments * 2;
    var start = 0;
    var end = 0;

    for (var h = 0; h < (holes ? holes.length : 0) + 1; h++) {
      if (h === 0) {
        end = holes && holes.length ? holes[0] : polygonVertexCount;
      } else {
        start = holes[h - 1];
        end = holes[h] || polygonVertexCount;
      }

      indexCount += (end - start) * 6 * (ringCount - 1);
      var sideRingVertexCount = (end - start) * (opts.smoothSide ? 1 : 2);
      vertexCount += sideRingVertexCount * ringCount // Double the bevel vertex number if not smooth
      + (!opts.smoothBevel ? bevelSegments * sideRingVertexCount * 2 : 0);
    }
  }

  var data = {
    position: new Float32Array(vertexCount * 3),
    indices: new (vertexCount > 0xffff ? Uint32Array : Uint16Array)(indexCount),
    uv: new Float32Array(vertexCount * 2)
  };
  var cursors = {
    vertex: 0,
    index: 0
  };

  for (var d = 0; d < preparedData.length; d++) {
    addTopAndBottom(preparedData[d], data, cursors, opts);
  }

  for (var _d = 0; _d < preparedData.length; _d++) {
    var _preparedData$_d = preparedData[_d],
        _holes = _preparedData$_d.holes,
        _vertices = _preparedData$_d.vertices;
    var topVertexCount = _vertices.length / 2;
    var _start = 0;

    var _end = _holes && _holes.length ? _holes[0] : topVertexCount; // Add exterior


    addExtrudeSide(data, preparedData[_d], _start, _end, cursors, opts); // Add holes

    if (_holes) {
      for (var _h = 0; _h < _holes.length; _h++) {
        _start = _holes[_h];
        _end = _holes[_h + 1] || topVertexCount;
        addExtrudeSide(data, preparedData[_d], _start, _end, cursors, opts);
      }
    }
  } // Wrap uv


  for (var i = 0; i < data.uv.length; i++) {
    var val = data.uv[i];

    if (val > 0 && Math.round(val) === val) {
      data.uv[i] = 1;
    } else {
      data.uv[i] = val % 1;
    }
  }

  data.normal = generateNormal(data.indices, data.position); // PENDING

  data.boundingRect = preparedData[0] && preparedData[0].rect;
  return data;
}

function convertPolylineToTriangulatedPolygon(polyline, polylineIdx, opts) {
  var lineWidth = opts.lineWidth;
  var pointCount = polyline.length;
  var points = new Float32Array(pointCount * 2);
  var translate = opts.translate || [0, 0];
  var scale$$1 = opts.scale || [1, 1];

  for (var i = 0, k = 0; i < pointCount; i++) {
    points[k++] = polyline[i][0] * scale$$1[0] + translate[0];
    points[k++] = polyline[i][1] * scale$$1[1] + translate[1];
  }

  if (area$1(points, 0, pointCount) < 0) {
    reversePoints(points, 2, 0, pointCount);
  }

  var insidePoints = [];
  var outsidePoints = [];
  var miterLimit = opts.miterLimit;
  var outsideIndicesMap = innerOffsetPolygon(points, outsidePoints, 0, pointCount, 0, -lineWidth / 2, miterLimit, false);
  reversePoints(points, 2, 0, pointCount);
  var insideIndicesMap = innerOffsetPolygon(points, insidePoints, 0, pointCount, 0, -lineWidth / 2, miterLimit, false);
  var polygonVertexCount = (insidePoints.length + outsidePoints.length) / 2;
  var polygonVertices = new Float32Array(polygonVertexCount * 2);
  var offset = 0;
  var outsidePointCount = outsidePoints.length / 2;

  for (var _i6 = 0; _i6 < outsidePoints.length; _i6++) {
    polygonVertices[offset++] = outsidePoints[_i6];
  }

  for (var _i7 = 0; _i7 < insidePoints.length; _i7++) {
    polygonVertices[offset++] = insidePoints[_i7];
  } // Built indices


  var indices = new (polygonVertexCount > 0xffff ? Uint32Array : Uint16Array)(((pointCount - 1) * 2 + (polygonVertexCount - pointCount * 2)) * 3);
  var off = 0;

  for (var _i8 = 0; _i8 < pointCount - 1; _i8++) {
    var i2 = _i8 + 1;
    indices[off++] = outsidePointCount - 1 - outsideIndicesMap[_i8];
    indices[off++] = outsidePointCount - 1 - outsideIndicesMap[_i8] - 1;
    indices[off++] = insideIndicesMap[_i8] + 1 + outsidePointCount;
    indices[off++] = outsidePointCount - 1 - outsideIndicesMap[_i8];
    indices[off++] = insideIndicesMap[_i8] + 1 + outsidePointCount;
    indices[off++] = insideIndicesMap[_i8] + outsidePointCount;

    if (insideIndicesMap[i2] - insideIndicesMap[_i8] === 2) {
      indices[off++] = insideIndicesMap[_i8] + 2 + outsidePointCount;
      indices[off++] = insideIndicesMap[_i8] + 1 + outsidePointCount;
      indices[off++] = outsidePointCount - outsideIndicesMap[i2] - 1;
    } else if (outsideIndicesMap[i2] - outsideIndicesMap[_i8] === 2) {
      indices[off++] = insideIndicesMap[i2] + outsidePointCount;
      indices[off++] = outsidePointCount - 1 - (outsideIndicesMap[_i8] + 1);
      indices[off++] = outsidePointCount - 1 - (outsideIndicesMap[_i8] + 2);
    }
  }

  var topVertices = opts.bevelSize > 0 ? offsetPolygon(polygonVertices, [], opts.bevelSize, null, true) : polygonVertices;
  var boundingRect = opts.boundingRect;
  return {
    vertices: polygonVertices,
    indices: indices,
    topVertices: topVertices,
    rect: {
      x: boundingRect.x * scale$$1[0] + translate[0],
      y: boundingRect.y * scale$$1[1] + translate[1],
      width: boundingRect.width * scale$$1[0],
      height: boundingRect.height * scale$$1[1]
    },
    depth: typeof opts.depth === 'function' ? opts.depth(polylineIdx) : opts.depth,
    holes: []
  };
}
/**
 *
 * @param {Array} polylines Polylines array that match GeoJSON MultiLineString geometry.
 * @param {Object} [opts]
 * @param {number} [opts.depth]
 * @param {number} [opts.bevelSize = 0]
 * @param {number} [opts.bevelSegments = 2]
 * @param {number} [opts.simplify = 0]
 * @param {boolean} [opts.smoothSide = false]
 * @param {boolean} [opts.smoothBevel = false]
 * @param {boolean} [opts.excludeBottom = false]
 * @param {boolean} [opts.lineWidth = 1]
 * @param {boolean} [opts.miterLimit = 2]
 * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
 * @param {Array} [opts.translate]
 * @param {Array} [opts.scale]
 * @param {Object} [opts.boundingRect]
 * @return {Object} {indices, position, uv, normal, boundingRect}
 */

function extrudePolyline(polylines, opts) {
  opts = Object.assign({}, opts);
  var min = [Infinity, Infinity];
  var max = [-Infinity, -Infinity];

  for (var i = 0; i < polylines.length; i++) {
    updateBoundingRect(polylines[i], min, max);
  }

  opts.boundingRect = opts.boundingRect || {
    x: min[0],
    y: min[1],
    width: max[0] - min[0],
    height: max[1] - min[1]
  };
  normalizeOpts(opts);
  var scale$$1 = opts.scale || [1, 1];

  if (opts.lineWidth == null) {
    opts.lineWidth = 1;
  }

  if (opts.miterLimit == null) {
    opts.miterLimit = 2;
  }

  var preparedData = []; // Extrude polyline to polygon

  for (var _i10 = 0; _i10 < polylines.length; _i10++) {
    var newPolyline = polylines[_i10];
    var simplifyTolerance = opts.simplify / Math.max(scale$$1[0], scale$$1[1]);

    if (simplifyTolerance > 0) {
      newPolyline = simplify(newPolyline, simplifyTolerance, true);
    }

    preparedData.push(convertPolylineToTriangulatedPolygon(newPolyline, _i10, opts));
  }

  return innerExtrudeTriangulatedPolygon(preparedData, opts);
}

function updateBoundingRect(points, min, max) {
  for (var i = 0; i < points.length; i++) {
    min[0] = Math.min(points[i][0], min[0]);
    min[1] = Math.min(points[i][1], min[1]);
    max[0] = Math.max(points[i][0], max[0]);
    max[1] = Math.max(points[i][1], max[1]);
  }
}

var COMMA = ',';
/**
 *
 * @param {maptalks.LineString} lineString
 * @param {ThreeLayer} layer
 */

function getLinePosition(lineString, layer, center) {
  var positions = [];
  var positionsV = [];

  if (Array.isArray(lineString) && lineString[0] instanceof Vector3) {
    for (var i = 0, len = lineString.length; i < len; i++) {
      var v = lineString[i];
      positions.push(v.x, v.y, v.z);
      positionsV.push(v);
    }
  } else {
    if (Array.isArray(lineString)) lineString = new LineString(lineString);
    if (!lineString || !(lineString instanceof LineString)) return null;
    var z = 0;
    var coordinates = lineString.getCoordinates();
    var centerPt = layer.coordinateToVector3(center || lineString.getCenter());

    for (var _i = 0, _len = coordinates.length; _i < _len; _i++) {
      var coordinate = coordinates[_i];

      if (Array.isArray(coordinate)) {
        coordinate = new Coordinate(coordinate);
      }

      var _v = layer.coordinateToVector3(coordinate, z).sub(centerPt);

      positions.push(_v.x, _v.y, _v.z);
      positionsV.push(_v);
    }
  }

  return {
    positions: positions,
    positionsV: positionsV
  };
}
/**
 *
 * @param {maptalks.LineString} lineString
 * @param {Number} lineWidth
 * @param {Number} depth
 * @param {ThreeLayer} layer
 */

function getExtrudeLineGeometry(lineString, lineWidth, depth, layer, center) {
  if (lineWidth === void 0) {
    lineWidth = 1;
  }

  if (depth === void 0) {
    depth = 1;
  }

  var positions = getLinePosition(lineString, layer, center).positionsV;
  var ps = [];

  for (var i = 0, len = positions.length; i < len; i++) {
    var p = positions[i];
    ps.push([p.x, p.y]);
  }

  var _extrudePolyline = extrudePolyline([ps], {
    lineWidth: lineWidth,
    depth: depth
  }),
      indices = _extrudePolyline.indices,
      position = _extrudePolyline.position,
      normal = _extrudePolyline.normal;

  var geometry = new BufferGeometry();
  geometry.addAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.addAttribute('normal', new Float32BufferAttribute(normal, 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  return geometry;
}
/**
 *
 * @param {Array[Array]} chunkLines
 * @param {*} layer
 */

function getChunkLinesPosition(chunkLines, layer, positionMap, centerPt) {
  var positions = [],
      positionsV = [],
      lnglats = [];

  for (var i = 0, len = chunkLines.length; i < len; i++) {
    var line = chunkLines[i];

    for (var j = 0, len1 = line.length; j < len1; j++) {
      var lnglat = line[j];

      if (lnglats.length > 0) {
        var key = lnglat.join(COMMA).toString();
        var key1 = lnglats[lnglats.length - 1].join(COMMA).toString();

        if (key !== key1) {
          lnglats.push(lnglat);
        }
      } else {
        lnglats.push(lnglat);
      }
    }
  }

  var z = 0;

  for (var _i2 = 0, _len2 = lnglats.length; _i2 < _len2; _i2++) {
    var _lnglat = lnglats[_i2];
    var v = void 0;

    var _key = _lnglat.join(COMMA).toString();

    if (positionMap && positionMap[_key]) {
      v = positionMap[_key];
    } else {
      v = layer.coordinateToVector3(_lnglat, z).sub(centerPt);
    }

    positionsV.push(v);
    positions.push(v.x, v.y, v.z);
  }

  return {
    positions: positions,
    positionsV: positionsV,
    lnglats: lnglats
  };
}
/**
 *
 * @param {*} lineString
 * @param {*} lineWidth
 * @param {*} depth
 * @param {*} layer
 */

function getExtrudeLineParams(lineString, lineWidth, depth, layer, center) {
  if (lineWidth === void 0) {
    lineWidth = 1;
  }

  if (depth === void 0) {
    depth = 1;
  }

  var positions = getLinePosition(lineString, layer, center).positionsV;
  var ps = [];

  for (var i = 0, len = positions.length; i < len; i++) {
    var p = positions[i];
    ps.push([p.x, p.y]);
  }

  var _extrudePolyline2 = extrudePolyline([ps], {
    lineWidth: lineWidth,
    depth: depth
  }),
      indices = _extrudePolyline2.indices,
      position = _extrudePolyline2.position,
      normal = _extrudePolyline2.normal;

  return {
    position: position,
    normal: normal,
    indices: indices
  };
}

function initColors(cs) {
  var colors = [];

  if (cs && cs.length) {
    cs.forEach(function (color) {
      color = color instanceof Color ? color : new Color(color);
      colors.push(color.r, color.g, color.b);
    });
  }

  return colors;
}

var OPTIONS$2 = {
  altitude: 0,
  colors: null
};
/**
 *
 */

var Line$1 =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(Line$$1, _BaseObject);

  function Line$$1(lineString, options, material, layer) {
    var _this;

    options = Util.extend({}, OPTIONS$2, options, {
      layer: layer,
      lineString: lineString
    });
    _this = _BaseObject.call(this) || this;

    _this._initOptions(options);

    var positions = getLinePosition(lineString, layer).positions;
    var geometry = new BufferGeometry();
    geometry.addAttribute('position', new Float32BufferAttribute(positions, 3));
    var colors = initColors(options.colors);

    if (colors && colors.length) {
      geometry.addAttribute('color', new Float32BufferAttribute(colors, 3));
      material.vertexColors = VertexColors;
    }

    _this._createLine(geometry, material);

    var _options = options,
        altitude = _options.altitude;
    var center = lineString.getCenter();
    var z = layer.distanceToVector3(altitude, altitude).x;
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v);

    return _this;
  }

  return Line$$1;
}(BaseObject$$1);

var OPTIONS$3 = {
  width: 3,
  height: 1,
  altitude: 0
};
/**
 *
 */

var ExtrudeLine =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(ExtrudeLine, _BaseObject);

  function ExtrudeLine(lineString, options, material, layer) {
    var _this;

    options = Util.extend({}, OPTIONS$3, options, {
      layer: layer,
      lineString: lineString
    });
    _this = _BaseObject.call(this) || this;

    _this._initOptions(options);

    var _options = options,
        height = _options.height,
        width = _options.width;
    options.height = layer.distanceToVector3(height, height).x;
    options.width = layer.distanceToVector3(width, width).x;
    var geometry = getExtrudeLineGeometry(lineString, options.width, options.height, layer);

    _this._createMesh(geometry, material);

    var _options2 = options,
        altitude = _options2.altitude;
    var center = lineString.getCenter();
    var z = layer.distanceToVector3(altitude, altitude).x;
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v);

    return _this;
  }

  return ExtrudeLine;
}(BaseObject$$1);

/**
 * this is for ExtrudeMesh util
 */

/**
 * Fix the bug in the center of multipoygon
 * @param {maptalks.Polygon} polygon
 * @param {*} layer
 */

function toShape(polygon, layer, center) {
  var shell, holes; //it is pre for geojson,Possible later use of geojson

  if (Array.isArray(polygon)) {
    shell = polygon[0];
    holes = polygon.slice(1, polygon.length);
  } else {
    shell = polygon.getShell();
    holes = polygon.getHoles();
  }

  center = center || polygon.getCenter();
  var centerPt = layer.coordinateToVector3(center);
  var outer = shell.map(function (c) {
    return layer.coordinateToVector3(c).sub(centerPt);
  });
  var shape = new Shape(outer);

  if (holes && holes.length > 0) {
    shape.holes = holes.map(function (item) {
      var pts = item.map(function (c) {
        return layer.coordinateToVector3(c).sub(centerPt);
      });
      return new Shape(pts);
    });
  }

  return shape;
}
/**
 *  Support custom center point
 * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
 * @param {*} height
 * @param {*} layer
 */

function getExtrudeGeometry(polygon, height, layer, center) {
  if (!polygon) {
    return null;
  }

  var shape;

  if (polygon instanceof MultiPolygon) {
    shape = polygon.getGeometries().map(function (p) {
      return toShape(p, layer, center || polygon.getCenter());
    });
  } else if (polygon instanceof Polygon) {
    shape = toShape(polygon, layer, center || polygon.getCenter());
  } //Possible later use of geojson


  if (!shape) return null;
  height = layer.distanceToVector3(height, height).x;
  var name = parseInt(REVISION) >= 93 ? 'depth' : 'amount';
  var config = {
    'bevelEnabled': false,
    'bevelSize': 1
  };
  config[name] = height;
  var geom = new ExtrudeGeometry(shape, config);
  var buffGeom = new BufferGeometry();
  buffGeom.fromGeometry(geom);
  return buffGeom;
}
/**
 *
 * @param {*} geometry
 * @param {*} color
 * @param {*} _topColor
 */

function initVertexColors$1(geometry, color, _topColor) {
  var position = geometry.attributes.position.array;
  var len = position.length;
  var bottomColor = color instanceof Color ? color : new Color(color);
  var topColor = new Color(_topColor);
  var colors = [];

  for (var i = 0; i < len; i += 3) {
    var z = position[i + 2];

    if (z > 0) {
      colors.push(topColor.r, topColor.r, topColor.b);
    } else {
      colors.push(bottomColor.r, bottomColor.r, bottomColor.b);
    }
  }

  geometry.addAttribute('color', new Float32BufferAttribute(colors, 3, true));
  return colors;
}
/**
 *Get the center point of the point set
 * @param {*} coordinates
 */

function getCenterOfPoints(coordinates) {
  if (coordinates === void 0) {
    coordinates = [];
  }

  var minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

  for (var i = 0, len = coordinates.length; i < len; i++) {
    var c = coordinates[i];
    var x = void 0,
        y = void 0;

    if (Array.isArray(c)) {
      x = c[0];
      y = c[1];
    } else if (c instanceof Coordinate) {
      x = c.x;
      y = c.y;
    }

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return new Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
}

var OPTIONS$4 = {
  altitude: 0,
  height: 1,
  topColor: null,
  bottomColor: '#2d2f61'
};
/**
 *
 */

var ExtrudePolygon =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(ExtrudePolygon, _BaseObject);

  function ExtrudePolygon(polygon, options, material, layer) {
    var _this;

    options = Util.extend({}, OPTIONS$4, options, {
      layer: layer,
      polygon: polygon
    });
    _this = _BaseObject.call(this) || this;

    _this._initOptions(options);

    var _options = options,
        height = _options.height,
        topColor = _options.topColor,
        bottomColor = _options.bottomColor,
        altitude = _options.altitude;
    var geometry = getExtrudeGeometry(polygon, height, layer);

    if (topColor && !material.map) {
      initVertexColors$1(geometry, bottomColor, topColor);
      material.vertexColors = VertexColors;
    }

    _this._createMesh(geometry, material);

    var center = polygon.getCenter();
    var z = layer.distanceToVector3(altitude, altitude).x;
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v);

    return _this;
  }

  return ExtrudePolygon;
}(BaseObject$$1);

var OPTIONS$5 = {
  altitude: 0,
  coordinate: null
};
/**
 * Model container
 */

var Model =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(Model, _BaseObject);

  function Model(model, options, layer) {
    var _this;

    if (options === void 0) {
      options = {};
    }

    if (!options.coordinate) {
      console.warn('coordinate is null,it is important to locate the model');
      options.coordinate = layer.getMap().getCenter();
    }

    options = Util.extend({}, OPTIONS$5, options, {
      layer: layer,
      model: model
    });
    _this = _BaseObject.call(this) || this;

    _this._initOptions(options);

    _this._createGroup();

    _this.getObject3d().add(model);

    var _options = options,
        altitude = _options.altitude,
        coordinate = _options.coordinate;
    var z = layer.distanceToVector3(altitude, altitude).x;
    var position = layer.coordinateToVector3(coordinate, z);

    _this.getObject3d().position.copy(position);

    return _this;
  }

  return Model;
}(BaseObject$$1);

/**
 * provide a simple geo function
 */
var PI = Math.PI / 180;
var R = 6378137;
var MINLENGTH = 1;

function formatLineArray(polyline) {
  var lnglats = polyline.getCoordinates();
  return lnglats.map(function (lnglat) {
    return lnglat.toArray();
  });
}

function degreesToRadians(d) {
  return d * PI;
}

function distance(c1, c2) {
  if (!c1 || !c2) {
    return 0;
  }

  if (!Array.isArray(c1)) {
    c1 = c1.toArray();
  }

  if (!Array.isArray(c2)) {
    c2 = c2.toArray();
  }

  var b = degreesToRadians(c1[1]);
  var d = degreesToRadians(c2[1]),
      e = b - d,
      f = degreesToRadians(c1[0]) - degreesToRadians(c2[0]);
  b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
  b *= R;
  return Math.round(b * 1E5) / 1E5;
}

function getPercentLngLat(l, length) {
  var len = l.len,
      c1 = l.c1,
      c2 = l.c2;
  var dx = c2[0] - c1[0],
      dy = c2[1] - c1[1];
  var percent = length / len;
  var lng = c1[0] + percent * dx;
  var lat = c1[1] + percent * dy;
  return [lng, lat];
}
/**
 * This is not an accurate line segment cutting method, but rough, in order to speed up the calculation,
 * the correct cutting algorithm can be referred to. http://turfjs.org/docs/#lineChunk
 * @param {*} cs
 * @param {*} lineChunkLength
 */


function lineSlice(cs, lineChunkLength) {
  if (lineChunkLength === void 0) {
    lineChunkLength = 10;
  }

  lineChunkLength = Math.max(lineChunkLength, MINLENGTH);

  if (!Array.isArray(cs)) {
    cs = formatLineArray(cs);
  }

  var LEN = cs.length;
  var list = [];
  var totalLen = 0;

  for (var i = 0; i < LEN - 1; i++) {
    var len = distance(cs[i], cs[i + 1]);
    var floorlen = Math.floor(len);
    list.push({
      c1: cs[i],
      len: floorlen,
      c2: cs[i + 1]
    });
    totalLen += floorlen;
  }

  if (totalLen <= lineChunkLength) {
    var lnglats = list.map(function (d) {
      return [d.c1, d.c2];
    });
    return lnglats;
  }

  if (list.length === 1) {
    if (list[0].len <= lineChunkLength) {
      return [[list[0].c1, list[0].c2]];
    }
  }

  var LNGLATSLEN = list.length;
  var first = list[0];
  var idx = 0;
  var currentLngLat;
  var currentLen = 0;
  var lines = [];
  var lls = [first.c1];

  while (idx < LNGLATSLEN) {
    var _list$idx = list[idx],
        _len = _list$idx.len,
        c2 = _list$idx.c2;
    currentLen += _len;

    if (currentLen < lineChunkLength) {
      lls.push(c2);

      if (idx === LNGLATSLEN - 1) {
        lines.push(lls);
      }

      idx++;
    }

    if (currentLen === lineChunkLength) {
      lls.push(c2);
      currentLen = 0;
      lines.push(lls); //next

      lls = [c2];
      idx++;
    }

    if (currentLen > lineChunkLength) {
      var offsetLen = _len - currentLen + lineChunkLength;
      currentLngLat = getPercentLngLat(list[idx], offsetLen);
      lls.push(currentLngLat);
      lines.push(lls);
      currentLen = 0;
      list[idx].c1 = currentLngLat;
      list[idx].len = _len - offsetLen; //next

      lls = [];
      lls.push(currentLngLat);
    }
  }

  return lines;
}

var MAX_POINTS = 1000;
/**
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {*} ps
 * @param {*} norls
 * @param {*} indices
 */

function setExtrudeLineGeometryAttribute(geometry, ps, norls, indices) {
  var len = ps.length;
  geometry.attributes.normal.count = len;
  geometry.attributes.position.count = len;
  var positions = geometry.attributes.position.array;
  var normals = geometry.attributes.normal.array;

  for (var i = 0; i < len; i++) {
    positions[i] = ps[i];
    normals[i] = norls[i];
  } // geometry.index.array = new Uint16Array(indices.length);


  geometry.index.count = indices.length; // geometry.index.needsUpdate = true;

  for (var _i = 0, len1 = indices.length; _i < len1; _i++) {
    geometry.index.array[_i] = indices[_i];
  } // geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
  // geometry.setDrawRange(0, len / 3);

}

var OPTIONS$6 = {
  trail: 5,
  chunkLength: 50,
  width: 2,
  height: 1,
  speed: 1,
  altitude: 0,
  interactive: false
};
/**
 *
 */

var ExtrudeLineTrail =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(ExtrudeLineTrail, _BaseObject);

  function ExtrudeLineTrail(lineString, options, material, layer) {
    var _this;

    options = Util.extend({}, OPTIONS$6, options, {
      layer: layer,
      lineString: lineString
    });
    _this = _BaseObject.call(this) || this;

    _this._initOptions(options);

    var _options = options,
        width = _options.width,
        height = _options.height,
        altitude = _options.altitude,
        speed = _options.speed,
        chunkLength = _options.chunkLength,
        trail = _options.trail;
    var chunkLines = lineSlice(lineString, chunkLength);
    var centerPt = layer.coordinateToVector3(lineString.getCenter()); //cache position for  faster computing,reduce double counting

    var positionMap = {};

    for (var i = 0, len = chunkLines.length; i < len; i++) {
      var chunkLine = chunkLines[i];

      for (var j = 0, len1 = chunkLine.length; j < len1; j++) {
        var lnglat = chunkLine[j];
        var key = lnglat.join(',').toString();

        if (!positionMap[key]) {
          positionMap[key] = layer.coordinateToVector3(lnglat).sub(centerPt);
        }
      }
    }

    var positions = getChunkLinesPosition(chunkLines.slice(0, 1), layer, positionMap, centerPt).positionsV; //generate geometry

    var geometry = new BufferGeometry();
    var ps = new Float32Array(MAX_POINTS * 3); // 3 vertices per point

    var norls = new Float32Array(MAX_POINTS * 3); // 3 vertices per point

    var inds = new Uint16Array(MAX_POINTS);
    geometry.addAttribute('position', new BufferAttribute(ps, 3).setDynamic(true));
    geometry.addAttribute('normal', new BufferAttribute(norls, 3).setDynamic(true));
    geometry.setIndex(new BufferAttribute(inds, 1));
    var lineWidth = layer.distanceToVector3(width, width).x;
    var depth = layer.distanceToVector3(height, height).x;
    var params = getExtrudeLineParams(positions, lineWidth, depth, layer);
    setExtrudeLineGeometryAttribute(geometry, params.position, params.normal, params.indices);

    _this._createMesh(geometry, material);

    var z = layer.distanceToVector3(altitude, altitude).x;
    var center = lineString.getCenter();
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v);

    _this._params = {
      index: 0,
      chunkLines: chunkLines,
      geometries: [],
      layer: layer,
      trail: Math.max(1, trail),
      lineWidth: lineWidth,
      depth: depth,
      speed: Math.min(1, speed),
      idx: 0,
      loaded: false,
      positionMap: positionMap,
      centerPt: centerPt
    };

    _this._init(_this._params);

    return _this;
  }
  /**
   * Follow-up support for adding webworker
   * @param {*} params
   */


  var _proto = ExtrudeLineTrail.prototype;

  _proto._init = function _init(params) {
    var layer = params.layer,
        trail = params.trail,
        lineWidth = params.lineWidth,
        depth = params.depth,
        chunkLines = params.chunkLines,
        positionMap = params.positionMap,
        centerPt = params.centerPt;
    var len = chunkLines.length,
        geometries = [];

    for (var i = 0; i < len; i++) {
      var lines = chunkLines.slice(i, i + trail);
      var ps = getChunkLinesPosition(lines, layer, positionMap, centerPt).positionsV;
      geometries.push(getExtrudeLineParams(ps, lineWidth, depth, layer));
    }

    this._params.geometries = geometries;
    this._params.loaded = true;
  };

  _proto._animation = function _animation() {
    var _this$_params = this._params,
        index = _this$_params.index,
        geometries = _this$_params.geometries,
        speed = _this$_params.speed,
        idx = _this$_params.idx,
        chunkLines = _this$_params.chunkLines,
        trail = _this$_params.trail,
        lineWidth = _this$_params.lineWidth,
        depth = _this$_params.depth,
        loaded = _this$_params.loaded,
        layer = _this$_params.layer,
        positionMap = _this$_params.positionMap,
        centerPt = _this$_params.centerPt;
    if (!loaded) return;
    var i = Math.round(index);

    if (i > idx) {
      this._params.idx++;
      var p = geometries[i]; //if not init, this is will running

      if (!p) {
        var lines = chunkLines.slice(i, i + trail);
        var ps = getChunkLinesPosition(lines, layer, positionMap, centerPt).positionsV;
        p = getExtrudeLineParams(ps, lineWidth, depth, layer);
        geometries[i] = p;
      }

      setExtrudeLineGeometryAttribute(this.getObject3d().geometry, p.position, p.normal, p.indices);
      this.getObject3d().geometry.attributes.position.needsUpdate = true;
      this.getObject3d().geometry.attributes.normal.needsUpdate = true;
      this.getObject3d().geometry.index.needsUpdate = true;
    }

    if (index >= chunkLines.length - 1) {
      this._params.index = -1;
      this._params.idx = -1;
    }

    this._params.index += speed;
  };

  return ExtrudeLineTrail;
}(BaseObject$$1);

var EVENTS = ['click', 'mousemove', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].join(' ').toString();
/**
 * This is for the merger, MergedExtrudeMesh,Points ...
 * @param {*} Base
 */

var MergedMixin = function MergedMixin(Base) {
  return (
    /*#__PURE__*/
    function (_Base) {
      _inheritsLoose(_class, _Base);

      function _class() {
        return _Base.apply(this, arguments) || this;
      }

      var _proto = _class.prototype;

      // this._faceMap=[];
      // this._baseObjects = [];
      // this._data = [];
      // this.faceIndex = null;
      // this.index=null;
      // this._geometriesAttributes = [];
      // this._geometryCache = geometry.clone();
      // this.isHide = false;

      /**
       *
       * @param {*} baseObjects
       */
      _proto._initBaseObjectsEvent = function _initBaseObjectsEvent(baseObjects) {
        if (baseObjects && Array.isArray(baseObjects) && baseObjects.length) {
          for (var i = 0, len = baseObjects.length; i < len; i++) {
            var baseObject = baseObjects[i];

            this._proxyEvent(baseObject);
          }
        }

        return this;
      }
      /**
       *Events representing the merge
       * @param {*} baseObject
       */
      ;

      _proto._proxyEvent = function _proxyEvent(baseObject) {
        var _this = this;

        baseObject.on('add', function (e) {
          _this._showGeometry(e.target, true);
        });
        baseObject.on('remove', function (e) {
          _this._showGeometry(e.target, false);
        });
        baseObject.on('mouseout', function (e) {
          _this._mouseover = false;

          _this._fire('mouseout', Object.assign({}, e, {
            target: _this,
            selectMesh: _this.getSelectMesh ? _this.getSelectMesh() : null
          })); // this._showGeometry(e.target, false);

        });
        baseObject.on(EVENTS, function (e) {
          _this._fire(e.type, Object.assign({}, e, {
            target: _this,
            selectMesh: _this.getSelectMesh ? _this.getSelectMesh() : null
          }));
        });
      }
      /**
       * Get the index of the monomer to be hidden
       * @param {*} attribute
       */
      ;

      _proto._getHideGeometryIndex = function _getHideGeometryIndex(attribute) {
        var indexs = [];
        var count = 0;

        for (var i = 0, len = this._geometriesAttributes.length; i < len; i++) {
          if (this._geometriesAttributes[i].hide === true) {
            indexs.push(i);
            count += this._geometriesAttributes[i][attribute].count;
          }
        }

        return {
          indexs: indexs,
          count: count
        };
      }
      /**
       * update geometry attributes
       * @param {*} bufferAttribute
       * @param {*} attribute
       */
      ;

      _proto._updateAttribute = function _updateAttribute(bufferAttribute, attribute) {
        var _this$_getHideGeometr = this._getHideGeometryIndex(attribute),
            indexs = _this$_getHideGeometr.indexs;

        var array = this._geometryCache.attributes[attribute].array;
        var len = array.length;

        for (var i = 0; i < len; i++) {
          bufferAttribute.array[i] = array[i];
        }

        var value = NaN;

        if (this.getObject3d() instanceof LineSegments) {
          value = 0;
        }

        for (var j = 0; j < indexs.length; j++) {
          var index = indexs[j];
          var _this$_geometriesAttr = this._geometriesAttributes[index][attribute],
              start = _this$_geometriesAttr.start,
              end = _this$_geometriesAttr.end;

          for (var _i = start; _i < end; _i++) {
            bufferAttribute.array[_i] = value;
          }
        }

        return this;
      }
      /**
       * show or hide monomer
       * @param {*} baseObject
       * @param {*} isHide
       */
      ;

      _proto._showGeometry = function _showGeometry(baseObject, isHide) {
        var index;

        if (baseObject) {
          index = baseObject.getOptions().index;
        }

        if (index != null) {
          var geometryAttributes = this._geometriesAttributes[index];
          var hide = geometryAttributes.hide;

          if (hide === isHide) {
            return this;
          }

          geometryAttributes.hide = isHide;
          var buffGeom = this.getObject3d().geometry;

          this._updateAttribute(buffGeom.attributes.position, 'position'); // this._updateAttribute(buffGeom.attributes.normal, 'normal', 3);
          // this._updateAttribute(buffGeom.attributes.color, 'color', 3);
          // this._updateAttribute(buffGeom.attributes.uv, 'uv', 2);


          buffGeom.attributes.position.needsUpdate = true; // buffGeom.attributes.color.needsUpdate = true;
          // buffGeom.attributes.normal.needsUpdate = true;
          // buffGeom.attributes.uv.needsUpdate = true;

          this.isHide = isHide;
        }

        return this;
      }
      /**
       * Get selected monomer
       */
      ;

      _proto.getSelectMesh = function getSelectMesh() {
        return {
          data: null,
          baseObject: null
        };
      };

      return _class;
    }(Base)
  );
};

var OPTIONS$7 = {
  altitude: 0,
  height: 1,
  topColor: null,
  bottomColor: '#2d2f61'
};

var ExtrudePolygons =
/*#__PURE__*/
function (_MergedMixin) {
  _inheritsLoose(ExtrudePolygons, _MergedMixin);

  function ExtrudePolygons(polygons, options, material, layer) {
    var _this;

    if (!BufferGeometryUtils) {
      console.error('not find BufferGeometryUtils,please include related scripts');
    }

    if (!Array.isArray(polygons)) {
      polygons = [polygons];
    }

    var centers = [];
    var len = polygons.length;

    for (var i = 0; i < len; i++) {
      var polygon = polygons[i];
      centers.push(polygon.getCenter());
    } // Get the center point of the point set


    var center = getCenterOfPoints(centers);
    var geometries = [],
        extrudePolygons = [];
    var faceIndex = 0,
        faceMap = [],
        geometriesAttributes = [],
        psIndex = 0,
        normalIndex = 0,
        uvIndex = 0;

    for (var _i = 0; _i < len; _i++) {
      var _polygon = polygons[_i];
      var height = (_polygon.getProperties() || {}).height || 1;
      var buffGeom = getExtrudeGeometry(_polygon, height, layer, center);
      geometries.push(buffGeom);
      var extrudePolygon = new ExtrudePolygon(_polygon, Object.assign({}, options, {
        height: height,
        index: _i
      }), material, layer);
      extrudePolygons.push(extrudePolygon);

      var _geometry = new Geometry();

      _geometry.fromBufferGeometry(buffGeom);

      var faceLen = _geometry.faces.length;
      faceMap[_i] = [faceIndex + 1, faceIndex + faceLen];
      faceIndex += faceLen;

      _geometry.dispose();

      var psCount = buffGeom.attributes.position.count,
          //  colorCount = buffGeom.attributes.color.count,
      normalCount = buffGeom.attributes.normal.count,
          uvCount = buffGeom.attributes.uv.count;
      geometriesAttributes[_i] = {
        position: {
          count: psCount,
          start: psIndex,
          end: psIndex + psCount * 3
        },
        normal: {
          count: normalCount,
          start: normalIndex,
          end: normalIndex + normalCount * 3
        },
        // color: {
        //     count: colorCount,
        //     start: colorIndex,
        //     end: colorIndex + colorCount * 3,
        // },
        uv: {
          count: uvCount,
          start: uvIndex,
          end: uvIndex + uvCount * 2
        },
        hide: false
      };
      psIndex += psCount * 3;
      normalIndex += normalCount * 3; // colorIndex += colorCount * 3;

      uvIndex += uvCount * 2;
    }

    var geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    options = Util.extend({}, OPTIONS$7, options, {
      layer: layer,
      polygons: polygons,
      coordinate: center
    });
    _this = _MergedMixin.call(this) || this;

    _this._initOptions(options);

    var _options = options,
        topColor = _options.topColor,
        bottomColor = _options.bottomColor,
        altitude = _options.altitude;

    if (topColor && !material.map) {
      initVertexColors$1(geometry, bottomColor, topColor);
      material.vertexColors = VertexColors;
    }

    _this._createMesh(geometry, material);

    var z = layer.distanceToVector3(altitude, altitude).x;
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v); //Face corresponding to monomer


    _this._faceMap = faceMap;
    _this._baseObjects = extrudePolygons;
    _this._datas = polygons;
    _this._geometriesAttributes = geometriesAttributes;
    _this.faceIndex = null;
    _this._geometryCache = geometry.clone();
    _this.isHide = false;

    _this._initBaseObjectsEvent(extrudePolygons);

    return _this;
  } // eslint-disable-next-line consistent-return


  var _proto = ExtrudePolygons.prototype;

  _proto.getSelectMesh = function getSelectMesh() {
    var index = this._getIndex();

    if (index != null) {
      return {
        data: this._datas[index],
        baseObject: this._baseObjects[index]
      };
    }
  } // eslint-disable-next-line consistent-return
  ;

  _proto._getIndex = function _getIndex(faceIndex) {
    if (faceIndex == null) {
      faceIndex = this.faceIndex;
    }

    if (faceIndex != null) {
      for (var i = 0, _len = this._faceMap.length; i < _len; i++) {
        var _this$_faceMap$i = this._faceMap[i],
            start = _this$_faceMap$i[0],
            end = _this$_faceMap$i[1];

        if (start <= faceIndex && faceIndex < end) {
          return i;
        }
      }
    }
  };

  return ExtrudePolygons;
}(MergedMixin(BaseObject$$1));

/* eslint-disable indent */

function vector2Pixel(world_vector, size, camera) {
  // eslint-disable-next-line camelcase
  var vector = world_vector.project(camera);
  var halfWidth = size.width / 2;
  var halfHeight = size.height / 2;
  var result = {
    x: Math.round(vector.x * halfWidth + halfWidth),
    y: Math.round(-vector.y * halfHeight + halfHeight)
  };
  return result;
}

var OPTIONS$8 = {
  altitude: 0,
  height: 0
};
var vector = new Vector3();

var Point =
/*#__PURE__*/
function (_BaseObject) {
  _inheritsLoose(Point, _BaseObject);

  function Point(coordinate, options, material, layer) {
    var _this;

    options = Util.extend({}, OPTIONS$8, options, {
      layer: layer,
      coordinate: coordinate
    });
    _this = _BaseObject.call(this) || this;
    var _options = options,
        height = _options.height,
        altitude = _options.altitude,
        color = _options.color;
    var vs = [],
        colors = [];

    if (color) {
      color = color instanceof Color ? color : new Color(color);
      colors.push(color.r, color.g, color.b);
    }

    var z = layer.distanceToVector3(height, height).x;
    var v = layer.coordinateToVector3(coordinate, z);
    vs.push(v.x, v.y, v.z);
    var geometry = new BufferGeometry();
    geometry.addAttribute('position', new Float32BufferAttribute(vs, 3, true));

    if (colors.length) {
      geometry.addAttribute('color', new Float32BufferAttribute(colors, 3, true));
    }

    options.positions = v;

    _this._initOptions(options);

    _this._createPoints(geometry, material);

    var z1 = layer.distanceToVector3(altitude, altitude).x;
    _this.getObject3d().position.z = z1;
    return _this;
  }
  /**
   *
   * @param {maptalks.Coordinate} coordinate
   */


  var _proto = Point.prototype;

  _proto.identify = function identify(coordinate) {
    var layer = this.getLayer(),
        size = this.getMap().getSize(),
        camera = this.getLayer().getCamera(),
        positions = this.getOptions().positions,
        altitude = this.getOptions().altitude; //Size of points

    var pointSize = this.getObject3d().material.size;
    var pixel = this.getMap().coordToContainerPoint(coordinate);
    var z = layer.distanceToVector3(altitude, altitude).x;
    vector.x = positions.x;
    vector.y = positions.y;
    vector.z = positions.z + z; //3D vector to screen coordinates

    var p = vector2Pixel(vector, size, camera); //Distance between two points

    var distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));

    if (distance <= pointSize / 2) {
      return true;
    }

    return false;
  };

  return Point;
}(BaseObject$$1);

var ROW = 30,
    COL = 30;

function contains(b, p) {
  var minx = b.minx,
      miny = b.miny,
      maxx = b.maxx,
      maxy = b.maxy;
  var x = p[0],
      y = p[1];

  if (minx <= x && x <= maxx && miny <= y && y <= maxy) {
    return true;
  }

  return false;
}

var BBox =
/*#__PURE__*/
function () {
  function BBox(minlng, minlat, maxlng, maxlat) {
    this.minlng = minlng;
    this.minlat = minlat;
    this.maxlng = maxlng;
    this.maxlat = maxlat;
    this.minx = Infinity;
    this.miny = Infinity;
    this.maxx = -Infinity;
    this.maxy = -Infinity;
    this.coordinates = [];
    this.positions = [];
    this.indexs = [];
    this.key = null;
  }
  /**
   *
   * @param {*} map
   */


  var _proto = BBox.prototype;

  _proto.updateBBoxPixel = function updateBBoxPixel(map) {
    var minx = Infinity,
        miny = Infinity,
        maxx = -Infinity,
        maxy = -Infinity;
    var minlng = this.minlng,
        minlat = this.minlat,
        maxlng = this.maxlng,
        maxlat = this.maxlat;
    [[minlng, minlat], [minlng, maxlat], [maxlng, minlat], [maxlng, maxlat]].map(function (lnglat) {
      return new Coordinate(lnglat);
    }).map(function (coordinate) {
      return map.coordToContainerPoint(coordinate);
    }).forEach(function (pixel) {
      minx = Math.min(minx, pixel.x);
      miny = Math.min(miny, pixel.y);
      maxx = Math.max(maxx, pixel.x);
      maxy = Math.max(maxy, pixel.y);
    });
    this.minx = minx;
    this.miny = miny;
    this.maxx = maxx;
    this.maxy = maxy;
    return this;
  }
  /**
   *Determine whether a point is included
   * @param {*} c
   */
  ;

  _proto.containsCoordinate = function containsCoordinate(c) {
    var lng, lat;

    if (Array.isArray(c)) {
      lng = c[0];
      lat = c[1];
    } else if (c instanceof Coordinate) {
      lng = c.x;
      lat = c.y;
    }

    var minlng = this.minlng,
        minlat = this.minlat,
        maxlng = this.maxlng,
        maxlat = this.maxlat;

    if (minlng <= lng && lng <= maxlng && minlat <= lat & lat <= maxlat) {
      return true;
    }

    return false;
  }
  /**
   *Judge rectangle intersection
   * @param {*} pixel
   * @param {*} size
   */
  ;

  _proto.isRecCross = function isRecCross(pixel, size) {
    var x = pixel.x,
        y = pixel.y;
    var rec = {
      minx: x - size / 2,
      miny: y - size / 2,
      maxx: x + size / 2,
      maxy: y + size / 2
    };
    var minx = rec.minx,
        miny = rec.miny,
        maxx = rec.maxx,
        maxy = rec.maxy;

    if (contains(this, [minx, miny]) || contains(this, [minx, maxy]) || contains(this, [maxx, miny]) || contains(this, [maxx, maxy]) || contains(rec, [this.minx, this.miny]) || contains(rec, [this.minx, this.maxy]) || contains(rec, this.maxx, this.miny) || contains(rec, this.maxx, this.maxy)) {
      return true;
    }

    return false;
  }
  /**
   *generate grids
   * @param {*} minlng
   * @param {*} minlat
   * @param {*} maxlng
   * @param {*} maxlat
   */
  ;

  BBox.initGrids = function initGrids(minlng, minlat, maxlng, maxlat) {
    var grids = [],
        offsetX = maxlng - minlng,
        offsetY = maxlat - minlat;
    var averageX = offsetX / COL,
        averageY = offsetY / ROW;
    var x = minlng,
        y = minlat;

    for (var i = 0; i < COL; i++) {
      x = minlng + i * averageX;

      for (var j = 0; j < ROW; j++) {
        y = minlat + j * averageY;
        var bounds = new BBox(x, y, x + averageX, y + averageY);
        bounds.key = j + '-' + i;
        grids.push(bounds);
      }
    }

    return grids;
  };

  return BBox;
}();

var OPTIONS$9 = {
  altitude: 0
};
var MAX = 100000;
var vector$1 = new Vector3();
/**
 *points
 */

var Points$1 =
/*#__PURE__*/
function (_MergedMixin) {
  _inheritsLoose(Points$$1, _MergedMixin);

  function Points$$1(points, options, material, layer) {
    var _this;

    if (!Array.isArray(points)) {
      points = [points];
    }

    options = Util.extend({}, OPTIONS$9, options, {
      layer: layer,
      points: points
    });
    var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    for (var i = 0, len = points.length; i < len; i++) {
      var coordinate = points[i].coordinate;
      var x = void 0,
          y = void 0;

      if (Array.isArray(coordinate)) {
        x = coordinate[0];
        y = coordinate[1];
      } else if (coordinate instanceof Coordinate) {
        x = coordinate.x;
        y = coordinate.y;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    var grids = BBox.initGrids(minX, minY, maxX, maxY);
    var gridslen = grids.length;
    var vs = [],
        vectors = [],
        colors = [],
        pointMeshes = [],
        geometriesAttributes = [];

    for (var _i = 0, _len = points.length; _i < _len; _i++) {
      var _points$_i = points[_i],
          _coordinate = _points$_i.coordinate,
          height = _points$_i.height,
          color = _points$_i.color;

      if (color) {
        color = color instanceof Color ? color : new Color(color);
        colors.push(color.r, color.g, color.b);
      }

      var _z = layer.distanceToVector3(height, height).x;
      var v = layer.coordinateToVector3(_coordinate, _z);
      vs.push(v.x, v.y, v.z);
      vectors.push(v); //Do not initialize the monomer when the data volume is too large

      if (_len <= MAX) {
        var point = new Point(_coordinate, {
          height: height,
          index: _i
        }, material, layer);
        pointMeshes.push(point);
      }

      geometriesAttributes[_i] = {
        position: {
          count: 1,
          start: _i * 3,
          end: _i * 3 + 3
        },
        hide: false
      };

      for (var j = 0; j < gridslen; j++) {
        if (grids[j].containsCoordinate(_coordinate)) {
          // grids[j].coordinates.push(coordinate);
          grids[j].positions.push(v);
          grids[j].indexs.push(_i);
          break;
        }
      }
    }

    var geometry = new BufferGeometry();
    geometry.addAttribute('position', new Float32BufferAttribute(vs, 3, true));

    if (colors.length) {
      geometry.addAttribute('color', new Float32BufferAttribute(colors, 3, true));
    } //for identify


    options.positions = vectors;
    _this = _MergedMixin.call(this) || this;

    _this._initOptions(options);

    _this._createPoints(geometry, material);

    var altitude = options.altitude;
    var z = layer.distanceToVector3(altitude, altitude).x;
    _this.getObject3d().position.z = z;
    _this._baseObjects = pointMeshes;
    _this._data = points;
    _this.faceIndex = null;
    _this._geometriesAttributes = geometriesAttributes;
    _this._geometryCache = geometry.clone();
    _this.isHide = false;

    _this._initBaseObjectsEvent(pointMeshes);

    _this._grids = grids;

    _this._bindMapEvents();

    return _this;
  }

  var _proto = Points$$1.prototype;

  _proto._bindMapEvents = function _bindMapEvents() {
    var _this2 = this;

    var map = this.getMap();
    this.on('add', function () {
      _this2._updateGrids();

      map.on('zoomstart zooming zoomend movestart moving moveend pitch rotate', _this2._updateGrids, _this2);
    });
    this.on('remove', function () {
      map.off('zoomstart zooming zoomend movestart moving moveend pitch rotate', _this2._updateGrids, _this2);
    });
  };

  _proto._updateGrids = function _updateGrids() {
    var map = this.getMap();

    this._grids.forEach(function (b) {
      if (b.indexs.length) {
        b.updateBBoxPixel(map);
      }
    });
  } // eslint-disable-next-line consistent-return
  ;

  _proto.getSelectMesh = function getSelectMesh() {
    var index = this.faceIndex;

    if (index != null) {
      if (!this._baseObjects[index]) {
        var data = this._data[index];
        var coordinate = data.coordinate,
            height = data.height,
            color = data.color;
        this._baseObjects[index] = new Point(coordinate, {
          height: height,
          index: index,
          color: color
        }, this.getObject3d().material, this.getLayer());

        this._proxyEvent(this._baseObjects[index]);
      }

      return {
        data: this._data[index],
        baseObject: this._baseObjects[index]
      };
    }
  }
  /**
  *
  * @param {maptalks.Coordinate} coordinate
  */
  ;

  _proto.identify = function identify(coordinate) {
    var layer = this.getLayer(),
        size = this.getMap().getSize(),
        camera = this.getLayer().getCamera(),
        altitude = this.getOptions().altitude,
        map = this.getMap();
    var z = layer.distanceToVector3(altitude, altitude).x;
    var pointSize = this.getObject3d().material.size;
    var pixel = map.coordToContainerPoint(coordinate);
    var bs = [];

    this._grids.forEach(function (b) {
      if (b.indexs.length) {
        if (b.isRecCross(pixel, pointSize)) {
          bs.push(b);
        }
      }
    });

    if (bs.length < 1) {
      return false;
    }

    for (var i = 0, len = bs.length; i < len; i++) {
      for (var j = 0, len1 = bs[i].positions.length; j < len1; j++) {
        var v = bs[i].positions[j];
        vector$1.x = v.x;
        vector$1.y = v.y;
        vector$1.z = v.z + z;
        var p = vector2Pixel(vector$1, size, camera);
        var distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));

        if (distance <= pointSize / 2) {
          this.faceIndex = bs[i].indexs[j];
          return true;
        }
      }
    } // for (let i = 0, len = positions.length; i < len; i++) {
    //     const v = positions[i];
    //     vector.x = v.x;
    //     vector.y = v.y;
    //     vector.z = v.z + z;
    //     const p = vector2Pixel(vector, size, camera);
    //     const distance = Math.sqrt(Math.pow(pixel.x - p.x, 2) + Math.pow(pixel.y - p.y, 2));
    //     if (distance <= pointSize / 2) {
    //         this.faceIndex = i;
    //         console.timeEnd(timer);
    //         return true;
    //     }
    // }


    return false;
  };

  return Points$$1;
}(MergedMixin(BaseObject$$1));

var OPTIONS$a = {
  coordinate: null,
  radius: 10,
  height: 100,
  radialSegments: 6,
  altitude: 0,
  topColor: null,
  bottomColor: '#2d2f61'
};
/**
 * merged bars
 */

var Bars =
/*#__PURE__*/
function (_MergedMixin) {
  _inheritsLoose(Bars, _MergedMixin);

  function Bars(points, options, material, layer) {
    var _this;

    if (!BufferGeometryUtils) {
      console.error('not find BufferGeometryUtils,please include related scripts');
    }

    if (!Array.isArray(points)) {
      points = [points];
    }

    var len = points.length;
    var geometries = [],
        bars = [],
        geometriesAttributes = [],
        faceMap = [];
    var faceIndex = 0,
        psIndex = 0,
        normalIndex = 0,
        uvIndex = 0;

    for (var i = 0; i < len; i++) {
      var opts = Util.extend({
        index: i
      }, OPTIONS$a, points[i]);
      var radius = opts.radius,
          radialSegments = opts.radialSegments,
          altitude = opts.altitude,
          topColor = opts.topColor,
          bottomColor = opts.bottomColor,
          height = opts.height,
          coordinate = opts.coordinate;
      var r = layer.distanceToVector3(radius, radius).x;
      var h = layer.distanceToVector3(height, height).x;
      var alt = layer.distanceToVector3(altitude, altitude).x;
      var buffGeom = getGeometry({
        radius: r,
        height: h,
        radialSegments: radialSegments
      }, false);

      if (topColor && !material.map) {
        initVertexColors(buffGeom, bottomColor, topColor, 'z', h / 2);
        material.vertexColors = VertexColors;
      } // buffGeom.rotateX(Math.PI / 2);


      var v = layer.coordinateToVector3(coordinate);
      var parray = buffGeom.attributes.position.array;

      for (var j = 0, len1 = parray.length; j < len1; j += 3) {
        parray[j + 2] += alt;
        parray[j] += v.x;
        parray[j + 1] += v.y;
        parray[j + 2] += v.z;
      }

      geometries.push(buffGeom);
      var bar = new Bar(coordinate, opts, material, layer);
      bars.push(bar);

      var _geometry = new Geometry();

      _geometry.fromBufferGeometry(buffGeom);

      var faceLen = _geometry.faces.length;
      faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
      faceIndex += faceLen;

      _geometry.dispose();

      var psCount = buffGeom.attributes.position.count,
          //  colorCount = buffGeom.attributes.color.count,
      normalCount = buffGeom.attributes.normal.count,
          uvCount = buffGeom.attributes.uv.count;
      geometriesAttributes[i] = {
        position: {
          count: psCount,
          start: psIndex,
          end: psIndex + psCount * 3
        },
        normal: {
          count: normalCount,
          start: normalIndex,
          end: normalIndex + normalCount * 3
        },
        // color: {
        //     count: colorCount,
        //     start: colorIndex,
        //     end: colorIndex + colorCount * 3,
        // },
        uv: {
          count: uvCount,
          start: uvIndex,
          end: uvIndex + uvCount * 2
        },
        hide: false
      };
      psIndex += psCount * 3;
      normalIndex += normalCount * 3; // colorIndex += colorCount * 3;

      uvIndex += uvCount * 2;
    }

    _this = _MergedMixin.call(this) || this;
    options = Util.extend({}, {
      altitude: 0,
      layer: layer,
      points: points
    }, options);

    _this._initOptions(options);

    var geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

    _this._createMesh(geometry, material);

    _this._faceMap = faceMap;
    _this._baseObjects = bars;
    _this._datas = points;
    _this._geometriesAttributes = geometriesAttributes;
    _this.faceIndex = null;
    _this._geometryCache = geometry.clone();
    _this.isHide = false;

    _this._initBaseObjectsEvent(bars);

    return _this;
  } // eslint-disable-next-line consistent-return


  var _proto = Bars.prototype;

  _proto.getSelectMesh = function getSelectMesh() {
    var index = this._getIndex();

    if (index != null) {
      return {
        data: this._datas[index],
        baseObject: this._baseObjects[index]
      };
    }
  } // eslint-disable-next-line consistent-return
  ;

  _proto._getIndex = function _getIndex(faceIndex) {
    if (faceIndex == null) {
      faceIndex = this.faceIndex;
    }

    if (faceIndex != null) {
      for (var i = 0, _len = this._faceMap.length; i < _len; i++) {
        var _this$_faceMap$i = this._faceMap[i],
            start = _this$_faceMap$i[0],
            end = _this$_faceMap$i[1];

        if (start <= faceIndex && faceIndex < end) {
          return i;
        }
      }
    }
  };

  return Bars;
}(MergedMixin(BaseObject$$1));

var OPTIONS$b = {
  width: 3,
  height: 1,
  altitude: 0
};

var ExtrudeLines =
/*#__PURE__*/
function (_MergedMixin) {
  _inheritsLoose(ExtrudeLines, _MergedMixin);

  function ExtrudeLines(lineStrings, options, material, layer) {
    var _this;

    if (!BufferGeometryUtils) {
      console.error('not find BufferGeometryUtils,please include related scripts');
    }

    if (!Array.isArray(lineStrings)) {
      lineStrings = [lineStrings];
    }

    var centers = [];
    var len = lineStrings.length;

    for (var i = 0; i < len; i++) {
      var lineString = lineStrings[i];
      centers.push(lineString.getCenter());
    } // Get the center point of the point set


    var center = getCenterOfPoints(centers);
    var geometries = [],
        extrudeLines = [];
    var faceIndex = 0,
        faceMap = [],
        geometriesAttributes = [],
        psIndex = 0,
        normalIndex = 0;

    for (var _i = 0; _i < len; _i++) {
      var _lineString = lineStrings[_i];
      var opts = Util.extend({}, OPTIONS$b, _lineString.getProperties(), {
        index: _i
      });
      var height = opts.height,
          width = opts.width;
      var w = layer.distanceToVector3(width, width).x;
      var h = layer.distanceToVector3(height, height).x;
      var buffGeom = getExtrudeLineGeometry(_lineString, w, h, layer, center);
      geometries.push(buffGeom);
      var extrudeLine = new ExtrudeLine(_lineString, opts, material, layer);
      extrudeLines.push(extrudeLine);

      var _geometry = new Geometry();

      _geometry.fromBufferGeometry(buffGeom);

      var faceLen = _geometry.faces.length;
      faceMap[_i] = [faceIndex + 1, faceIndex + faceLen];
      faceIndex += faceLen;

      _geometry.dispose();

      var psCount = buffGeom.attributes.position.count,
          //  colorCount = buffGeom.attributes.color.count,
      normalCount = buffGeom.attributes.normal.count;
      geometriesAttributes[_i] = {
        position: {
          count: psCount,
          start: psIndex,
          end: psIndex + psCount * 3
        },
        normal: {
          count: normalCount,
          start: normalIndex,
          end: normalIndex + normalCount * 3
        },
        // color: {
        //     count: colorCount,
        //     start: colorIndex,
        //     end: colorIndex + colorCount * 3,
        // },
        // uv: {
        //     count: uvCount,
        //     start: uvIndex,
        //     end: uvIndex + uvCount * 2,
        // },
        hide: false
      };
      psIndex += psCount * 3;
      normalIndex += normalCount * 3; // colorIndex += colorCount * 3;
      // uvIndex += uvCount * 2;
    }

    var geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    options = Util.extend({}, OPTIONS$b, options, {
      layer: layer,
      lineStrings: lineStrings,
      coordinate: center
    });
    _this = _MergedMixin.call(this) || this;

    _this._initOptions(options);

    _this._createMesh(geometry, material);

    var _options = options,
        altitude = _options.altitude;
    var z = layer.distanceToVector3(altitude, altitude).x;
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v); //Face corresponding to monomer


    _this._faceMap = faceMap;
    _this._baseObjects = extrudeLines;
    _this._datas = lineStrings;
    _this._geometriesAttributes = geometriesAttributes;
    _this.faceIndex = null;
    _this._geometryCache = geometry.clone();
    _this.isHide = false;

    _this._initBaseObjectsEvent(extrudeLines);

    return _this;
  } // eslint-disable-next-line consistent-return


  var _proto = ExtrudeLines.prototype;

  _proto.getSelectMesh = function getSelectMesh() {
    var index = this._getIndex();

    if (index != null) {
      return {
        data: this._datas[index],
        baseObject: this._baseObjects[index]
      };
    }
  } // eslint-disable-next-line consistent-return
  ;

  _proto._getIndex = function _getIndex(faceIndex) {
    if (faceIndex == null) {
      faceIndex = this.faceIndex;
    }

    if (faceIndex != null) {
      for (var i = 0, _len = this._faceMap.length; i < _len; i++) {
        var _this$_faceMap$i = this._faceMap[i],
            start = _this$_faceMap$i[0],
            end = _this$_faceMap$i[1];

        if (start <= faceIndex && faceIndex < end) {
          return i;
        }
      }
    }
  };

  return ExtrudeLines;
}(MergedMixin(BaseObject$$1));

var OPTIONS$c = {
  altitude: 0,
  colors: null
};
/**
 *
 */

var Lines =
/*#__PURE__*/
function (_MergedMixin) {
  _inheritsLoose(Lines, _MergedMixin);

  function Lines(lineStrings, options, material, layer) {
    var _this;

    if (!Array.isArray(lineStrings)) {
      lineStrings = [lineStrings];
    }

    var centers = [];
    var len = lineStrings.length;

    for (var i = 0; i < len; i++) {
      var lineString = lineStrings[i];
      centers.push(lineString.getCenter());
    } // Get the center point of the point set


    var center = getCenterOfPoints(centers);
    options = Util.extend({}, OPTIONS$c, options, {
      layer: layer,
      lineStrings: lineStrings,
      coordinate: center
    });
    var lines = [];
    var faceIndex = 0,
        faceMap = [],
        geometriesAttributes = [],
        psIndex = 0,
        ps = [];

    for (var _i = 0; _i < len; _i++) {
      var _lineString = lineStrings[_i];
      var opts = Util.extend({}, {
        altitude: options.altitude,
        index: _i
      }, _lineString.getProperties());

      var _getLinePosition = getLinePosition(_lineString, layer, center),
          positionsV = _getLinePosition.positionsV;

      for (var j = 0, len1 = positionsV.length; j < len1; j++) {
        var _v = positionsV[j];

        if (j > 0 && j < len1 - 1) {
          ps.push(_v.x, _v.y, _v.z);
        }

        ps.push(_v.x, _v.y, _v.z);
      }

      var line = new Line$1(_lineString, opts, material, layer);
      lines.push(line);
      var psCount = positionsV.length + positionsV.length - 2;
      var faceLen = psCount;
      faceMap[_i] = [faceIndex, faceIndex + faceLen];
      faceIndex += faceLen;
      geometriesAttributes[_i] = {
        position: {
          count: psCount,
          start: psIndex,
          end: psIndex + psCount * 3
        },
        hide: false
      };
      psIndex += psCount * 3;
    }

    var geometry = new BufferGeometry();
    geometry.addAttribute('position', new Float32BufferAttribute(ps, 3));
    _this = _MergedMixin.call(this) || this;

    _this._initOptions(options);

    _this._createLineSegments(geometry, material);

    var _options = options,
        altitude = _options.altitude;
    var z = layer.distanceToVector3(altitude, altitude).x;
    var v = layer.coordinateToVector3(center, z);

    _this.getObject3d().position.copy(v);

    _this._faceMap = faceMap;
    _this._baseObjects = lines;
    _this._datas = lineStrings;
    _this._geometriesAttributes = geometriesAttributes;
    _this.faceIndex = null;
    _this.index = null;
    _this._geometryCache = geometry.clone();
    _this.isHide = false;

    _this._initBaseObjectsEvent(lines);

    return _this;
  } // eslint-disable-next-line consistent-return


  var _proto = Lines.prototype;

  _proto.getSelectMesh = function getSelectMesh() {
    var index = this._getIndex();

    if (index != null) {
      return {
        data: this._datas[index],
        baseObject: this._baseObjects[index]
      };
    }
  } // eslint-disable-next-line consistent-return
  ;

  _proto._getIndex = function _getIndex(faceIndex) {
    if (faceIndex == null) {
      faceIndex = this.faceIndex || this.index;
    }

    if (faceIndex != null) {
      for (var i = 0, _len = this._faceMap.length; i < _len; i++) {
        var _this$_faceMap$i = this._faceMap[i],
            start = _this$_faceMap$i[0],
            end = _this$_faceMap$i[1];

        if (start <= faceIndex && faceIndex < end) {
          return i;
        }
      }
    }
  };

  return Lines;
}(MergedMixin(BaseObject$$1));

var options = {
  'renderer': 'gl',
  'doubleBuffer': false,
  'glOptions': null
};
var RADIAN = Math.PI / 180;
var LINEPRECISIONS = [[4000, 220], [2000, 100], [1000, 30], [500, 15], [100, 5], [50, 2], [10, 1], [5, 0.7], [2, 0.1], [1, 0.05], [0.5, 0.02]];
var EVENTS$1 = ['mousemove', 'click', 'mousedown', 'mouseup', 'dblclick', 'contextmenu', 'touchstart', 'touchmove', 'touchend'];
var MATRIX4 = new Matrix4();
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
  }
  /**
   * Draw method of ThreeLayer when map is interacting
   * In default, it calls renderScene, refresh the camera and the scene
   */
  ;

  _proto.drawOnInteracting = function drawOnInteracting() {
    this.renderScene();
  }
  /**
   * Convert a geographic coordinate to THREE Vector3
   * @param  {maptalks.Coordinate} coordinate - coordinate
   * @param {Number} [z=0] z value
   * @return {THREE.Vector3}
   */
  ;

  _proto.coordinateToVector3 = function coordinateToVector3(coordinate, z) {
    if (z === void 0) {
      z = 0;
    }

    var map = this.getMap();

    if (!map) {
      return null;
    }

    if (!(coordinate instanceof Coordinate)) {
      coordinate = new Coordinate(coordinate);
    }

    var p = map.coordinateToPoint(coordinate, getTargetZoom(map));
    return new Vector3(p.x, p.y, z);
  }
  /**
   * Convert geographic distance to THREE Vector3
   * @param  {Number} w - width
   * @param  {Number} h - height
   * @return {THREE.Vector3}
   */
  ;

  _proto.distanceToVector3 = function distanceToVector3(w, h, coord) {
    var map = this.getMap();
    var zoom = getTargetZoom(map);
    var center = coord || map.getCenter();

    if (!(center instanceof Coordinate)) {
      center = new Coordinate(center);
    }

    var target = map.locate(center, w, h);
    var p0 = map.coordinateToPoint(center, zoom),
        p1 = map.coordinateToPoint(target, zoom);
    var x = Math.abs(p1.x - p0.x) * Util.sign(w);
    var y = Math.abs(p1.y - p0.y) * Util.sign(h);
    return new Vector3(x, y, 0);
  }
  /**
   * Convert a Polygon or a MultiPolygon to THREE shape
   * @param  {maptalks.Polygon|maptalks.MultiPolygon} polygon - polygon or multipolygon
   * @return {THREE.Shape}
   */
  ;

  _proto.toShape = function toShape(polygon) {
    var _this = this;

    if (!polygon) {
      return null;
    }

    if (polygon instanceof MultiPolygon) {
      return polygon.getGeometries().map(function (c) {
        return _this.toShape(c);
      });
    }

    var center = polygon.getCenter();
    var centerPt = this.coordinateToVector3(center);
    var shell = polygon.getShell();
    var outer = shell.map(function (c) {
      return _this.coordinateToVector3(c).sub(centerPt);
    });
    var shape = new Shape(outer);
    var holes = polygon.getHoles();

    if (holes && holes.length > 0) {
      shape.holes = holes.map(function (item) {
        var pts = item.map(function (c) {
          return _this.coordinateToVector3(c).sub(centerPt);
        });
        return new Shape(pts);
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
  ;

  _proto.toExtrudeMesh = function toExtrudeMesh(polygon, altitude, material, height) {
    var _this2 = this;

    if (!polygon) {
      return null;
    }

    if (polygon instanceof MultiPolygon) {
      return polygon.getGeometries().map(function (c) {
        return _this2.toExtrudeMesh(c, altitude, material, height);
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
    height = Util.isNumber(height) ? height : altitude;
    height = this.distanceToVector3(height, height).x;
    var amount = this.distanceToVector3(altitude, altitude).x; //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

    var config = {
      'bevelEnabled': false,
      'bevelSize': 1
    };
    var name = parseInt(REVISION) >= 93 ? 'depth' : 'amount';
    config[name] = height;
    var geom = new ExtrudeGeometry(shape, config);
    var buffGeom = new BufferGeometry();
    buffGeom.fromGeometry(geom);
    var mesh = new Mesh(buffGeom, material);
    mesh.position.set(center.x, center.y, amount - height);
    return mesh;
  }
  /**
   *
   * @param {maptalks.Polygon|maptalks.MultiPolygon} polygon
   * @param {Object} options
   * @param {THREE.Material} material
   */
  ;

  _proto.toExtrudePolygon = function toExtrudePolygon(polygon, options, material) {
    return new ExtrudePolygon(polygon, options, material, this);
  }
  /**
   *
   * @param {maptalks.Coordinate} coordinate
   * @param {Object} options
   * @param {THREE.Material} material
   */
  ;

  _proto.toBar = function toBar(coordinate, options, material) {
    return new Bar(coordinate, options, material, this);
  }
  /**
  *
  * @param {maptalks.LineString} lineString
  * @param {Object} options
  * @param {THREE.LineMaterial} material
  */
  ;

  _proto.toLine = function toLine(lineString, options, material) {
    return new Line$1(lineString, options, material, this);
  }
  /**
   *
   * @param {maptalks.LineString} lineString
   * @param {Object} options
   * @param {THREE.Material} material
   */
  ;

  _proto.toExtrudeLine = function toExtrudeLine(lineString, options, material) {
    return new ExtrudeLine(lineString, options, material, this);
  }
  /**
   *
   * @param {THREE.Mesh|THREE.Group} model
   * @param {Object} options
   */
  ;

  _proto.toModel = function toModel(model, options) {
    return new Model(model, options, this);
  }
  /**
   *
   * @param {maptalks.LineString} lineString
   * @param {*} options
   * @param {THREE.Material} material
   */
  ;

  _proto.toExtrudeLineTrail = function toExtrudeLineTrail(lineString, options, material) {
    return new ExtrudeLineTrail(lineString, options, material, this);
  }
  /**
   *
   * @param {*} polygons
   * @param {*} options
   * @param {*} material
   */
  ;

  _proto.toExtrudePolygons = function toExtrudePolygons(polygons, options, material) {
    return new ExtrudePolygons(polygons, options, material, this);
  }
  /**
   *
   * @param {maptalks.Coordinate} coordinate
   * @param {*} options
   * @param {*} material
   */
  ;

  _proto.toPoint = function toPoint(coordinate, options, material) {
    return new Point(coordinate, options, material, this);
  }
  /**
   *
   * @param {Array} points
   * @param {*} options
   * @param {*} material
   */
  ;

  _proto.toPoints = function toPoints(points, options, material) {
    return new Points$1(points, options, material, this);
  }
  /**
   *
   * @param {Array} points
   * @param {*} options
   * @param {*} material
   */
  ;

  _proto.toBars = function toBars(points, options, material) {
    return new Bars(points, options, material, this);
  }
  /**
   *
   * @param {Array[maptalks.LineString]} lineStrings
   * @param {*} options
   * @param {*} material
   */
  ;

  _proto.toExtrudeLines = function toExtrudeLines(lineStrings, options, material) {
    return new ExtrudeLines(lineStrings, options, material, this);
  }
  /**
   *
   * @param {Array[maptalks.LineString]} lineStrings
   * @param {*} options
   * @param {*} material
   */
  ;

  _proto.toLines = function toLines(lineStrings, options, material) {
    return new Lines(lineStrings, options, material, this);
  };

  _proto.clearMesh = function clearMesh() {
    var scene = this.getScene();

    if (!scene) {
      return this;
    }

    for (var i = scene.children.length - 1; i >= 0; i--) {
      if (scene.children[i] instanceof Mesh) {
        scene.remove(scene.children[i]);
      }
    }

    return this;
  };

  _proto.lookAt = function lookAt(vector) {
    var renderer$$1 = this._getRenderer();

    if (renderer$$1) {
      renderer$$1.context.lookAt(vector);
    }

    return this;
  };

  _proto.getCamera = function getCamera() {
    var renderer$$1 = this._getRenderer();

    if (renderer$$1) {
      return renderer$$1.camera;
    }

    return null;
  };

  _proto.getScene = function getScene() {
    var renderer$$1 = this._getRenderer();

    if (renderer$$1) {
      return renderer$$1.scene;
    }

    return null;
  };

  _proto.renderScene = function renderScene() {
    var renderer$$1 = this._getRenderer();

    if (renderer$$1) {
      return renderer$$1.renderScene();
    }

    return this;
  };

  _proto.getThreeRenderer = function getThreeRenderer() {
    var renderer$$1 = this._getRenderer();

    if (renderer$$1) {
      return renderer$$1.context;
    }

    return null;
  }
  /**
   * add object3ds
   * @param {BaseObject} meshes
   */
  ;

  _proto.addMesh = function addMesh(meshes) {
    var _this3 = this;

    if (!meshes) return this;

    if (!Array.isArray(meshes)) {
      meshes = [meshes];
    }

    var scene = this.getScene();
    meshes.forEach(function (mesh) {
      if (mesh instanceof BaseObject$$1) {
        scene.add(mesh.getObject3d());

        if (!mesh.isAdd) {
          mesh.isAdd = true;

          mesh._fire('add', {
            target: mesh
          });
        }

        if (mesh._animation && Util.isFunction(mesh._animation)) {
          _this3._animationBaseObjectMap[mesh.getObject3d().uuid] = mesh;
        }
      } else if (mesh instanceof Object3D) {
        scene.add(mesh);
      }
    });

    this._zoomend();

    this.renderScene();
    return this;
  }
  /**
   * remove object3ds
   * @param {BaseObject} meshes
   */
  ;

  _proto.removeMesh = function removeMesh(meshes) {
    var _this4 = this;

    if (!meshes) return this;

    if (!Array.isArray(meshes)) {
      meshes = [meshes];
    }

    var scene = this.getScene();
    meshes.forEach(function (mesh) {
      if (mesh instanceof BaseObject$$1) {
        scene.remove(mesh.getObject3d());

        if (mesh.isAdd) {
          mesh.isAdd = false;

          mesh._fire('remove', {
            target: mesh
          });
        }

        if (mesh._animation && Util.isFunction(mesh._animation)) {
          delete _this4._animationBaseObjectMap[mesh.getObject3d().uuid];
        }
      } else if (mesh instanceof Object3D) {
        scene.remove(mesh);
      }
    });
    this.renderScene();
    return this;
  };

  _proto._initRaycaster = function _initRaycaster() {
    if (!this._raycaster) {
      this._raycaster = new Raycaster();
      this._mouse = new Vector2();
    }

    return this;
  }
  /**
   *
   * @param {Coordinate} coordinate
   * @param {Object} options
   * @return {Array}
   */
  ;

  _proto.identify = function identify(coordinate, options) {
    var _this5 = this;

    if (!coordinate) {
      console.error('coordinate is null,it should be Coordinate');
      return [];
    }

    if (Array.isArray(coordinate)) {
      coordinate = new Coordinate(coordinate);
    }

    if (!(coordinate instanceof Coordinate)) {
      console.error('coordinate type is error,it should be Coordinate');
      return [];
    }

    var p = this.getMap().coordToContainerPoint(coordinate);
    var x = p.x,
        y = p.y;

    this._initRaycaster();

    var raycaster = this._raycaster,
        mouse = this._mouse,
        camera = this.getCamera(),
        scene = this.getScene(),
        size = this.getMap().getSize(); //fix Errors will be reported when the layer is not initialized

    if (!scene) {
      return [];
    }

    var width = size.width,
        height = size.height;
    mouse.x = x / width * 2 - 1;
    mouse.y = -(y / height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); //set linePrecision for THREE.Line

    raycaster.linePrecision = this._getLinePrecision(this.getMap().getResolution());
    var children = [],
        hasidentifyChildren = [];
    scene.children.forEach(function (mesh) {
      var parent = mesh.__parent;

      if (parent && parent.getOptions) {
        var interactive = parent.getOptions().interactive;

        if (interactive && parent.isVisible()) {
          //If baseobject has its own hit detection
          if (parent.identify && Util.isFunction(parent.identify)) {
            hasidentifyChildren.push(parent);
          } else {
            children.push(mesh);
          }
        }
      } else if (mesh instanceof Mesh || mesh instanceof Group) {
        children.push(mesh);
      }
    });
    var baseObjects = [];
    var intersects = raycaster.intersectObjects(children, true);

    if (intersects && Array.isArray(intersects) && intersects.length) {
      baseObjects = intersects.map(function (intersect) {
        var object = intersect.object;
        object = _this5._recursionMesh(object);
        var baseObject = object.__parent || object;
        baseObject.faceIndex = intersect.faceIndex;
        baseObject.index = intersect.index;
        return baseObject;
      });
    }

    if (hasidentifyChildren.length) {
      hasidentifyChildren.forEach(function (baseObject) {
        // baseObject identify
        if (baseObject.identify(coordinate)) {
          baseObjects.push(baseObject);
        }
      });
    }

    options = Util.extend({}, options);
    var count = options.count;
    return Util.isNumber(count) && count > 0 ? baseObjects.slice(0, count) : baseObjects;
  }
  /**
  * Recursively finding the root node of mesh,Until it is scene node
  * @param {*} mesh
  */
  ;

  _proto._recursionMesh = function _recursionMesh(mesh) {
    while (mesh && !(mesh.parent instanceof Scene)) {
      mesh = mesh.parent;
    }

    return mesh || {};
  } //get Line Precision by Resolution
  ;

  _proto._getLinePrecision = function _getLinePrecision(res) {
    if (res === void 0) {
      res = 10;
    }

    for (var i = 0, len = LINEPRECISIONS.length; i < len; i++) {
      var _LINEPRECISIONS$i = LINEPRECISIONS[i],
          resLevel = _LINEPRECISIONS$i[0],
          precision = _LINEPRECISIONS$i[1];

      if (res > resLevel) {
        return precision;
      }
    }

    return 0.01;
  }
  /**
   * fire baseObject events
   * @param {*} e
   */
  ;

  _proto._identifyBaseObjectEvents = function _identifyBaseObjectEvents(e) {
    var map = this.map || this.getMap(); //When map interaction, do not carry out mouse movement detection, which can have better performance
    // if (map.isInteracting() && e.type === 'mousemove') {
    //     return this;
    // }

    map.resetCursor('default');
    var type = e.type,
        coordinate = e.coordinate;
    var baseObjects = this.identify(coordinate);
    var scene = this.getScene();

    if (baseObjects.length === 0 && scene) {
      for (var i = 0, len = scene.children.length; i < len; i++) {
        var child = scene.children[i] || {};
        var parent = child.__parent;

        if (parent) {
          parent._fire('empty', Object.assign({}, e, {
            target: parent
          }));
        }
      }
    }

    if (type === 'mousemove') {
      if (baseObjects.length) {
        map.setCursor('pointer');
      } // mouseout objects


      var outBaseObjects = [];

      if (this._baseObjects) {
        this._baseObjects.forEach(function (baseObject) {
          var isOut = true;
          baseObjects.forEach(function (baseO) {
            if (baseObject === baseO) {
              isOut = false;
            }
          });

          if (isOut) {
            outBaseObjects.push(baseObject);
          }
        });
      }

      outBaseObjects.forEach(function (baseObject) {
        if (baseObject instanceof BaseObject$$1) {
          // reset _mouseover status
          // Deal with the mergedmesh
          if (baseObject.getSelectMesh) {
            if (!baseObject.isHide) {
              baseObject._mouseover = false;

              baseObject._fire('mouseout', Object.assign({}, e, {
                target: baseObject,
                type: 'mouseout',
                selectMesh: null
              }));

              baseObject.closeToolTip();
            }
          } else {
            baseObject._mouseover = false;

            baseObject._fire('mouseout', Object.assign({}, e, {
              target: baseObject,
              type: 'mouseout'
            }));

            baseObject.closeToolTip();
          }
        }
      });
      baseObjects.forEach(function (baseObject) {
        if (baseObject instanceof BaseObject$$1) {
          if (!baseObject._mouseover) {
            baseObject._fire('mouseover', Object.assign({}, e, {
              target: baseObject,
              type: 'mouseover',
              selectMesh: baseObject.getSelectMesh ? baseObject.getSelectMesh() : null
            }));

            baseObject._mouseover = true;
          }

          baseObject._fire(type, Object.assign({}, e, {
            target: baseObject,
            selectMesh: baseObject.getSelectMesh ? baseObject.getSelectMesh() : null
          })); // tooltip


          var tooltip = baseObject.getToolTip();

          if (tooltip && !tooltip._owner) {
            tooltip.addTo(baseObject);
          }

          baseObject.openToolTip(coordinate);
        }
      });
    } else {
      baseObjects.forEach(function (baseObject) {
        if (baseObject instanceof BaseObject$$1) {
          baseObject._fire(type, Object.assign({}, e, {
            target: baseObject,
            selectMesh: baseObject.getSelectMesh ? baseObject.getSelectMesh() : null
          }));

          if (type === 'click') {
            var infoWindow = baseObject.getInfoWindow();

            if (infoWindow && !infoWindow._owner) {
              infoWindow.addTo(baseObject);
            }

            baseObject.openInfoWindow(coordinate);
          }
        }
      });
    }

    this._baseObjects = baseObjects;
    return this;
  }
  /**
   *map zoom event
   */
  ;

  _proto._zoomend = function _zoomend() {
    var scene = this.getScene();

    if (!scene) {
      return;
    }

    var zoom = this.getMap().getZoom();
    scene.children.forEach(function (mesh) {
      var parent = mesh.__parent;

      if (parent && parent.getOptions) {
        var minZoom = parent.getMinZoom(),
            maxZoom = parent.getMaxZoom();

        if ((zoom < minZoom || zoom > maxZoom) && parent.isVisible()) {
          parent.hide();
        } else if (minZoom <= zoom && zoom <= maxZoom && !parent.isVisible()) {
          parent.show();
        }
      }
    });
  };

  _proto.onAdd = function onAdd() {
    var _this6 = this;

    _maptalks$CanvasLayer.prototype.onAdd.call(this);

    var map = this.map || this.getMap();
    if (!map) return this;
    EVENTS$1.forEach(function (event) {
      map.on(event, _this6._identifyBaseObjectEvents, _this6);
    });
    this._needsUpdate = true;

    if (!this._animationBaseObjectMap) {
      this._animationBaseObjectMap = {};
    }

    map.on('zooming zoomend', this._zoomend, this);
    return this;
  };

  _proto.onRemove = function onRemove() {
    var _this7 = this;

    _maptalks$CanvasLayer.prototype.onRemove.call(this);

    var map = this.map || this.getMap();
    if (!map) return this;
    EVENTS$1.forEach(function (event) {
      map.off(event, _this7._identifyBaseObjectEvents, _this7);
    });
    map.off('zooming zoomend', this._zoomend, this);
    return this;
  };

  _proto._callbackBaseObjectAnimation = function _callbackBaseObjectAnimation() {
    var layer = this;

    if (layer._animationBaseObjectMap) {
      for (var uuid in layer._animationBaseObjectMap) {
        var baseObject = layer._animationBaseObjectMap[uuid];

        baseObject._animation();
      }
    }

    return this;
  }
  /**
   * To make map's 2d point's 1 pixel euqal with 1 pixel on XY plane in THREE's scene:
   * 1. fov is 90 and camera's z is height / 2 * scale,
   * 2. if fov is not 90, a ratio is caculated to transfer z to the equivalent when fov is 90
   * @return {Number} fov ratio on z axis
   */
  ;

  _proto._getFovRatio = function _getFovRatio() {
    var map = this.getMap();
    var fov = map.getFov();
    return Math.tan(fov / 2 * RADIAN);
  };

  return ThreeLayer;
}(CanvasLayer);

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
    var renderer$$1 = new WebGLRenderer({
      'context': this.gl,
      alpha: true
    });
    renderer$$1.autoClear = false;
    renderer$$1.setClearColor(new Color(1, 1, 1), 0);
    renderer$$1.setSize(this.canvas.width, this.canvas.height);
    renderer$$1.clear();
    renderer$$1.canvas = this.canvas;
    this.context = renderer$$1;
    var scene = this.scene = new Scene();
    var map = this.layer.getMap();
    var fov = map.getFov() * Math.PI / 180;
    var camera = this.camera = new PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
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

    var r = Browser.retina ? 2 : 1;
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
    this.layer._callbackBaseObjectAnimation();

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
    var camera = this.camera;
    camera.matrix.elements = map.cameraWorldMatrix;
    camera.projectionMatrix.elements = map.projMatrix;
    camera.projectionMatrixInverse.elements = MATRIX4.getInverse(camera.projectionMatrix).elements;
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
}(renderer.CanvasLayerRenderer);

ThreeLayer.registerRenderer('gl', ThreeRenderer);

function getTargetZoom(map) {
  return map.getGLZoom();
}

export { ThreeLayer, ThreeRenderer, BaseObject$$1 as BaseObject };

typeof console !== 'undefined' && console.log('maptalks.three v0.7.0, requires maptalks@>=0.39.0.');
