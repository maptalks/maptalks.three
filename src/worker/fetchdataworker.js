import * as maptalks from 'maptalks';

export const fetchDataWorkerKey = '__maptalks.three.fetchdata__';

export function fetchDataWorkerCode(exports) {
    const tasks = [],
        taskings = [],
        concurrentCount = 5;

    exports.initialize = function () {
    };

    exports.onmessage = function (message, postResponse) {
        const data = message.data;
        const task = {
            url: data,
            postResponse,
            abort: false
        };
        loopTask(task);

    };

    function loopTask(task) {
        if (task.abort) {
            taskings.splice(taskings.indexOf(task), 1);
            if (tasks.length) {
                taskings.push(tasks[0]);
                tasks.splice(0, 1);
                fetchData(taskings[taskings.length - 1]);
            }
        } else if (taskings.length < concurrentCount) {
            taskings.push(task);
            fetchData(task);
        } else {
            tasks.push(task);
        }

    }

    function fetchData(task) {
        fetch(task.url).then(res => res.text()).then((json) => {
            const blob = new Blob([json], { type: 'application/json' });
            blob.arrayBuffer().then(arrayBuffer => {
                task.postResponse(null, arrayBuffer, [arrayBuffer]);
            });
        }).catch(error => {
            console.error(error);
        }).finally(() => {
            task.abort = true;
            loopTask(task);
        });
    }
}

var actor;
export function getFetchDataActor() {
    if (!maptalks.worker) {
        console.error('maptalks.worker is not defined,You can\'t use');
    }
    if (!actor) {
        actor = new maptalks.worker.Actor(fetchDataWorkerKey);
    }
    return actor;
}
