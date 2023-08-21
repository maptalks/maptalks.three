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
    lineString?: any,
    option?: any
}

function getDatas(queues: Array<TaskQueue>) {
    return queues.map(q => {
        return q.data;
    });
}

function getOptions(queues: Array<TaskQueue>) {
    return queues.map(q => {
        return q.option || q.baseObject.getOptions();
    });
}

export class BaseObjectTask {
    queueMap: { [key: string]: TaskQueue };
    tempQueue: Array<TaskQueue>;
    time: number;
    deQueueCount: number;
    resultQueue: Array<any>;

    constructor() {
        this.queueMap = {};
        this.tempQueue = [];
        this.time = this.getCurrentTime();
        this.deQueueCount = 5;
        this.resultQueue = [];
    }

    getActor() {
        return getActor();
    }

    getCurrentTime() {
        return maptalks.Util.now();
    }

    loop() {
        this.deQueue();
    }

    push(data: TaskQueue) {
        this.tempQueue.push(data);
        if (data.id) {
            this.queueMap[data.id] = data;
        }
        return this;
    }

    reset() {
        this.time = this.getCurrentTime();
        this.tempQueue = [];
        return this;
    }

    pushResult(result: any) {
        if (!result) {
            return;
        }
        if (!Array.isArray(result)) {
            result = [result];
        }
        result.forEach(d => {
            this.resultQueue.push(d);
        });
        return this;
    }

    deQueue() {
        if (!this.resultQueue.length) {
            return this;
        }
        const count = this.deQueueCount;
        const resultList = this.resultQueue.slice(0, count) || [];
        resultList.forEach(result => {
            const { id } = result;
            if (this.queueMap[id]) {
                const { baseObject } = this.queueMap[id];
                if (baseObject && baseObject._workerLoad) {
                    const layer = baseObject.getLayer();
                    if (layer) {
                        baseObject._workerLoad(result);
                    } else {
                        console.warn(baseObject, ' worker Processing completed but removed from the layer');
                    }
                }
                delete this.queueMap[id];
            }
        });
        this.resultQueue.splice(0, count);
        return this;
    }
}

class ExtrudePolygonTask extends BaseObjectTask {
    constructor() {
        super();
        this.deQueueCount = 100;
    }

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
                    this.pushResult(result);
                }
            });
            this.reset();
        }
        super.loop();
    }

}

class ExtrudePolygonsTask extends BaseObjectTask {

    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    id: queue.id,
                    type: 'ExtrudePolygons',
                    layer: queue.layer,
                    data: queue.data,
                    key: queue.key,
                    center: queue.center,
                    callback: (result) => {
                        this.pushResult(result);
                    }
                });
            });
            this.reset();
        }
        super.loop();
    }
}


class ExtrudeLineTask extends BaseObjectTask {
    constructor() {
        super();
        this.deQueueCount = 100;
    }

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
                    this.pushResult(result);
                }
            });
            this.reset();
        }
        super.loop();
    }
}

class ExtrudeLinesTask extends BaseObjectTask {

    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    id: queue.id,
                    type: 'ExtrudeLines',
                    layer: queue.layer,
                    data: queue.data,
                    key: queue.key,
                    lineStrings: queue.lineStrings,
                    center: queue.center,
                    callback: (result) => {
                        this.pushResult(result);
                    }
                });
            });
            this.reset();
        }
        super.loop();
    }
}

class LineTask extends BaseObjectTask {
    constructor() {
        super();
        this.deQueueCount = 200;
    }

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
                    this.pushResult(result);
                }
            });
            this.reset();
        }
        super.loop();
    }
}

class LinesTask extends BaseObjectTask {
    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    id: queue.id,
                    type: 'Lines',
                    layer: queue.layer,
                    data: queue.data,
                    key: queue.key,
                    lineStrings: queue.lineStrings,
                    center: queue.center,
                    callback: (result) => {
                        this.pushResult(result);
                    }
                });
            });
            this.reset();
        }
        super.loop();
    }
}


class FatLineTask extends BaseObjectTask {
    constructor() {
        super();
        this.deQueueCount = 100;
    }

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
                    this.pushResult(result);
                }
            });
            this.reset();
        }
        super.loop();
    }
}

class FatLinesTask extends BaseObjectTask {
    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    id: queue.id,
                    type: 'FatLines',
                    layer: queue.layer,
                    data: queue.data,
                    key: queue.key,
                    lineStrings: queue.lineStrings,
                    center: queue.center,
                    callback: (result) => {
                        this.pushResult(result);
                    }
                });
            });
            this.reset();
        }
        super.loop();
    }
}

class BarTask extends BaseObjectTask {
    constructor() {
        super();
        this.deQueueCount = 100;
    }

    loop(): void {
        const t = this.getCurrentTime();
        if ((t - this.time >= 32 || this.tempQueue.length >= 1000) && this.tempQueue.length) {
            const actor = getActor();
            (actor as any).pushQueue({
                type: 'Bar',
                layer: this.tempQueue[0].layer,
                data: getDatas(this.tempQueue),
                options: getOptions(this.tempQueue),
                callback: (result) => {
                    this.pushResult(result);
                }
            });
            this.reset();
        }
        super.loop();
    }
}
class BarsTask extends BaseObjectTask {
    constructor() {
        super();
        this.deQueueCount = 1;
    }
    loop(): void {
        if (this.tempQueue.length) {
            const actor = getActor();
            this.tempQueue.forEach(queue => {
                (actor as any).pushQueue({
                    id: queue.id,
                    type: 'Bars',
                    layer: queue.layer,
                    data: queue.data,
                    callback: (result) => {
                        this.pushResult(result);
                    }
                });
            });
            this.reset();
        }
        super.loop();
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
export const BarTaskIns = new BarTask();
export const BarsTaskIns = new BarsTask();

export const BaseObjectTaskManager = {
    isRunning: false,
    tasks: [],
    addTask: (taskIns) => {
        if (taskIns) {
            BaseObjectTaskManager.tasks.push(taskIns);
        }
    },
    removeTask: (taskIns) => {
        BaseObjectTaskManager.tasks.splice(BaseObjectTaskManager.tasks.indexOf(taskIns), 1);
    },
    loop() {
        ExtrudePolygonTaskIns.loop();
        ExtrudePolygonsTaskIns.loop();
        ExtrudeLineTaskIns.loop();
        ExtrudeLinesTaskIns.loop();
        LineTaskIns.loop();
        LinesTaskIns.loop();
        FatLineTaskIns.loop();
        FatLinesTaskIns.loop();
        BarTaskIns.loop();
        BarsTaskIns.loop();
        BaseObjectTaskManager.tasks.forEach(taskIns => {
            if (taskIns && taskIns.loop) {
                taskIns.loop();
            }
        });
        maptalks.Util.requestAnimFrame(BaseObjectTaskManager.loop);
    },
    star() {
        if (!BaseObjectTaskManager.isRunning) {
            BaseObjectTaskManager.isRunning = true;
            BaseObjectTaskManager.loop();
        }
    }
}