import * as maptalks from 'maptalks';
import * as THREE from 'three';
import { ThreeLayer } from "./../index";

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
 * This is the base class for all 3D objects
 * 
 * 
 * Its function and maptalks.geometry are as similar as possible
 */
class BaseObject extends maptalks.Eventable(Base) { //maptalks.Eventable(Base) return a Class  https://github.com/maptalks/maptalks.js/blob/master/src/core/Eventable.js
    constructor(id) {
        super();
        this.isBaseObject = true;
        this.object3d = null;
        this.options = {};
        this.toolTip = null;
        this.infoWindow = null;
        if (id == undefined) {
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
        this.id = id;
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
        this.options.properties = property
        return this;
    }


    getLayer() {
        return this.options.layer;
    }


    getMap() {
        const layer = this.getLayer();
        if (layer) {
            return layer.getMap();
        }
    }

    getCenter() {
        const options = this.getOptions();
        const { coordinate, lineString, polygon } = options;
        if (coordinate) {
            return coordinate;
        } else {
            const geometry = polygon || lineString;
            if (geometry && geometry.getCenter()) {
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
        return this;
    }


    hide() {
        this.getObject3d().visible = false;
        return this;
    }

    isVisible() {
        return (this.getObject3d().visible ? true : false);
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
            this.getObject3d().material = material;
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
        (coordinate && this.infoWindow && this.infoWindow.show(coordinate));
        return this;
    }

    closeInfoWindow() {
        (this.infoWindow && this.infoWindow.hide());
        return this;
    }


    removeInfoWindow() {
        (this.infoWindow && this.infoWindow.remove() && (delete this.infoWindow));
        return this;
    }

    setToolTip(content, options) {
        this.toolTip = new maptalks.ui.ToolTip(content, options);
        return this;
    }

    getToolTip() {
        return this.toolTip;
    }

    openToolTip(coordinate) {
        (coordinate && this.toolTip && this.toolTip.show(coordinate));
        return this;
    }

    closeToolTip() {
        (this.toolTip && this.toolTip.hide());
        return this;
    }

    removeToolTip() {
        (this.toolTip && this.toolTip.remove() && (delete this.toolTip));
        return this;
    }

    config() {

        return this;
    }

    // on() {

    // }

    // off() {

    // }

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


    _createPoints(geometry, material) {

        /**
         * todo points
         */
    }
}

export default BaseObject;