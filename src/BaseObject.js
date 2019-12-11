import * as maptalks from 'maptalks';
import * as THREE from 'three';
import { ThreeLayer } from './../index';
import ToolTip from './ui/ToolTip';

const OPTIONS = {
    interactive: true,
    altitude: 0
};

/**
 * a Class for Eventable
 */
class Base {
    constructor() {

    }
}

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
    constructor(id) {
        super();
        this.isBaseObject = true;
        this.isAdd = false;
        this.object3d = null;
        this.options = {};
        this.toolTip = null;
        this.infoWindow = null;
        this._mouseover = false;
        this._showPlayer = null;
        if (id === undefined) {
            id = maptalks.Util.GUID();
        }
        this.id = id;
    }

    addTo(layer) {
        if (layer instanceof ThreeLayer) {
            layer.addMesh(this);
        } else {
            console.error('layer only support maptalks.ThreeLayer');
        }
        return this;
    }

    remove() {
        const layer = this.getLayer();
        if (layer) {
            layer.removeMesh(this);
        }
        return this;
    }

    getObject3d() {
        return this.object3d;
    }

    getId() {
        return this.id;
    }

    setId(id) {
        const oldId = this.getId();
        this.id = id;
        this._fire('idchange', {
            'old': oldId,
            'new': id,
            'target': this
        });
        return this;
    }

    getType() {
        return this.constructor.name;
    }

    getOptions() {
        return this.options;
    }

    getProperties() {
        return (this.options || {}).properties;
    }

    setProperties(property) {
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
    getMap() {
        const layer = this.getLayer();
        if (layer) {
            return layer.getMap();
        }
    }

    // eslint-disable-next-line consistent-return
    getCenter() {
        const options = this.getOptions();
        const { coordinate, lineString, polygon } = options;
        if (coordinate) {
            return coordinate;
        } else {
            const geometry = polygon || lineString;
            if (geometry && geometry.getCenter) {
                return geometry.getCenter();
            }
        }
    }

    getAltitude() {
        return this.getOptions().altitude;
    }


    /**
     * Different objects need to implement their own methods
     * @param {*} altitude
     */
    setAltitude(altitude) {
        if (maptalks.Util.isNumber(altitude)) {
            const z = this.getLayer().distanceToVector3(altitude, altitude).x;
            this.getObject3d().position.z = z;
            this.options.altitude = altitude;
        }
        return this;
    }


    show() {
        this.getObject3d().visible = true;
        this._fire('show');
        return this;
    }


    hide() {
        this.getObject3d().visible = false;
        this._fire('hide');
        return this;
    }

    isVisible() {
        return (!!this.getObject3d().visible);
    }


    /**
     *  Different objects need to implement their own methods
     */
    getSymbol() {
        return this.getObject3d().material;
    }

    /**
     *  Different objects need to implement their own methods
     * @param {*} material
     */
    setSymbol(material) {
        if (material && material instanceof THREE.Material) {
            material.needsUpdate = true;
            material.vertexColors = this.getObject3d().material.vertexColors;
            const old = this.getObject3d().material.clone();
            this.getObject3d().material = material;
            this._fire('symbolchange', {
                'old': old,
                'new': material,
                'target': this
            });
        }
        return this;
    }

    setInfoWindow(options) {
        this.infoWindow = new maptalks.ui.InfoWindow(options);
        return this;
    }

    getInfoWindow() {
        return this.infoWindow;
    }

    openInfoWindow(coordinate) {
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
        (this.infoWindow && this.infoWindow.remove() && (delete this.infoWindow));
        return this;
    }

    setToolTip(content, options) {
        this.toolTip = new ToolTip(content, options);
        return this;
    }

    getToolTip() {
        return this.toolTip;
    }

    openToolTip(coordinate) {
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
        (this.toolTip && this.toolTip.remove() && (delete this.toolTip));
        return this;
    }

    /**
     * different components should implement their own animation methods
     * @param {*} options
     * @param {*} cb
     */
    // eslint-disable-next-line no-unused-vars
    animateShow(options = {}, cb) {

    }

    config() {

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

    _initOptions(options) {
        this.options = maptalks.Util.extend({}, OPTIONS, options);
        return this;
    }

    _createMesh(geometry, material) {
        this.object3d = new THREE.Mesh(geometry, material);
        this.object3d.__parent = this;
        return this;
    }

    _createGroup() {
        this.object3d = new THREE.Group();
        this.object3d.__parent = this;
        return this;
    }


    _createLine(geometry, material) {
        this.object3d = new THREE.Line(geometry, material);
        this.object3d.computeLineDistances();
        this.object3d.__parent = this;
        return this;
    }


    // eslint-disable-next-line no-unused-vars
    _createPoints(geometry, material) {
        //Serving for particles
        this.object3d = new THREE.Points(geometry, material);
        this.object3d.__parent = this;
        return this;
    }

    _createLineSegments(geometry, material) {
        this.object3d = new THREE.LineSegments(geometry, material);
        this.object3d.computeLineDistances();
        this.object3d.__parent = this;
        return this;
    }
}

export default BaseObject;
