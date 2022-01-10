import * as maptalks from 'maptalks';
import { isGeoJSONLine, isGeoJSONPolygon } from '../util/GeoJSONUtil';
import { getPolygonArrayBuffer, getPolygonPositions } from '../util/ExtrudeUtil';
// import pkg from './../../package.json';
import { getLinePosition } from '../util/LineUtil';
import { LineStringType, PolygonType, SingleLineStringType } from './../type/index';
import { ThreeLayer } from './../index';
import { getWorkerName } from './worker';

let MeshActor;
if (maptalks.worker) {
    MeshActor = class extends maptalks.worker.Actor {
        test(info, cb) {
            //send data to worker thread
            this.send(info, null, cb);
        }

        pushQueue(q: any = {}) {
            const { type, data, callback, layer, key, center, lineStrings } = q;
            let params;
            if (type.indexOf('ExtrudePolygon') > -1) {
                params = gengerateExtrudePolygons(data, center, layer);
            } else if (type === 'ExtrudeLines') {
                params = gengerateExtrudeLines(data, center, layer, lineStrings);
            } else if (type === 'Point') {
                //todo points
            }
            if (!params) {
                return;
            }
            this.send({ type, datas: params.datas, glRes: params.glRes, matrix: params.matrix, center: params.center }, params.transfer, function (err, message) {
                if (err) {
                    console.error(err);
                }
                message.key = key;
                callback(message);
            });
        }


        // eslint-disable-next-line no-unused-vars
        // receive(message) {
        //     console.log(message);
        // }
    };
}

var actor: maptalks.worker.Actor;
export function getActor(): maptalks.worker.Actor {
    if (!maptalks.worker) {
        console.error('maptalks.worker is not defined,You can\'t use ThreeVectorTileLayer');
    }
    if (!actor && MeshActor) {
        actor = new MeshActor(getWorkerName());
    }
    return actor;
}
/**
 * generate extrudepolygons data for worker
 * @param {*} polygons
 * @param {*} layer
 */
function gengerateExtrudePolygons(polygons: PolygonType[] = [], center: maptalks.Coordinate, layer: ThreeLayer) {
    const isMercator = layer.isMercator();
    let glRes, matrix;
    if (isMercator) {
        const map = layer.getMap();
        glRes = map.getGLRes();
        matrix = map.getSpatialReference().getTransformation().matrix;
    }
    let centerPt;
    if (center) {
        centerPt = layer.coordinateToVector3(center);
    }
    const len = polygons.length;
    const datas = [], transfer = [], altCache = {};
    for (let i = 0; i < len; i++) {
        const polygon = polygons[i];
        const p = (polygon as any);
        const properties = p._properties ? p._properties : (isGeoJSONPolygon(p) ? p['properties'] : p.getProperties() || {});
        if (!center) {
            centerPt = layer.coordinateToVector3(properties.center);
        }
        let data;
        if (isMercator) {
            data = getPolygonArrayBuffer(polygon);
        } else {
            data = getPolygonPositions(polygon, layer, properties.center || center, centerPt, true);
        }
        for (let j = 0, len1 = data.length; j < len1; j++) {
            const d = data[j];
            for (let m = 0, len2 = d.length; m < len2; m++) {
                //ring
                transfer.push(d[m]);
            }
        }
        let height = properties.height || 1;
        let bottomHeight = properties.bottomHeight || 0;
        if (bottomHeight !== undefined && typeof bottomHeight === 'number' && bottomHeight !== 0) {
            if (altCache[bottomHeight] === undefined) {
                altCache[bottomHeight] = layer.distanceToVector3(bottomHeight, bottomHeight).x;
            }
            bottomHeight = altCache[bottomHeight];
        }
        if (altCache[height] === undefined) {
            altCache[height] = layer.distanceToVector3(height, height).x;
        }
        height = altCache[height];
        const d = {
            id: properties.id,
            data,
            height,
            bottomHeight,
        };
        if (isMercator) {
            (d as any).center = [centerPt.x, centerPt.y];
        }
        datas.push(d);
    }
    return {
        datas,
        transfer,
        glRes,
        matrix,
        center: isMercator ? [centerPt.x, centerPt.y] : null
    };
}

/**
 * generate ExtrudeLines data for worker
 * @param {*} lineStringList
 * @param {*} center
 * @param {*} layer
 */
function gengerateExtrudeLines(lineStringList: Array<Array<SingleLineStringType>>, center: maptalks.Coordinate, layer: ThreeLayer, lineStrings: Array<LineStringType>) {
    const datas = [], transfer = [], altCache = {};
    const len = lineStringList.length;
    for (let i = 0; i < len; i++) {
        const multiLineString = lineStringList[i];
        const properties = (isGeoJSONLine(lineStrings[i] as any) ? lineStrings[i]['properties'] : (lineStrings[i] as any).getProperties() || {});
        const width = properties.width || 1;
        const height = properties.height || 1;
        let bottomHeight = properties.bottomHeight || 0;
        if (bottomHeight !== undefined && typeof bottomHeight === 'number' && bottomHeight !== 0) {
            if (altCache[bottomHeight] === undefined) {
                altCache[bottomHeight] = layer.distanceToVector3(bottomHeight, bottomHeight).x;
            }
            bottomHeight = altCache[bottomHeight];
        }
        if (altCache[height] === undefined) {
            altCache[height] = layer.distanceToVector3(height, height).x;
        }
        if (altCache[width] === undefined) {
            altCache[width] = layer.distanceToVector3(width, width).x;
        }
        const data = [];
        for (let j = 0, len1 = multiLineString.length; j < len1; j++) {
            const lineString = multiLineString[j];
<<<<<<< HEAD
            const arrayBuffer = getLinePosition(lineString, layer, center, false).arrayBuffer;
            transfer.push(arrayBuffer);
            data.push(arrayBuffer);
=======
            const positions2d = getLinePosition(lineString, layer, center).positions2d.buffer;
            transfer.push(positions2d);
            data.push(positions2d);
>>>>>>> 365
        }
        datas.push({
            data,
            height: altCache[height],
            width: altCache[width],
            bottomHeight
        });
    }
    return {
        datas,
        transfer
    };
}




