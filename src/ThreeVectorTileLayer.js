import * as maptalks from 'maptalks';
import * as THREE from 'three';
import { pushQueue, outQueue, getQueues, nextLoop } from './queue/TileDataQueue';
import { isGeoJSONPolygon, isGeoJSONLine, spliteGeoJSONMulti, isGeoJSONPoint, getGeoJSONCoordinates } from './util/GeoJSONUtil';

const canvas = document.createElement('canvas');
const SIZE = 256;
canvas.width = canvas.height = SIZE;
function generateImage(key, debug) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    if (debug) {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'rgba(255,0,0,0.4)';
        ctx.lineWidth = 0.2;
        const text = key || 'tile';
        ctx.font = '18px sans-serif';
        ctx.rect(0, 0, SIZE, SIZE);
        ctx.stroke();
        ctx.fillText(text, 15, SIZE / 2);
    }
    return canvas.toDataURL();
}

const OPTIONS = {
    worker: false
};
/**
 *Provide a simple data loading layer with large amount of data
 */
class ThreeVectorTileLayer extends maptalks.TileLayer {
    constructor(url, options = {}, getMaterial, layer) {
        super(maptalks.Util.GUID(), maptalks.Util.extend({ urlTemplate: url }, OPTIONS, options));
        this._opts = options;
        this._layer = layer;
        this.getMaterial = getMaterial;
        this._baseObjectKeys = {};
        this._loadTiles = {};
        this._add = null;
        this._layerLaodTime = new Date().getTime();
        this._init();
    }

    isAsynchronous() {
        return this._opts.worker;
    }

    /**
     *get current all baseobject
     */
    getBaseObjects() {
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
    onSelectMesh(type, e) {

    }

    /**
     * this is can override
     * @param {*} index
     * @param {*} json
     */
    formatBaseObjects(index, json) {
        const opts = this._opts, baseobjects = [];
        const asynchronous = this.isAsynchronous();
        for (let layerName in json) {
            const geojson = json[layerName] || {};
            let features;
            if (Array.isArray(geojson)) {
                features = geojson;
            } else if (geojson.type === 'FeatureCollection') {
                features = geojson.features;
            }
            if (features && features.length) {
                const polygons = [], lineStrings = [], points = [];
                for (let i = 0, len = features.length; i < len; i++) {
                    const feature = features[i];
                    if (isGeoJSONPolygon(feature)) {
                        polygons.push(feature);
                    } else if (isGeoJSONLine(feature)) {
                        const fs = spliteGeoJSONMulti(feature);
                        for (let j = 0, len1 = fs.length; j < len1; j++) {
                            lineStrings.push(fs[j]);
                        }
                    } else if (isGeoJSONPoint(feature)) {
                        const fs = spliteGeoJSONMulti(feature);
                        for (let j = 0, len1 = fs.length; j < len1; j++) {
                            points.push(maptalks.Util.extend({}, fs[j].properties, fs[j], { coordinate: getGeoJSONCoordinates(fs[j]) }));
                        }
                    }
                }
                if (polygons.length) {
                    const material = this._getMaterial(layerName, polygons, index, geojson);
                    if (material) {
                        const extrudepolygons = this._layer.toExtrudePolygons(polygons,
                            maptalks.Util.extend({}, { topColor: '#fff', layerName, asynchronous, key: index }, opts), material);
                        baseobjects.push(extrudepolygons);
                    }
                }

                if (lineStrings.length) {
                    const material = this._getMaterial(layerName, lineStrings, index, geojson);
                    if (material && (material instanceof THREE.LineBasicMaterial || material instanceof THREE.LineDashedMaterial)) {
                        const lines = this._layer.toLines(lineStrings, maptalks.Util.extend({}, { layerName }, opts), material);
                        baseobjects.push(lines);
                    }
                }
                if (points.length) {
                    const material = this._getMaterial(layerName, points, index, geojson);
                    if (material && material instanceof THREE.PointsMaterial) {
                        const ps = this._layer.toPoints(points, maptalks.Util.extend({}, { layerName }, opts), material);
                        baseobjects.push(ps);
                    }
                }
            }
        }
        return baseobjects;
    }

    //queue loop
    loopMessage(q) {
        const { currentQueue } = getQueues();
        if (currentQueue.length > 0) {
            this.getTileData(q);
        }
    }


    /**
     *
     * @param {*} q
     */
    getTileData(q) {
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
        const keys = [], keysMap = {};
        tileGrids.forEach(d => {
            const tiles = d.tiles || [];
            for (let i = 0, len = tiles.length; i < len; i++) {
                const { dupKey } = tiles[i];
                keys.push(dupKey);
                keysMap[dupKey] = true;
            }
        });
        return { keys, keysMap };
    }


    _isLoad() {
        const { keys } = this._getCurentTileKeys();
        const keys1 = Object.keys(this._renderer.tilesInView);
        if (keys.length === keys1.length) {
            return true;
        }
        return false;
    }


    _layerOnLoad() {
        // This event will be triggered multiple times per unit time
        const time = new Date().getTime();
        const offsetTime = time - this._layerLaodTime;
        if (offsetTime < 20) {
            return;
        }
        this._layerLaodTime = time;
        const tilesInView = this._renderer.tilesInView, loadTiles = this._loadTiles, threeLayer = this._layer, keys = this._baseObjectKeys;
        const tilesInViewLen = Object.keys(tilesInView), loadTilesLen = Object.keys(loadTiles).length;
        const needsRemoveBaseObjects = [];
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
            threeLayer.removeMesh(needsRemoveBaseObjects);
        }
        if (tilesInViewLen && loadTilesLen) {
            for (let index in tilesInView) {
                if (!loadTiles[index]) {
                    if (keys[index]) {
                        const baseobject = keys[index];
                        threeLayer.addMesh(baseobject);
                    } else {
                        const [y, x, z] = index.split('_').slice(1, 4);
                        this.getTileUrl(x, y, z);
                    }
                }
            }
        }
        this._loadTiles = Object.assign({}, tilesInView);
        this._diffCache();
    }

    _init() {
        this.on('layerload', this._layerOnLoad);
        this.on('add', () => {
            if (this._add === false) {
                const baseobjects = this.getBaseObjects();
                this._layer.addMesh(baseobjects);
            }
            this._add = true;
            /**
             * layerload have a bug ,Sometimes it doesn't trigger,I don't know why
             * Add heartbeat detection mechanism
             */
            this.intervalId = setInterval(() => {
                if (this._isLoad()) {
                    this.fire('layerload');
                }
            }, 1000);
        });
        this.on('remove', () => {
            this._add = false;
            const baseobjects = this.getBaseObjects();
            this._layer.removeMesh(baseobjects);
            clearInterval(this.intervalId);
        });
        this.on('show', () => {
            const baseobjects = this.getBaseObjects();
            baseobjects.forEach(baseobject => {
                baseobject.show();
            });
            for (let key in this._baseObjectKeys) {
                const baseobjects = this._baseObjectKeys[key] || [];
                baseobjects.forEach(baseobject => {
                    baseobject.show();
                });
            }
        });
        this.on('hide', () => {
            const baseobjects = this.getBaseObjects();
            baseobjects.forEach(baseobject => {
                baseobject.hide();
            });
            for (let key in this._baseObjectKeys) {
                const baseobjects = this._baseObjectKeys[key] || [];
                baseobjects.forEach(baseobject => {
                    baseobject.hide();
                });
            }
        });
        this.on('renderercreate', (e) => {
            e.renderer.loadTile = function loadTile(tile) {
                var tileSize = this.layer.getTileSize();
                var tileImage = new Image();
                tileImage.width = tileSize['width'];
                tileImage.height = tileSize['height'];
                tileImage.onload = this.onTileLoad.bind(this, tileImage, tile);
                tileImage.onerror = this.onTileError.bind(this, tileImage, tile);
                this.loadTileImage(tileImage, tile['url'], tile.dupKey);
                return tileImage;
            };

            e.renderer.deleteTile = function (tile) {
                if (!tile || !tile.image) {
                    return;
                }
                tile.image.onload = null;
                tile.image.onerror = null;
                const tileinfo = tile.info || {};
                outQueue(tileinfo.dupKey);
            };

            e.renderer.loadTileImage = (img, url, key) => {
                img._key = key;
                pushQueue(key, url, (index, json, image) => {
                    // img.src = generateImage(key, this._opts.debug);
                    nextLoop(index, this);
                    setTimeout(() => {
                        this._generateBaseObjects(index, json, image);
                    }, 5);
                }, img, this);
            };
        });
    }

    _getMaterial(layerName, data, index, geojson) {
        if (this.getMaterial && maptalks.Util.isFunction(this.getMaterial)) {
            return this.getMaterial(layerName, data, index, geojson);
        }
        return null;
    }

    _workerLoad(e) {
        const baseobject = e.target;
        const img = baseobject._img;
        img.currentCount++;
        if (img.currentCount === img.needCount) {
            img.src = generateImage(img._key, this._opts.debug);
        }
    }


    _generateBaseObjects(index, json, img) {
        if (json && img) {
            const { keysMap } = this._getCurentTileKeys();
            //not in current ,ignore
            if (!keysMap[index]) {
                img.src = generateImage(index, this._opts.debug);
                return;
            }
            const baseobjects = this.formatBaseObjects(index, json);
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

                this._layer.addMesh(baseobjects);
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

    _diffCache() {
        if (this._layer.getMap().isInteracting()) {
            return;
        }
        if (Object.keys(this._baseObjectKeys).length > this._renderer.tileCache.max) {
            const tileCache = this._renderer.tileCache.data;
            const tilesInView = this._renderer.tilesInView;
            const needsRemoveBaseObjects = [];
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
                this._layer.removeMesh(needsRemoveBaseObjects);
            }
        }
    }

    _diposeBaseObject(index) {
        const baseobjects = this._baseObjectKeys[index];
        if (baseobjects && baseobjects.length) {
            baseobjects.forEach(baseobject => {
                baseobject.getObject3d().geometry.dispose();
                if (baseobject._geometryCache) {
                    baseobject._geometryCache.dispose();
                }
                const bos = baseobject._baseObjects;
                if (bos && bos.length) {
                    bos.forEach(bo => {
                        bo.getObject3d().geometry.dispose();
                        bo = null;
                    });
                }
                baseobject._datas = null;
                baseobject._geometriesAttributes = null;
                baseobject._faceMap = null;
                baseobject = null;
            });
        }
    }

    _cachetile(index, baseobject) {
        if (!this._baseObjectKeys[index]) {
            this._baseObjectKeys[index] = [];
        }
        this._baseObjectKeys[index].push(baseobject);

    }
}

export default ThreeVectorTileLayer;
