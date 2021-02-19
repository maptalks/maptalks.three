import * as maptalks from 'maptalks';
import Terrain from './Terrain';
import BaseVectorTileLayer from './BaseVectorTileLayer';
import { ThreeLayer } from './index';
import BaseObject from './BaseObject';
import { ImageType, Queue } from './type';

const OPTIONS = {
    // worker: false
    scale: 1,
    tileDivisor: 4
};
/**
 *
 */
class TerrainVectorTileLayer extends BaseVectorTileLayer {
    _imgQueue: { [key: string]: HTMLImageElement };
    constructor(url: string, options: any = {}, material: THREE.Material, layer: ThreeLayer) {
        super(maptalks.Util.GUID(), maptalks.Util.extend({ urlTemplate: url }, OPTIONS, options));
        this._opts = options;
        this._layer = layer;
        this.material = material;
        this._baseObjectKeys = {};
        this._loadTiles = {};
        this._add = null;
        this._imgQueue = {};
        this._layerLaodTime = new Date().getTime();
        this._init();
    }

    isAsynchronous(): boolean {
        return false;
    }

    /**
     * this is can override
     * @param {*} index
     * @param {*} json
     */
    formatBaseObjects(index: string, image: ImageType): BaseObject[] {
        const opts = this.options, baseobjects: BaseObject[] = [];
        const { scale, tileDivisor } = opts;
        const { x, y, z } = this._getXYZOfIndex(index);
        const zoom = this.getMap().getZoom();
        const texture = this.getTileUrl(x, y, z);
        const [imageWidth, imageHeight] = this.options.tileSize;

        const extent = this._getTileLngLatExtent(x, y, z);
        const material = this.material.clone();
        if ((z + 1) >= Math.round(zoom)) {
            const terrain = new Terrain(extent, {
                image,
                imageWidth: imageWidth / tileDivisor,
                imageHeight: imageHeight / tileDivisor,
                texture
            }, material, this._layer);
            terrain.getObject3d().scale.set(scale, scale, 1);
            baseobjects.push(terrain);
        }
        return baseobjects;
    }

    //queue loop
    loopMessage(q: Queue): void {
        this.getTileData(q);
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

            e.renderer.deleteTile = (tile) => {
                if (!tile || !tile.image) {
                    return;
                }
                tile.image.onload = null;
                tile.image.onerror = null;
                const tileinfo = tile.info || {};
                const rgbImage = this._imgQueue[tileinfo.id];
                if (rgbImage) {
                    rgbImage.src = '';
                    rgbImage.onload = null;
                    rgbImage.onerror = null;
                    delete this._imgQueue[tileinfo.id];
                }
            };
            e.renderer.loadTileImage = (img, url, key) => {
                img._key = key;
                const rgbImage = new Image();
                this._imgQueue[key] = rgbImage;
                const q = {
                    key,
                    url,
                    rgbImage,
                    callback: (index, rgbImage, image) => {
                        this._generateBaseObjects(index, rgbImage, image);
                    },
                    img,
                    vt: this
                };
                this.loopMessage(q);
            };
        });
    }
}

export default TerrainVectorTileLayer;
