
import * as maptalks from 'maptalks';

const ROW: number = 30, COL: number = 30;


function contains(b: BBox, p: Array<number>) {
    const { minx, miny, maxx, maxy } = b;
    const [x, y] = p;
    if (minx <= x && x <= maxx && miny <= y && y <= maxy) {
        return true;
    }
    return false;
}

class BBox {
    minlng: number;
    minlat: number;
    maxlng: number;
    maxlat: number;
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
    coordinates: Array<Array<number>>;
    positions: Array<THREE.Vector3>;
    indexs: Array<number>;
    key: string;

    constructor(minlng: number, minlat: number, maxlng: number, maxlat: number) {
        this.minlng = minlng;
        this.minlat = minlat;
        this.maxlng = maxlng;
        this.maxlat = maxlat;
        this.minx = Infinity;
        this.miny = Infinity;
        this.maxx = -Infinity;
        this.maxy = -Infinity;
        this.coordinates = [];
        this.positions = [];
        this.indexs = [];
        this.key = null;
    }


    /**
     *
     * @param {*} map
     */
    updateBBoxPixel(map: maptalks.Map) {
        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
        const { minlng, minlat, maxlng, maxlat } = this;
        [
            [minlng, minlat],
            [minlng, maxlat],
            [maxlng, minlat],
            [maxlng, maxlat]
        ].map(lnglat => {
            return new maptalks.Coordinate(lnglat);
        }).map(coordinate => {
            return map.coordToContainerPoint(coordinate);
        }).forEach(pixel => {
            minx = Math.min(minx, pixel.x);
            miny = Math.min(miny, pixel.y);
            maxx = Math.max(maxx, pixel.x);
            maxy = Math.max(maxy, pixel.y);
        });
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
        return this;
    }

    /**
     *Determine whether a point is included
     * @param {*} c
     */
    containsCoordinate(c: Array<number> | maptalks.Coordinate) {
        let lng, lat;
        if (Array.isArray(c)) {
            lng = c[0];
            lat = c[1];
        } else if (c instanceof maptalks.Coordinate) {
            lng = c.x;
            lat = c.y;
        }
        const { minlng, minlat, maxlng, maxlat } = this;
        return (minlng <= lng && lng <= maxlng && minlat <= lat && lat <= maxlat);
    }

    /**
     *Judge rectangle intersection
     * @param {*} pixel
     * @param {*} size
     */
    isRecCross(pixel: maptalks.Point, size: number): boolean {
        const { x, y } = pixel;
        const rec = {
            minx: x - size / 2,
            miny: y - size / 2,
            maxx: x + size / 2,
            maxy: y + size / 2
        };
        const { minx, miny, maxx, maxy } = rec;
        if (contains(this, [minx, miny]) ||
            contains(this, [minx, maxy]) ||
            contains(this, [maxx, miny]) ||
            contains(this, [maxx, maxy]) ||
            contains(rec as BBox, [this.minx, this.miny]) ||
            contains(rec as BBox, [this.minx, this.maxy]) ||
            contains(rec as BBox, [this.maxx, this.miny]) ||
            contains(rec as BBox, [this.maxx, this.maxy])) {
            return true;
        }
        return false;
    }

    /**
     *generate grids
     * @param {*} minlng
     * @param {*} minlat
     * @param {*} maxlng
     * @param {*} maxlat
     */
    static initGrids(minlng: number, minlat: number, maxlng: number, maxlat: number): BBox[] {
        const grids: BBox[] = [], offsetX = maxlng - minlng, offsetY = maxlat - minlat;
        const averageX = offsetX / COL, averageY = offsetY / ROW;
        let x = minlng, y = minlat;
        for (let i = 0; i < COL; i++) {
            x = minlng + i * averageX;
            for (let j = 0; j < ROW; j++) {
                y = minlat + j * averageY;
                const bounds = new BBox(x, y, x + averageX, y + averageY);
                bounds.key = j + '-' + i;
                grids.push(bounds);
            }
        }
        return grids;
    }

}

export default BBox;
