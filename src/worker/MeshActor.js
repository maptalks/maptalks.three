import * as maptalks from 'maptalks';
import { isGeoJSONPolygon, getGeoJSONCenter } from '../util/GeoJSONUtil';
import { getPolygonPositions, getCenterOfPoints } from '../util/ExtrudeUtil';
import pkg from './../../package.json';



const MeshActor = class extends maptalks.worker.Actor {
    test(info, cb) {
        //send data to worker thread
        this.send(info, null, cb);
    }

    pushQueue(q = {}) {
        const { type, data, callback, layer, key } = q;
        let params;
        if (type === 'Polygon') {
            params = gengerateExtrudePolygons(data, layer);
        } else if (type === 'Line') {
            //todo liness
        } else if (type === 'Point') {
            //todo points
        }
        this.send({ type, datas: params.datas }, params.transfe, function (err, message) {
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

var actor;
export function getActor() {
    if (!actor) {
        actor = new MeshActor(pkg.name);
    }
    return actor;
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




