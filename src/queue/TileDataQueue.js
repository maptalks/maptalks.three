/*

Global sharing

*/


//Maximum concurrent
const MAX = 5;
const waitingQueue = [
    // {
    //     key,
    //     url,
    //     callback,
    //     img,
    //     vt
    // }
];
const currentQueue = [];

export function getQueues() {
    return {
        waitingQueue,
        currentQueue
    };
}

/**
 *
 * @param {*} key
 * @param {*} url
 * @param {*} callback
 * @param {*} img
 * @param {*} vt
 */
export function pushQueue(key, url, callback, img, vt) {
    // url += `?key=${key}`;
    const q = {
        key,
        url,
        callback,
        img,
        vt
    };
    if (currentQueue.length < MAX) {
        currentQueue.push(q);
        vt.loopMessage(q);
    } else {
        waitingQueue.push(q);
    }
}

/**
 *
 * @param {*} index
 */
export function outQueue(index) {
    const callback = deleteQueueItem(waitingQueue, index);
    if (callback) {
        callback(index);
    }
}


/**
 *
 * @param {*} queArray
 * @param {*} index
 */
export function deleteQueueItem(queArray, index) {
    for (let i = 0, len = queArray.length; i < len; i++) {
        const q = queArray[i];
        if (q) {
            const { key, callback } = q;
            if (index === key) {
                queArray.splice(i, 1);
                return callback;
            }
        }
    }
    return null;
}

/**
 *
 * @param {*} key
 * @param {*} vt
 */
export function nextLoop(key, vt) {
    deleteQueueItem(currentQueue, key);
    if (waitingQueue.length) {
        currentQueue.push(waitingQueue[0]);
        waitingQueue.splice(0, 1);
        const last = currentQueue[currentQueue.length - 1];
        vt.loopMessage(last);
    }
}


// function message(q) {
//     if (currentQueue.length > 0) {
//         const { key, url, callback, img, loopMessage } = q;
//         maptalks.Ajax.getJSON(url, {}, function (error, res) {
//             if (error) {
//                 console.error(error);
//                 callback(key, null, img);
//             } else {
//                 callback(key, res, img);
//             }

//             deleteQueueItem(currentQueue, key);
//             if (waitingQueue.length) {
//                 currentQueue.push(waitingQueue[0]);
//                 waitingQueue.splice(0, 1);
//                 const last = currentQueue[currentQueue.length - 1];
//                 message(last);
//                 //  循环消费
//             }
//         });
//     }
// }
