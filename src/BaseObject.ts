"use strict"
import * as maptalks from 'maptalks';
import * as THREE from 'three';
import { BaseObjectOptionType } from './type/BaseOption';
import Line2 from './util/fatline/Line2';
import { addAttribute } from './util/ThreeAdaptUtil';

const OPTIONS = {
    interactive: true,
    altitude: 0,
    minZoom: 0,
    maxZoom: 30,
    asynchronous: false
};

/**
 * a Class for Eventable
 */
function Base() {

}

// class Base {
//     constructor() {

//     }
// }

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
class BaseObject extends maptalks.Eventable(Base) {
    isAdd: boolean = false;
    object3d: THREE.Object3D;
    options: BaseObjectOptionType;
    toolTip: maptalks.ui.ToolTip;
    infoWindow: maptalks.ui.InfoWindow;
    _mouseover: boolean = false;
    _showPlayer: any;
    _visible: boolean = true;
    _zoomVisible: boolean = true;
    _vt: any;
    picked: boolean = false;
    pickObject3d: THREE.Object3D;
    id: string | number;
    type: string;
    _baseObjects: BaseObject[];

    readonly isBaseObject: boolean = true;

    constructor(id?: string | number) {
        super();
        if (id === undefined) {
            id = maptalks.Util.GUID();
        }
        this.id = id;
    }

    addTo(layer: any) {
        if (layer && layer.type === 'ThreeLayer') {
            layer.addMesh([this]);
        } else {
            console.error('layer only support maptalks.ThreeLayer');
        }
        return this;
    }

    remove() {
        const layer = this.getLayer();
        if (layer) {
            layer.removeMesh([this]);
        }
        return this;
    }

    getObject3d(): THREE.Object3D {
        return this.object3d;
    }

    getId(): string | number {
        return this.id;
    }

    setId(id: string | number) {
        const oldId = this.getId();
        this.id = id;
        this._fire('idchange', {
            'old': oldId,
            'new': id,
            'target': this
        });
        return this;
    }

    getType(): string {
        return this.type;
    }

    getOptions(): BaseObjectOptionType {
        return this.options;
    }

    getProperties(): object {
        return (this.options || {}).properties;
    }

    setProperties(property: object) {
        const old = Object.assign({}, this.getProperties());
        this.options.properties = property;
        this._fire('propertieschange', {
            'old': old,
            'new': property,
            'target': this
        });
        return this;
    }


    getLayer() {
        return this.options.layer;
    }


    // eslint-disable-next-line consistent-return
    getMap(): maptalks.Map {
        const layer = this.getLayer();
        if (layer) {
            return layer.getMap();
        }
    }

    // eslint-disable-next-line consistent-return
    getCenter(): maptalks.Coordinate {
        const options = this.getOptions();
        const { coordinate, lineString, polygon } = options;
        if (coordinate) {
            return coordinate instanceof maptalks.Coordinate ? coordinate : new maptalks.Coordinate(coordinate);
        } else {
            const geometry = polygon || lineString;
            if (geometry && geometry.getCenter) {
                return geometry.getCenter();
            }
        }
    }

    getAltitude(): number {
        return this.getOptions().altitude;
    }


    /**
     * Different objects need to implement their own methods
     * @param {*} altitude
     */
    setAltitude(altitude: number) {
        if (maptalks.Util.isNumber(altitude)) {
            const z = this.getLayer().distanceToVector3(altitude, altitude).x;
            this.getObject3d().position.z = z;
            this.options.altitude = altitude;
            if (this.pickObject3d) {
                this.pickObject3d.position.z = z;
            }
            //fix merged mesh
            if (this._baseObjects && Array.isArray(this._baseObjects)) {
                for (let i = 0, len = this._baseObjects.length; i < len; i++) {
                    if (this._baseObjects[i]) {
                        this._baseObjects[i].getObject3d().position.z = z;
                    }
                }
            }
        }
        return this;
    }

    supportHeight(): boolean {
        return this.getOptions().heightEnable;
    }

    getHeight(): number {
        const { height } = this.getOptions();
        return maptalks.Util.isNumber(height) ? height : 0;
    }

    setHeight(height: number) {
        if (!maptalks.Util.isNumber(height) || this._baseObjects || !this.supportHeight()) {
            return this;
        }
        const layer = this.getLayer();
        if (!layer) {
            return this;
        }
        const { geometry } = (this.getObject3d() as any);
        if (geometry instanceof THREE.BufferGeometry) {
            const { position } = geometry.attributes || {};
            if (!position) {
                return this;
            }
            const array = position.array;
            let min = Infinity, max = -Infinity;
            for (let i = 0, len = array.length; i < len; i += 3) {
                const z = array[i + 2];
                min = Math.min(z, min);
                max = Math.max(z, max);
            }
            const middle = (min + max) / 2;
            let z = layer.distanceToVector3(height, height).x;
            // z>0
            z = Math.max(z, 0.000001);
            for (let i = 0, len = array.length; i < len; i += 3) {
                if (array[i + 2] > middle) {
                    (array[i + 2] as any) = z;
                }
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            this.getOptions().height = height;
        }
        return this;
    }


    show() {
        //  in zoom range
        if (this._zoomVisible) {
            this.getObject3d().visible = true;
            this._fire('show');
        }
        this._visible = true;
        return this;
    }


    hide() {
        this.getObject3d().visible = false;
        this._fire('hide');
        this._visible = false;
        return this;
    }

    isVisible(): boolean {
        return (!!this.getObject3d().visible);
    }


    /**
     *  Different objects need to implement their own methods
     */
    getSymbol(): THREE.Material {
        return (this.getObject3d() as any).material;
    }

    /**
     *  Different objects need to implement their own methods
     * @param {*} material
     */
    setSymbol(material: THREE.Material) {
        if (material && material instanceof THREE.Material) {
            material.needsUpdate = true;
            material.vertexColors = (this.getObject3d() as any).material.vertexColors;
            const old = (this.getObject3d() as any).material.clone();
            (this.getObject3d() as any).material = material;
            this._fire('symbolchange', {
                'old': old,
                'new': material,
                'target': this
            });
        }
        return this;
    }

    setInfoWindow(options: object) {
        this.removeInfoWindow();
        this.infoWindow = new maptalks.ui.InfoWindow(options);
        this.infoWindow.addTo(this);
        return this;
    }

    getInfoWindow(): maptalks.ui.InfoWindow {
        return this.infoWindow;
    }

    openInfoWindow(coordinate: maptalks.Coordinate) {
        coordinate = coordinate || this.getCenter();
        if (!(coordinate instanceof maptalks.Coordinate)) {
            coordinate = new maptalks.Coordinate(coordinate);
        }
        // eslint-disable-next-line no-unused-expressions
        (coordinate && this.infoWindow && this.infoWindow.show(coordinate));
        return this;
    }

    closeInfoWindow() {
        // eslint-disable-next-line no-unused-expressions
        (this.infoWindow && this.infoWindow.hide());
        return this;
    }


    removeInfoWindow() {
        // eslint-disable-next-line no-unused-expressions
        if (this.infoWindow) {
            this.infoWindow.remove();
            delete this.infoWindow;
        }
        return this;
    }

    setToolTip(content: string, options: object) {
        this.removeToolTip();
        this.toolTip = new maptalks.ui.ToolTip(content, options);
        this.toolTip.addTo(this);
        return this;
    }

    getToolTip(): maptalks.ui.ToolTip {
        return this.toolTip;
    }

    openToolTip(coordinate: maptalks.Coordinate) {
        coordinate = coordinate || this.getCenter();
        if (!(coordinate instanceof maptalks.Coordinate)) {
            coordinate = new maptalks.Coordinate(coordinate);
        }
        // eslint-disable-next-line no-unused-expressions
        (coordinate && this.toolTip && this.toolTip.show(coordinate));
        return this;
    }

    closeToolTip() {
        // eslint-disable-next-line no-unused-expressions
        (this.toolTip && this.toolTip.hide());
        return this;
    }

    removeToolTip() {
        // eslint-disable-next-line no-unused-expressions
        if (this.toolTip) {
            this.toolTip.remove();
            delete this.toolTip;
        }
        return this;
    }

    /**
     * different components should implement their own animation methods
     * @param {*} options
     * @param {*} cb
     */
    // eslint-disable-next-line no-unused-vars
    animateShow(options: object = {}, cb: Function) {
        if (this._showPlayer) {
            this._showPlayer.cancel();
        }
        if (maptalks.Util.isFunction(options)) {
            options = {};
            cb = options as Function;
        }
        const duration = options['duration'] || 1000,
            easing = options['easing'] || 'out';
        const player = this._showPlayer = maptalks.animation.Animation.animate({
            'scale': 1
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            const scale = frame.styles.scale;
            if (scale > 0) {
                this.getObject3d().scale.z = scale;
            }
            if (cb) {
                cb(frame, scale);
            }
        });
        player.play();
        return player;
    }


    getMinZoom(): number {
        return this.getOptions().minZoom;
    }


    getMaxZoom(): number {
        return this.getOptions().maxZoom;
    }

    isAsynchronous(): boolean {
        return this.getOptions().asynchronous;
    }

    fire(eventType: string, param: any) {
        this._fire(eventType, param);
        if (this._vt && this._vt.onSelectMesh) {
            this._vt.onSelectMesh(eventType, param);
        }
        return this;
    }

    config() {

        return this;
    }

    setPickObject3d(object3d: THREE.Object3D) {
        this.pickObject3d = object3d;
        this.pickObject3d['__parent'] = this;
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

    _initOptions(options: BaseObjectOptionType) {
        this.options = maptalks.Util.extend({} as BaseObjectOptionType, OPTIONS, options);
        return this;
    }

    _createMesh(geometry: THREE.BufferGeometry, material: THREE.Material) {
        this.object3d = new THREE.Mesh(geometry, material);
        this.object3d['__parent'] = this;
        return this;
    }

    _createGroup() {
        this.object3d = new THREE.Group();
        this.object3d['__parent'] = this;
        return this;
    }


    _createLine(geometry: THREE.BufferGeometry, material: THREE.LineBasicMaterial | THREE.LineDashedMaterial) {
        this.object3d = new THREE.Line(geometry, material);
        // (this.object3d as THREE.Line).computeLineDistances();
        this._computeLineDistances(geometry);
        this.object3d['__parent'] = this;
        return this;
    }

    _createLine2(geometry, material) {
        this.object3d = new Line2(geometry, material);
        (this.object3d as any).computeLineDistances();
        this.object3d['__parent'] = this;
        return this;
    }


    // eslint-disable-next-line no-unused-vars
    _createPoints(geometry: THREE.BufferGeometry, material: THREE.PointsMaterial) {
        //Serving for particles
        this.object3d = new THREE.Points(geometry, material);
        this.object3d['__parent'] = this;
        return this;
    }

    _createLineSegments(geometry: THREE.BufferGeometry, material: THREE.LineBasicMaterial | THREE.LineDashedMaterial) {
        this.object3d = new THREE.LineSegments(geometry, material);
        // (this.object3d as THREE.LineSegments).computeLineDistances();
        this._computeLineDistances(geometry);
        this.object3d['__parent'] = this;
        return this;
    }

    /**
     * rewrite three.js computeLineDistances ,1.7 speed
     * @param geometry 
     */
    _computeLineDistances(geometry: THREE.BufferGeometry) {
        const position = geometry.attributes.position.array;
        const count = geometry.attributes.position.count;
        const lineDistances = new Float32Array(count);
        lineDistances[0] = 0;
        const start = new THREE.Vector3(0, 0, 0), end = new THREE.Vector3(0, 0, 0);
        for (let i = 1; i < count; i++) {
            const idx = (i - 1) * 3;
            start.x = position[idx];
            start.y = position[idx + 1];
            start.z = position[idx + 2];

            const idx1 = i * 3;
            end.x = position[idx1];
            end.y = position[idx1 + 1];
            end.z = position[idx1 + 2];
            const distance = end.distanceTo(start);
            lineDistances[i] = lineDistances[i - 1] + distance;
        }
        addAttribute(geometry, 'lineDistance', new THREE.BufferAttribute(lineDistances, 1));
    }
}

export default BaseObject;
