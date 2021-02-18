import * as maptalks from 'maptalks';
import BaseObject from './BaseObject';
import { ThreeLayer } from './index';
import { Queue } from './type';
import { generateImage } from './util/CanvasUtil';

/**
 *
 */
class BaseVectorTileLayer extends maptalks.TileLayer {
    _opts: any;
    _layer: ThreeLayer;
    material: THREE.Material;
    getMaterial: Function;
    _baseObjectKeys: { [key: string]: Array<BaseObject> };
    _loadTiles: { [key: string]: any };
    _add: boolean;
    _layerLaodTime: number;
    intervalId: any;
    constructor(url, options = {}) {
        super(maptalks.Util.GUID(), maptalks.Util.extend({ urlTemplate: url }, options));
        this._opts = null;
        this._layer = null;
        this.material = null;
        this.getMaterial = null;
        this._baseObjectKeys = {};
        this._loadTiles = {};
        this._add = null;
        this._layerLaodTime = new Date().getTime();
    }


    isAsynchronous(): boolean {
        return this._opts.worker;
    }


    /**
     *get current all baseobject
     */
    getBaseObjects(): BaseObject[] {
        const loadTiles = this._loadTiles;
        const baseos = [];
        for (let key in loadTiles) {
            const baseobjects = this._baseObjectKeys[key];
            if (baseobjects && Array.isArray(baseobjects) && baseobjects.length) {
                for (let i = 0, len = baseobjects.length; i < len; i++) {
                    baseos.push(baseobjects[i]);
                }
            }
        }
        return baseos;
    }

    /**
   * This method should be overridden for event handling
   * @param {*} type
   * @param {*} e
   */
    // eslint-disable-next-line no-unused-vars
    onSelectMesh(type: string, e: any): void {

    }


    /**
   * this is can override
   * @param {*} index
   * @param {*} json
   */
    // eslint-disable-next-line no-unused-vars
    formatBaseObjects(index: string, json: any): BaseObject[] {
        return [];
    }

    //queue loop
    // eslint-disable-next-line no-unused-vars
    loopMessage(q: Queue): void {

    }


    /**
    *
    * @param {*} q
    */
    getTileData(q: Queue): void {
        const { key, url, callback, img } = q;
        maptalks.Ajax.getJSON(url, {}, function (error, res) {
            if (error) {
                console.error(error);
                callback(key, null, img);
            } else {
                callback(key, res, img);
            }
        });
    }

    _getCurentTileKeys() {
        const tileGrids = this.getTiles().tileGrids || [];
        const keys: Array<string> = [], keysMap: { [key: string]: boolean } = {};
        for (let i = 0, len = tileGrids.length; i < len; i++) {
            const d = tileGrids[i];
            const tiles = d.tiles || [];
            for (let j = 0, len1 = tiles.length; j < len1; j++) {
                const { id } = tiles[j];
                keys.push(id);
                keysMap[id] = true;
            }

        }
        return { keys, keysMap };
    }


    _isLoad(): boolean {
        const { keys } = this._getCurentTileKeys();
        const keys1 = Object.keys(this._renderer.tilesInView);
        if (keys.length === keys1.length) {
            return true;
        }
        return false;
    }


    _layerOnLoad(): void {
        // This event will be triggered multiple times per unit time
        const time = new Date().getTime();
        const offsetTime = time - this._layerLaodTime;
        if (offsetTime < 20) {
            return;
        }
        this._layerLaodTime = time;
        const tilesInView = this._renderer.tilesInView, loadTiles = this._loadTiles, threeLayer = this._layer, keys = this._baseObjectKeys;
        const tilesInViewLen = Object.keys(tilesInView).length, loadTilesLen = Object.keys(loadTiles).length;
        const needsRemoveBaseObjects: BaseObject[] = [];
        if (tilesInViewLen && loadTilesLen) {
            for (let index in loadTiles) {
                if (!tilesInView[index]) {
                    if (keys[index]) {
                        (keys[index] || []).forEach(baseobject => {
                            needsRemoveBaseObjects.push(baseobject);
                        });
                    }
                }
            }
        }
        if (needsRemoveBaseObjects.length) {
            threeLayer.removeMesh(needsRemoveBaseObjects, false);
        }
        if (tilesInViewLen && loadTilesLen) {
            for (let index in tilesInView) {
                if (!loadTiles[index]) {
                    if (keys[index]) {
                        const baseobject = keys[index];
                        threeLayer.addMesh(baseobject);
                    } else {
                        const { x, y, z } = this._getXYZOfIndex(index);
                        this.getTileUrl(x, y, z);
                    }
                }
            }
        }
        this._loadTiles = Object.assign({}, tilesInView);
        this._diffCache();
    }


    _init(): void {

    }


    _workerLoad(e: any) {
        const baseobject = e.target;
        const img = baseobject._img;
        img.currentCount++;
        if (img.currentCount === img.needCount) {
            img.src = generateImage(img._key, this._opts.debug);
        }
    }


    _generateBaseObjects(index: string, res: any, img: any) {
        if (res && img) {
            const { keysMap } = this._getCurentTileKeys();
            //not in current ,ignore
            if (!keysMap[index]) {
                img.src = generateImage(index, this._opts.debug);
                return;
            }
            const baseobjects = this.formatBaseObjects(index, res);
            if (baseobjects.length) {
                img.needCount = baseobjects.length;
                img.currentCount = 0;
                for (let i = 0, len = baseobjects.length; i < len; i++) {
                    const baseobject = baseobjects[i];
                    baseobject._img = img;
                    baseobject._vt = this;
                    if (!this.isVisible()) {
                        baseobject.hide();
                    }
                    this._cachetile(index, baseobject);
                    if (!baseobject.isAsynchronous()) {
                        img.currentCount++;
                    }
                }

                this._layer.addMesh(baseobjects, false);
                if (img.needCount === img.currentCount) {
                    img.src = generateImage(index, this._opts.debug);
                }
                if (this.isAsynchronous()) {
                    baseobjects.filter(baseobject => {
                        return baseobject.isAsynchronous();
                    }).forEach(baseobject => {
                        baseobject.on('workerload', this._workerLoad, this);
                    });
                } else {
                    img.src = generateImage(index, this._opts.debug);
                }
            } else {
                img.src = generateImage(index, this._opts.debug);
            }
            this._loadTiles[index] = true;
        } else if (img) {
            img.src = generateImage(index, this._opts.debug);
        }
    }

    _diffCache(): void {
        // if (this._layer.getMap().isInteracting()) {
        //     return;
        // }
        if (Object.keys(this._baseObjectKeys).length > this._renderer.tileCache.max) {
            const tileCache = this._renderer.tileCache.data;
            const tilesInView = this._renderer.tilesInView;
            const needsRemoveBaseObjects: BaseObject[] = [];
            for (let index in this._baseObjectKeys) {
                if (!tileCache[index] && !tilesInView[index]) {
                    (this._baseObjectKeys[index] || []).forEach(baseobject => {
                        if (baseobject.isAdd) {
                            needsRemoveBaseObjects.push(baseobject);
                        }
                    });
                    this._diposeBaseObject(index);
                    delete this._baseObjectKeys[index];
                }
            }
            // Batch deletion can have better performance
            if (needsRemoveBaseObjects.length) {
                this._layer.removeMesh(needsRemoveBaseObjects, false);
            }
        }
    }

    _diposeBaseObject(index: string): void {
        const baseobjects = this._baseObjectKeys[index];
        if (baseobjects && baseobjects.length) {
            baseobjects.forEach(baseobject => {
                (baseobject.getObject3d() as any).geometry.dispose();
                if (baseobject._geometryCache) {
                    baseobject._geometryCache.dispose();
                }
                const bos = baseobject._baseObjects;
                if (bos && bos.length) {
                    bos.forEach(bo => {
                        (bo.getObject3d() as any).geometry.dispose();
                        bo = null;
                    });
                }
                baseobject._datas = null;
                baseobject._geometriesAttributes = null;
                baseobject._faceMap = null;
                baseobject._colorMap = null;
                if (baseobject.pickObject3d) {
                    (baseobject.pickObject3d as any).geometry.dispose();
                    // baseobject.pickObject3d.material.dispose();
                }
                baseobject = null;
            });
        }
    }

    _cachetile(index: string, baseobject: BaseObject): void {
        if (!this._baseObjectKeys[index]) {
            this._baseObjectKeys[index] = [];
        }
        this._baseObjectKeys[index].push(baseobject);

    }

    _getXYZOfIndex(index: string) {
        const splitstr = index.indexOf('_') > -1 ? '_' : '-';
        let [y, x, z] = index.split(splitstr).slice(1, 4);
        const x1 = parseInt(x);
        const y1 = parseInt(y);
        const z1 = parseInt(z);
        return { x: x1, y: y1, z: z1 };
    }


    _getTileExtent(x: number, y: number, z: number): maptalks.Extent {
        const map = this.getMap(),
            res = map._getResolution(z),
            tileConfig = this._getTileConfig(),
            tileExtent = tileConfig.getTilePrjExtent(x, y, res);
        return tileExtent;
    }

    /**
     *
     * @param {} x
     * @param {*} y
     * @param {*} z
     */
    _getTileLngLatExtent(x: number, y: number, z: number): maptalks.Extent {
        const tileExtent = this._getTileExtent(x, y, z);
        let max = tileExtent.getMax(),
            min = tileExtent.getMin();
        const map = this.getMap();
        const projection = map.getProjection();
        min = projection.unproject(min);
        max = projection.unproject(max);
        return new maptalks.Extent(min, max);
    }
}

export default BaseVectorTileLayer;

