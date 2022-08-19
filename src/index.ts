import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import Bar from './Bar';
import Line from './Line';
import ExtrudeLine from './ExtrudeLine';
import ExtrudePolygon from './ExtrudePolygon';
import Model from './Model';
import ExtrudeLineTrail from './ExtrudeLineTrail';
import ExtrudePolygons from './ExtrudePolygons';
import Point from './Point';
import Points from './Points';
import Bars from './Bars';
import ExtrudeLines from './ExtrudeLines';
import Lines from './Lines';
import ThreeVectorTileLayer from './ThreeVectorTileLayer';
import Terrain from './Terrain';
import TerrainVectorTileLayer from './TerrainVectorTileLayer';
import HeatMap from './HeatMap';
import { setRaycasterLinePrecision } from './util/ThreeAdaptUtil';
import GPUPick from './GPUPick';
import FatLine from './FatLine';
import FatLines from './FatLines';
import Box from './Box';
import Boxs from './Boxs';
import MergedMixin from './MergedMixin';
import * as GeoJSONUtil from './util/GeoJSONUtil';
import * as GeoUtil from './util/GeoUtil';
import * as MergeGeometryUtil from './util/MergeGeometryUtil';
import * as ExtrudeUtil from './util/ExtrudeUtil';
import * as LineUtil from './util/LineUtil';
import * as IdentifyUtil from './util/IdentifyUtil';
import * as geometryExtrude from 'deyihu-geometry-extrude';
import * as polyextrude from 'poly-extrude';
import LineMaterial from './util/fatline/LineMaterial';
import { BarOptionType, BaseLayerOptionType, BaseObjectOptionType, ExtrudeLineOptionType, ExtrudeLineTrailOptionType, ExtrudePolygonOptionType, FatLineMaterialType, getBaseObjectMaterialType, HeatMapDataType, HeatMapOptionType, LineMaterialType, LineOptionType, LineStringType, PointOptionType, PolygonType, SingleLineStringType, TerrainOptionType } from './type/index';
import { getWorkerCode, getWorkerName } from './worker/getworker';
import { BaseObjectTaskManager, BaseObjectTask } from './BaseObjectTaskManager';
import { fetchDataWorkerKey, fetchDataWorkerCode, getFetchDataActor } from './worker/fetchdataworker';


const options: BaseLayerOptionType = {
    'renderer': 'gl',
    'doubleBuffer': false,
    'glOptions': null,
    'geometryEvents': true,
    'identifyCountOnEvent': 0,
    'forceRenderOnZooming': true,
    'loopRenderCount': 50
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
    [0.5, 0.02],
    [0.4, 0.01],
    [0.1, 0.005],
    [0.05, 0.002],
    [0.01, 0.001]
];

const EVENTS = [
    'mouseout',
    'mousemove',
    // 'click',
    'mousedown',
    'mouseup',
    'dblclick',
    'contextmenu',
    'touchstart',
    'touchmove',
    'touchend'
];
const TEMP_COORD = new maptalks.Coordinate(0, 0);
const TEMP_POINT = new maptalks.Point(0, 0);

const KEY_FBO = '__webglFramebuffer';

// const MATRIX4 = new THREE.Matrix4();

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
class ThreeLayer extends maptalks.CanvasLayer {
    options: BaseLayerOptionType;
    map: maptalks.Map;
    type: string;
    _animationBaseObjectMap: { [key: string]: BaseObject } = {};
    _needsUpdate: boolean = true;
    _raycaster: THREE.Raycaster;
    _mouse: THREE.Vector2;
    _containerPoint: maptalks.Point;
    _mousemoveTimeOut: number = 0;
    _mousedownTime: number = 0;
    _baseObjects: Array<BaseObject> = [];
    _delayMeshes: Array<BaseObject> = [];
    _identifyBaseObjectEventsThis: Function;
    _zoomendThis: Function

    constructor(id: string, options: BaseLayerOptionType) {
        super(id, options);
        this.type = 'ThreeLayer';
    }

    isMercator() {
        const map = this.getMap();
        if (!map) {
            return false;
        }
        const sp = map.getSpatialReference();
        const prj = sp._projection, res = sp._resolutions;
        if (prj && prj.code === 'EPSG:3857' && res && res.length && Math.floor(res[0]) === 156543 && map.getGLRes) {
            return true;
        }
        return false;
    }

    isRendering(): boolean {
        const map = this.getMap();
        if (!map) {
            return false;
        }
        return map.isInteracting() || map.isAnimating();
    }

    prepareToDraw(...args) {

    }
    /**
     * Draw method of ThreeLayer
     * In default, it calls renderScene, refresh the camera and the scene
     */
    draw(gl, view, scene, camera, timeStamp, context) {
        this.renderScene(context, this);
    }

    /**
     * Draw method of ThreeLayer when map is interacting
     * In default, it calls renderScene, refresh the camera and the scene
     */
    drawOnInteracting(gl, view, scene, camera, event, timeStamp, context) {
        this.renderScene(context, this);
    }
    /**
     * Convert a geographic coordinate to THREE Vector3
     * @param  {maptalks.Coordinate} coordinate - coordinate
     * @param {Number} [z=0] z value
     * @return {THREE.Vector3}
     */
    coordinateToVector3(coordinate: maptalks.Coordinate | Array<number>, z: number = 0): THREE.Vector3 {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        const isArray = Array.isArray(coordinate);
        if (isArray) {
            TEMP_COORD.x = coordinate[0];
            TEMP_COORD.y = coordinate[1];
        } else if (!(coordinate instanceof maptalks.Coordinate)) {
            coordinate = new maptalks.Coordinate(coordinate);
        }
        const res = getGLRes(map);
        const p = coordinateToPoint(map, isArray ? TEMP_COORD : coordinate, res, TEMP_POINT);
        return new THREE.Vector3(p.x, p.y, z);
    }

    coordinatiesToGLFloatArray(coordinaties: Array<maptalks.Coordinate | Array<number>>, centerPt: THREE.Vector3): {
        positions: Float32Array,
        positons2d: Float32Array
    } {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        const res = getGLRes(map);
        const len = coordinaties.length;
        const array = new Float32Array(len * 2);
        const array3d = new Float32Array(len * 3);
        for (let i = 0; i < len; i++) {
            let coordinate = coordinaties[i];
            const isArray = Array.isArray(coordinate);
            if (isArray) {
                TEMP_COORD.x = coordinate[0];
                TEMP_COORD.y = coordinate[1];
            } else if (!(coordinate instanceof maptalks.Coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            const p = coordinateToPoint(map, isArray ? TEMP_COORD : coordinate, res, TEMP_POINT);
            p.x -= centerPt.x;
            p.y -= centerPt.y;
            const idx = i * 2;
            array[idx] = p.x;
            array[idx + 1] = p.y;

            const idx1 = i * 3
            array3d[idx1] = p.x;
            array3d[idx1 + 1] = p.y;
            array3d[idx1 + 2] = 0;

        }
        return {
            positions: array3d,
            positons2d: array
        };
    }

    coordinatiesToGLArray(coordinaties: Array<maptalks.Coordinate | Array<number>>, centerPt: THREE.Vector3): Array<Array<number>> {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        const res = getGLRes(map);
        const len = coordinaties.length;
        const array = new Array(len);
        for (let i = 0; i < len; i++) {
            let coordinate = coordinaties[i];
            const isArray = Array.isArray(coordinate);
            if (isArray) {
                TEMP_COORD.x = coordinate[0];
                TEMP_COORD.y = coordinate[1];
            } else if (!(coordinate instanceof maptalks.Coordinate)) {
                coordinate = new maptalks.Coordinate(coordinate);
            }
            const p = coordinateToPoint(map, isArray ? TEMP_COORD : coordinate, res, TEMP_POINT);
            p.x -= centerPt.x;
            p.y -= centerPt.y;
            array[i] = [p.x, p.y];
        }
        return array;
    }

    /**
     * Convert geographic distance to THREE Vector3
     * @param  {Number} w - width
     * @param  {Number} h - height
     * @return {THREE.Vector3}
     */
    distanceToVector3(w: number, h: number, coord?: maptalks.Coordinate | Array<number>): THREE.Vector3 {
        if ((w === 0 && h === 0) || (!maptalks.Util.isNumber(w) || !maptalks.Util.isNumber(h))) {
            return new THREE.Vector3(0, 0, 0);
        }
        const map = this.getMap();
        const res = getGLRes(map);
        let center = coord || map.getCenter();
        if (!(center instanceof maptalks.Coordinate)) {
            center = new maptalks.Coordinate(center);
        }
        const target = map.locate(center, w, h);
        const p0 = coordinateToPoint(map, center, res),
            p1 = coordinateToPoint(map, target, res);
        const x = Math.abs(p1.x - p0.x) * maptalks.Util.sign(w);
        const y = Math.abs(p1.y - p0.y) * maptalks.Util.sign(h);
        return new THREE.Vector3(x, y, 0);
    }

    altitudeToVector3(altitude: number, altitude1: number, coord?: maptalks.Coordinate | Array<number>): THREE.Vector3 {
        if ((altitude === 0) || (!maptalks.Util.isNumber(altitude))) {
            return new THREE.Vector3(0, 0, 0);
        }
        const map = this.getMap();
        if (map.altitudeToPoint) {
            const res = getGLRes(map);
            let z = map.altitudeToPoint(altitude, res);
            if (altitude < 0 && z > 0) {
                z = -z;
            }
            return new THREE.Vector3(z, z, 0);
        }
        return this.distanceToVector3(altitude, altitude, coord);
    }

    /**
     * Convert a Polygon or a MultiPolygon to THREE shape
     * @param  {maptalks.Polygon|maptalks.MultiPolygon} polygon - polygon or multipolygon
     * @return {THREE.Shape}
     */
    toShape(polygon: maptalks.Polygon | maptalks.MultiPolygon): THREE.Shape | Array<THREE.Shape> {
        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(c => this.toShape(c) as any);
        }
        const center = polygon.getCenter();
        const centerPt = this.coordinateToVector3(center);
        const shell = polygon.getShell();
        const outer = shell.map(c => {
            const vector = this.coordinateToVector3(c).sub(centerPt);
            return new THREE.Vector2(vector.x, vector.y);
        });
        const shape = new THREE.Shape(outer);
        const holes = polygon.getHoles();

        if (holes && holes.length > 0) {
            shape.holes = holes.map(item => {
                const pts = item.map(c => {
                    const vector = this.coordinateToVector3(c).sub(centerPt);
                    return new THREE.Vector2(vector.x, vector.y);
                });
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
    toExtrudeMesh(polygon: maptalks.Polygon | maptalks.MultiPolygon, altitude: number, material: THREE.Material, height: number): THREE.Mesh | Array<THREE.Mesh> {
        if (!polygon) {
            return null;
        }
        if (polygon instanceof maptalks.MultiPolygon) {
            return polygon.getGeometries().map(c => this.toExtrudeMesh(c, altitude, material, height) as any);
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
        height = this.altitudeToVector3(height, height).x;
        const amount = this.altitudeToVector3(altitude, altitude).x;
        //{ amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        const config: { [key: string]: any } = { 'bevelEnabled': false, 'bevelSize': 1 };
        const name = parseInt(THREE.REVISION) >= 93 ? 'depth' : 'amount';
        config[name] = height;
        const geom = new THREE.ExtrudeGeometry(shape, config);
        let buffGeom = geom as any;
        if ((THREE.BufferGeometry.prototype as any).fromGeometry) {
            buffGeom = new THREE.BufferGeometry();
            buffGeom.fromGeometry(geom);
        }
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
    toExtrudePolygon(polygon: PolygonType, options: ExtrudePolygonOptionType, material: THREE.Material): ExtrudePolygon {
        return new ExtrudePolygon(polygon, options, material, this);
    }


    /**
     *
     * @param {maptalks.Coordinate} coordinate
     * @param {Object} options
     * @param {THREE.Material} material
     */
    toBar(coordinate: maptalks.Coordinate, options: BarOptionType, material: THREE.Material): Bar {
        return new Bar(coordinate, options, material, this);
    }


    /**
    *
    * @param {maptalks.LineString} lineString
    * @param {Object} options
    * @param {THREE.LineMaterial} material
    */
    toLine(lineString: LineStringType, options: LineOptionType, material: LineMaterialType): Line {
        return new Line(lineString, options, material, this);
    }


    /**
     *
     * @param {maptalks.LineString} lineString
     * @param {Object} options
     * @param {THREE.Material} material
     */
    toExtrudeLine(lineString: LineStringType, options: ExtrudeLineOptionType, material: THREE.Material): ExtrudeLine {
        return new ExtrudeLine(lineString, options, material, this);
    }


    /**
     *
     * @param {THREE.Mesh|THREE.Group} model
     * @param {Object} options
     */
    toModel(model: THREE.Object3D, options: BaseObjectOptionType): Model {
        return new Model(model, options, this);
    }



    /**
     *
     * @param {maptalks.LineString} lineString
     * @param {*} options
     * @param {THREE.Material} material
     */
    toExtrudeLineTrail(lineString: SingleLineStringType, options: ExtrudeLineTrailOptionType, material: THREE.Material): ExtrudeLineTrail {
        return new ExtrudeLineTrail(lineString, options, material, this);
    }

    /**
     *
     * @param {*} polygons
     * @param {*} options
     * @param {*} material
     */
    toExtrudePolygons(polygons: Array<PolygonType>, options: ExtrudePolygonOptionType, material: THREE.Material): ExtrudePolygons {
        return new ExtrudePolygons(polygons, options, material, this);
    }


    /**
     *
     * @param {maptalks.Coordinate} coordinate
     * @param {*} options
     * @param {*} material
     */
    toPoint(coordinate: maptalks.Coordinate, options: PointOptionType, material: THREE.PointsMaterial): Point {
        return new Point(coordinate, options, material, this);
    }


    /**
     *
     * @param {Array} points
     * @param {*} options
     * @param {*} material
     */
    toPoints(points: Array<PointOptionType>, options: PointOptionType, material: THREE.PointsMaterial): Points {
        return new Points(points, options, material, this);
    }


    /**
     *
     * @param {Array} points
     * @param {*} options
     * @param {*} material
     */
    toBars(points: Array<BarOptionType>, options: BarOptionType, material: THREE.Material): Bars {
        return new Bars(points, options, material, this);
    }


    /**
     *
     * @param {Array[maptalks.LineString]} lineStrings
     * @param {*} options
     * @param {*} material
     */
    toExtrudeLines(lineStrings: Array<LineStringType>, options: ExtrudeLineOptionType, material: THREE.Material): ExtrudeLines {
        return new ExtrudeLines(lineStrings, options, material, this);
    }


    /**
     *
     * @param {Array[maptalks.LineString]} lineStrings
     * @param {*} options
     * @param {*} material
     */
    toLines(lineStrings: Array<LineStringType>, options: LineOptionType, material: LineMaterialType): Lines {
        return new Lines(lineStrings, options, material, this);
    }


    /**
     *
     * @param {*} url
     * @param {*} options
     * @param {*} getMaterial
     * @param {*} worker
     */
    toThreeVectorTileLayer(url: string, options: any, getMaterial: getBaseObjectMaterialType): ThreeVectorTileLayer {
        return new ThreeVectorTileLayer(url, options, getMaterial, this);
    }

    /**
     *
     * @param {*} extent
     * @param {*} options
     * @param {*} material
     */
    toTerrain(extent: maptalks.Extent, options: TerrainOptionType, material: THREE.Material): Terrain {
        return new Terrain(extent, options, material, this);
    }

    /**
     *
     * @param {*} url
     * @param {*} options
     * @param {*} material
     */
    toTerrainVectorTileLayer(url: string, options: any, material: THREE.Material): TerrainVectorTileLayer {
        return new TerrainVectorTileLayer(url, options, material, this);
    }


    /**
     *
     * @param {*} data
     * @param {*} options
     * @param {*} material
     */
    toHeatMap(data: Array<HeatMapDataType>, options: HeatMapOptionType, material: THREE.Material): HeatMap {
        return new HeatMap(data, options, material, this);
    }

    /**
     *
     * @param {*} lineString
     * @param {*} options
     * @param {*} material
     */
    toFatLine(lineString: LineStringType, options: LineOptionType, material: FatLineMaterialType): FatLine {
        return new FatLine(lineString, options, material, this);
    }

    /**
     *
     * @param {*} lineStrings
     * @param {*} options
     * @param {*} material
     */
    toFatLines(lineStrings: Array<LineStringType>, options, material: FatLineMaterialType): FatLines {
        return new FatLines(lineStrings, options, material, this);
    }

    /**
     *
     * @param {*} coorindate
     * @param {*} options
     * @param {*} material
     */
    toBox(coorindate: maptalks.Coordinate, options: BarOptionType, material: THREE.Material): Box {
        return new Box(coorindate, options, material, this);
    }

    /**
     *
     * @param {*} points
     * @param {*} options
     * @param {*} material
     */
    toBoxs(points: Array<BarOptionType>, options: BarOptionType, material: THREE.Material): Boxs {
        return new Boxs(points, options, material, this);
    }


    getBaseObjects(): Array<BaseObject> {
        return this.getMeshes().filter((mesh => {
            return mesh instanceof BaseObject;
        })) as any;
    }


    getMeshes(): Array<THREE.Object3D | BaseObject> {
        const scene = this.getScene();
        if (!scene) {
            return [];
        }
        const meshes = [];
        for (let i = 0, len = scene.children.length; i < len; i++) {
            const child = scene.children[i];
            if (child instanceof THREE.Object3D && !(child instanceof THREE.Camera)) {
                meshes.push(child['__parent'] || child);
            }
        }
        return meshes;
    }


    clear() {
        return this.clearMesh();
    }

    clearMesh() {
        const scene = this.getScene();
        if (!scene) {
            return this;
        }
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (child instanceof THREE.Object3D && !(child instanceof THREE.Camera)) {
                scene.remove(child);
                const parent = child['__parent'];
                if (parent && parent instanceof BaseObject) {
                    parent.isAdd = false;
                    parent._fire('remove', { target: parent });
                    delete this._animationBaseObjectMap[child.uuid];
                }
            }
        }
        return this;
    }

    lookAt(vector: THREE.Vector3) {
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.context.lookAt(vector);
        }
        return this;
    }

    getCamera(): THREE.Camera {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.camera;
        }
        return null;
    }

    getScene(): THREE.Scene {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.scene;
        }
        return null;
    }

    renderScene(context?: Object, layer?: any) {
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.clearCanvas();
            renderer.renderScene(context);
            //外部调用时，直接redraw
            if (!layer) {
                renderer.setToRedraw();
            }
        }
        return this;
    }

    loop(render: boolean = false) {
        const delayMeshes = this._delayMeshes;
        if (!delayMeshes.length) {
            return;
        }
        const map = this.getMap();
        if (!map || map.isAnimating() || map.isInteracting()) {
            return;
        }
        const loopRenderCount = this.options.loopRenderCount || 50;
        const meshes = delayMeshes.slice(0, loopRenderCount);
        if (meshes) {
            this.addMesh(meshes, render);
        }
        delayMeshes.splice(0, loopRenderCount);
    }

    renderPickScene() {
        const renderer = this._getRenderer();
        if (renderer) {
            const pick = renderer.pick;
            if (pick) {
                pick.pick(this._containerPoint);
            }
        }
        return this;
    }

    getThreeRenderer(): THREE.WebGLRenderer {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.context;
        }
        return null;
    }

    getPick(): GPUPick {
        const renderer = this._getRenderer();
        if (renderer) {
            return renderer.pick;
        }
        return null;
    }

    delayAddMesh(meshes: Array<BaseObject>) {
        if (!meshes) return this;
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        for (let i = 0, len = meshes.length; i < len; i++) {
            this._delayMeshes.push(meshes[i]);
        }
        return this;
    }

    /**
     * add object3ds
     * @param {BaseObject} meshes
     */
    addMesh(meshes: Array<BaseObject | THREE.Object3D>, render: boolean = true) {
        if (!meshes) return this;
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        const scene = this.getScene();
        meshes.forEach(mesh => {
            if (mesh instanceof BaseObject) {
                scene.add(mesh.getObject3d());
                if (!mesh.isAdd) {
                    mesh.isAdd = true;
                    mesh._fire('add', { target: mesh });
                }
                if (mesh._animation && maptalks.Util.isFunction(mesh._animation)) {
                    this._animationBaseObjectMap[mesh.getObject3d().uuid] = mesh;
                }
            } else if (mesh instanceof THREE.Object3D) {
                scene.add(mesh);
            }
        });
        this._zoomend();
        if (render) {
            const renderer = this._getRenderer();
            if (renderer) {
                renderer.setToRedraw();
            }
        }
        return this;
    }

    /**
     * remove object3ds
     * @param {BaseObject} meshes
     */
    removeMesh(meshes: Array<BaseObject | THREE.Object3D>, render: boolean = true) {
        if (!meshes) return this;
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        const scene = this.getScene();
        meshes.forEach(mesh => {
            if (mesh instanceof BaseObject) {
                scene.remove(mesh.getObject3d());
                if (mesh.isAdd) {
                    mesh.isAdd = false;
                    mesh._fire('remove', { target: mesh });
                }
                if (mesh._animation && maptalks.Util.isFunction(mesh._animation)) {
                    delete this._animationBaseObjectMap[mesh.getObject3d().uuid];
                }
                const delayMeshes = this._delayMeshes;
                if (delayMeshes.length) {
                    for (let i = 0, len = delayMeshes.length; i < len; i++) {
                        if (delayMeshes[i] === mesh) {
                            delayMeshes.splice(i, 1);
                            break;
                        }
                    }
                }
            } else if (mesh instanceof THREE.Object3D) {
                scene.remove(mesh);
            }
        });
        if (render) {
            const renderer = this._getRenderer();
            if (renderer) {
                renderer.setToRedraw();
            }
        }
        return this;
    }

    _initRaycaster() {
        if (!this._raycaster) {
            this._raycaster = new THREE.Raycaster();
            this._mouse = new THREE.Vector2();
        }
        return this;
    }

    getRaycaster() {
        return this._raycaster;
    }

    /**
     *
     * @param {Coordinate} coordinate
     * @param {Object} options
     * @return {Array}
     */
    identify(coordinate: maptalks.Coordinate, options: object): Array<BaseObject | THREE.Object3D> {
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
        this._containerPoint = p;
        const { x, y } = p;
        this._initRaycaster();
        this.fire('identify', { coordinate, options });
        const raycaster = this._raycaster,
            mouse = this._mouse,
            camera = this.getCamera(),
            scene = this.getScene(),
            size = this.getMap().getSize();
        //fix Errors will be reported when the layer is not initialized
        if (!scene) {
            return [];
        }
        const width = size.width,
            height = size.height;
        mouse.x = (x / width) * 2 - 1;
        mouse.y = -(y / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        raycaster.layers.enableAll();
        //set linePrecision for THREE.Line
        setRaycasterLinePrecision(raycaster, this._getLinePrecision(this.getMap().getResolution()));
        const children: Array<THREE.Object3D> = [], hasidentifyChildren: Array<BaseObject> = [];
        scene.children.forEach(mesh => {
            const parent = mesh['__parent'];
            if (parent && parent.getOptions) {
                const baseObject = parent as BaseObject;
                const interactive = baseObject.getOptions().interactive;
                if (interactive && baseObject.isVisible()) {
                    //If baseobject has its own hit detection
                    if (baseObject.identify && maptalks.Util.isFunction(baseObject.identify)) {
                        hasidentifyChildren.push(baseObject);
                    } else {
                        children.push(mesh);
                    }
                }
            } else if (mesh instanceof THREE.Mesh || mesh instanceof THREE.Group) {
                children.push(mesh);
            }
        });
        let baseObjects: Array<THREE.Object3D | BaseObject> = [];
        const intersects = raycaster.intersectObjects(children, true);
        if (intersects && Array.isArray(intersects) && intersects.length) {
            baseObjects = intersects.map(intersect => {
                let object: any = intersect.object;
                const instanceId = intersect.instanceId;
                object = this._recursionMesh(object) || {};
                const baseObject = object['__parent'] || object;
                baseObject.faceIndex = intersect.faceIndex;
                baseObject.index = intersect.index;
                baseObject.intersect = intersect;
                if (maptalks.Util.isNumber(instanceId)) {
                    baseObject.instanceId = instanceId;
                }
                return baseObject;
            });
        }
        this.renderPickScene();
        if (hasidentifyChildren.length) {
            hasidentifyChildren.forEach(baseObject => {
                // baseObject identify
                if (baseObject.identify(coordinate)) {
                    baseObjects.push(baseObject);
                }
            });
        }
        const len = baseObjects.length;
        for (let i = 0; i < len; i++) {
            if (baseObjects[i]) {
                for (let j = i + 1; j < len; j++) {
                    if (baseObjects[i] === baseObjects[j]) {
                        baseObjects.splice(j, 1);
                    }
                }
            }
        }
        options = maptalks.Util.extend({}, options);
        const count = options['count'];
        return (maptalks.Util.isNumber(count) && count > 0 ? baseObjects.slice(0, count) : baseObjects);
    }

    /**
    * Recursively finding the root node of mesh,Until it is scene node
    * @param {*} mesh
    */
    _recursionMesh(mesh: THREE.Object3D): THREE.Object3D {
        while (mesh && ((mesh.parent !== this.getScene()))) {
            mesh = mesh.parent;
        }
        return mesh;
    }

    //get Line Precision by Resolution
    _getLinePrecision(res = 10): number {
        for (let i = 0, len = LINEPRECISIONS.length; i < len; i++) {
            const [resLevel, precision] = LINEPRECISIONS[i];
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
    _identifyBaseObjectEvents(event: MouseEvent) {
        if (!this.options.geometryEvents) {
            return this;
        }
        const map = this.map || this.getMap();
        //When map interaction, do not carry out mouse movement detection, which can have better performance
        if (map.isInteracting() || !map.options.geometryEvents || map._ignoreEvent(event)) {
            return this;
        }
        const eventType = event.type;
        const e = map._getEventParams ? map._getEventParams(event) : this._getEventParams(event);
        e.type = eventType;
        const { type, coordinate } = e;
        const now = maptalks.Util.now();
        if (this._mousemoveTimeOut && type === 'mousemove') {
            if (now - this._mousemoveTimeOut < 64) {
                return this;
            }
        }
        this._mousemoveTimeOut = now;
        if (type === 'mousedown') {
            this._mousedownTime = maptalks.Util.now();
        }
        let isClick = false;
        if (type === 'mouseup') {
            const clickTimeThreshold = map.options.clickTimeThreshold || 280;
            isClick = (maptalks.Util.now() - this._mousedownTime < clickTimeThreshold);
        }
        // map.resetCursor('default');
        const identifyCountOnEvent = this.options['identifyCountOnEvent'];
        let count = Math.max(0, maptalks.Util.isNumber(identifyCountOnEvent) ? identifyCountOnEvent : 0);
        if (count === 0) {
            count = Infinity;
        }

        const outBaseObjectsFunc = (baseObjects: Array<BaseObject | THREE.Object3D>) => {
            const outBaseObjects: Array<THREE.Object3D | BaseObject> = [];
            if (this._baseObjects) {
                this._baseObjects.forEach(baseObject => {
                    let isOut = true;
                    baseObjects.forEach(baseO => {
                        if (baseObject === baseO) {
                            isOut = false;
                        }
                    });
                    if (isOut) {
                        outBaseObjects.push(baseObject);
                    }
                });
            }
            outBaseObjects.forEach(baseObject => {
                if (baseObject && baseObject instanceof BaseObject) {
                    // reset _mouseover status
                    // Deal with the mergedmesh
                    if (baseObject.getSelectMesh) {
                        if (!baseObject.isHide) {
                            baseObject._mouseover = false;
                            baseObject.fire('mouseout', Object.assign({}, e, { target: baseObject, type: 'mouseout', selectMesh: null }));
                            baseObject.closeToolTip();
                        }
                    } else {
                        baseObject._mouseover = false;
                        baseObject.fire('mouseout', Object.assign({}, e, { target: baseObject, type: 'mouseout' }));
                        baseObject.closeToolTip();
                    }
                }
            });
        }
        if (type === 'mouseout') {
            outBaseObjectsFunc([]);
            this._baseObjects = [];
            return this;
        }
        const baseObjects = this.identify(coordinate, { count });
        const scene = this.getScene();
        if (baseObjects.length === 0 && scene) {
            for (let i = 0, len = scene.children.length; i < len; i++) {
                const child = scene.children[i] || {};
                const parent = child['__parent'];
                if (parent) {
                    (parent as BaseObject).fire('empty', Object.assign({}, e, { target: parent }));
                }
            }
        }

        function showInfoWindow(baseObject: BaseObject, eventType?: string) {
            eventType = eventType || type;
            const infoWindow = baseObject.getInfoWindow();
            if (infoWindow && (!infoWindow._owner)) {
                infoWindow.addTo(baseObject);
            }

            const infoOptions = infoWindow ? (infoWindow as any).options : {};
            const autoOpenOn = infoOptions['autoOpenOn'] || 'click';
            if (autoOpenOn === eventType) {
                baseObject.openInfoWindow(coordinate);
                baseObject.fire('showinfowindow', { infoWindow });
            }
        }
        if (type === 'mousemove') {
            // if (baseObjects.length) {
            //     map.setCursor('pointer');
            // }
            // mouseout objects
            outBaseObjectsFunc(baseObjects);
            baseObjects.forEach(baseObject => {
                if (baseObject instanceof BaseObject) {
                    if (!baseObject._mouseover) {
                        baseObject.fire('mouseover', Object.assign({}, e, { target: baseObject, type: 'mouseover', selectMesh: (baseObject.getSelectMesh ? baseObject.getSelectMesh() : null) }));
                        baseObject._mouseover = true;
                        showInfoWindow(baseObject, 'mouseover');
                    }
                    baseObject.fire(type, Object.assign({}, e, { target: baseObject, selectMesh: (baseObject.getSelectMesh ? baseObject.getSelectMesh() : null) }));
                    // tooltip
                    const tooltip = baseObject.getToolTip();
                    if (tooltip && (!tooltip._owner)) {
                        tooltip.addTo(baseObject);
                    }
                    baseObject.openToolTip(coordinate);
                    showInfoWindow(baseObject);
                }
            });
            this._baseObjects = baseObjects as any;
        } else {
            baseObjects.forEach(baseObject => {
                if (baseObject instanceof BaseObject) {
                    baseObject.fire(type, Object.assign({}, e, { target: baseObject, selectMesh: (baseObject.getSelectMesh ? baseObject.getSelectMesh() : null) }));
                    showInfoWindow(baseObject);
                }
            });
        }
        if (isClick) {
            this._identifyBaseObjectEvents(maptalks.Util.extend({}, event, { type: 'click' }));
        }
        return this;
    }

    _getEventParams(e) {
        const map = this.getMap();
        const eventParam = {
            domEvent: e
            // type: e.type
        };
        if (!map) {
            return eventParam;
        }
        const actual = e.touches && e.touches.length > 0 ? e.touches[0] : e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e;
        if (actual) {
            const getEventContainerPoint = maptalks.DomUtil.getEventContainerPoint;
            const containerPoint = getEventContainerPoint(actual, (map as any)._containerDOM);
            eventParam['coordinate'] = map.containerPointToCoordinate(containerPoint);
            eventParam['containerPoint'] = containerPoint;
            eventParam['viewPoint'] = map.containerPointToViewPoint(containerPoint);
            eventParam['pont2d'] = map._containerPointToPoint(containerPoint);
        }
        return eventParam;
    }


    /**
     *map zoom event
     */
    _zoomend() {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        const zoom = this.getMap().getZoom();
        scene.children.forEach(mesh => {
            const parent = mesh['__parent'];
            if (parent && parent.getOptions) {
                const baseObject = parent as BaseObject;
                if (baseObject.zoomChange && maptalks.Util.isFunction(baseObject.zoomChange)) {
                    baseObject.zoomChange(zoom);
                }
                const minZoom = baseObject.getMinZoom(), maxZoom = baseObject.getMaxZoom();
                if (zoom < minZoom || zoom > maxZoom) {
                    if (baseObject.isVisible()) {
                        baseObject.getObject3d().visible = false;
                    }
                    baseObject._zoomVisible = false;
                } else if (minZoom <= zoom && zoom <= maxZoom) {
                    if (baseObject._visible) {
                        baseObject.getObject3d().visible = true;
                    }
                    baseObject._zoomVisible = true;
                }
            }
        });
    }

    _getGeometryEventMapPanel() {
        const map = this.map || this.getMap();
        const dom = (map as any)._panels.allLayers || (map as any)._containerDOM;
        return dom;
    }


    onAdd() {
        super.onAdd();
        const map = this.map || this.getMap();
        if (!map) return this;
        const dom = this._getGeometryEventMapPanel();
        if (!this._identifyBaseObjectEventsThis) {
            this._identifyBaseObjectEventsThis = this._identifyBaseObjectEvents.bind(this);
        }
        if (!this._zoomendThis) {
            this._zoomendThis = this._zoomend.bind(this);
        }
        maptalks.DomUtil.on(dom, EVENTS.join(' '), this._identifyBaseObjectEventsThis, this);
        this._needsUpdate = true;
        if (!this._animationBaseObjectMap) {
            this._animationBaseObjectMap = {};
        }
        map.on('zooming zoomend', this._zoomendThis, this);
        return this;
    }

    onRemove() {
        super.onRemove();
        const map = this.map || this.getMap();
        if (!map) return this;
        const dom = this._getGeometryEventMapPanel();
        maptalks.DomUtil.off(dom, EVENTS.join(' '), this._identifyBaseObjectEventsThis, this);
        map.off('zooming zoomend', this._zoomendThis, this);
        return this;
    }

    _callbackBaseObjectAnimation() {
        const layer = this;
        if (layer._animationBaseObjectMap) {
            for (const uuid in layer._animationBaseObjectMap) {
                const baseObject = layer._animationBaseObjectMap[uuid];
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
    _getFovRatio(): number {
        const map = this.getMap();
        const fov = map.getFov();
        return Math.tan(fov / 2 * RADIAN);
    }
}

ThreeLayer.mergeOptions(options);

class ThreeRenderer extends maptalks.renderer.CanvasLayerRenderer {
    scene: THREE.Scene;
    camera: THREE.Camera;
    canvas: any
    layer: ThreeLayer;
    gl: any
    context: THREE.WebGLRenderer;
    matrix4: THREE.Matrix4;
    pick: GPUPick;
    _renderTime: number = 0;
    _renderTarget: THREE.WebGLRenderTarget = null;

    getPrepareParams(): Array<any> {
        return [this.scene, this.camera];
    }

    getDrawParams(): Array<any> {
        return [this.scene, this.camera];
    }

    _drawLayer() {
        super._drawLayer.apply(this, arguments);
        // this.renderScene();
    }

    hitDetect(): boolean {
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
                stencil: true,
                preserveDrawingBuffer: false
            };
            attributes.preserveDrawingBuffer = true;
            this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        }
        this._initThreeRenderer();
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
    }

    _initThreeRenderer() {
        this.matrix4 = new THREE.Matrix4();
        const renderer = new THREE.WebGLRenderer({ 'context': this.gl, alpha: true });
        renderer.autoClear = false;
        renderer.setClearColor(new THREE.Color(1, 1, 1), 0);
        renderer.setSize(this.canvas.width, this.canvas.height);
        renderer.clear();
        // renderer.canvas = this.canvas;
        this.context = renderer;

        const scene = this.scene = new THREE.Scene();
        const map = this.layer.getMap();
        const fov = map.getFov() * Math.PI / 180;
        const camera = this.camera = new THREE.PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
        camera.matrixAutoUpdate = false;
        this._syncCamera();
        scene.add(camera);
        this.pick = new GPUPick(this.layer);
        BaseObjectTaskManager.star();
    }

    onCanvasCreate() {
        super.onCanvasCreate();

    }

    resizeCanvas(canvasSize: maptalks.Size) {
        if (!this.canvas) {
            return;
        }
        let size, map = this.getMap();
        if (!canvasSize) {
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        // const r = maptalks.Browser.retina ? 2 : 1;
        const r = map.getDevicePixelRatio ? map.getDevicePixelRatio() : (maptalks.Browser.retina ? 2 : 1);
        const canvas = this.canvas;
        //retina support
        canvas.height = r * size['height'];
        canvas.width = r * size['width'];
        if (this.layer._canvas && canvas.style) {
            canvas.style.width = size.width + 'px';
            canvas.style.height = size.height + 'px';
        }
        this.context.setSize(canvas.width, canvas.height);
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }

        this.context.clear();
    }

    prepareCanvas(): any {
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        this.layer.fire('renderstart', { 'context': this.context });
        return null;
    }
    renderScene(context) {
        // const time = maptalks.Util.now();
        // Make sure to execute only once in a frame
        // if (time - this._renderTime >= 16) {
        //     this.layer._callbackBaseObjectAnimation();
        //     this._renderTime = time;
        // }
        this.layer._callbackBaseObjectAnimation();
        this._syncCamera();
        // 把 WebglRenderTarget 中的 framebuffer 替换为 GroupGLLayer 中的 fbo
        // 参考: https://stackoverflow.com/questions/55082573/use-webgl-texture-as-a-three-js-texture-map
        // 实现有点 hacky，需要留意 three 版本变动 对它的影响
        if (context && context.renderTarget) {
            const { width, height } = context.renderTarget.fbo;
            if (!this._renderTarget) {
                this._renderTarget = new THREE.WebGLRenderTarget(width, height, {
                    // depthTexture: new THREE.DepthTexture(width, height, THREE.UnsignedInt248Type)
                    depthBuffer: false
                });
                // 绘制一次以后，才会生成 framebuffer 对象
                this.context.setRenderTarget(this._renderTarget);
                this.context.render(this.scene, this.camera);
            } else {
                // 这里不能setSize，因为setSize中会把原有的fbo dipose掉
                // this._renderTarget.setSize(width, height);
                this._renderTarget.viewport.set(0, 0, width, height);
                this._renderTarget.scissor.set(0, 0, width, height);
            }
            const renderTargetProps = this.context.properties.get(this._renderTarget);

            const threeCreatedFBO = renderTargetProps[KEY_FBO];
            // 用GroupGLLayer的webgl fbo对象替换WebglRenderTarget的fbo对象
            renderTargetProps[KEY_FBO] = context.renderTarget.getFramebuffer(context.renderTarget.fbo);
            this.context.setRenderTarget(this._renderTarget);
            const bloomEnable = context.bloom === 1 && context.sceneFilter;
            const object3ds = this.scene.children || [];
            //reset all object3ds layers
            for (let i = 0, len = object3ds.length; i < len; i++) {
                if (!object3ds[i] || !object3ds[i].layers) {
                    continue;
                }
                object3ds[i].layers.set(0);
            }
            if (bloomEnable) {
                const sceneFilter = context.sceneFilter;
                //符合当前渲染帧的条件的分组到layer=1
                for (let i = 0, len = object3ds.length; i < len; i++) {
                    if (!object3ds[i] || !object3ds[i].layers) {
                        continue;
                    }
                    const parent = object3ds[i]['__parent'];
                    object3ds[i]['bloom'] = false;
                    //判断当前ojbect3d是否开启bloom
                    if (parent) {
                        object3ds[i]['bloom'] = parent.bloom;
                    }
                    let layer = 0;
                    //当object3d找不到parent(baseobject)时，也加入当前渲染帧，这种情况的一般都是灯光对象
                    //sceneFilter 用来过滤符合当前模式的meshes
                    if (object3ds[i] && sceneFilter(object3ds[i]) || !parent) {
                        layer = 1;
                    }
                    object3ds[i].layers.set(layer);
                }
            }
            this.camera.layers.set(bloomEnable ? 1 : 0);

            this.context.render(this.scene, this.camera);
            renderTargetProps[KEY_FBO] = threeCreatedFBO;
        } else {
            this.context.render(this.scene, this.camera);
        }
        this.context.setRenderTarget(null);
        this.completeRender();
    }

    remove() {
        delete this._drawContext;
        if (this._renderTarget) {
            this._renderTarget.dispose();
            delete this._renderTarget;
        }
        super.remove();
    }

    _syncCamera() {
        const map = this.getMap();
        const camera = this.camera;
        camera.matrix.elements = map.cameraWorldMatrix;
        camera.projectionMatrix.elements = map.projMatrix;
        //https://github.com/mrdoob/three.js/commit/d52afdd2ceafd690ac9e20917d0c968ff2fa7661
        if (this.matrix4.invert) {
            camera.projectionMatrixInverse.elements = this.matrix4.copy(camera.projectionMatrix).invert().elements;
            //r95 no projectionMatrixInverse properties
        } else if (camera.projectionMatrixInverse) {
            camera.projectionMatrixInverse.elements = this.matrix4.getInverse(camera.projectionMatrix).elements;
        }
    }

    _createGLContext(canvas: HTMLCanvasElement, options: object) {
        const names = ['webgl2', 'webgl', 'experimental-webgl'];
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

function getGLRes(map: maptalks.Map) {
    return map.getGLRes ? map.getGLRes() : map.getGLZoom();
}

function coordinateToPoint(map, coordinate, res, out?: any) {
    if (map.coordToPointAtRes) {
        return map.coordToPointAtRes(coordinate, res, out);
    }
    return map.coordinateToPoint(coordinate, res, out);
}

export {
    ThreeLayer, ThreeRenderer, BaseObject,
    MergedMixin,
    GeoJSONUtil, MergeGeometryUtil, GeoUtil, ExtrudeUtil, LineUtil,
    IdentifyUtil, geometryExtrude,
    LineMaterial,
    getFetchDataActor,
    BaseObjectTaskManager,
    BaseObjectTask,
    polyextrude
};

if (maptalks.registerWorkerAdapter) {
    maptalks.registerWorkerAdapter(getWorkerName(), getWorkerCode());
    maptalks.registerWorkerAdapter(fetchDataWorkerKey, fetchDataWorkerCode);
}
