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
    lineStrings?: any,
    lineString?: any
}

function getDatas(queues: Array<TaskQueue>) {
    return queues.map(q => {
        return q.data;
    });
}

function getOptions(queues: Array<TaskQueue>) {
    return queues.map(q => {
        return q.baseObject.getOptions();
    });
}

class BaseObjectTask {
    queueMap: { [key: string]: TaskQueue };
    tempQueue: Array<TaskQueue>;
    time: number;

    constructor() {
        this.queueMap = {};
        this.tempQueue = [];
        this.time = this.getCurrentTime();
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

    reset() {
        this.time = this.getCurrentTime();
        this.tempQueue = [];
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
                options: getOptions(this.tempQueue),
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
            this.reset();
        }
    }

}

class ExtrudePolygonsTask extends BaseObjectTask {

    loop(): void {
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
            this.reset();
        }
    }
}


class ExtrudeLineTask extends BaseObjectTask {

    loop(): void {
        const t = this.getCurrentTime();
        if ((t - this.time >= 32 || this.tempQueue.length >= 1000) && this.tempQueue.length) {
            const actor = getActor();
            (actor as any).pushQueue({
                type: 'ExtrudeLine',
                layer: this.tempQueue[0].layer,
                data: getDatas(this.tempQueue),
                options: getOptions(this.tempQueue),
                lineStrings: this.tempQueue.map(q => {
                    return q.lineString;
                }),
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
            this.reset();
        }
    }
}

class ExtrudeLinesTask extends BaseObjectTask {

    loop(): void {
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
            this.reset();
        }
    }
}

class LineTask extends BaseObjectTask {
    loop(): void {
        const t = this.getCurrentTime();
        if ((t - this.time >= 32 || this.tempQueue.length >= 1000) && this.tempQueue.length) {
            const actor = getActor();
            (actor as any).pushQueue({
                type: 'Line',
                layer: this.tempQueue[0].layer,
                data: getDatas(this.tempQueue),
                options: getOptions(this.tempQueue),
                lineStrings: this.tempQueue.map(q => {
                    return q.lineString;
                }),
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
            this.reset();
        }
    }
}

class LinesTask extends BaseObjectTask {
    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    type: 'Lines',
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
            this.reset();
        }
    }
}


class FatLineTask extends BaseObjectTask {
    loop(): void {
        const t = this.getCurrentTime();
        if ((t - this.time >= 32 || this.tempQueue.length >= 1000) && this.tempQueue.length) {
            const actor = getActor();
            (actor as any).pushQueue({
                type: 'FatLine',
                layer: this.tempQueue[0].layer,
                data: getDatas(this.tempQueue),
                options: getOptions(this.tempQueue),
                lineStrings: this.tempQueue.map(q => {
                    return q.lineString;
                }),
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
            this.reset();
        }
    }
}

class FatLinesTask extends BaseObjectTask {
    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    type: 'FatLines',
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
            this.reset();
        }
    }
}


export const ExtrudePolygonTaskIns = new ExtrudePolygonTask();
export const ExtrudePolygonsTaskIns = new ExtrudePolygonsTask();
export const ExtrudeLineTaskIns = new ExtrudeLineTask();
export const ExtrudeLinesTaskIns = new ExtrudeLinesTask();
export const LineTaskIns = new LineTask();
export const LinesTaskIns = new LinesTask();
export const FatLineTaskIns = new FatLineTask();
export const FatLinesTaskIns = new FatLinesTask();

export const BaseObjectTaskManager = {
    isRunning: false,
    loop() {
        ExtrudePolygonTaskIns.loop();
        ExtrudePolygonsTaskIns.loop();
        ExtrudeLineTaskIns.loop();
        ExtrudeLinesTaskIns.loop();
        LineTaskIns.loop();
        LinesTaskIns.loop();
        FatLineTaskIns.loop();
        FatLinesTaskIns.loop();
        maptalks.Util.requestAnimFrame(BaseObjectTaskManager.loop);
    },
    star() {
        if (!BaseObjectTaskManager.isRunning) {
            BaseObjectTaskManager.isRunning = true;
            BaseObjectTaskManager.loop();
        }
    }
}