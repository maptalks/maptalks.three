import { isGeoJSONPolygon, getGeoJSONCenter } from '../util/GeoJSONUtil';
import { getPolygonPositions, getCenterOfPoints } from '../util/ExtrudeUtil';

/*

Global sharing

*/
const workerQueues = [];

class WorkerQueue {
    constructor(worker) {
        this.worker = worker;
        this.waitingQueue = [
            // {
            //     key,
            //     type,
            //     layer
            //     data,
            //     callback
            // }
        ];
        this.runing = false;
    }



    pushQueue(q = {}) {
        const { worker, waitingQueue, runing } = this;
        if (worker) {
            waitingQueue.push(q);
        }
        if (!runing) {
            this.message();
        }
    }


    message() {
        const { worker, waitingQueue } = this;
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
            this.runing = true;
            worker.postMessage({ type, datas: params.datas }, params.transfer);
            worker.onmessage = (e) => {
                e.data.key = key;
                callback(e.data);
                this.waitingQueue.splice(0, 1);
                this.message();
            };
        } else {
            this.runing = false;
        }
    }
}


export function setWorker(meshWorkers = []) {
    if (!Array.isArray(meshWorkers)) {
        meshWorkers = [meshWorkers];
    }
    (meshWorkers || []).forEach(meshWorker => {
        if (meshWorker instanceof Worker) {
            workerQueues.push(new WorkerQueue(meshWorker));
        }
    });
}


function getFreeWorkerQueue() {
    let index = 0, minValue = Infinity;
    for (let i = 0, len = workerQueues.length; i < len; i++) {
        const { waitingQueue } = workerQueues[i];
        if (waitingQueue.length < minValue) {
            minValue = waitingQueue.length;
            index = i;
        }
    }
    return workerQueues[index];
}

export function pushQueue(q = {}) {
    const workerQueue = getFreeWorkerQueue();
    if (workerQueue) {
        workerQueue.pushQueue(q);
    }
    if (workerQueues.length === 0) {
        console.error('not find worker');
    }
}

export function isFree() {
    let maxValue = -Infinity;
    for (let i = 0, len = workerQueues.length; i < len; i++) {
        const { waitingQueue } = workerQueues[i];
        maxValue = Math.max(waitingQueue.length, maxValue);
    }
    if (maxValue > 0) {
        return false;
    }
    return true;
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
