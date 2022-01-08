import * as maptalks from 'maptalks';
import { isGeoJSONLine, isGeoJSONPolygon } from '../util/GeoJSONUtil';
import { getPolygonPositions } from '../util/ExtrudeUtil';
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
            if (type === 'Polygon') {
                params = gengerateExtrudePolygons(data, center, layer);
            } else if (type === 'LineString') {
                //todo liness
                params = gengerateExtrudeLines(data, center, layer, lineStrings);
            } else if (type === 'Point') {
                //todo points
            }
            this.send({ type, datas: params.datas }, params.transfer, function (err, message) {
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
    const centerPt = layer.coordinateToVector3(center);
    const len = polygons.length;
    const datas = [], transfer = [], altCache = {};
    for (let i = 0; i < len; i++) {
        const polygon = polygons[i];
        const data = getPolygonPositions(polygon, layer, center, centerPt, true);
        for (let j = 0, len1 = data.length; j < len1; j++) {
            const d = data[j];
            for (let m = 0, len2 = d.length; m < len2; m++) {
                //ring
                transfer.push(d[m]);
            }
        }
        const properties = (isGeoJSONPolygon(polygon as any) ? polygon['properties'] : (polygon as any).getProperties() || {});
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
        datas.push({
            data,
            height,
            bottomHeight
        });
    }
    return {
        datas,
        transfer
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
            const arrayBuffer = getLinePosition(lineString, layer, center, false).arrayBuffer;
            transfer.push(arrayBuffer);
            data.push(arrayBuffer);
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




