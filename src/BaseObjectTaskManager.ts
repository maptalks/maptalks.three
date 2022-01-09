
import * as maptalks from 'maptalks';
import BaseObject from './BaseObject';
import { ThreeLayer } from './index';
import { getActor } from './worker/MeshActor';

type TaskQueue = {
    id: string,
    data: any,
    layer: ThreeLayer,
    baseObject: BaseObject,
    key?: string,
    center?: any,
    lineStrings?: any
}

function getDatas(queues: Array<TaskQueue>) {
    return queues.map(q => {
        return q.data;
    });
}

class BaseObjectTask {
    queueMap: { [key: string]: TaskQueue };
    tempQueue: Array<TaskQueue>;
    time: number;

    constructor() {
        this.queueMap = {};
        this.tempQueue = [];
        this.time = maptalks.Util.now();
    }

    getCurrentTime() {
        return maptalks.Util.now();
    }

    loop() {

    }

    push(data: TaskQueue) {
        this.tempQueue.push(data);
        if (data.id) {
            this.queueMap[data.id] = data;
        }
    }
}

class ExtrudePolygonTask extends BaseObjectTask {

    loop(): void {
        const t = this.getCurrentTime();
        if ((t - this.time >= 32 || this.tempQueue.length >= 1000) && this.tempQueue.length) {
            const actor = getActor();
            (actor as any).pushQueue({
                type: 'ExtrudePolygon',
                layer: this.tempQueue[0].layer,
                data: getDatas(this.tempQueue),
                callback: (result) => {
                    if (!result) {
                        return;
                    }
                    result.forEach(d => {
                        const { id } = d;
                        if (this.queueMap[id]) {
                            const { baseObject } = this.queueMap[id];
                            if (baseObject && baseObject._workerLoad) {
                                baseObject._workerLoad(d);
                            }
                            delete this.queueMap[id];
                        }
                    });
                }
            });
            this.time = t;
            this.tempQueue = [];
        }
    }

}

class ExtrudePolygonsTask extends BaseObjectTask {

    loop(): void {
        const t = this.getCurrentTime();
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    type: 'ExtrudePolygons',
                    layer: queue.layer,
                    data: queue.data,
                    key: queue.key,
                    center: queue.center,
                    callback: (result) => {
                        if (!result) {
                            return;
                        }
                        const { baseObject } = queue;
                        if (baseObject && baseObject._workerLoad) {
                            baseObject._workerLoad(result);
                        }
                    }
                });
            });
            this.time = t;
            this.tempQueue = [];
        }
    }
}

class ExtrudeLinesTask extends BaseObjectTask {

    loop(): void {
        const t = this.getCurrentTime();
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    type: 'ExtrudeLines',
                    layer: queue.layer,
                    data: queue.data,
                    key: queue.key,
                    lineStrings: queue.lineStrings,
                    center: queue.center,
                    callback: (result) => {
                        if (!result) {
                            return;
                        }
                        const { baseObject } = queue;
                        if (baseObject && baseObject._workerLoad) {
                            baseObject._workerLoad(result);
                        }
                    }
                });
            });
            this.time = t;
            this.tempQueue = [];
        }
    }
}

export const ExtrudePolygonTaskIns = new ExtrudePolygonTask();
export const ExtrudePolygonsTaskIns = new ExtrudePolygonsTask();
export const ExtrudeLinesTaskIns = new ExtrudeLinesTask();

export const BaseObjectTaskManager = {
    isRunning: false,
    loop() {
        ExtrudePolygonTaskIns.loop();
        ExtrudePolygonsTaskIns.loop();
        ExtrudeLinesTaskIns.loop();
        maptalks.Util.requestAnimFrame(BaseObjectTaskManager.loop);
    },
    star() {
        if (!BaseObjectTaskManager.isRunning) {
            BaseObjectTaskManager.isRunning = true;
            BaseObjectTaskManager.loop();
        }
    }
}