import * as maptalks from 'maptalks';
import * as THREE from 'three';

const OPTIONS = {
    interactive: true,
    altitude: 0
};

/**
 * This is the base class for all 3D objects
 */
class BaseObject {
    constructor(id) {
        this.object3d = null;
        this.options = {};
        if (id == undefined) {
            id = maptalks.Util.GUID();
        }
        this.id = id;
    }

    getObject3d() {
        return this.object3d;
    }

    getId() {
        return this.id;
    }

    setId() {
        this.id = id;
        return this;
    }

    getType() {

    }

    getOptions() {
        return this.options;
    }

    getProperties() {
        return (this.options || {}).properties;
    }

    setProperties(property) {

        return this;
    }


    getLayer() {
        return this.options.layer;
    }

    show() {

        return this;
    }


    hide() {

        return this;
    }

    isVisible() {

    }


    getSymbol() {


    }

    setSymbol() {

        return this;
    }

    setInfoWindow(options) {

        return this;
    }

    getInfoWindow() {

    }

    openInfoWindow(coordinate) {

    }

    closeInfoWindow() {

    }


    removeInfoWindow() {

    }

    setTooltip(options) {

    }

    removeTooltip() {

    }

    config() {

    }

    on() {

    }

    off() {

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
        return this;
    }

    _createGroup() {
        this.object3d = new THREE.Group();
        return this;
    }


    _createLine(geometry, material) {

        /**
         * todo line
         */
    }


    _createPoints(geometry, material) {

        /**
         * todo points
         */
    }
}

export default BaseObject;