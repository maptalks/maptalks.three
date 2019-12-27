import { isGeoJSONPolygon, getGeoJSONCenter } from '../util/GeoJSONUtil';
import { getPolygonPositions, getCenterOfPoints } from '../util/ExtrudeUtil';

var worker;
const waitingQueue = [
    // {
    //     key,
    //     type,
    //     layer
    //     data,
    //     callback
    // }
];

var runing = false;

export function setWorker(meshWorker) {
    worker = meshWorker;
}

export function pushQueue(q = {}) {
    if (worker) {
        waitingQueue.push(q);
    }
    if (!runing) {
        message();
    }
}

function message() {
    if (waitingQueue.length > 0) {
        const { type, data, callback, layer, key } = waitingQueue[0];
        let params;
        if (type === 'Polygon') {
            params = gengerateExtrudePolygons(data, layer);
        } else if (type === 'Line') {
            //todo liness
        } else if (type === 'Point') {
            //todo points
        }
        runing = true;
        worker.postMessage({ type, datas: params.datas }, params.transfer);
        worker.onmessage = (e) => {
            e.data.key = key;
            callback(e.data);
            waitingQueue.splice(0, 1);
            message();
        };
    } else {
        runing = false;
    }
}

/**
 * generate extrudepolygons data for worker
 * @param {*} polygons
 * @param {*} layer
 */
function gengerateExtrudePolygons(polygons = [], layer) {
    const len = polygons.length;
    const centers = [];
    for (let i = 0; i < len; i++) {
        const polygon = polygons[i];
        centers.push(isGeoJSONPolygon(polygon) ? getGeoJSONCenter(polygon) : polygon.getCenter());
    }
    // Get the center point of the point set
    const center = getCenterOfPoints(centers);
    const datas = [], transfer = [];
    for (let i = 0; i < len; i++) {
        const polygon = polygons[i];
        const data = getPolygonPositions(polygon, layer, center, true);
        for (let j = 0, len1 = data.length; j < len1; j++) {
            const { outer, holes } = data[j];
            transfer.push(outer);
            if (holes && holes.length) {
                for (let m = 0, len2 = holes.length; m < len2; m++) {
                    transfer.push(holes[m]);
                }
            }
        }
        let height = (isGeoJSONPolygon(polygon) ? polygon.properties : polygon.getProperties() || {}).height || 1;
        height = layer.distanceToVector3(height, height).x;
        datas.push({
            data,
            height
        });
    }
    return {
        datas,
        transfer
    };
}
