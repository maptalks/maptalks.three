import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getGeometriesColorArray } from './util';
import { addAttribute, getVertexColors } from './util/ThreeAdaptUtil';

const EVENTS = ['click', 'mousemove', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].join(' ').toString();
const defaultMaterial = new THREE.MeshBasicMaterial();
(defaultMaterial as any).vertexColors = getVertexColors();

type Constructor<T> = new (...args: any[]) => T;

/**
 * This is for the merger, MergedExtrudeMesh,Points ...
 * @param {*} Base
 */
const MergedMixin = <T extends Constructor<BaseObject>>(Base: T) => {

    return class extends Base {
        _faceMap: Array<Array<number>>;
        _baseObjects: Array<BaseObject>;
        _datas: Array<any>;
        faceIndex: number;
        index: number;
        _geometriesAttributes: Array<any>;
        _geometryCache: THREE.BufferGeometry;
        isHide: boolean;

        // this._faceMap=[];
        // this._baseObjects = [];
        // this._datas = [];
        // this.faceIndex = null;
        // this.index=null;
        // this._geometriesAttributes = [];
        // this._geometryCache = geometry.clone();
        // this.isHide = false;

        /**
         *
         * @param {*} baseObjects
         */
        _initBaseObjectsEvent(baseObjects: Array<BaseObject>) {
            if (baseObjects && Array.isArray(baseObjects) && baseObjects.length) {
                for (let i = 0, len = baseObjects.length; i < len; i++) {
                    const baseObject = baseObjects[i];
                    this._proxyEvent(baseObject);
                }
            }
            return this;
        }

        /**
         *Events representing the merge
         * @param {*} baseObject
         */
        _proxyEvent(baseObject: BaseObject): void {
            baseObject.on('add', (e) => {
                this._showGeometry(e.target, true);
            });
            baseObject.on('remove', (e) => {
                this._showGeometry(e.target, false);
            });
            baseObject.on('mouseout', (e) => {
                this._mouseover = false;
                this.fire('mouseout', Object.assign({}, e, { target: this, selectMesh: (this.getSelectMesh ? this.getSelectMesh() : null) }));
                // this._showGeometry(e.target, false);
            });
            baseObject.on(EVENTS, (e) => {
                this.fire(e.type, Object.assign({}, e, { target: this, selectMesh: (this.getSelectMesh ? this.getSelectMesh() : null) }));
            });
        }


        /**
         * Get the index of the monomer to be hidden
         * @param {*} attribute
         */
        _getHideGeometryIndex(attribute: string) {
            const indexs: Array<number> = [];
            let count = 0;
            for (let i = 0, len = this._geometriesAttributes.length; i < len; i++) {
                if (this._geometriesAttributes[i].hide === true) {
                    indexs.push(i);
                    count += this._geometriesAttributes[i][attribute].count;
                }
            }
            return {
                indexs,
                count
            };
        }

        /**
         * update geometry attributes
         * @param {*} bufferAttribute
         * @param {*} attribute
         */
        _updateAttribute(bufferAttribute: THREE.BufferAttribute, attribute: string) {
            const { indexs } = this._getHideGeometryIndex(attribute);
            const array = this._geometryCache.attributes[attribute].array;
            const len = array.length;
            for (let i = 0; i < len; i++) {
                (bufferAttribute as any).array[i] = array[i];
            }
            let value = NaN;
            if (this.getObject3d() instanceof THREE.LineSegments) {
                value = 0;
            }
            for (let j = 0; j < indexs.length; j++) {
                const index = indexs[j];
                const { start, end } = this._geometriesAttributes[index][attribute];
                for (let i = start; i < end; i++) {
                    (bufferAttribute as any).array[i] = value;
                }
            }
            return this;
        }

        /**
         * show or hide monomer
         * @param {*} baseObject
         * @param {*} isHide
         */
        _showGeometry(baseObject: BaseObject, isHide: boolean) {
            let index;
            if (baseObject) {
                index = baseObject.getOptions().index;
            }
            if (index != null) {
                const geometryAttributes = this._geometriesAttributes[index];
                const { hide } = geometryAttributes;
                if (hide === isHide) {
                    return this;
                }
                geometryAttributes.hide = isHide;
                const buffGeom = (this.getObject3d() as any).geometry;
                this._updateAttribute(buffGeom.attributes.position, 'position');
                // this._updateAttribute(buffGeom.attributes.normal, 'normal', 3);
                // this._updateAttribute(buffGeom.attributes.color, 'color', 3);
                // this._updateAttribute(buffGeom.attributes.uv, 'uv', 2);
                buffGeom.attributes.position.needsUpdate = true;
                // buffGeom.attributes.color.needsUpdate = true;
                // buffGeom.attributes.normal.needsUpdate = true;
                // buffGeom.attributes.uv.needsUpdate = true;
                this.isHide = isHide;
            }
            return this;
        }


        /**
         * Get selected monomer
         */
        // eslint-disable-next-line consistent-return
        getSelectMesh(): {
            data: any;
            baseObject: BaseObject;
        } {
            const index = this._getIndex();
            if (index != null) {
                return {
                    data: this._datas[index],
                    baseObject: this._baseObjects[index]
                };
            }
        }

        _getIndex(faceIndex?: number): number {
            if (faceIndex == null) {
                faceIndex = this.faceIndex || this.index;
            }
            return faceIndex;
        }

        _init(): void {
            const pick = this.getLayer().getPick();
            this.on('add', () => {
                pick.add(this.pickObject3d);
            });
            this.on('remove', () => {
                pick.remove(this.pickObject3d);
            });
        }

        //Different objects need to implement their own methods
        _setPickObject3d() {
            if (!this._colorMap) {
                return;
            }
            // multiplexing geometry
            const geometry = this._geometryCache || (this.getObject3d() as any).geometry.clone();
            const pick = this.getLayer().getPick();
            const { _geometriesAttributes } = this;
            const len = _geometriesAttributes.length;
            const colors = getGeometriesColorArray(_geometriesAttributes);
            let cIndex = 0;
            for (let i = 0; i < len; i++) {
                const color = pick.getColor();
                const colorIndex = color.getHex();
                this._colorMap[colorIndex] = i;
                const { count } = _geometriesAttributes[i].position;
                this._datas[i].colorIndex = colorIndex;
                for (let j = 0; j < count; j++) {
                    colors[cIndex] = color.r;
                    colors[cIndex + 1] = color.g;
                    colors[cIndex + 2] = color.b;
                    cIndex += 3;
                }
            }
            addAttribute(geometry, 'color', new THREE.BufferAttribute(colors, 3, true));
            // const material = new THREE.MeshBasicMaterial();
            // material.vertexColors = THREE.VertexColors;
            const color = pick.getColor();
            const colorIndex = color.getHex();
            const mesh = new THREE.Mesh(geometry, defaultMaterial);
            mesh.position.copy(this.getObject3d().position);
            mesh['_colorIndex'] = colorIndex;
            this.setPickObject3d(mesh);
        }
    };
};

export default MergedMixin;
