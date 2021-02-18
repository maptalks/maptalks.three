import * as maptalks from 'maptalks';
import * as THREE from 'three';
import { pushQueue, outQueue, getQueues, nextLoop } from './queue/TileDataQueue';
import { isGeoJSONPolygon, isGeoJSONLine, spliteGeoJSONMulti, isGeoJSONPoint, getGeoJSONCoordinates } from './util/GeoJSONUtil';
import BaseVectorTileLayer from './BaseVectorTileLayer';
import { ThreeLayer } from './index';
import BaseObject from './BaseObject';
import { Queue } from './type';

const OPTIONS = {
    worker: false
};
/**
 *Provide a simple data loading layer with large amount of data
 */
class ThreeVectorTileLayer extends BaseVectorTileLayer {
    constructor(url: string, options: any = {}, getMaterial: Function, layer: ThreeLayer) {
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

    /**
     * this is can override
     * @param {*} index
     * @param {*} json
     */
    formatBaseObjects(index: string, json: any): BaseObject[] {
        const opts = this._opts, baseobjects: BaseObject[] = [];
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
    loopMessage(q: Queue): void {
        const { currentQueue } = getQueues();
        if (currentQueue.length > 0) {
            this.getTileData(q);
        }
    }

    _init(): void {
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
                if (this._isLoad() && (!this._layer.getMap().isInteracting())) {
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
                this.loadTileImage(tileImage, tile['url'], tile.id);
                return tileImage;
            };

            e.renderer.deleteTile = function (tile) {
                if (!tile || !tile.image) {
                    return;
                }
                tile.image.onload = null;
                tile.image.onerror = null;
                const tileinfo = tile.info || {};
                outQueue(tileinfo.id);
            };

            e.renderer.loadTileImage = (img, url, key) => {
                img._key = key;
                pushQueue(key, url, (index, json, image) => {
                    // img.src = generateImage(key, this._opts.debug);
                    this._generateBaseObjects(index, json, image);
                    nextLoop(index, this);
                }, img, this);
            };
        });
    }

    _getMaterial(layerName: string, data: any, index: string, geojson: any): THREE.Material {
        if (this.getMaterial && maptalks.Util.isFunction(this.getMaterial)) {
            return this.getMaterial(layerName, data, index, geojson);
        }
        return null;
    }

}

export default ThreeVectorTileLayer;
