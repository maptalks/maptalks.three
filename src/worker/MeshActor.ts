import * as maptalks from 'maptalks';
import { getPolygonArrayBuffer, getPolygonPositions } from '../util/ExtrudeUtil';
// import pkg from './../../package.json';
import { getLineArrayBuffer, getLinePosition } from '../util/LineUtil';
import { LineStringType, PolygonType, SingleLineStringType } from './../type/index';
import { ThreeLayer } from './../index';
import { getWorkerName } from './worker';
import { getLineStringProperties, getPolygonProperties } from './../util/index';

let MeshActor;
if (maptalks.worker) {
    MeshActor = class extends maptalks.worker.Actor {
        test(info, cb) {
            //send data to worker thread
            this.send(info, null, cb);
        }

        pushQueue(q: any = {}) {
            const { type, data, callback, layer, key, center, lineStrings, options, id, baseOptions } = q;
            let params;
            if (type.indexOf('ExtrudePolygon') > -1) {
                params = gengerateExtrudePolygons(data, center, layer, options, baseOptions);
            } else if (type === 'ExtrudeLines' || type === 'Paths') {
                params = gengerateExtrudeLines(data, center, layer, lineStrings, options, baseOptions);
            } else if (type === 'Point') {
                //todo points
            } else if (type === 'Line' || type === 'FatLine') {
                params = gengerateLines(data, center, layer, lineStrings, options, baseOptions);
            } else if (type === 'Lines' || type === 'FatLines') {
                params = gengerateLines(data, center, layer, lineStrings, options, baseOptions);
            } else if (type === 'ExtrudeLine' || type === 'Path') {
                params = gengerateExtrudeLines(data, center, layer, lineStrings, options, baseOptions);
            } else if (type === 'Bar' || type === 'Bars') {
                params = generateBars(data);
            }
            if (!params) {
                console.error(`No processing logic found for type:${type}`);
                return;
            }
            this.send({ type, datas: params.datas, glRes: params.glRes, matrix: params.matrix, center: params.center },
                params.transfer, function (err, message) {
                    if (err) {
                        console.error(err);
                    }
                    message.key = key;
                    message.id = id;
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
 * 
 * @param distance 
 * @param layer 
 * @param altCache 
 * @returns 
 */
function getDistance(distance: number, layer: ThreeLayer, altCache = {}) {
    if (distance !== undefined && typeof distance === 'number' && distance !== 0) {
        if (altCache[distance] === undefined) {
            altCache[distance] = layer.distanceToVector3(distance, distance).x;
        }
        return altCache[distance];
    }
    return 0;
}

function getAltitude(altitude: number, layer: ThreeLayer, altCache = {}) {
    if (altitude !== undefined && typeof altitude === 'number' && altitude !== 0) {
        if (altCache[altitude] === undefined) {
            altCache[altitude] = layer.altitudeToVector3(altitude, altitude).x;
        }
        return altCache[altitude];
    }
    return 0;
}

function mergeOptions(properties, baseOptions) {
    if (!baseOptions) {
        return properties || {};
    }
    return Object.assign({}, baseOptions, properties);
}

/**
 * generate extrudepolygons data for worker
 * @param {*} polygons
 * @param {*} layer
 */
function gengerateExtrudePolygons(polygons: PolygonType[] = [], center: maptalks.Coordinate, layer: ThreeLayer, options: Array<any> = [], baseOptions?: any) {
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
        let properties = options[i] ? options[i] : getPolygonProperties(p);
        properties = mergeOptions(properties, baseOptions);
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
        const top = properties.top;
        height = getAltitude(height, layer, altCache);
        bottomHeight = getAltitude(bottomHeight, layer, altCache);
        const d = {
            id: properties.id,
            data,
            height,
            bottomHeight,
            top
        };
        if (isMercator) {
            (d as any).center = [centerPt.x, centerPt.y];
        }
        datas.push(d);
        //delete Internal properties
        if (p._properties) {
            delete p._properties;
        }
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
function gengerateExtrudeLines(lineStringList: Array<Array<SingleLineStringType>>, center: maptalks.Coordinate, layer: ThreeLayer,
    lineStrings: Array<LineStringType>, options: Array<any> = [], baseOptions?: any) {
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
    const datas = [], transfer = [], cache = {}, altCache = {};
    const len = lineStringList.length;
    for (let i = 0; i < len; i++) {
        const multiLineString = lineStringList[i];
        let properties = options[i] ? options[i] : getLineStringProperties(lineStrings[i]);
        properties = mergeOptions(properties, baseOptions);
        if (!center) {
            centerPt = layer.coordinateToVector3(properties.center);
        }
        let width = properties.width || 1;
        let height = properties.height || 1;
        let cornerRadius = properties.cornerRadius || 0;
        let bottomHeight = properties.bottomHeight || 0;
        //for ExtrudeLineTrail ,slice lines the center is lineCenter
        const parentCenter = properties.parentCenter;
        width = getDistance(width, layer, cache);
        cornerRadius = getDistance(cornerRadius, layer, cache);
        height = getAltitude(height, layer, altCache);
        bottomHeight = getAltitude(bottomHeight, layer, altCache);
        const data = [];
        for (let j = 0, len1 = multiLineString.length; j < len1; j++) {
            const lineString = multiLineString[j];
            let arrayBuffer: ArrayBuffer;
            if (isMercator) {
                arrayBuffer = getLineArrayBuffer(lineString, layer);
            } else {
                arrayBuffer = getLinePosition(lineString, layer, parentCenter || center, false).arrayBuffer;
            }
            transfer.push(arrayBuffer);
            data.push(arrayBuffer);
        }
        const d = {
            id: properties.id,
            data,
            height,
            width,
            cornerRadius,
            bottomHeight
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
 * generate Lines data for worker
 * @param lineStringList 
 * @param center 
 * @param layer 
 * @param lineStrings 
 * @param options 
 * @returns 
 */
function gengerateLines(lineStringList: Array<Array<SingleLineStringType>>, center: maptalks.Coordinate, layer: ThreeLayer,
    lineStrings: Array<LineStringType>, options: Array<any> = [], baseOptions?: any) {
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
    const datas = [], transfer = [], altCache = {};
    const len = lineStringList.length;
    for (let i = 0; i < len; i++) {
        const multiLineString = lineStringList[i];
        let properties = options[i] ? options[i] : getLineStringProperties(lineStrings[i]);
        properties = mergeOptions(properties, baseOptions);
        if (!center) {
            centerPt = layer.coordinateToVector3(properties.center);
        }
        let bottomHeight = properties.bottomHeight || 0;
        bottomHeight = getAltitude(bottomHeight, layer, altCache);
        const data = [];
        for (let j = 0, len1 = multiLineString.length; j < len1; j++) {
            const lineString = multiLineString[j];
            if (isMercator) {
                const arrayBuffer = getLineArrayBuffer(lineString, layer);
                transfer.push(arrayBuffer);
                data.push(arrayBuffer);
            } else {
                const arrayBuffer = getLinePosition(lineString, layer, center, false).arrayBuffer;
                transfer.push(arrayBuffer);
                data.push(arrayBuffer);
            }
        }
        const d = {
            id: properties.id,
            data,
            bottomHeight
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


function generateBars(data) {
    const len = data.length;
    const datas = new Float32Array(len * 7);
    let idx = 0;
    for (let i = 0; i < len; i++) {
        let { center, radialSegments, radius, height, altitude, id } = data[i];
        center = center || [0, 0];

        datas[idx] = center[0];
        datas[idx + 1] = center[1];
        datas[idx + 2] = radialSegments || 6;
        datas[idx + 3] = radius || 1;
        datas[idx + 4] = height;
        datas[idx + 5] = altitude || 0;
        datas[idx + 6] = id;
        idx += 7;
    }
    const buffer = datas.buffer;
    return {
        datas: buffer, transfer: [buffer]
    };
}


